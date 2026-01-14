import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { supabaseAdmin } from '../../../lib/supabase';
import { Resend } from 'resend';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-12-15.clover',
});

const resend = new Resend(import.meta.env.RESEND_API_KEY);
const webhookSecret = import.meta.env.STRIPE_WEBHOOK_SECRET;

export const POST: APIRoute = async ({ request }) => {
    console.log('=== STRIPE WEBHOOK RECEIVED ===');
    
    try {
        const body = await request.text();
        const sig = request.headers.get('stripe-signature');

        if (!sig) {
            console.error('No stripe-signature header');
            return new Response('No signature', { status: 400 });
        }

        let event: Stripe.Event;

        try {
            // Verificar la firma del webhook
            event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
        } catch (err: any) {
            console.error('Webhook signature verification failed:', err.message);
            return new Response(`Webhook Error: ${err.message}`, { status: 400 });
        }

        console.log('Event type:', event.type);

        // Manejar el evento de checkout completado
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object as Stripe.Checkout.Session;
            
            console.log('Processing checkout.session.completed');
            console.log('Session ID:', session.id);
            console.log('Payment Status:', session.payment_status);

            // Solo procesar si el pago fue exitoso
            if (session.payment_status === 'paid') {
                await handleSuccessfulPayment(session);
            }
        }

        return new Response(JSON.stringify({ received: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error: any) {
        console.error('Webhook error:', error);
        return new Response(`Webhook Error: ${error.message}`, { status: 500 });
    }
};

async function handleSuccessfulPayment(session: Stripe.Checkout.Session) {
    console.log('=== CREATING ORDER FROM PAYMENT ===');
    
    try {
        // Obtener los line items de la sesión
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
            expand: ['data.price.product']
        });

        console.log('Line items:', lineItems.data.length);

        // Obtener detalles del cliente
        const customerEmail = session.customer_details?.email || session.customer_email || null;
        const customerName = session.customer_details?.name || session.metadata?.customer_name || null;
        const customerPhone = session.metadata?.customer_phone || null;
        
        // Obtener dirección de envío
        const shippingDetails = (session as any).shipping_details || session.customer_details;
        let shippingAddress = '';
        let addressObject: any = null;
        
        if (shippingDetails?.address) {
            const addr = shippingDetails.address;
            const name = shippingDetails.name || customerName || '';
            shippingAddress = [
                name,
                addr.line1,
                addr.line2,
                `${addr.postal_code} ${addr.city}`,
                addr.state,
                addr.country === 'ES' ? 'España' : addr.country
            ].filter(Boolean).join('\n');
            
            // Crear objeto de dirección para guardar en el perfil
            addressObject = {
                street: [addr.line1, addr.line2].filter(Boolean).join(', '),
                city: addr.city,
                postal_code: addr.postal_code,
                province: addr.state,
                country: addr.country === 'ES' ? 'ES' : addr.country
            };
        }

        // Buscar si el usuario tiene una cuenta registrada
        let customerId = null;
        if (customerEmail) {
            const { data: authUser } = await supabaseAdmin.auth.admin.getUserByEmail(customerEmail);
            
            if (authUser?.user) {
                customerId = authUser.user.id;
                
                // Actualizar o crear registro en customers con la información de la compra
                if (addressObject) {
                    const { error: updateError } = await supabaseAdmin
                        .from('customers')
                        .update({
                            full_name: customerName,
                            phone: customerPhone,
                            default_address: addressObject,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', customerId);
                    
                    if (updateError) {
                        console.error('Error updating customer profile:', updateError);
                    } else {
                        console.log('Customer profile updated with purchase data');
                    }
                }
            }
        }

        // Calcular total (Stripe lo tiene en centavos)
        const totalPrice = (session.amount_total || 0) / 100;

        // Crear el pedido en Supabase
        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .insert({
                customer_id: customerId,
                total_price: totalPrice,
                customer_email: customerEmail,
                customer_name: customerName,
                shipping_address: shippingAddress,
                status: 'paid', // Ya está pagado
                stripe_session_id: session.id,
                stripe_payment_intent: session.payment_intent as string
            })
            .select()
            .single();

        if (orderError) {
            console.error('Error creating order:', orderError);
            throw orderError;
        }

        console.log('Order created:', order.id);

        // Crear los items del pedido
        const orderItems = lineItems.data.map((item) => {
            const product = item.price?.product as Stripe.Product;
            return {
                order_id: order.id,
                product_id: product?.metadata?.product_id || null,
                product_name: item.description || product?.name || 'Producto',
                product_image: product?.images?.[0] || null,
                quantity: item.quantity || 1,
                size: product?.metadata?.size || null,
                price_at_purchase: (item.amount_total || 0) / 100 / (item.quantity || 1)
            };
        });

        const { error: itemsError } = await supabaseAdmin
            .from('order_items')
            .insert(orderItems);

        if (itemsError) {
            console.error('Error creating order items:', itemsError);
        }

        // Enviar email de confirmación
        if (customerEmail) {
            await sendOrderConfirmationEmail({
                to: customerEmail,
                customerName: customerName || 'Cliente',
                orderId: order.id,
                orderItems: orderItems,
                total: totalPrice,
                shippingAddress: shippingAddress
            });
        }

        console.log('Order processing completed successfully');
    } catch (error) {
        console.error('Error handling successful payment:', error);
        throw error;
    }
}

async function sendOrderConfirmationEmail(data: {
    to: string;
    customerName: string;
    orderId: string;
    orderItems: any[];
    total: number;
    shippingAddress: string;
}) {
    try {
        const itemsHTML = data.orderItems.map((item) => `
            <tr>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        ${item.product_image ? `<img src="${item.product_image}" alt="${item.product_name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;">` : ''}
                        <div>
                            <strong style="display: block; margin-bottom: 4px;">${item.product_name}</strong>
                            <span style="color: #6b7280; font-size: 14px;">${item.size ? `Talla: ${item.size} | ` : ''}Cantidad: ${item.quantity}</span>
                        </div>
                    </div>
                </td>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; white-space: nowrap;">
                    ${(item.price_at_purchase * item.quantity).toFixed(2)} €
                </td>
            </tr>
        `).join('');

        const addressHTML = data.shippingAddress ? `
            <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                <h2 style="font-size: 18px; color: #111827; margin-top: 0; margin-bottom: 15px;">📦 Dirección de Envío</h2>
                <p style="margin: 0; color: #374151; line-height: 1.8; white-space: pre-line;">${data.shippingAddress}</p>
            </div>
        ` : '';

        await resend.emails.send({
            from: 'FashionMarket <onboarding@resend.dev>',
            to: [data.to],
            subject: '✅ Confirmación de Pedido - FashionMarket',
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
                        <div style="background: linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%); padding: 40px 20px; text-align: center;">
                            <div style="background-color: rgba(255, 255, 255, 0.2); width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                                <span style="font-size: 40px;">✓</span>
                            </div>
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">¡Pedido Confirmado!</h1>
                            <p style="color: #ffffff; margin: 10px 0 0 0; opacity: 0.9;">Pedido #${data.orderId.slice(0, 8)}</p>
                        </div>
                        
                        <!-- Content -->
                        <div style="padding: 40px 30px;">
                            <p style="font-size: 16px; margin-bottom: 20px;">Hola <strong>${data.customerName}</strong>,</p>
                            
                            <p style="font-size: 16px; margin-bottom: 30px;">
                                Tu pedido ha sido confirmado y pagado exitosamente. Estamos preparándolo para su envío.
                            </p>
                            
                            <!-- Order Status -->
                            <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 16px 20px; margin-bottom: 30px; border-radius: 4px;">
                                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                                    <span style="font-size: 20px;">📋</span>
                                    <strong style="color: #065f46; font-size: 16px;">Estado del Pedido</strong>
                                </div>
                                <div style="margin-left: 32px;">
                                    <div style="margin-bottom: 8px;">
                                        <span style="display: inline-block; width: 12px; height: 12px; background-color: #10b981; border-radius: 50%; margin-right: 8px;"></span>
                                        <span style="color: #065f46; font-weight: 600;">Pedido confirmado y pagado</span>
                                    </div>
                                    <div style="margin-bottom: 8px; opacity: 0.6;">
                                        <span style="display: inline-block; width: 12px; height: 12px; background-color: #d1d5db; border-radius: 50%; margin-right: 8px;"></span>
                                        <span style="color: #6b7280;">Preparando envío</span>
                                    </div>
                                    <div style="margin-bottom: 8px; opacity: 0.6;">
                                        <span style="display: inline-block; width: 12px; height: 12px; background-color: #d1d5db; border-radius: 50%; margin-right: 8px;"></span>
                                        <span style="color: #6b7280;">En reparto</span>
                                    </div>
                                    <div style="opacity: 0.6;">
                                        <span style="display: inline-block; width: 12px; height: 12px; background-color: #d1d5db; border-radius: 50%; margin-right: 8px;"></span>
                                        <span style="color: #6b7280;">Entregado</span>
                                    </div>
                                </div>
                                <p style="margin: 12px 0 0 32px; font-size: 14px; color: #065f46;">
                                    Te avisaremos cuando tu pedido esté en camino con el código de seguimiento.
                                </p>
                            </div>

                            ${addressHTML}
                            
                            <!-- Order Details -->
                            <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                                <h2 style="font-size: 18px; color: #111827; margin-top: 0; margin-bottom: 20px;">Detalles del Pedido</h2>
                                
                                <table style="width: 100%; border-collapse: collapse;">
                                    ${itemsHTML}
                                </table>
                                
                                <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #e5e7eb;">
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                                        <span style="color: #6b7280;">Envío:</span>
                                        <span style="font-weight: 600; color: #10b981;">Gratis</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; padding-top: 10px; border-top: 1px solid #e5e7eb;">
                                        <span style="font-size: 18px; font-weight: bold;">Total:</span>
                                        <span style="font-size: 18px; font-weight: bold; color: #06b6d4;">${data.total.toFixed(2)} €</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Delivery Info -->
                            <div style="background-color: #eff6ff; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                                    <span style="font-size: 20px;">🚚</span>
                                    <strong style="color: #1e40af; font-size: 16px;">Información de Envío</strong>
                                </div>
                                <p style="margin: 0 0 8px 32px; color: #1e40af; font-size: 14px;">
                                    <strong>Tiempo estimado:</strong> 3-7 días laborables
                                </p>
                                <p style="margin: 0 0 0 32px; color: #1e40af; font-size: 14px;">
                                    <strong>Envío:</strong> Gratis en toda España
                                </p>
                            </div>

                            <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                                Si tienes alguna pregunta sobre tu pedido, no dudes en contactarnos respondiendo a este email.
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

        console.log('Order confirmation email sent to:', data.to);
    } catch (error) {
        console.error('Error sending order confirmation email:', error);
    }
}
