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
            subject: 'Tu pedido está en camino - FashionMarket',
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
                        <div style="background: linear-gradient(135deg, #0891b2 0%, #06b6d4 50%, #22d3ee 100%); padding: 48px 32px; text-align: center;">
                            <div style="width: 80px; height: 80px; margin: 0 auto 20px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                                    <rect x="1" y="3" width="15" height="13" rx="2" ry="2"></rect>
                                    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                                    <circle cx="5.5" cy="18.5" r="2.5"></circle>
                                    <circle cx="18.5" cy="18.5" r="2.5"></circle>
                                </svg>
                            </div>
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Tu pedido está en camino</h1>
                            <p style="color: rgba(255,255,255,0.9); margin: 12px 0 0 0; font-size: 16px;">Pedido #${orderId.slice(0, 8).toUpperCase()}</p>
                        </div>
                        
                        <!-- Content -->
                        <div style="padding: 40px 32px;">
                            <p style="font-size: 16px; margin: 0 0 24px 0; color: #e2e8f0;">
                                Hola <strong style="color: #22d3ee;">${customerName || 'Cliente'}</strong>,
                            </p>
                            
                            <p style="font-size: 16px; margin: 0 0 32px 0; color: #94a3b8;">
                                Buenas noticias. Tu pedido ha sido enviado y está en camino hacia ti.
                            </p>
                            
                            <!-- Tracking Card -->
                            <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border: 1px solid #334155; border-radius: 16px; padding: 28px; margin-bottom: 24px;">
                                <h2 style="font-size: 14px; color: #94a3b8; margin: 0 0 20px 0; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Información de seguimiento</h2>
                                
                                <div style="display: flex; align-items: center; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #334155;">
                                    <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #06b6d4, #0891b2); border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-right: 16px;">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                                            <rect x="1" y="3" width="15" height="13" rx="2" ry="2"></rect>
                                            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                                            <circle cx="5.5" cy="18.5" r="2.5"></circle>
                                            <circle cx="18.5" cy="18.5" r="2.5"></circle>
                                        </svg>
                                    </div>
                                    <div>
                                        <div style="font-size: 12px; color: #64748b; margin-bottom: 4px;">Transportista</div>
                                        <div style="font-size: 16px; color: #f1f5f9; font-weight: 600;">${carrierName || 'Transportista'}</div>
                                    </div>
                                </div>
                                
                                <div style="display: flex; align-items: center;">
                                    <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #8b5cf6, #7c3aed); border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-right: 16px;">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                            <polyline points="22,6 12,13 2,6"></polyline>
                                        </svg>
                                    </div>
                                    <div>
                                        <div style="font-size: 12px; color: #64748b; margin-bottom: 4px;">Código de seguimiento</div>
                                        <div style="font-size: 16px; color: #22d3ee; font-weight: 600; font-family: 'SF Mono', Monaco, monospace;">${trackingNumber}</div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- CTA Button -->
                            ${trackingUrl ? `
                                <a href="${trackingUrl}" 
                                   style="display: block; text-align: center; padding: 16px 32px; background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); color: white; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; margin-bottom: 24px; box-shadow: 0 4px 14px rgba(6, 182, 212, 0.4);">
                                    Rastrear mi pedido
                                </a>
                            ` : ''}

                            <!-- Progress Bar -->
                            <div style="background: #0f172a; border: 1px solid #334155; border-radius: 16px; padding: 28px; margin-bottom: 24px;">
                                <h3 style="font-size: 14px; color: #94a3b8; margin: 0 0 24px 0; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Estado del pedido</h3>
                                
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
                                            <div style="width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #06b6d4, #0891b2); margin: 0 auto;">
                                                <table width="100%" height="100%"><tr><td align="center" valign="middle">
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                                </td></tr></table>
                                            </div>
                                        </td>
                                        <td width="25%" align="center" style="padding-bottom: 8px;">
                                            <div style="width: 36px; height: 36px; border-radius: 50%; background: #334155; margin: 0 auto;">
                                                <table width="100%" height="100%"><tr><td align="center" valign="middle" style="color: #64748b; font-weight: 600; font-size: 14px;">4</td></tr></table>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td align="center" style="font-size: 11px; color: #22d3ee; font-weight: 500;">Confirmado</td>
                                        <td align="center" style="font-size: 11px; color: #22d3ee; font-weight: 500;">Preparado</td>
                                        <td align="center" style="font-size: 11px; color: #22d3ee; font-weight: 500;">Enviado</td>
                                        <td align="center" style="font-size: 11px; color: #64748b;">Entregado</td>
                                    </tr>
                                </table>
                            </div>

                            <!-- Delivery Estimate -->
                            <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border: 1px solid #334155; border-radius: 16px; padding: 24px; margin-bottom: 24px;">
                                <div style="display: flex; align-items: center;">
                                    <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-right: 16px;">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                                            <circle cx="12" cy="12" r="10"></circle>
                                            <polyline points="12 6 12 12 16 14"></polyline>
                                        </svg>
                                    </div>
                                    <div>
                                        <div style="font-size: 12px; color: #64748b; margin-bottom: 4px;">Entrega estimada</div>
                                        <div style="font-size: 18px; color: #10b981; font-weight: 700;">2-5 días laborables</div>
                                    </div>
                                </div>
                            </div>

                            <p style="font-size: 14px; color: #64748b; margin: 24px 0 0 0; text-align: center;">
                                ¿Tienes alguna pregunta? Responde a este correo y te ayudaremos.
                            </p>
                        </div>
                        
                        <!-- Footer -->
                        <div style="background-color: #0f172a; padding: 32px; text-align: center; border-top: 1px solid #334155;">
                            <p style="color: #64748b; margin: 0; font-size: 13px;">
                                © ${new Date().getFullYear()} FashionMarket. Todos los derechos reservados.
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
