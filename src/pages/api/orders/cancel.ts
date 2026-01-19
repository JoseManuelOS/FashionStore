import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { sendCancellationNotification } from '../../../lib/admin-notifications';

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
            .select('id, customer_email, customer_name, status, order_number, total_price')
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

        // Get order items to restore stock
        const { data: orderItems, error: itemsError } = await supabaseAdmin
            .from('order_items')
            .select('product_id, size, quantity')
            .eq('order_id', orderId);

        if (itemsError) {
            console.error('Error fetching order items:', itemsError);
        }

        // Restore stock for each item
        let itemsRestored = 0;
        if (orderItems && orderItems.length > 0) {
            for (const item of orderItems) {
                if (item.product_id && item.size) {
                    // Update product_variants stock
                    const { data: variant } = await supabaseAdmin
                        .from('product_variants')
                        .select('stock')
                        .eq('product_id', item.product_id)
                        .eq('size', item.size)
                        .single();

                    if (variant) {
                        await supabaseAdmin
                            .from('product_variants')
                            .update({
                                stock: variant.stock + item.quantity,
                                updated_at: new Date().toISOString()
                            })
                            .eq('product_id', item.product_id)
                            .eq('size', item.size);

                        itemsRestored++;
                    }

                    // Also update main products table stock (legacy support)
                    const { data: product } = await supabaseAdmin
                        .from('products')
                        .select('stock')
                        .eq('id', item.product_id)
                        .single();

                    if (product) {
                        await supabaseAdmin
                            .from('products')
                            .update({ stock: product.stock + item.quantity })
                            .eq('id', item.product_id);
                    }
                }
            }
        }

        // Update order status to cancelled
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

        // Send cancellation confirmation email
        const customerEmail = order.customer_email || userEmail;
        const customerName = order.customer_name || 'Cliente';

        try {
            const { Resend } = await import('resend');
            const resend = new Resend(import.meta.env.RESEND_API_KEY);

            await resend.emails.send({
                from: 'FashionMarket <onboarding@resend.dev>',
                to: [customerEmail],
                subject: `Pedido #${order.order_number || order.id} Cancelado`,
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    </head>
                    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1f2937; margin: 0; padding: 0; background-color: #f3f4f6;">
                        <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                            <!-- Header -->
                            <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 40px 20px; text-align: center;">
                                <div style="width: 70px; height: 70px; background: white; border-radius: 50%; margin: 0 auto 15px auto;">
                                    <table width="70" height="70"><tr><td align="center" valign="middle" style="color: #ef4444; font-size: 36px; font-weight: bold;">✕</td></tr></table>
                                </div>
                                <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold;">Pedido Cancelado</h1>
                                <p style="color: #fecaca; margin: 10px 0 0 0;">Pedido #${order.order_number || order.id}</p>
                            </div>
                            
                            <!-- Content -->
                            <div style="padding: 40px 30px;">
                                <p style="font-size: 16px; margin-bottom: 20px;">Hola <strong>${customerName}</strong>,</p>
                                
                                <p style="font-size: 16px; margin-bottom: 25px;">
                                    Te confirmamos que tu pedido ha sido cancelado correctamente.
                                </p>
                                
                                <!-- Order Summary -->
                                <div style="background-color: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 25px;">
                                    <h3 style="font-size: 14px; color: #6b7280; margin: 0 0 15px 0; text-transform: uppercase; letter-spacing: 0.5px;">Resumen</h3>
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                                        <span style="color: #6b7280;">Número de pedido:</span>
                                        <span style="font-weight: 600; color: #1f2937;">#${order.order_number || order.id}</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                                        <span style="color: #6b7280;">Importe:</span>
                                        <span style="font-weight: 600; color: #1f2937;">${order.total_price?.toFixed(2) || '0.00'}€</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between;">
                                        <span style="color: #6b7280;">Estado:</span>
                                        <span style="font-weight: 600; color: #ef4444;">Cancelado</span>
                                    </div>
                                </div>
                                
                                <!-- Refund Notice -->
                                <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 15px 20px; margin-bottom: 25px; border-radius: 4px;">
                                    <h4 style="color: #065f46; margin: 0 0 8px 0; font-size: 14px;">Sobre el reembolso</h4>
                                    <p style="color: #047857; margin: 0; font-size: 14px;">
                                        El importe se reembolsará automáticamente a tu método de pago original en un plazo de <strong>5-10 días hábiles</strong>.
                                    </p>
                                </div>
                                
                                <p style="font-size: 14px; color: #6b7280;">
                                    Si tienes alguna pregunta, no dudes en contactarnos. ¡Esperamos verte pronto de nuevo!
                                </p>
                                
                                <div style="text-align: center; margin-top: 30px;">
                                    <a href="${import.meta.env.PUBLIC_SITE_URL || 'https://fashionmarket.com'}/productos" 
                                       style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); color: white; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px;">
                                        Seguir comprando
                                    </a>
                                </div>
                            </div>
                            
                            <!-- Footer -->
                            <div style="background-color: #1f2937; padding: 25px; text-align: center;">
                                <p style="color: #9ca3af; margin: 0; font-size: 14px;">
                                    © 2026 FashionMarket. Todos los derechos reservados.
                                </p>
                            </div>
                        </div>
                    </body>
                    </html>
                `
            });

            console.log('Cancellation email sent to:', customerEmail);
        } catch (emailError) {
            console.error('Error sending cancellation email:', emailError);
            // Continue even if email fails
        }

        // Notify admin about cancellation
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
                message: 'Pedido cancelado correctamente',
                items_restored: itemsRestored
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
