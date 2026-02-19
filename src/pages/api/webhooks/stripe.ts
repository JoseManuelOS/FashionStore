import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { supabaseAdmin, createFacturacion, decrementStock } from '../../../lib/supabase';
import { Resend } from 'resend';
import { sendNewOrderNotification, sendLowStockAlert } from '../../../lib/admin-notifications';

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

        const itemsHTML = data.orderItems.map((item) => `
            <tr>
                <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb;">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                        <tr>
                            <td width="64" valign="top">
                                ${item.product_image
                                    ? `<img src="${item.product_image}" alt="${item.product_name}" style="width: 56px; height: 56px; object-fit: cover; border-radius: 8px; border: 1px solid #e5e7eb;">`
                                    : `<div style="width: 56px; height: 56px; background: #f3f4f6; border-radius: 8px;"></div>`
                                }
                            </td>
                            <td style="padding-left: 12px;" valign="middle">
                                <div style="font-weight: 600; color: #111827; font-size: 14px;">${item.product_name}</div>
                                <div style="color: #6b7280; font-size: 13px; margin-top: 2px;">${item.size ? `Talla: ${item.size} &nbsp;|&nbsp; ` : ''}Cant: ${item.quantity}</div>
                            </td>
                            <td width="90" align="right" valign="middle">
                                <div style="font-weight: 700; color: #111827; font-size: 14px;">${(item.price_at_purchase * item.quantity).toFixed(2)} &euro;</div>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        `).join('');

        const addressSection = data.shippingAddress ? `
            <tr>
                <td style="padding: 0 0 24px 0;">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background: #f9fafb; border-radius: 10px; border: 1px solid #e5e7eb;">
                        <tr>
                            <td style="padding: 16px 20px;">
                                <div style="font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Direcci&oacute;n de env&iacute;o</div>
                                <div style="color: #374151; font-size: 14px; line-height: 1.7; white-space: pre-line;">${data.shippingAddress}</div>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        ` : '';

        const year = new Date().getFullYear();

        const { data: emailResult, error: emailError } = await resend.emails.send({
            from: 'FashionMarket <noreply@roomieapp.info>',
            to: [data.to],
            subject: `Pedido confirmado ${orderRef} - FashionMarket`,
            html: `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Confirmaci&oacute;n de Pedido ${orderRef}</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f3f4f6;padding:40px 20px;">
<tr><td align="center">
<table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

  <!-- Header -->
  <tr>
    <td style="background:#0e7490;padding:40px 32px;text-align:center;">
      <div style="width:60px;height:60px;background:rgba(255,255,255,0.2);border-radius:50%;margin:0 auto 16px;line-height:60px;font-size:28px;color:white;">&#10003;</div>
      <h1 style="color:#ffffff;margin:0;font-size:26px;font-weight:700;">Pedido Confirmado</h1>
      <p style="color:rgba(255,255,255,0.85);margin:10px 0 0;font-size:15px;">Gracias por tu compra, <strong>${data.customerName}</strong></p>
      <div style="margin-top:20px;display:inline-block;background:rgba(255,255,255,0.15);padding:10px 24px;border-radius:8px;border:1px solid rgba(255,255,255,0.25);">
        <span style="color:rgba(255,255,255,0.75);font-size:12px;text-transform:uppercase;letter-spacing:1px;">Referencia</span>
        <div style="color:#ffffff;font-size:20px;font-weight:700;margin-top:2px;">${orderRef}</div>
      </div>
    </td>
  </tr>

  <!-- Body -->
  <tr>
    <td style="padding:32px 32px 0;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%">

        <!-- Message -->
        <tr>
          <td style="padding-bottom:24px;">
            <p style="margin:0;color:#374151;font-size:15px;line-height:1.6;">
              Tu pedido ha sido procesado correctamente y est&aacute; siendo preparado para su env&iacute;o. Recibir&aacute;s otro email cuando sea enviado.
            </p>
          </td>
        </tr>

        <!-- Items table -->
        <tr>
          <td style="padding-bottom:24px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-radius:10px;border:1px solid #e5e7eb;overflow:hidden;">
              <tr style="background:#f9fafb;">
                <th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #e5e7eb;">Producto</th>
                <th style="padding:10px 16px;text-align:right;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #e5e7eb;">Total</th>
              </tr>
              ${itemsHTML}
              <tr style="background:#f9fafb;">
                <td style="padding:14px 16px;font-weight:700;color:#111827;font-size:15px;">TOTAL</td>
                <td style="padding:14px 16px;text-align:right;font-weight:700;color:#0e7490;font-size:18px;">${data.total.toFixed(2)} &euro;</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Shipping address -->
        ${addressSection}

        <!-- Delivery info -->
        <tr>
          <td style="padding-bottom:24px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f0fdf4;border-radius:10px;border:1px solid #bbf7d0;">
              <tr>
                <td style="padding:16px 20px;">
                  <div style="font-size:11px;font-weight:600;color:#166534;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Tiempo estimado de entrega</div>
                  <div style="font-size:16px;font-weight:700;color:#15803d;">3-7 d&iacute;as laborables</div>
                  <div style="font-size:13px;color:#166534;margin-top:2px;">Env&iacute;o gratuito a toda Espa&ntilde;a</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td style="padding-bottom:32px;text-align:center;">
            <a href="https://j4o0084kg0ssoo0wc0ocw0g8.victoriafp.online/cuenta/pedidos"
               style="display:inline-block;background:#0e7490;color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:8px;font-weight:600;font-size:15px;">
              Ver mis pedidos
            </a>
          </td>
        </tr>

      </table>
    </td>
  </tr>

  <!-- Footer -->
  <tr>
    <td style="background:#f9fafb;padding:24px 32px;text-align:center;border-top:1px solid #e5e7eb;">
      <p style="margin:0;color:#9ca3af;font-size:13px;">&copy; ${year} FashionMarket. Todos los derechos reservados.</p>
      <p style="margin:8px 0 0;color:#9ca3af;font-size:12px;">Si tienes alguna pregunta responde a este correo.</p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`
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
        // Get facturacion record with stored invoice data
        const { data: factura } = await supabaseAdmin
            .from('facturacion')
            .select('*')
            .eq('order_id', orderId)
            .single();

        if (!factura) {
            console.log('No facturacion record found for order:', orderId);
            return;
        }

        // Use data from facturacion table
        const customerEmail = factura.customer_email;
        if (!customerEmail) {
            console.log('No customer email in facturacion');
            return;
        }

        const invoiceNumber = factura.invoice_number;
        const invoiceDate = new Date(factura.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
        const items = factura.items || [];
        const baseImponible = factura.subtotal / 1.21;
        const iva = factura.iva_amount;
        const total = factura.total;

        const itemsHTML = items.map((item: any) => `
            <tr>
                <td style="padding: 12px 16px; border-bottom: 1px solid #2a2a3e; color: #e2e8f0;">${item.product_name}</td>
                <td style="padding: 12px 16px; border-bottom: 1px solid #2a2a3e; text-align: center; color: #71717a;">${item.size || '-'}</td>
                <td style="padding: 12px 16px; border-bottom: 1px solid #2a2a3e; text-align: center; color: #e2e8f0;">${item.quantity}</td>
                <td style="padding: 12px 16px; border-bottom: 1px solid #2a2a3e; text-align: right; color: #e2e8f0;">${item.price.toFixed(2)} €</td>
                <td style="padding: 12px 16px; border-bottom: 1px solid #2a2a3e; text-align: right; font-weight: 600; color: #22d3ee;">${item.total.toFixed(2)} €</td>
            </tr>
        `).join('');

        await resend.emails.send({
            from: 'FashionMarket <noreply@roomieapp.info>',
            to: [customerEmail],
            subject: `Factura ${invoiceNumber} - FashionMarket`,
            html: `
                <!DOCTYPE html>
                <html>
                <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
                <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #e2e8f0; margin: 0; padding: 0; background-color: #0a0a0f;">
                    <div style="max-width: 700px; margin: 0 auto; background-color: #0f0f1a;">
                        <div style="background: linear-gradient(135deg, #0891b2 0%, #06b6d4 50%, #22d3ee 100%); padding: 40px 32px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0 0 8px 0; font-size: 24px; font-weight: 700;">FACTURA</h1>
                            <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 18px; font-weight: 600;">${invoiceNumber}</p>
                        </div>
                        
                        <div style="padding: 32px;">
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 32px;">
                                <tr>
                                    <td valign="top" width="50%">
                                        <p style="margin: 0 0 4px 0; font-size: 12px; color: #71717a; text-transform: uppercase; font-weight: 600;">De:</p>
                                        <p style="margin: 0; color: #f1f5f9; font-weight: 600;">FashionMarket S.L.</p>
                                        <p style="margin: 4px 0 0 0; color: #71717a; font-size: 14px;">CIF: B12345678</p>
                                        <p style="margin: 4px 0 0 0; color: #71717a; font-size: 14px;">Calle Comercio 123, 28001 Madrid</p>
                                    </td>
                                    <td valign="top" width="50%" style="text-align: right;">
                                        <p style="margin: 0 0 4px 0; font-size: 12px; color: #71717a; text-transform: uppercase; font-weight: 600;">Para:</p>
                                        <p style="margin: 0; color: #f1f5f9; font-weight: 600;">${factura.customer_name || 'Cliente'}</p>
                                        <p style="margin: 4px 0 0 0; color: #71717a; font-size: 14px;">${customerEmail}</p>
                                    </td>
                                </tr>
                            </table>
                            
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px; background: #1a1a2e; border: 1px solid #2a2a3e; border-radius: 8px;">
                                <tr>
                                    <td style="padding: 16px 20px;"><span style="font-size: 12px; color: #71717a;">Fecha:</span> <strong style="color: #f1f5f9;">${invoiceDate}</strong></td>
                                    <td style="padding: 16px 20px; text-align: right;"><span style="font-size: 12px; color: #71717a;">Factura:</span> <strong style="color: #f1f5f9;">${invoiceNumber}</strong></td>
                                </tr>
                            </table>
                            
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px; background: #1a1a2e; border: 1px solid #2a2a3e; border-radius: 8px; overflow: hidden;">
                                <thead>
                                    <tr style="background: #2a2a3e;">
                                        <th style="padding: 12px 16px; text-align: left; font-size: 12px; color: #71717a; text-transform: uppercase;">Producto</th>
                                        <th style="padding: 12px 16px; text-align: center; font-size: 12px; color: #71717a; text-transform: uppercase;">Talla</th>
                                        <th style="padding: 12px 16px; text-align: center; font-size: 12px; color: #71717a; text-transform: uppercase;">Cant.</th>
                                        <th style="padding: 12px 16px; text-align: right; font-size: 12px; color: #71717a; text-transform: uppercase;">Precio</th>
                                        <th style="padding: 12px 16px; text-align: right; font-size: 12px; color: #71717a; text-transform: uppercase;">Total</th>
                                    </tr>
                                </thead>
                                <tbody>${itemsHTML}</tbody>
                            </table>
                            
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr><td width="55%"></td><td>
                                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #1a1a2e; border: 1px solid #2a2a3e; border-radius: 8px; padding: 16px;">
                                        <tr><td style="padding: 8px 16px; color: #71717a;">Base imponible</td><td style="padding: 8px 16px; text-align: right; color: #e2e8f0;">${baseImponible.toFixed(2)} €</td></tr>
                                        <tr><td style="padding: 8px 16px; color: #71717a;">IVA (21%)</td><td style="padding: 8px 16px; text-align: right; color: #e2e8f0;">${iva.toFixed(2)} €</td></tr>
                                        <tr><td style="padding: 8px 16px; color: #71717a;">Envío</td><td style="padding: 8px 16px; text-align: right; color: #10b981; font-weight: 600;">Gratis</td></tr>
                                        <tr><td colspan="2" style="padding: 12px 16px 8px; border-top: 1px solid #2a2a3e;">
                                            <table width="100%"><tr><td style="font-size: 17px; font-weight: 700; color: #f1f5f9;">Total</td><td style="font-size: 20px; font-weight: 700; color: #22d3ee; text-align: right;">${total.toFixed(2)} €</td></tr></table>
                                        </td></tr>
                                    </table>
                                </td></tr>
                            </table>
                        </div>
                        
                        <div style="background-color: #0a0a0f; padding: 24px 32px; text-align: center; border-top: 1px solid #2a2a3e;">
                            <p style="color: #71717a; margin: 0; font-size: 13px;">Esta factura ha sido generada electrónicamente y es válida sin firma.</p>
                            <p style="color: #52525b; margin: 8px 0 0 0; font-size: 12px;">© ${new Date().getFullYear()} FashionMarket. Todos los derechos reservados.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        });

        console.log('Invoice email sent to:', customerEmail);
    } catch (error) {
        console.error('Error sending invoice email:', error);
        throw error;
    }
}
