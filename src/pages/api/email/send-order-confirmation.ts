import type { APIRoute } from 'astro';
import { Resend } from 'resend';

const resend = new Resend(import.meta.env.RESEND_API_KEY);

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const { to, customerName, orderItems, total, sessionId, shippingAddress, orderNumber, orderId } = body;

        if (!to || !customerName || !orderItems) {
            return new Response(
                JSON.stringify({ error: 'Faltan datos requeridos' }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        // Generar HTML del correo
        const itemsHTML = orderItems.map((item: any) => `
            <tr>
                <td style="padding: 16px; border-bottom: 1px solid #2a2a3e;">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                        <tr>
                            <td width="70" valign="top">
                                <img src="${item.image}" alt="${item.name}" style="width: 64px; height: 64px; object-fit: cover; border-radius: 10px; background: #2a2a3e;">
                            </td>
                            <td style="padding-left: 16px;" valign="top">
                                <div style="color: #f1f5f9; font-weight: 600; font-size: 15px; margin-bottom: 6px;">${item.name}</div>
                                <div style="color: #71717a; font-size: 13px;">Talla: ${item.size} · Cantidad: ${item.quantity}</div>
                            </td>
                            <td width="80" align="right" valign="top">
                                <div style="color: #22d3ee; font-weight: 700; font-size: 15px;">${(item.price * item.quantity).toFixed(2)} €</div>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        `).join('');

        // Dirección de envío
        const addressHTML = shippingAddress ? `
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
                            <div style="color: #e2e8f0; line-height: 1.6;">
                                <strong>${customerName}</strong><br>
                                ${shippingAddress.line1}<br>
                                ${shippingAddress.city}, ${shippingAddress.postal_code}<br>
                                ${shippingAddress.state ? shippingAddress.state + '<br>' : ''}
                                ${shippingAddress.country === 'ES' ? 'España' : shippingAddress.country}
                            </div>
                        </td>
                    </tr>
                </table>
            </div>
        ` : '';

        const { data, error } = await resend.emails.send({
            from: 'FashionMarket <onboarding@resend.dev>',
            to: [to],
            subject: 'Confirmación de Pedido - FashionMarket',
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
                                <table width="100%" height="100%"><tr><td align="center" valign="middle">
                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
                                        <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                </td></tr></table>
                            </div>
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Pedido Confirmado</h1>
                            <p style="color: rgba(255,255,255,0.9); margin: 12px 0 0 0; font-size: 16px;">Pedido #${orderNumber ? orderNumber : (orderId ? orderId.slice(0, 8) : '')}</p>
                        </div>
                        
                        <!-- Content -->
                        <div style="padding: 40px 32px;">
                            <p style="font-size: 16px; margin: 0 0 8px 0; color: #a1a1aa;">
                                Hola <strong style="color: #22d3ee;">${customerName}</strong>,
                            </p>
                            
                            <p style="font-size: 16px; margin: 0 0 32px 0; color: #a1a1aa;">
                                Tu pedido ha sido procesado correctamente y está siendo preparado para su envío.
                            </p>
                            
                            <!-- Order Status Progress -->
                            <div style="background: #0a0a0f; border: 1px solid #2a2a3e; border-radius: 16px; padding: 28px; margin-bottom: 24px;">
                                <h3 style="font-size: 14px; color: #a1a1aa; margin: 0 0 24px 0; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Estado del pedido</h3>
                                
                                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                    <tr>
                                        <td width="25%" align="center" style="padding-bottom: 8px;">
                                            <div style="width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #06b6d4, #0891b2); margin: 0 auto;">
                                                <table width="100%" height="100%"><tr><td align="center" valign="middle">
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                                </td></tr></table>
                                            </div>
                                        </td>
                                        <td width="25%" align="center" style="padding-bottom: 8px;">
                                            <div style="width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #06b6d4, #0891b2); margin: 0 auto;">
                                                <table width="100%" height="100%"><tr><td align="center" valign="middle">
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                                </td></tr></table>
                                            </div>
                                        </td>
                                        <td width="25%" align="center" style="padding-bottom: 8px;">
                                            <div style="width: 36px; height: 36px; border-radius: 50%; border: 3px solid #06b6d4; background: #0f0f1a; margin: 0 auto; box-shadow: 0 0 0 4px rgba(6, 182, 212, 0.2);">
                                                <table width="100%" height="100%"><tr><td align="center" valign="middle" style="color: #22d3ee; font-weight: 700; font-size: 14px;">3</td></tr></table>
                                            </div>
                                        </td>
                                        <td width="25%" align="center" style="padding-bottom: 8px;">
                                            <div style="width: 36px; height: 36px; border-radius: 50%; background: #2a2a3e; margin: 0 auto;">
                                                <table width="100%" height="100%"><tr><td align="center" valign="middle" style="color: #71717a; font-weight: 600; font-size: 14px;">4</td></tr></table>
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

                            ${addressHTML}
                            
                            <!-- Order Details -->
                            <div style="background: #0a0a0f; border: 1px solid #2a2a3e; border-radius: 16px; overflow: hidden; margin-bottom: 24px;">
                                <div style="padding: 20px 24px; border-bottom: 1px solid #2a2a3e;">
                                    <h2 style="font-size: 14px; color: #a1a1aa; margin: 0; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Detalles del pedido</h2>
                                </div>
                                
                                <table style="width: 100%; border-collapse: collapse;">
                                    ${itemsHTML}
                                </table>
                                
                                <div style="padding: 20px 24px; background: #0a0a0f;">
                                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                        <tr>
                                            <td style="padding: 8px 0; color: #71717a; font-size: 14px;">Subtotal</td>
                                            <td align="right" style="padding: 8px 0; color: #e2e8f0; font-weight: 600;">${total.toFixed(2)} €</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 8px 0; color: #71717a; font-size: 14px;">Envío</td>
                                            <td align="right" style="padding: 8px 0; color: #10b981; font-weight: 600;">Gratis</td>
                                        </tr>
                                        <tr>
                                            <td colspan="2" style="padding-top: 16px; border-top: 1px solid #2a2a3e;">
                                                <table width="100%"><tr>
                                                    <td style="font-size: 18px; font-weight: 700; color: #f1f5f9;">Total</td>
                                                    <td align="right" style="font-size: 20px; font-weight: 700; color: #22d3ee;">${total.toFixed(2)} €</td>
                                                </tr></table>
                                            </td>
                                        </tr>
                                    </table>
                                </div>
                            </div>

                            <!-- Delivery Info -->
                            <div style="background: linear-gradient(135deg, #0a0a0f 0%, #0f0f1a 100%); border: 1px solid #2a2a3e; border-radius: 16px; padding: 24px; margin-bottom: 24px;">
                                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                    <tr>
                                        <td width="56" valign="top">
                                            <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 12px;">
                                                <table width="100%" height="100%"><tr><td align="center" valign="middle">
                                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                                                        <rect x="1" y="3" width="15" height="13" rx="2" ry="2"></rect>
                                                        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                                                        <circle cx="5.5" cy="18.5" r="2.5"></circle>
                                                        <circle cx="18.5" cy="18.5" r="2.5"></circle>
                                                    </svg>
                                                </td></tr></table>
                                            </div>
                                        </td>
                                        <td style="padding-left: 16px;">
                                            <div style="font-size: 12px; color: #71717a; margin-bottom: 4px;">Tiempo de entrega estimado</div>
                                            <div style="font-size: 18px; color: #10b981; font-weight: 700;">3-7 días laborables</div>
                                            <div style="font-size: 13px; color: #71717a; margin-top: 4px;">Envío gratis a toda España</div>
                                        </td>
                                    </tr>
                                </table>
                            </div>
                            
                            <!-- CTA Button -->
                            <div style="text-align: center; margin: 32px 0;">
                                <a href="${request.headers.get('origin')}/cuenta/pedidos" style="display: inline-block; background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px rgba(6, 182, 212, 0.4);">
                                    Ver mi pedido
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
            `,
        });

        if (error) {
            console.error('Error enviando correo:', error);
            return new Response(
                JSON.stringify({ error: 'Error al enviar el correo' }),
                {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        console.log('Correo enviado exitosamente:', data);

        return new Response(
            JSON.stringify({ success: true, messageId: data?.id }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    } catch (error: any) {
        console.error('Error en send-order-email:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
};
