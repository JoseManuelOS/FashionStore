import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { supabaseAdmin, createFacturacion } from '../../../lib/supabase';
import { Resend } from 'resend';
import { sendNewOrderNotification, sendLowStockAlert } from '../../../lib/admin-notifications';

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

        // Get shipping address - check metadata first (when customer provides in form), then Stripe collected
        let shippingAddress = '';
        let addressObject: any = null;

        // First try to get address from metadata (when customer provides it in checkout form)
        if (session.metadata?.shipping_address) {
            try {
                const metaAddr = JSON.parse(session.metadata.shipping_address);
                console.log('📍 Address from metadata:', metaAddr);

                // Build address parts from metadata
                const addressParts = [];
                if (customerName) addressParts.push(customerName);
                if (metaAddr.street) addressParts.push(metaAddr.street);

                const cityLine = [metaAddr.postal_code, metaAddr.city].filter(Boolean).join(' ');
                if (cityLine) addressParts.push(cityLine);

                if (metaAddr.province) addressParts.push(metaAddr.province);

                const countryName = metaAddr.country === 'ES' ? 'España' : (metaAddr.country || 'España');
                if (countryName) addressParts.push(countryName);

                shippingAddress = addressParts.join('\n');

                addressObject = {
                    street: metaAddr.street || '',
                    city: metaAddr.city || '',
                    postal_code: metaAddr.postal_code || '',
                    province: metaAddr.province || '',
                    country: metaAddr.country || 'ES'
                };
            } catch (e) {
                console.error('Error parsing metadata address:', e);
            }
        }

        // Fallback to Stripe shipping_details (when Stripe collects address)
        if (!shippingAddress) {
            const shippingDetails = (session as any).shipping_details || session.customer_details;

            if (shippingDetails?.address) {
                const addr = shippingDetails.address;
                const name = shippingDetails.name || customerName || '';
                console.log('📍 Address from Stripe shipping_details:', addr);

                // Build address parts, filtering out null/undefined/empty values
                const addressParts = [];
                if (name) addressParts.push(name);
                if (addr.line1) addressParts.push(addr.line1);
                if (addr.line2) addressParts.push(addr.line2);

                // Only add postal/city if both exist
                const cityLine = [addr.postal_code, addr.city].filter(Boolean).join(' ');
                if (cityLine) addressParts.push(cityLine);

                if (addr.state) addressParts.push(addr.state);

                const countryName = addr.country === 'ES' ? 'España' : addr.country;
                if (countryName) addressParts.push(countryName);

                shippingAddress = addressParts.join('\n');

                addressObject = {
                    street: [addr.line1, addr.line2].filter(Boolean).join(', '),
                    city: addr.city || '',
                    postal_code: addr.postal_code || '',
                    province: addr.state || '',
                    country: addr.country || ''
                };
            }
        }

        console.log('📍 Final shipping address:', shippingAddress);

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

        // Create invoice automatically
        let invoiceCreated = false;
        try {
            const invoice = await createFacturacion(order.id);
            console.log('🧾 Invoice created:', invoice.invoice_number);
            invoiceCreated = true;
        } catch (invoiceError) {
            // Don't fail the request - payment already processed
            console.error('⚠️ Error creating invoice (non-fatal):', invoiceError);
        }

        // Send invoice email to customer automatically
        if (invoiceCreated && customerEmail) {
            try {
                // Import the send function directly to avoid fetch
                const { getFacturacionByOrderId, getOrderById } = await import('../../../lib/supabase');
                const invoiceData = await getFacturacionByOrderId(order.id);

                if (invoiceData) {
                    const formatCurrency = (amount: number) =>
                        new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);

                    const items = invoiceData.items || [];
                    const itemsHtml = items.map((item: any) => `
                        <tr>
                            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #374151;">
                                <div style="font-weight: 600;">${item.product_name}</div>
                                ${item.size ? `<div style="font-size: 12px; color: #6b7280;">Talla: ${item.size}</div>` : ''}
                            </td>
                            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center; color: #374151;">${item.quantity}</td>
                            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600; color: #111827;">${formatCurrency(item.total || item.price * item.quantity)}</td>
                        </tr>
                    `).join('');

                    const invoiceDate = new Date().toLocaleDateString('es-ES', {
                        day: '2-digit', month: 'long', year: 'numeric'
                    });

                    await resend.emails.send({
                        from: 'FashionMarket <noreply@roomieapp.info>',
                        to: customerEmail,
                        subject: `Factura ${invoiceData.invoice_number} - Pedido #${order.order_number}`,
                        html: `
                            <!DOCTYPE html>
                            <html>
                            <head><meta charset="UTF-8"></head>
                            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f3f4f6;">
                                <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden;">
                                    <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 32px; text-align: center;">
                                        <h1 style="font-size: 22px; font-weight: 700; color: #06b6d4; margin: 0 0 8px 0;">FASHIONMARKET</h1>
                                        <p style="color: #94a3b8; font-size: 14px; margin: 0;">Factura ${invoiceData.invoice_number}</p>
                                    </div>
                                    <div style="padding: 24px;">
                                        <p style="color: #374151; margin: 0 0 20px;">Hola <strong>${customerName || 'Cliente'}</strong>,</p>
                                        <p style="color: #6b7280; margin: 0 0 24px;">Adjuntamos la factura de tu pedido #${order.order_number}.</p>
                                        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                                            <thead><tr style="background: #f1f5f9;">
                                                <th style="padding: 10px; text-align: left; font-size: 11px; color: #64748b; text-transform: uppercase;">Producto</th>
                                                <th style="padding: 10px; text-align: center; font-size: 11px; color: #64748b; text-transform: uppercase;">Cant.</th>
                                                <th style="padding: 10px; text-align: right; font-size: 11px; color: #64748b; text-transform: uppercase;">Total</th>
                                            </tr></thead>
                                            <tbody>${itemsHtml}</tbody>
                                        </table>
                                        <div style="background: #f9fafb; padding: 16px; border-radius: 8px;">
                                            <table style="width: 100%;">
                                                <tr><td style="color: #6b7280;">Base imponible</td><td style="text-align: right;">${formatCurrency(invoiceData.subtotal || 0)}</td></tr>
                                                <tr><td style="color: #6b7280;">IVA (21%)</td><td style="text-align: right;">${formatCurrency(invoiceData.iva_amount || 0)}</td></tr>
                                                <tr style="font-weight: 700; font-size: 18px;"><td style="padding-top: 12px;">TOTAL</td><td style="text-align: right; color: #06b6d4; padding-top: 12px;">${formatCurrency(invoiceData.total || 0)}</td></tr>
                                            </table>
                                        </div>
                                    </div>
                                    <div style="padding: 16px; text-align: center; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px;">
                                        Gracias por tu compra en FashionMarket
                                    </div>
                                </div>
                            </body>
                            </html>
                        `
                    });
                    console.log('📧 Invoice email sent to:', customerEmail);
                }
            } catch (invoiceEmailError) {
                console.error('⚠️ Error sending invoice email (non-fatal):', invoiceEmailError);
            }
        }

        // Send admin notification for new order
        try {
            await sendNewOrderNotification({
                id: order.id,
                order_number: order.order_number,
                customer_name: customerName || undefined,
                customer_email: customerEmail || undefined,
                total_price: totalPrice,
                items: orderItems
            });
        } catch (notifyError) {
            console.error('⚠️ Error sending admin notification (non-fatal):', notifyError);
        }

        // Check for low stock and alert admin
        try {
            const lowStockProducts: Array<{ id: string; name: string; size?: string; currentStock: number }> = [];

            for (const item of orderItems) {
                if (item.product_id) {
                    // Check variant stock
                    const { data: variant } = await supabaseAdmin
                        .from('product_variants')
                        .select('stock, size')
                        .eq('product_id', item.product_id)
                        .eq('size', item.size || '')
                        .single();

                    if (variant && variant.stock < 5) {
                        lowStockProducts.push({
                            id: item.product_id,
                            name: item.product_name,
                            size: item.size || undefined,
                            currentStock: variant.stock
                        });
                    }
                }
            }

            if (lowStockProducts.length > 0) {
                await sendLowStockAlert(lowStockProducts);
            }
        } catch (stockError) {
            console.error('⚠️ Error checking stock (non-fatal):', stockError);
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
                    from: 'FashionMarket <noreply@roomieapp.info>',
                    to: customerEmail,
                    subject: `Confirmación de pedido #${order.order_number ? order.order_number : order.id.slice(0, 8).toUpperCase()}`,
                    html: `
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <meta charset="UTF-8">
                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        </head>
                        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #e2e8f0; margin: 0; padding: 0; background-color: #0a0a0f;">
                            <div style="max-width: 600px; margin: 0 auto; background-color: #0f0f1a;">
                                <!-- Header -->
                                <div style="background: linear-gradient(135deg, #0891b2 0%, #06b6d4 50%, #22d3ee 100%); padding: 48px 32px; text-align: center;">
                                    <div style="width: 80px; height: 80px; margin: 0 auto 20px; background: rgba(255,255,255,0.2); border-radius: 50%;">
                                        <table width="100%" height="80"><tr><td align="center" valign="middle" style="color: white; font-size: 40px; font-weight: 300;">✓</td></tr></table>
                                    </div>
                                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Pedido Confirmado</h1>
                                    <p style="color: rgba(255,255,255,0.9); margin: 12px 0 0 0; font-size: 16px;">Gracias por tu compra</p>
                                    <div style="margin-top: 24px; background: rgba(255, 255, 255, 0.15); display: inline-block; padding: 12px 24px; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.2);">
                                        <p style="color: rgba(255,255,255,0.8); font-size: 12px; font-weight: 500; margin: 0; text-transform: uppercase; letter-spacing: 1px;">Referencia del pedido</p>
                                        <p style="color: #ffffff; font-size: 20px; font-weight: 700; margin: 4px 0 0;">#${order.order_number ? order.order_number : order.id.slice(0, 8).toUpperCase()}</p>
                                    </div>
                                </div>
                                
                                <!-- Content -->
                                <div style="padding: 40px 32px;">
                                    <!-- Order Info Card -->
                                    <div style="background: #0a0a0f; border: 1px solid #2a2a3e; border-radius: 16px; padding: 24px; margin-bottom: 24px;">
                                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 1px solid #2a2a3e; padding-bottom: 16px;">
                                            <div>
                                                <p style="color: #71717a; font-size: 12px; margin: 0; text-transform: uppercase;">Número de pedido</p>
                                                <p style="color: #22d3ee; font-size: 18px; font-weight: 700; margin: 4px 0 0;">#${order.order_number ? order.order_number : order.id.slice(0, 8).toUpperCase()}</p>
                                            </div>
                                            <div style="text-align: right;">
                                                <p style="color: #71717a; font-size: 12px; margin: 0; text-transform: uppercase;">Total</p>
                                                <p style="color: #f1f5f9; font-size: 24px; font-weight: 700; margin: 4px 0 0;">${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(totalPrice)}</p>
                                            </div>
                                        </div>
                                        
                                        <!-- Products Table -->
                                        <table style="width: 100%; border-collapse: collapse;">
                                            <thead>
                                                <tr>
                                                    <th style="padding: 12px; text-align: left; color: #71717a; font-size: 12px; text-transform: uppercase; border-bottom: 1px solid #2a2a3e;">Producto</th>
                                                    <th style="padding: 12px; text-align: center; color: #71717a; font-size: 12px; text-transform: uppercase; border-bottom: 1px solid #2a2a3e;">Cant.</th>
                                                    <th style="padding: 12px; text-align: right; color: #71717a; font-size: 12px; text-transform: uppercase; border-bottom: 1px solid #2a2a3e;">Precio</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                ${productsHtml}
                                            </tbody>
                                        </table>
                                    </div>
                                    
                                    ${shippingAddress ? `
                                    <!-- Shipping Address -->
                                    <div style="background: #0a0a0f; border: 1px solid #2a2a3e; border-radius: 16px; padding: 24px; margin-bottom: 24px;">
                                        <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                            <tr>
                                                <td width="48" valign="top">
                                                    <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #f97316, #ea580c); border-radius: 10px; text-align: center; line-height: 40px;">
                                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" style="vertical-align: middle;">
                                                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                                            <circle cx="12" cy="10" r="3"></circle>
                                                        </svg>
                                                    </div>
                                                </td>
                                                <td style="padding-left: 16px;">
                                                    <div style="font-size: 12px; color: #71717a; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Dirección de envío</div>
                                                    <div style="color: #e2e8f0; line-height: 1.6; white-space: pre-line;">${shippingAddress}</div>
                                                </td>
                                            </tr>
                                        </table>
                                    </div>
                                    ` : ''}
                                    
                                    <!-- Order Status Progress -->
                                    <div style="background: #0a0a0f; border: 1px solid #2a2a3e; border-radius: 16px; padding: 28px; margin-bottom: 24px;">
                                        <h3 style="font-size: 14px; color: #a1a1aa; margin: 0 0 24px 0; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Estado del pedido</h3>
                                        
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td width="25%" align="center" style="padding-bottom: 8px;">
                                                    <div style="width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #06b6d4, #0891b2); margin: 0 auto;">
                                                        <table width="36" height="36"><tr><td align="center" valign="middle" style="color: white; font-size: 18px;">✓</td></tr></table>
                                                    </div>
                                                </td>
                                                <td width="25%" align="center" style="padding-bottom: 8px;">
                                                    <div style="width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #06b6d4, #0891b2); margin: 0 auto;">
                                                        <table width="36" height="36"><tr><td align="center" valign="middle" style="color: white; font-size: 18px;">✓</td></tr></table>
                                                    </div>
                                                </td>
                                                <td width="25%" align="center" style="padding-bottom: 8px;">
                                                    <div style="width: 36px; height: 36px; border-radius: 50%; border: 3px solid #06b6d4; background: #0f0f1a; margin: 0 auto; box-shadow: 0 0 0 4px rgba(6, 182, 212, 0.2);">
                                                        <table width="36" height="36"><tr><td align="center" valign="middle" style="color: #22d3ee; font-weight: 700; font-size: 14px;">3</td></tr></table>
                                                    </div>
                                                </td>
                                                <td width="25%" align="center" style="padding-bottom: 8px;">
                                                    <div style="width: 36px; height: 36px; border-radius: 50%; background: #2a2a3e; margin: 0 auto;">
                                                        <table width="36" height="36"><tr><td align="center" valign="middle" style="color: #71717a; font-weight: 600; font-size: 14px;">4</td></tr></table>
                                                    </div>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td align="center" style="font-size: 11px; color: #22d3ee; font-weight: 500;">Confirmado</td>
                                                <td align="center" style="font-size: 11px; color: #22d3ee; font-weight: 500;">Pagado</td>
                                                <td align="center" style="font-size: 11px; color: #22d3ee; font-weight: 500;">Preparando</td>
                                                <td align="center" style="font-size: 11px; color: #71717a;">Enviado</td>
                                            </tr>
                                        </table>
                                        
                                        <p style="margin: 20px 0 0 0; font-size: 13px; color: #71717a; text-align: center;">
                                            Te notificaremos cuando tu pedido sea enviado.
                                        </p>
                                    </div>
                                    
                                    <!-- CTA Button -->
                                    <div style="text-align: center; margin: 32px 0;">
                                        <a href="${import.meta.env.PUBLIC_SITE_URL || 'http://localhost:4321'}/cuenta/pedidos" style="display: inline-block; background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px rgba(6, 182, 212, 0.4);">
                                            Ver mis pedidos
                                        </a>
                                    </div>
                                    
                                    <p style="font-size: 14px; color: #71717a; margin: 24px 0 0 0; text-align: center;">
                                        ¿Tienes alguna pregunta? Responde a este correo y te ayudaremos.
                                    </p>
                                </div>
                                
                                <!-- Footer -->
                                <div style="background-color: #0a0a0f; padding: 32px; text-align: center; border-top: 1px solid #2a2a3e;">
                                    <p style="color: #71717a; margin: 0; font-size: 13px;">
                                        © ${new Date().getFullYear()} FashionMarket. Todos los derechos reservados.
                                    </p>
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
