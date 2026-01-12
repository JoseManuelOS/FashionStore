import type { APIRoute } from 'astro';
import { Resend } from 'resend';

const resend = new Resend(import.meta.env.RESEND_API_KEY);

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const { to, customerName, orderItems, total, sessionId, shippingAddress } = body;

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
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <img src="${item.image}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;">
                        <div>
                            <strong style="display: block; margin-bottom: 4px;">${item.name}</strong>
                            <span style="color: #6b7280; font-size: 14px;">Talla: ${item.size} | Cantidad: ${item.quantity}</span>
                        </div>
                    </div>
                </td>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; white-space: nowrap;">
                    ${(item.price * item.quantity).toFixed(2)} €
                </td>
            </tr>
        `).join('');

        // Dirección de envío
        const addressHTML = shippingAddress ? `
            <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                <h2 style="font-size: 18px; color: #111827; margin-top: 0; margin-bottom: 15px;">📦 Dirección de Envío</h2>
                <p style="margin: 0; color: #374151; line-height: 1.8;">
                    <strong>${customerName}</strong><br>
                    ${shippingAddress.line1}<br>
                    ${shippingAddress.city}, ${shippingAddress.postal_code}<br>
                    ${shippingAddress.state}<br>
                    ${shippingAddress.country === 'ES' ? 'España' : shippingAddress.country}
                </p>
            </div>
        ` : '';

        const { data, error } = await resend.emails.send({
            from: 'FashionMarket <onboarding@resend.dev>',
            to: [to],
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
                            <p style="color: #ffffff; margin: 10px 0 0 0; opacity: 0.9;">Gracias por tu compra</p>
                        </div>
                        
                        <!-- Content -->
                        <div style="padding: 40px 30px;">
                            <p style="font-size: 16px; margin-bottom: 20px;">Hola <strong>${customerName}</strong>,</p>
                            
                            <p style="font-size: 16px; margin-bottom: 30px;">
                                Tu pedido ha sido procesado exitosamente y está siendo preparado para su envío.
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
                                        <span style="color: #065f46; font-weight: 600;">Pedido confirmado</span>
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
                                    Recibirás actualizaciones por email en cada etapa del envío.
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
                                        <span style="color: #6b7280;">Subtotal:</span>
                                        <span style="font-weight: 600;">${total.toFixed(2)} €</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                                        <span style="color: #6b7280;">Envío:</span>
                                        <span style="font-weight: 600; color: #10b981;">Gratis</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; padding-top: 10px; border-top: 1px solid #e5e7eb;">
                                        <span style="font-size: 18px; font-weight: bold;">Total:</span>
                                        <span style="font-size: 18px; font-weight: bold; color: #06b6d4;">${total.toFixed(2)} €</span>
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
                                <p style="margin: 0 0 8px 32px; color: #1e40af; font-size: 14px;">
                                    <strong>Envío:</strong> Gratis a toda España
                                </p>
                                <p style="margin: 0 0 0 32px; color: #1e40af; font-size: 14px;">
                                    Te enviaremos el número de seguimiento en cuanto el pedido sea enviado.
                                </p>
                            </div>
                            
                            <!-- CTA Button -->
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${request.headers.get('origin')}/cuenta/pedidos" style="display: inline-block; background: linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                                    Seguir mi Pedido
                                </a>
                            </div>
                            
                            <p style="font-size: 14px; color: #6b7280; margin-top: 30px; text-align: center;">
                                ¿Necesitas ayuda? Contáctanos respondiendo a este correo<br>
                                Estamos aquí para ayudarte
                            </p>
                        </div>
                        
                        <!-- Footer -->
                        <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0; font-size: 14px; color: #6b7280;">
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
