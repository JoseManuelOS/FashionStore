export const prerender = false;
import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { Resend } from 'resend';
import {
    supabaseAdmin,
    incrementStock,
    getFacturacionByOrderId,
    createCreditNote,
    createFacturacion,
} from '../../../lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { sendCancellationNotification } from '../../../lib/admin-notifications';
import { buildCancellationHTML } from '../../../lib/email-templates';
import { generateInvoicePDFBase64 } from '../../../lib/pdf-generator';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-12-15.clover',
});

const resend = new Resend(import.meta.env.RESEND_API_KEY);

export const POST: APIRoute = async ({ request }) => {
    try {
        // Get auth token from header
        const authHeader = request.headers.get('Authorization');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response(
                JSON.stringify({ error: 'No authorization token' }),
                { status: 401, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const token = authHeader.replace('Bearer ', '');

        // Create a client with the user's token to get their info
        const supabase = createClient(
            import.meta.env.PUBLIC_SUPABASE_URL,
            import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
            {
                global: {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            }
        );

        // Get user from token
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);

        if (userError || !user?.email) {
            return new Response(
                JSON.stringify({ error: 'Invalid token or user not found' }),
                { status: 401, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const userEmail = user.email.toLowerCase();

        // Get order ID and reason from request body
        const body = await request.json();
        const { orderId, reason } = body;

        if (!orderId) {
            return new Response(
                JSON.stringify({ error: 'Order ID is required' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Find the order and verify it belongs to this user (by customer_email)
        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .select('id, customer_email, customer_name, status, order_number, total_price, stripe_payment_intent')
            .eq('id', orderId)
            .single();

        if (orderError || !order) {
            console.error('Order not found:', orderError);
            return new Response(
                JSON.stringify({ error: 'Order not found' }),
                { status: 404, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Verify the order belongs to this user by email
        if (order.customer_email?.toLowerCase() !== userEmail) {
            return new Response(
                JSON.stringify({ error: 'Unauthorized: Order does not belong to this user' }),
                { status: 403, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Verify order is in 'paid' status (can only cancel before shipping)
        if (order.status !== 'paid') {
            return new Response(
                JSON.stringify({
                    error: 'INVALID_STATUS',
                    message: `Solo se pueden cancelar pedidos en estado "Pagado". Estado actual: ${order.status}`,
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
            } catch (invoiceError) {
                console.error('Error creating invoice:', invoiceError);
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
                        error: 'Error al procesar el reembolso',
                        details: stripeError.message
                    }),
                    { status: 500, headers: { 'Content-Type': 'application/json' } }
                );
            }
        }

        // 2. Create credit note (factura rectificativa)
        let creditNote = null;
        if (originalInvoice) {
            try {
                creditNote = await createCreditNote(orderId);
                console.log('Credit note created:', creditNote.invoice_number);
            } catch (creditError) {
                console.error('Error creating credit note:', creditError);
            }
        }

        // 3. Get order items to restore stock
        const { data: orderItems, error: itemsError } = await supabaseAdmin
            .from('order_items')
            .select('product_id, product_name, size, color, quantity, price_at_purchase')
            .eq('order_id', orderId);

        if (itemsError) {
            console.error('Error fetching order items:', itemsError);
        }

        // 4. Restore stock for each item
        let itemsRestored = 0;
        if (orderItems && orderItems.length > 0) {
            for (const item of orderItems) {
                if (item.product_id && item.size) {
                    const success = await incrementStock(item.product_id, item.size, item.quantity, item.color || '');
                    if (success) {
                        itemsRestored++;
                    } else {
                        console.warn(`[CANCEL] Failed to restore stock for product ${item.product_id} size ${item.size} color ${item.color || 'N/A'}`);
                    }
                }
            }
        }

        // 5. Update order status to cancelled
        const { error: updateError } = await supabaseAdmin
            .from('orders')
            .update({
                status: 'cancelled',
                updated_at: new Date().toISOString()
            })
            .eq('id', orderId);

        if (updateError) {
            console.error('Error updating order status:', updateError);
            return new Response(
                JSON.stringify({ error: 'Error cancelling order', details: updateError.message }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // 6. Send cancellation email with PDFs
        const customerEmail = order.customer_email || userEmail;
        const customerName = order.customer_name || 'Cliente';
        const orderNumber = order.order_number || order.id;
        const orderRef = `#${orderNumber}`;

        try {
            if (originalInvoice && creditNote) {
                // Send premium email with PDF attachments
                const originalPDF = Buffer.from(generateInvoicePDFBase64(originalInvoice, orderNumber, false), 'base64');
                const creditNotePDF = Buffer.from(generateInvoicePDFBase64(creditNote, orderNumber, true), 'base64');

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
                    to: [customerEmail],
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
            } else {
                // Fallback: send simple cancellation email without PDFs
                const emailHtml = buildCancellationHTML({
                    customerName,
                    orderRef,
                    orderItems: (orderItems || []).map((item: any) => ({
                        product_name: item.product_name,
                        size: item.size,
                        quantity: item.quantity,
                        price: item.price_at_purchase,
                    })),
                    totalRefund: order.total_price || 0,
                    originalInvoiceNumber: '-',
                    creditNoteNumber: '-',
                });

                await resend.emails.send({
                    from: 'FashionMarket <noreply@roomieapp.info>',
                    to: [customerEmail],
                    subject: `Pedido ${orderRef} Cancelado - Reembolso Procesado - FashionMarket`,
                    html: emailHtml,
                });
            }

            console.log('Cancellation email sent to:', customerEmail);
        } catch (emailError) {
            console.error('Error sending cancellation email:', emailError);
        }

        // 7. Notify admin about cancellation
        try {
            await sendCancellationNotification({
                id: order.id,
                order_number: order.order_number,
                customer_name: customerName,
                customer_email: customerEmail,
                total_price: order.total_price
            }, reason);
        } catch (adminNotifyError) {
            console.error('Error sending admin notification:', adminNotifyError);
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Pedido cancelado correctamente. Reembolso procesado.',
                items_restored: itemsRestored,
                refund_id: refundId
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );

    } catch (error: any) {
        console.error('Error in cancel order API:', error);
        return new Response(
            JSON.stringify({ error: error.message || 'Internal server error' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
};
