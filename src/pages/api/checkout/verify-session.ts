import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { supabaseAdmin } from '../../../lib/supabase';
import { Resend } from 'resend';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-12-15.clover',
});

const resend = new Resend(import.meta.env.RESEND_API_KEY);

export const POST: APIRoute = async ({ request }) => {
    try {
        const { sessionId } = await request.json();

        if (!sessionId) {
            return new Response(
                JSON.stringify({ error: 'Session ID required' }),
                { status: 400 }
            );
        }

        console.log('🔍 Verifying Stripe session:', sessionId);

        // Get Stripe session
        const session = await stripe.checkout.sessions.retrieve(sessionId, {
            expand: ['line_items.data.price.product']
        });

        if (!session) {
            return new Response(
                JSON.stringify({ error: 'Session not found' }),
                { status: 404 }
            );
        }

        // Check if payment was successful
        if (session.payment_status !== 'paid') {
            return new Response(
                JSON.stringify({ error: 'Payment not completed' }),
                { status: 400 }
            );
        }

        // Check if order already exists
        const { data: existingOrder } = await supabaseAdmin
            .from('orders')
            .select('id')
            .eq('stripe_session_id', sessionId)
            .single();

        if (existingOrder) {
            console.log('✅ Order already exists:', existingOrder.id);
            return new Response(
                JSON.stringify({ success: true, orderId: existingOrder.id }),
                { status: 200 }
            );
        }

        console.log('📦 Creating new order from session...');

        // Get customer details
        const customerEmail = session.customer_details?.email || session.customer_email || null;
        const customerName = session.customer_details?.name || session.metadata?.customer_name || null;
        const customerPhone = session.metadata?.customer_phone || null;

        // Get shipping address
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

            addressObject = {
                street: [addr.line1, addr.line2].filter(Boolean).join(', '),
                city: addr.city,
                postal_code: addr.postal_code,
                province: addr.state,
                country: addr.country
            };
        }

        // Find customer ID by email in customers table
        let customerId = null;
        if (customerEmail) {
            const { data: customer } = await supabaseAdmin
                .from('customers')
                .select('id')
                .eq('email', customerEmail)
                .single();

            if (customer) {
                customerId = customer.id;

                // Update customer profile
                if (addressObject) {
                    await supabaseAdmin
                        .from('customers')
                        .update({
                            full_name: customerName,
                            phone: customerPhone,
                            default_address: addressObject,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', customerId);
                }
            }
        }

        // Calculate total
        const totalPrice = (session.amount_total || 0) / 100;

        // Create order with tracking columns
        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .insert({
                customer_id: customerId,
                total_price: totalPrice,
                customer_email: customerEmail,
                customer_name: customerName,
                shipping_address: shippingAddress,
                status: 'paid',
                stripe_session_id: sessionId,
                stripe_payment_intent: session.payment_intent as string
            })
            .select()
            .single();

        if (orderError) {
            console.error('❌ Error creating order:', orderError);
            return new Response(
                JSON.stringify({ error: 'Failed to create order: ' + orderError.message }),
                { status: 500 }
            );
        }

        console.log('✅ Order created:', order.id);

        // Create order items with product images
        const lineItems = session.line_items?.data || [];
        const orderItems = lineItems.map((item: any) => {
            const product = item.price?.product;
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

        if (orderItems.length > 0) {
            const { error: itemsError } = await supabaseAdmin
                .from('order_items')
                .insert(orderItems);

            if (itemsError) {
                console.error('❌ Error creating order items:', itemsError);
            }
        }

        // Send confirmation email with product details
        if (customerEmail && import.meta.env.RESEND_API_KEY) {
            try {
                const productsHtml = orderItems.map(item => `
                    <tr>
                        <td style="padding: 12px; border-bottom: 1px solid #333;">
                            <div style="display: flex; align-items: center; gap: 12px;">
                                ${item.product_image ? `<img src="${item.product_image}" alt="${item.product_name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;" />` : ''}
                                <div>
                                    <p style="margin: 0; font-weight: 600; color: #fff;">${item.product_name}</p>
                                    ${item.size ? `<p style="margin: 4px 0 0; font-size: 12px; color: #888;">Talla: ${item.size}</p>` : ''}
                                </div>
                            </div>
                        </td>
                        <td style="padding: 12px; border-bottom: 1px solid #333; text-align: center; color: #888;">${item.quantity}</td>
                        <td style="padding: 12px; border-bottom: 1px solid #333; text-align: right; color: #00d4ff; font-weight: 600;">${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(item.price_at_purchase * item.quantity)}</td>
                    </tr>
                `).join('');

                await resend.emails.send({
                    from: 'FashionMarket <onboarding@resend.dev>',
                    to: customerEmail,
                    subject: `✨ Confirmación de pedido #${order.order_number ? order.order_number : order.id.slice(0, 8).toUpperCase()}`,
                    html: `
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <meta charset="UTF-8">
                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        </head>
                        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1f2937; margin: 0; padding: 0; background-color: #0f172a;">
                            <div style="max-width: 600px; margin: 0 auto; background-color: #1e293b;">
                                <!-- Header -->
                                <div style="background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); padding: 48px 32px; text-align: center;">
                                    <div style="background: rgba(255, 255, 255, 0.2); width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;">
                                        <span style="font-size: 32px;">✨</span>
                                    </div>
                                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">¡Pedido Confirmado!</h1>
                                    <p style="color: #ffffff; margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">Gracias por tu compra</p>
                                    <div style="margin-top: 24px; background: rgba(255, 255, 255, 0.1); display: inline-block; padding: 8px 16px; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.2);">
                                        <p style="color: #ffffff; font-size: 14px; font-weight: 500; margin: 0; text-transform: uppercase; letter-spacing: 1px;">Referencia del pedido</p>
                                        <p style="color: #ffffff; font-size: 18px; font-weight: 700; margin: 4px 0 0;">#${order.order_number ? order.order_number : order.id.slice(0, 8).toUpperCase()}</p>
                                    </div>
                                </div>
                                <!-- Order Info Card -->
                                <div style="background: #1a1a2e; border: 1px solid #333; border-radius: 16px; padding: 24px; margin-bottom: 24px;">
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 1px solid #333; padding-bottom: 16px;">
                                        <div>
                                            <p style="color: #888; font-size: 12px; margin: 0;">Número de pedido</p>
                                            <p style="color: #00d4ff; font-size: 18px; font-weight: 700; margin: 4px 0 0;">#${order.order_number ? order.order_number : order.id.slice(0, 8).toUpperCase()}</p>
                                        </div>
                                        <div style="text-align: right;">
                                            <p style="color: #888; font-size: 12px; margin: 0;">Total</p>
                                            <p style="color: #fff; font-size: 24px; font-weight: 700; margin: 4px 0 0;">${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(totalPrice)}</p>
                                        </div>
                                    </div>
                                    
                                    <!-- Products Table -->
                                    <table style="width: 100%; border-collapse: collapse;">
                                        <thead>
                                            <tr>
                                                <th style="padding: 12px; text-align: left; color: #888; font-size: 12px; text-transform: uppercase; border-bottom: 1px solid #333;">Producto</th>
                                                <th style="padding: 12px; text-align: center; color: #888; font-size: 12px; text-transform: uppercase; border-bottom: 1px solid #333;">Cant.</th>
                                                <th style="padding: 12px; text-align: right; color: #888; font-size: 12px; text-transform: uppercase; border-bottom: 1px solid #333;">Precio</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${productsHtml}
                                        </tbody>
                                    </table>
                                </div>
                                
                                ${shippingAddress ? `
                                <!-- Shipping Address -->
                                <div style="background: #1a1a2e; border: 1px solid #333; border-radius: 16px; padding: 24px; margin-bottom: 24px;">
                                    <h3 style="color: #fff; font-size: 16px; margin: 0 0 12px; display: flex; align-items: center; gap: 8px;">
                                        📍 Dirección de envío
                                    </h3>
                                    <p style="color: #888; margin: 0; white-space: pre-line; line-height: 1.6;">${shippingAddress}</p>
                                </div>
                                ` : ''}
                                
                                <!-- Progress Bar -->
                                <div style="background: #1a1a2e; border: 1px solid #333; border-radius: 16px; padding: 24px; margin-bottom: 24px;">
                                    <h3 style="color: #fff; font-size: 16px; margin: 0 0 20px;">Estado del pedido</h3>
                                    <div style="display: flex; justify-content: space-between; position: relative;">
                                        <div style="position: absolute; top: 12px; left: 20px; right: 20px; height: 4px; background: #333; border-radius: 2px;"></div>
                                        <div style="position: absolute; top: 12px; left: 20px; width: 25%; height: 4px; background: linear-gradient(90deg, #00d4ff, #00d4ff); border-radius: 2px;"></div>
                                        
                                        <div style="text-align: center; z-index: 1;">
                                            <div style="width: 28px; height: 28px; background: #00d4ff; border-radius: 50%; margin: 0 auto 8px; line-height: 28px; font-size: 14px;">💳</div>
                                            <p style="color: #00d4ff; font-size: 11px; margin: 0;">Pagado</p>
                                        </div>
                                        <div style="text-align: center; z-index: 1;">
                                            <div style="width: 28px; height: 28px; background: #333; border-radius: 50%; margin: 0 auto 8px; line-height: 28px; font-size: 14px;">📦</div>
                                            <p style="color: #888; font-size: 11px; margin: 0;">Preparando</p>
                                        </div>
                                        <div style="text-align: center; z-index: 1;">
                                            <div style="width: 28px; height: 28px; background: #333; border-radius: 50%; margin: 0 auto 8px; line-height: 28px; font-size: 14px;">🚚</div>
                                            <p style="color: #888; font-size: 11px; margin: 0;">Enviado</p>
                                        </div>
                                        <div style="text-align: center; z-index: 1;">
                                            <div style="width: 28px; height: 28px; background: #333; border-radius: 50%; margin: 0 auto 8px; line-height: 28px; font-size: 14px;">✅</div>
                                            <p style="color: #888; font-size: 11px; margin: 0;">Entregado</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- CTA Button -->
                                <div style="text-align: center; margin-bottom: 30px;">
                                    <a href="${import.meta.env.PUBLIC_SITE_URL || 'http://localhost:4321'}/cuenta/pedidos" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #00d4ff, #00a8cc); color: #000; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 14px;">Ver mis pedidos</a>
                                </div>
                                
                                <!-- Footer -->
                                <div style="text-align: center; padding-top: 30px; border-top: 1px solid #333;">
                                    <p style="color: #888; font-size: 12px; margin: 0 0 10px;">¿Tienes alguna pregunta? Contáctanos</p>
                                    <p style="color: #666; font-size: 11px; margin: 0;">© 2026 FashionMarket. Todos los derechos reservados.</p>
                                </div>
                            </div>
                        </body>
                        </html>
                    `
                });
                console.log('✅ Email sent to:', customerEmail);
            } catch (emailError) {
                console.error('❌ Error sending email:', emailError);
            }
        }

        return new Response(
            JSON.stringify({ success: true, orderId: order.id }),
            { status: 200 }
        );

    } catch (error: any) {
        console.error('❌ Error verifying session:', error);
        return new Response(
            JSON.stringify({ error: error.message || 'Internal server error' }),
            { status: 500 }
        );
    }
};
