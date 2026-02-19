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
        // Check if order already exists (prevent duplicates from webhook + verify-session race)
        const { data: existingOrder } = await supabaseAdmin
            .from('orders')
            .select('id')
            .eq('stripe_session_id', session.id)
            .single();

        if (existingOrder) {
            console.log('⚠️ Order already exists for session, skipping:', existingOrder.id);
            return;
        }

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
        // Obtener dirección de envío
        const shippingDetails = (session as any).shipping_details || session.customer_details;
        let shippingAddress = '';
        let addressObject: any = null;

        // Intentar obtener dirección de metadata (proporcionada por nuestro frontend)
        if (session.metadata?.shipping_address) {
            try {
                const addr = JSON.parse(session.metadata.shipping_address);
                const name = session.metadata.customer_name || customerName || '';

                addressObject = {
                    street: addr.line1,
                    city: addr.city,
                    postal_code: addr.postal_code,
                    province: addr.state,
                    country: addr.country === 'ES' ? 'ES' : addr.country
                };

                shippingAddress = [
                    name,
                    addr.line1,
                    addr.line2,
                    [addr.postal_code, addr.city].filter(Boolean).join(' '),
                    addr.state,
                    addr.country === 'ES' ? 'España' : addr.country
                ].filter(Boolean).join('\n');

                console.log('Using shipping address from metadata');
            } catch (e) {
                console.error('Error parsing shipping address from metadata:', e);
            }
        }

        // Fallback a datos de Stripe si no hay metadata
        if (!shippingAddress && shippingDetails?.address) {
            const addr = shippingDetails.address;
            const name = shippingDetails.name || customerName || '';

            shippingAddress = [
                name,
                addr.line1,
                addr.line2,
                [addr.postal_code, addr.city].filter(Boolean).join(' '),
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

        // Get shipping method from metadata
        const shippingMethodId = session.metadata?.shipping_method_id
            ? parseInt(session.metadata.shipping_method_id)
            : null;

        // Crear el pedido en Supabase
        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .insert({
                customer_id: customerId,
                total_price: totalPrice,
                customer_email: customerEmail,
                customer_name: customerName,
                shipping_address: shippingAddress,
                shipping_method_id: shippingMethodId,
                status: 'paid',
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

        // ==========================================
        // 📦 Decrementar Stock por cada item
        // ==========================================
        console.log('Decrementing stock for order items...');
        for (const item of orderItems) {
            if (item.product_id && item.size) {
                const success = await decrementStock(item.product_id, item.size, item.quantity);
                if (success) {
                    console.log(`[STOCK] Decremented ${item.quantity} units of ${item.product_name} (${item.size})`);
                } else {
                    console.warn(`[STOCK] Failed to decrement stock for ${item.product_name} (${item.size})`);
                }
            }
        }

        // ==========================================
        // 🧾 Generar Factura Automática (Simplificada)
        // ==========================================
        try {
            console.log('Generating facturacion for order:', order.id);
            await createFacturacion(order.id);
            console.log('Facturacion generated successfully for order:', order.id);
        } catch (invoiceError) {
            console.error('Error generating facturacion:', invoiceError);
            // No fallamos el webhook, la factura se puede regenerar luego
        }

        // Enviar email de confirmación
        if (customerEmail) {
            try {
                await sendOrderConfirmationEmail({
                    to: customerEmail,
                    customerName: customerName || 'Cliente',
                    orderId: order.id,
                    orderNumber: order.order_number,
                    orderItems: orderItems,
                    total: totalPrice,
                    shippingAddress: shippingAddress
                });
            } catch (confirmError) {
                console.error('Error sending confirmation email (non-fatal):', confirmError);
            }

            // Enviar factura por email
            try {
                await sendInvoiceEmail(order.id);
                console.log('Invoice email sent for order:', order.id);
            } catch (invoiceEmailError) {
                console.error('Error sending invoice email:', invoiceEmailError);
                // No fallamos el webhook, la factura se puede reenviar después
            }
        }

        // Enviar notificación al admin
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

        // Comprobar stock bajo y alertar al admin
        try {
            const lowStockProducts: Array<{ id: string; name: string; size?: string; currentStock: number }> = [];

            for (const item of orderItems) {
                if (item.product_id && item.size) {
                    const { data: variant } = await supabaseAdmin
                        .from('product_variants')
                        .select('stock, size')
                        .eq('product_id', item.product_id)
                        .eq('size', item.size)
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
    orderNumber?: number;
    orderItems: any[];
    total: number;
    shippingAddress: string;
}) {
    try {
        const orderRef = data.orderNumber ? `#${data.orderNumber}` : `#${data.orderId.slice(0, 8).toUpperCase()}`;

        const { data: emailResult, error: emailError } = await resend.emails.send({
            from: 'FashionMarket <noreply@roomieapp.info>',
            to: [data.to],
            subject: `Pedido confirmado ${orderRef} - FashionMarket`,
            html: buildOrderConfirmationHTML({
                customerName: data.customerName,
                orderRef,
                orderItems: data.orderItems,
                totalPrice: data.total,
                shippingAddress: data.shippingAddress
            })
        });

        if (emailError) {
            console.error('[EMAIL] Error sending order confirmation:', emailError);
        } else {
            console.log('[EMAIL] Order confirmation sent to:', data.to, 'ID:', emailResult?.id);
        }
    } catch (error) {
        console.error('[EMAIL] Exception sending order confirmation:', error);
    }
}

async function sendInvoiceEmail(orderId: string) {
    try {
        const { data: factura } = await supabaseAdmin
            .from('facturacion')
            .select('*')
            .eq('order_id', orderId)
            .single();

        if (!factura) {
            console.log('No facturacion record found for order:', orderId);
            return;
        }

        const customerEmail = factura.customer_email;
        if (!customerEmail) {
            console.log('No customer email in facturacion');
            return;
        }

        const invoiceDate = new Date(factura.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });

        const { data: emailResult, error: emailError } = await resend.emails.send({
            from: 'FashionMarket <noreply@roomieapp.info>',
            to: [customerEmail],
            subject: `Factura ${factura.invoice_number} - FashionMarket`,
            html: buildInvoiceHTML({
                customerName: factura.customer_name || 'Cliente',
                customerEmail,
                invoiceNumber: factura.invoice_number,
                invoiceDate,
                items: factura.items || [],
                subtotal: factura.subtotal || 0,
                ivaAmount: factura.iva_amount || 0,
                total: factura.total || 0
            })
        });

        if (emailError) {
            console.error('[EMAIL] Error sending invoice:', emailError);
        } else {
            console.log('[EMAIL] Invoice sent to:', customerEmail, 'ID:', emailResult?.id);
        }
    } catch (error) {
        console.error('Error sending invoice email:', error);
        throw error;
    }
}
