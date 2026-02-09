import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabase';

const PROMO_CODE = 'WELCOME10'; // Código promocional para nuevos suscriptores

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const { email, name, source = 'popup' } = body;

        // Validar email
        if (!email || !email.includes('@')) {
            return new Response(
                JSON.stringify({ error: 'Email inválido' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Verificar si ya está suscrito
        const { data: existing } = await supabaseAdmin
            .from('newsletter_subscribers')
            .select('id, is_active')
            .eq('email', normalizedEmail)
            .single();

        if (existing) {
            if (existing.is_active) {
                return new Response(
                    JSON.stringify({
                        success: true,
                        message: '¡Ya estás suscrito!',
                        already_subscribed: true,
                        promo_code: PROMO_CODE
                    }),
                    { status: 200, headers: { 'Content-Type': 'application/json' } }
                );
            } else {
                // Reactivar suscripción
                await supabaseAdmin
                    .from('newsletter_subscribers')
                    .update({
                        is_active: true,
                        unsubscribed_at: null,
                        subscribed_at: new Date().toISOString()
                    })
                    .eq('id', existing.id);

                return new Response(
                    JSON.stringify({
                        success: true,
                        message: '¡Bienvenido de nuevo!',
                        reactivated: true,
                        promo_code: PROMO_CODE
                    }),
                    { status: 200, headers: { 'Content-Type': 'application/json' } }
                );
            }
        }

        // También verificar en customers (usuarios registrados)
        const { data: customerExists } = await supabaseAdmin
            .from('customers')
            .select('id, newsletter')
            .eq('email', normalizedEmail)
            .single();

        // Insertar nuevo suscriptor
        const { error: insertError } = await supabaseAdmin
            .from('newsletter_subscribers')
            .insert({
                email: normalizedEmail,
                name: name?.trim() || null,
                source,
                promo_code_sent: PROMO_CODE
            });

        if (insertError) {
            console.error('Error inserting subscriber:', insertError);
            return new Response(
                JSON.stringify({ error: 'Error al suscribirse. Inténtalo de nuevo.' }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // If customer exists but newsletter is false, update it
        if (customerExists && !customerExists.newsletter) {
            await supabaseAdmin
                .from('customers')
                .update({ newsletter: true })
                .eq('id', customerExists.id);
        }

        // Enviar email de bienvenida con código promocional
        try {
            const { Resend } = await import('resend');
            const resend = new Resend(import.meta.env.RESEND_API_KEY);

            await resend.emails.send({
                from: 'FashionMarket <noreply@roomieapp.info>',
                to: [normalizedEmail],
                subject: 'Bienvenido a FashionMarket - Tu código de descuento exclusivo',
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
                            <div style="background: linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%); padding: 50px 20px; text-align: center;">
                                <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold;">¡Bienvenido!</h1>
                                <p style="color: #ffffff; margin: 15px 0 0 0; font-size: 18px; opacity: 0.9;">Gracias por unirte a nuestra comunidad</p>
                            </div>
                            
                            <!-- Promo Code Section -->
                            <div style="padding: 40px 30px; text-align: center;">
                                <p style="font-size: 16px; color: #4b5563; margin-bottom: 25px;">
                                    Como agradecimiento por suscribirte, aquí tienes tu código de descuento exclusivo:
                                </p>
                                
                                <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 2px dashed #f59e0b; border-radius: 12px; padding: 25px; margin: 20px 0;">
                                    <p style="margin: 0 0 10px 0; color: #92400e; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Tu código de descuento</p>
                                    <div style="font-size: 36px; font-weight: bold; color: #1f2937; font-family: monospace; letter-spacing: 3px;">${PROMO_CODE}</div>
                                    <p style="margin: 15px 0 0 0; color: #b45309; font-size: 16px; font-weight: 600;">10% de descuento en tu primera compra</p>
                                </div>
                                
                                <a href="https://fashionmarket.com/productos" 
                                   style="display: inline-block; margin-top: 25px; padding: 16px 40px; background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); color: white; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px;">
                                    Explorar Colección
                                </a>
                            </div>
                            
                            <!-- Benefits -->
                            <div style="background-color: #f9fafb; padding: 30px;">
                                <h3 style="margin: 0 0 20px 0; color: #1f2937; font-size: 18px; text-align: center;">Como suscriptor recibirás</h3>
                                <div style="display: flex; flex-direction: column; gap: 12px;">
                                    <div style="display: flex; align-items: center; gap: 12px;">
                                        <span style="width: 24px; height: 24px; background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: bold;">✓</span>
                                        <span style="color: #4b5563;">Ofertas exclusivas para suscriptores</span>
                                    </div>
                                    <div style="display: flex; align-items: center; gap: 12px;">
                                        <span style="width: 24px; height: 24px; background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: bold;">✓</span>
                                        <span style="color: #4b5563;">Acceso anticipado a nuevas colecciones</span>
                                    </div>
                                    <div style="display: flex; align-items: center; gap: 12px;">
                                        <span style="width: 24px; height: 24px; background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: bold;">✓</span>
                                        <span style="color: #4b5563;">Consejos de estilo y tendencias</span>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Footer -->
                            <div style="background-color: #1f2937; padding: 25px; text-align: center;">
                                <p style="color: #9ca3af; margin: 0; font-size: 14px;">
                                    © 2026 FashionMarket. Todos los derechos reservados.
                                </p>
                                <p style="color: #6b7280; margin: 10px 0 0 0; font-size: 12px;">
                                    No quieres recibir más emails? <a href="#" style="color: #06b6d4;">Cancelar suscripción</a>
                                </p>
                            </div>
                        </div>
                    </body>
                    </html>
                `
            });
        } catch (emailError) {
            console.error('Error sending welcome email:', emailError);
            // Continue even if email fails
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: '¡Suscripción exitosa!',
                promo_code: PROMO_CODE
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );

    } catch (error: any) {
        console.error('Error in newsletter subscribe:', error);
        return new Response(
            JSON.stringify({ error: error.message || 'Error interno' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
};
