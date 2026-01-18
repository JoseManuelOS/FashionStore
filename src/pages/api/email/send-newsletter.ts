import type { APIRoute } from 'astro';
import { Resend } from 'resend';
import { getAllEmailRecipients } from '../../../lib/supabase';

const resend = new Resend(import.meta.env.RESEND_API_KEY);

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const { subject, content } = body;

        if (!subject || !content) {
            return new Response(
                JSON.stringify({ error: 'Faltan asunto o contenido del email' }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        // Obtener todos los suscriptores (combina newsletter_subscribers + customers con newsletter=true)
        const subscribers = await getAllEmailRecipients();

        if (subscribers.length === 0) {
            return new Response(
                JSON.stringify({ error: 'No hay suscriptores en el newsletter' }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        const emails = subscribers.map(s => s.email);
        const successfulSends: string[] = [];
        const failedSends: string[] = [];

        // Enviar emails uno por uno (o usar batch si tienes plan de pago)
        for (const subscriber of subscribers) {
            const email = subscriber.email;
            const name = subscriber.name || 'Cliente';


            try {
                const { data, error } = await resend.emails.send({
                    from: 'FashionMarket <onboarding@resend.dev>',
                    to: [email],
                    subject: subject,
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
                                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">FashionMarket</h1>
                                    <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">Newsletter</p>
                                </div>
                                
                                <!-- Content -->
                                <div style="padding: 40px 30px;">
                                    <p style="font-size: 16px; margin-bottom: 20px;">Hola <strong>${name}</strong>,</p>
                                    
                                    <div style="font-size: 16px; margin-bottom: 30px; white-space: pre-wrap;">
${content}
                                    </div>
                                    
                                    <!-- CTA Button -->
                                    <div style="text-align: center; margin: 30px 0;">
                                        <a href="${import.meta.env.PUBLIC_SITE_URL || 'https://fashionmarket.com'}" 
                                           style="display: inline-block; background-color: #06b6d4; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                                            Visitar la tienda
                                        </a>
                                    </div>
                                </div>
                                
                                <!-- Footer -->
                                <div style="background-color: #f9fafb; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                                    <p style="margin: 0 0 10px 0; font-size: 14px; color: #6b7280;">
                                        Recibes este email porque estás suscrito a nuestro newsletter.
                                    </p>
                                    <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                                        © ${new Date().getFullYear()} FashionMarket. Todos los derechos reservados.
                                    </p>
                                </div>
                            </div>
                        </body>
                        </html>
                    `
                });

                if (error) {
                    console.error(`Error enviando a ${email}:`, error);
                    failedSends.push(email);
                } else {
                    successfulSends.push(email);
                }
            } catch (err) {
                console.error(`Error enviando a ${email}:`, err);
                failedSends.push(email);
            }
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: `Newsletter enviado correctamente`,
                stats: {
                    total: emails.length,
                    sent: successfulSends.length,
                    failed: failedSends.length,
                    successfulEmails: successfulSends,
                    failedEmails: failedSends
                }
            }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            }
        );

    } catch (error) {
        console.error('Error en send-newsletter:', error);
        return new Response(
            JSON.stringify({ error: 'Error interno del servidor' }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
};
