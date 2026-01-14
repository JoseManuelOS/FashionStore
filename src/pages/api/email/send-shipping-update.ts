import type { APIRoute } from 'astro';
import { Resend } from 'resend';

const resend = new Resend(import.meta.env.RESEND_API_KEY);

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const { to, customerName, orderId, trackingNumber, trackingUrl, carrierName } = body;

        if (!to || !orderId || !trackingNumber) {
            return new Response(
                JSON.stringify({ error: 'Faltan datos requeridos (to, orderId, trackingNumber)' }),
                { 
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        const { data, error } = await resend.emails.send({
            from: 'FashionMarket <onboarding@resend.dev>',
            to: [to],
            subject: '📦 ¡Tu pedido está en camino! - FashionMarket',
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
                        <div style="background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%); padding: 40px 20px; text-align: center;">
                            <div style="font-size: 60px; margin-bottom: 15px;">📦</div>
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">¡Tu pedido está en camino!</h1>
                            <p style="color: #ffffff; margin: 10px 0 0 0; opacity: 0.9;">Pedido #${orderId.slice(0, 8)}</p>
                        </div>
                        
                        <!-- Content -->
                        <div style="padding: 40px 30px;">
                            <p style="font-size: 16px; margin-bottom: 20px;">Hola <strong>${customerName || 'Cliente'}</strong>,</p>
                            
                            <p style="font-size: 16px; margin-bottom: 30px;">
                                ¡Buenas noticias! Tu pedido ha sido enviado y está en camino.
                            </p>
                            
                            <!-- Tracking Info -->
                            <div style="background-color: #f3e8ff; border-left: 4px solid #8b5cf6; padding: 20px; margin-bottom: 30px; border-radius: 4px;">
                                <h2 style="font-size: 18px; color: #6b21a8; margin: 0 0 15px 0;">Información de Seguimiento</h2>
                                
                                <div style="margin-bottom: 12px;">
                                    <span style="color: #7c3aed; font-weight: 600;">Transportista:</span>
                                    <span style="color: #374151; margin-left: 8px;">${carrierName || 'Transportista'}</span>
                                </div>
                                
                                <div style="margin-bottom: 12px;">
                                    <span style="color: #7c3aed; font-weight: 600;">Código de seguimiento:</span>
                                    <span style="color: #374151; margin-left: 8px; font-family: monospace; background: #e9d5ff; padding: 2px 8px; border-radius: 4px;">${trackingNumber}</span>
                                </div>
                                
                                ${trackingUrl ? `
                                    <a href="${trackingUrl}" 
                                       style="display: inline-block; margin-top: 15px; padding: 12px 24px; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
                                        🔍 Rastrear mi pedido
                                    </a>
                                ` : ''}
                            </div>

                            <!-- Delivery Estimate -->
                            <div style="background-color: #eff6ff; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 10px;">
                                    <span style="font-size: 20px;">🚚</span>
                                    <strong style="color: #1e40af; font-size: 16px;">Entrega Estimada</strong>
                                </div>
                                <p style="margin: 0 0 0 32px; color: #1e40af; font-size: 14px;">
                                    Tu pedido llegará en <strong>2-5 días laborables</strong>
                                </p>
                            </div>

                            <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                                Si tienes alguna pregunta sobre tu envío, no dudes en contactarnos.
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

        if (error) {
            console.error('Error sending shipping update email:', error);
            return new Response(
                JSON.stringify({ error: error.message }),
                { 
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        return new Response(
            JSON.stringify({ success: true, id: data?.id }),
            { 
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    } catch (error: any) {
        console.error('Error:', error);
        return new Response(
            JSON.stringify({ error: error.message || 'Error desconocido' }),
            { 
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
};
