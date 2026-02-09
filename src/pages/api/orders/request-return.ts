import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { sendReturnRequestNotification } from '../../../lib/admin-notifications';

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

        // Create a client with the user's token
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

        // Verify order is in 'delivered' status
        if (order.status !== 'delivered') {
            return new Response(
                JSON.stringify({
                    error: 'INVALID_STATUS',
                    message: 'Solo se pueden solicitar devoluciones para pedidos entregados',
                    current_status: order.status
                }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Send return instructions email
        const customerEmail = order.customer_email || user.email;
        const customerName = order.customer_name || user.user_metadata?.full_name || 'Cliente';

        try {
            const { Resend } = await import('resend');
            const resend = new Resend(import.meta.env.RESEND_API_KEY);

            await resend.emails.send({
                from: 'FashionMarket <noreply@roomieapp.info>',
                to: [customerEmail],
                subject: `Solicitud de Devolución - Pedido #${order.order_number || order.id}`,
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    </head>
                    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1f2937; margin: 0; padding: 0; background-color: #f3f4f6;">
                        <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                            <!-- Header -->
                            <div style="background: linear-gradient(135deg, #d946ef 0%, #a21caf 100%); padding: 40px 20px; text-align: center;">
                                <div style="width: 60px; height: 60px; background: rgba(255,255,255,0.2); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 15px;">
                                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                                        <polyline points="9 11 12 14 22 4"></polyline>
                                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                                    </svg>
                                </div>
                                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Solicitud de Devolución</h1>
                                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Pedido #${order.order_number || order.id}</p>
                            </div>
                            
                            <!-- Content -->
                            <div style="padding: 40px 30px;">
                                <p style="font-size: 16px; margin-bottom: 20px;">Hola <strong>${customerName}</strong>,</p>
                                
                                <p style="font-size: 16px; margin-bottom: 30px;">
                                    Hemos recibido tu solicitud de devolución. A continuación te indicamos los pasos a seguir.
                                </p>
                                
                                <!-- Return Instructions -->
                                <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin-bottom: 30px; border-radius: 4px;">
                                    <h2 style="font-size: 18px; color: #92400e; margin: 0 0 15px 0;">Instrucciones de Envío</h2>
                                    <p style="color: #78350f; margin: 0 0 10px 0;">
                                        Envía los artículos en su <strong>embalaje original</strong> a la siguiente dirección:
                                    </p>
                                    <div style="background: white; padding: 15px; border-radius: 8px; margin-top: 10px;">
                                        <p style="margin: 0; font-weight: 600; color: #1f2937;">
                                            FashionMarket - Devoluciones<br>
                                            Calle de la Moda 123<br>
                                            Polígono Industrial<br>
                                            28001 Madrid, España
                                        </p>
                                    </div>
                                </div>
                                
                                <!-- Important Notice -->
                                <div style="background-color: #dbeafe; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                                    <h3 style="font-size: 16px; color: #1e40af; margin: 0 0 10px 0;">Información Importante</h3>
                                    <ul style="margin: 0; padding-left: 20px; color: #1e3a8a;">
                                        <li style="margin-bottom: 8px;">Los productos deben estar sin usar y con todas las etiquetas</li>
                                        <li style="margin-bottom: 8px;">Incluye una copia de este email o el número de pedido</li>
                                        <li style="margin-bottom: 8px;">Recomendamos usar un servicio de envío con seguimiento</li>
                                    </ul>
                                </div>
                                
                                <!-- Refund Info -->
                                <div style="background-color: #ecfdf5; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                                    <h3 style="font-size: 16px; color: #065f46; margin: 0 0 10px 0;">Sobre el Reembolso</h3>
                                    <p style="margin: 0; color: #047857; font-size: 14px;">
                                        Una vez recibido y validado el paquete, el reembolso se procesará en tu <strong>método de pago original</strong> en un plazo de <strong>5 a 7 días hábiles</strong>.
                                    </p>
                                </div>

                                <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                                    Si tienes alguna pregunta, no dudes en contactarnos.
                                </p>
                            </div>
                            
                            <!-- Footer -->
                            <div style="background-color: #1f2937; padding: 30px; text-align: center;">
                                <p style="color: #9ca3af; margin: 0; font-size: 14px;">
                                    © 2026 FashionMarket. Todos los derechos reservados.
                                </p>
                            </div>
                        </div>
                    </body>
                    </html>
                `
            });

            console.log('Return instructions email sent to:', customerEmail);
        } catch (emailError) {
            console.error('Error sending return email:', emailError);
            // Continue even if email fails - don't block the response
        }

        // Notify admin about return request
        try {
            await sendReturnRequestNotification({
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
                message: 'Solicitud de devolución procesada. Se ha enviado un email con las instrucciones.',
                email_sent_to: customerEmail
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );

    } catch (error: any) {
        console.error('Error in request-return API:', error);
        return new Response(
            JSON.stringify({ error: error.message || 'Internal server error' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
};
