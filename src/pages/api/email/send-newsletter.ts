export const prerender = false;
import type { APIRoute } from 'astro';
import { Resend } from 'resend';
import { getAllEmailRecipients } from '../../../lib/supabase';
import { isAdminAuthenticated, unauthorizedResponse } from '../../../lib/admin-auth';

const resend = new Resend(import.meta.env.RESEND_API_KEY);

export const POST: APIRoute = async ({ request }) => {
    if (!isAdminAuthenticated(request)) {
        return unauthorizedResponse();
    }

    try {
        const body = await request.json();
        const {
            subject,
            content,
            headerTitle = 'Novedades de FashionMarket',
            imageUrl = '',
            promoCode = '',
            promoDiscount = '',
            buttonText = 'Visitar la tienda',
            buttonUrl = ''
        } = body;

        if (!subject || !content) {
            return new Response(
                JSON.stringify({ error: 'Faltan asunto o contenido del email' }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

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

        const successfulSends: string[] = [];
        const failedSends: string[] = [];
        const siteUrl = import.meta.env.PUBLIC_SITE_URL || 'https://j4o0084kg0ssoo0wc0ocw0g8.victoriafp.online';
        const finalButtonUrl = buttonUrl
            ? (buttonUrl.startsWith('/') ? `${siteUrl}${buttonUrl}` : buttonUrl)
            : `${siteUrl}/productos`;

        // 1.1 s between sends to stay within Resend's rate limit (1 req/s)
        const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        // Generate promo section if code exists
        const promoSection = promoCode ? `
            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 2px dashed #f59e0b; border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center;">
                <p style="margin: 0 0 10px 0; color: #92400e; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Codigo de descuento exclusivo</p>
                <div style="font-size: 32px; font-weight: bold; color: #1f2937; font-family: monospace; letter-spacing: 3px;">${promoCode}</div>
                ${promoDiscount ? `<p style="margin: 15px 0 0 0; color: #b45309; font-size: 16px; font-weight: 600;">${promoDiscount}</p>` : ''}
            </div>
        ` : '';

        // Generate image section if URL exists
        const imageSection = imageUrl ? `
            <div style="margin: 25px 0;">
                <img src="${imageUrl}" alt="Newsletter" style="width: 100%; max-width: 540px; height: auto; border-radius: 12px; display: block; margin: 0 auto;" />
            </div>
        ` : '';

        
        async function sendToSubscriber(subscriber: { email: string; name?: string }) {
            const email = subscriber.email;
            const name = subscriber.name || 'Cliente';
            const MAX_ATTEMPTS = 3;

            for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
                try {
                    const { error } = await resend.emails.send({
                        from: 'FashionMarket <noreply@roomieapp.info>',
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
    <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); padding: 50px 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">${headerTitle}</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 12px 0 0 0; font-size: 14px;">FashionMarket Newsletter</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px;">
            <p style="font-size: 16px; margin-bottom: 20px;">Hola <strong>${name}</strong>,</p>
            
            ${imageSection}
            
            <div style="font-size: 16px; margin-bottom: 25px; color: #374151; white-space: pre-wrap; line-height: 1.7;">${content}</div>
            
            ${promoSection}
            
            <!-- CTA Button -->
            <div style="text-align: center; margin: 30px 0;">
                <a href="${finalButtonUrl}" 
                   style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); color: white; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px rgba(6, 182, 212, 0.3);">
                    ${buttonText}
                </a>
            </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #0a0a0f; padding: 30px; text-align: center;">
            <p style="color: #9ca3af; margin: 0 0 10px 0; font-size: 14px;">
                Recibes este email porque estas suscrito a nuestro newsletter.
            </p>
            <p style="color: #6b7280; margin: 0; font-size: 12px;">
                © ${new Date().getFullYear()} FashionMarket. Todos los derechos reservados.
            </p>
            <a href="${siteUrl}/unsubscribe" style="color: #06b6d4; font-size: 12px; text-decoration: none; margin-top: 10px; display: inline-block;">
                Cancelar suscripcion
            </a>
        </div>
    </div>
</body>
</html>
                    `
                });

                    if (!error) {
                        return { email, success: true };
                    }
                    // Resend returned an error — wait before retrying
                    console.warn(`[NEWSLETTER] Attempt ${attempt}/${MAX_ATTEMPTS} failed for ${email}:`, error);
                } catch (err) {
                    console.warn(`[NEWSLETTER] Attempt ${attempt}/${MAX_ATTEMPTS} threw for ${email}:`, err);
                }

                // Wait longer on each retry: 2 s, then 4 s
                if (attempt < MAX_ATTEMPTS) {
                    await sleep(attempt * 2000);
                }
            }

            return { email, success: false };
        }

        // Send emails sequentially with a delay to respect Resend's rate limit
        for (let i = 0; i < subscribers.length; i++) {
            const result = await sendToSubscriber(subscribers[i]);
            if (result.success) {
                successfulSends.push(result.email);
            } else {
                failedSends.push(result.email);
            }

            // Wait 1.1 s between sends (skip delay after the last one)
            if (i < subscribers.length - 1) {
                await sleep(1100);
            }
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: `Newsletter enviado correctamente`,
                stats: {
                    total: subscribers.length,
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
