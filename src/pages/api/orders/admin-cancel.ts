export const prerender = false;
import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { Resend } from 'resend';
import {
    supabaseAdmin,
    getOrderById,
    getFacturacionByOrderId,
    createCreditNote,
    createFacturacion,
    incrementStock,
} from '../../../lib/supabase';
import { isAdminAuthenticated, unauthorizedResponse } from '../../../lib/admin-auth';
import { buildCancellationHTML } from '../../../lib/email-templates';
import { generateInvoicePDFBase64 } from '../../../lib/pdf-generator';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-12-15.clover',
});

const resend = new Resend(import.meta.env.RESEND_API_KEY);

export const POST: APIRoute = async ({ request }) => {
    // Verify admin authentication
    if (!isAdminAuthenticated(request)) {
        return unauthorizedResponse();
    }

    try {
        const body = await request.json();
        const { orderId } = body;

        if (!orderId) {
            return new Response(
                JSON.stringify({ error: 'Order ID is required' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Get the order
        const order = await getOrderById(orderId);
        if (!order) {
            return new Response(
                JSON.stringify({ error: 'Order not found' }),
                { status: 404, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Verify order is in 'paid' status (can only cancel before shipping)
        if (order.status !== 'paid') {
            return new Response(
                JSON.stringify({
                    error: 'Solo se pueden cancelar pedidos en estado "Pagado"',
                    current_status: order.status
                }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Get or create original invoice
        let originalInvoice = await getFacturacionByOrderId(orderId);
        if (!originalInvoice) {
            try {
                originalInvoice = await createFacturacion(orderId);
                console.log('Original invoice created for cancellation:', originalInvoice.invoice_number);
            } catch (invoiceError: any) {
                console.error('Error creating invoice:', invoiceError);
                return new Response(
                    JSON.stringify({ error: 'Failed to create invoice', details: invoiceError.message }),
                    { status: 500, headers: { 'Content-Type': 'application/json' } }
                );
            }
        }

        // 1. Process Stripe refund
        let refundId = null;
        if (order.stripe_payment_intent) {
            try {
                const refund = await stripe.refunds.create({
                    payment_intent: order.stripe_payment_intent,
                });
                refundId = refund.id;
                console.log('Stripe refund processed:', refundId);
            } catch (stripeError: any) {
                console.error('Stripe refund error:', stripeError);
                return new Response(
                    JSON.stringify({
                        error: 'Error al procesar el reembolso en Stripe',
                        details: stripeError.message
                    }),
                    { status: 500, headers: { 'Content-Type': 'application/json' } }
                );
            }
        }

        // 2. Create credit note (factura rectificativa)
        let creditNote;
        try {
            creditNote = await createCreditNote(orderId);
            console.log('Credit note created:', creditNote.invoice_number);
        } catch (creditError: any) {
            console.error('Error creating credit note:', creditError);
            return new Response(
                JSON.stringify({
                    error: 'Error al crear la factura rectificativa',
                    details: creditError.message
                }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // 3. Update order status to "cancelled"
        const { error: statusError } = await supabaseAdmin
            .from('orders')
            .update({
                status: 'cancelled',
                updated_at: new Date().toISOString()
            })
            .eq('id', orderId);

        if (statusError) {
            console.error('Error updating order status:', statusError);
        }

        // 4. Restore stock for cancelled items
        if (order.items) {
            for (const item of order.items) {
                if (item.product_id && item.size) {
                    try {
                        const itemColor = (item as any).color || '';
                        await incrementStock(item.product_id, item.size, item.quantity, itemColor);
                        console.log(`Stock restored: ${item.product_name} (${item.size}${itemColor ? '/' + itemColor : ''}) +${item.quantity}`);
                    } catch (stockError) {
                        console.error('Error restoring stock:', stockError);
                    }
                }
            }
        }

        // 5. Generate PDF invoices
        const orderNumber = order.order_number || orderId.toString().slice(0, 8);
        const originalPDF = Buffer.from(generateInvoicePDFBase64(originalInvoice, orderNumber, false), 'base64');
        const creditNotePDF = Buffer.from(generateInvoicePDFBase64(creditNote, orderNumber, true), 'base64');

        // 6. Send cancellation email to customer with PDF attachments
        if (order.customer_email) {
            try {
                const orderRef = `#${orderNumber}`;
                const customerName = order.customer_name || 'Cliente';

                const emailHtml = buildCancellationHTML({
                    customerName,
                    orderRef,
                    orderItems: (creditNote.items || []).map((item: any) => ({
                        product_name: item.product_name,
                        size: item.size,
                        quantity: item.quantity,
                        price: Math.abs(item.price),
                    })),
                    totalRefund: Math.abs(creditNote.total),
                    originalInvoiceNumber: originalInvoice.invoice_number,
                    creditNoteNumber: creditNote.invoice_number,
                });

                await resend.emails.send({
                    from: 'FashionMarket <noreply@roomieapp.info>',
                    to: [order.customer_email],
                    subject: `Pedido ${orderRef} Cancelado - Reembolso Procesado - FashionMarket`,
                    html: emailHtml,
                    attachments: [
                        {
                            filename: `Factura_${originalInvoice.invoice_number}.pdf`,
                            content: originalPDF,
                        },
                        {
                            filename: `Factura_Rectificativa_${creditNote.invoice_number}.pdf`,
                            content: creditNotePDF,
                        },
                    ],
                });

                console.log('Cancellation email sent to:', order.customer_email);
            } catch (emailError) {
                console.error('Error sending cancellation email:', emailError);
            }
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Pedido cancelado. Reembolso procesado y email enviado.',
                refund_id: refundId,
                credit_note: creditNote.invoice_number,
                status: 'cancelled'
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );

    } catch (error: any) {
        console.error('Error in admin-cancel API:', error);
        return new Response(
            JSON.stringify({ error: error.message || 'Internal server error' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
};
