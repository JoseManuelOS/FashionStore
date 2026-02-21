import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { supabaseAdmin, createFacturacion, decrementStock } from '../../../lib/supabase';
import { Resend } from 'resend';
import { sendNewOrderNotification, sendLowStockAlert } from '../../../lib/admin-notifications';
import { buildOrderConfirmationHTML, buildInvoiceHTML } from '../../../lib/email-templates';

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
            .select('id, order_number')
            .eq('stripe_session_id', sessionId)
            .single();

        if (existingOrder) {
            console.log('✅ Order already exists:', existingOrder.id);
            return new Response(
                JSON.stringify({ success: true, orderId: existingOrder.id, orderNumber: existingOrder.order_number }),
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
                color: product?.metadata?.color || null,
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

        // 📦 Decrementar stock por cada item
        console.log('[STOCK] Decrementing stock for order items...');
        for (const item of orderItems) {
            if (item.product_id && item.size) {
                const success = await decrementStock(item.product_id, item.size, item.quantity, item.color || '');
                if (success) {
                    console.log(`[STOCK] Decremented ${item.quantity} of ${item.product_name} (${item.size}${item.color ? `, ${item.color}` : ''})`);
                } else {
                    console.warn(`[STOCK] Failed to decrement stock for ${item.product_name} (${item.size}${item.color ? `, ${item.color}` : ''})`);
                }
            } else {
                console.warn(`[STOCK] Skipped stock decrement - missing product_id or size for: ${item.product_name}`);
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
                const { getFacturacionByOrderId } = await import('../../../lib/supabase');
                const invoiceData = await getFacturacionByOrderId(order.id);

                if (invoiceData) {
                    const invoiceDate = new Date().toLocaleDateString('es-ES', {
                        day: '2-digit', month: 'long', year: 'numeric'
                    });

                    const { data: invoiceEmailResult, error: invoiceEmailErr } = await resend.emails.send({
                        from: 'FashionMarket <noreply@roomieapp.info>',
                        to: customerEmail,
                        subject: `Factura ${invoiceData.invoice_number} - Pedido #${order.order_number}`,
                        html: buildInvoiceHTML({
                            customerName: customerName || 'Cliente',
                            customerEmail: customerEmail,
                            invoiceNumber: invoiceData.invoice_number,
                            invoiceDate,
                            items: invoiceData.items || [],
                            subtotal: invoiceData.subtotal || 0,
                            ivaAmount: invoiceData.iva_amount || 0,
                            total: invoiceData.total || 0
                        })
                    });

                    if (invoiceEmailErr) {
                        console.error('[EMAIL] Error sending invoice:', invoiceEmailErr);
                    } else {
                        console.log('[EMAIL] Invoice sent to:', customerEmail, 'ID:', invoiceEmailResult?.id);
                    }
                }
            } catch (invoiceEmailError) {
                console.error('⚠️ Error sending invoice email (non-fatal):', invoiceEmailError);
            }
        }

        // Send admin notification for new order
        await new Promise(resolve => setTimeout(resolve, 1000));
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
            const lowStockProducts: Array<{ id: string; name: string; size?: string; color?: string; currentStock: number }> = [];

            for (const item of orderItems) {
                if (item.product_id) {
                    // Check variant stock (with color)
                    const { data: variant } = await supabaseAdmin
                        .from('product_variants')
                        .select('stock, size, color')
                        .eq('product_id', item.product_id)
                        .eq('size', item.size || '')
                        .eq('color', item.color || '')
                        .single();

                    if (variant && variant.stock < 5) {
                        lowStockProducts.push({
                            id: item.product_id,
                            name: item.product_name,
                            size: item.size || undefined,
                            color: item.color || undefined,
                            currentStock: variant.stock
                        });
                    }
                }
            }

            if (lowStockProducts.length > 0) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                await sendLowStockAlert(lowStockProducts);
            }
        } catch (stockError) {
            console.error('⚠️ Error checking stock (non-fatal):', stockError);
        }

        // Send confirmation email with product details
        // Wait 1s to respect Resend's 2 req/s rate limit
        if (customerEmail && import.meta.env.RESEND_API_KEY) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            try {
                const orderRef = order.order_number ? `#${order.order_number}` : `#${order.id.slice(0, 8).toUpperCase()}`;

                const { data: emailResult, error: emailError } = await resend.emails.send({
                    from: 'FashionMarket <noreply@roomieapp.info>',
                    to: customerEmail,
                    subject: `Pedido confirmado ${orderRef} - FashionMarket`,
                    html: buildOrderConfirmationHTML({
                        customerName: customerName || 'Cliente',
                        orderRef,
                        orderItems,
                        totalPrice,
                        shippingAddress
                    })
                });

                if (emailError) {
                    console.error('[EMAIL] Error sending order confirmation:', emailError);
                } else {
                    console.log('[EMAIL] Order confirmation sent to:', customerEmail, 'ID:', emailResult?.id);
                }
            } catch (emailError) {
                console.error('[EMAIL] Exception sending confirmation email:', emailError);
            }
        }

        return new Response(
            JSON.stringify({ success: true, orderId: order.id, orderNumber: order.order_number }),
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
