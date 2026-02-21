import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { Resend } from 'resend';
import {
    supabaseAdmin,
    getOrderById,
    getFacturacionByOrderId,
    createCreditNote,
} from '../../../lib/supabase';
import { isAdminAuthenticated, unauthorizedResponse } from '../../../lib/admin-auth';
import { buildReturnAcceptedHTML } from '../../../lib/email-templates';
import { generateInvoicePDF, generateInvoicePDFBase64 } from '../../../lib/pdf-generator';

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

        // Verify order is in return_requested status
        if (order.status !== 'return_requested') {
            return new Response(
                JSON.stringify({
                    error: 'Order is not in return_requested status',
                    current_status: order.status
                }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Get original invoice
        const originalInvoice = await getFacturacionByOrderId(orderId);
        if (!originalInvoice) {
            return new Response(
                JSON.stringify({ error: 'Original invoice not found. Cannot process return without invoice.' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // 1. Process Stripe refund (non-blocking — if it fails, continue with the rest)
        let refundId = null;
        let refundWarning = '';
        if (order.stripe_payment_intent) {
            try {
                const refund = await stripe.refunds.create({
                    payment_intent: order.stripe_payment_intent,
                });
                refundId = refund.id;
                console.log('Stripe refund processed:', refundId);
            } catch (stripeError: any) {
                console.error('Stripe refund error:', stripeError);
                // Check if already refunded
                if (stripeError.code === 'charge_already_refunded') {
                    refundWarning = 'El pago ya había sido reembolsado anteriormente en Stripe.';
                    console.log('Payment was already refunded, continuing...');
                } else {
                    refundWarning = `No se pudo procesar el reembolso automático en Stripe: ${stripeError.message}. Puedes procesarlo manualmente desde el panel de Stripe.`;
                    console.log('Stripe refund failed but continuing with return process...');
                }
            }
        } else {
            refundWarning = 'No se encontró el Payment Intent de Stripe. El reembolso deberá procesarse manualmente.';
            console.log('No stripe_payment_intent found, skipping refund...');
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
                    error: 'Failed to create credit note',
                    details: creditError.message
                }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // 3. Update order status to "returned"
        const { error: statusError } = await supabaseAdmin
            .from('orders')
            .update({ status: 'returned' })
            .eq('id', orderId);

        if (statusError) {
            console.error('Error updating order status:', statusError);
        }

        // 4. Restore stock for returned items
        if (order.items) {
            for (const item of order.items) {
                if (item.product_id && item.size) {
                    try {
                        const { incrementStock } = await import('../../../lib/supabase');
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
        const orderNumber = order.order_number || orderId.slice(0, 8);
        const originalPDF = Buffer.from(generateInvoicePDFBase64(originalInvoice, orderNumber, false), 'base64');
        const creditNotePDF = Buffer.from(generateInvoicePDFBase64(creditNote, orderNumber, true), 'base64');

        // 6. Send email to customer with PDF attachments
        if (order.customer_email) {
            try {
                const orderRef = `#${orderNumber}`;
                const customerName = order.customer_name || 'Cliente';

                const emailHtml = buildReturnAcceptedHTML({
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
                    subject: `Devolución Aceptada - Pedido ${orderRef} - FashionMarket`,
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

                console.log('Return accepted email sent to:', order.customer_email);
            } catch (emailError) {
                console.error('Error sending return accepted email:', emailError);
            }
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: refundWarning 
                    ? `Devolución aceptada. ${refundWarning}` 
                    : 'Devolución aceptada. Reembolso procesado y email enviado.',
                refund_id: refundId,
                refund_warning: refundWarning || null,
                credit_note: creditNote.invoice_number,
                status: 'returned'
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );

    } catch (error: any) {
        console.error('Error in accept-return API:', error);
        return new Response(
            JSON.stringify({ error: error.message || 'Internal server error' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
};
