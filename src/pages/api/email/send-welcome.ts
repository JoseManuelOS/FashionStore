import type { APIRoute } from 'astro';
import { Resend } from 'resend';

const resend = new Resend(import.meta.env.RESEND_API_KEY);

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const { to, name } = body;

        if (!to || !name) {
            return new Response(
                JSON.stringify({ error: 'Faltan datos requeridos' }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        const { data, error } = await resend.emails.send({
            from: 'FashionMarket <noreply@roomieapp.info>',
            to: [to],
            subject: 'Bienvenido a FashionMarket - Tu cuenta ha sido creada',
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
                        <div style="background: linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%); padding: 50px 20px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0 0 10px 0; font-size: 32px; font-weight: bold;">¡Bienvenido a FashionMarket!</h1>
                            <p style="color: #ffffff; margin: 0; font-size: 16px; opacity: 0.9;">Estamos encantados de tenerte con nosotros</p>
                        </div>
                        
                        <!-- Content -->
                        <div style="padding: 40px 30px;">
                            <p style="font-size: 16px; margin-bottom: 20px;">Hola <strong>${name}</strong>,</p>
                            
                            <p style="font-size: 16px; margin-bottom: 20px;">
                                ¡Gracias por unirte a nuestra comunidad! Estamos emocionados de que formes parte de FashionMarket.
                            </p>
                            
                            <p style="font-size: 16px; margin-bottom: 30px;">
                                Descubre nuestra colección de moda masculina premium diseñada para el hombre moderno que busca estilo y elegancia.
                            </p>
                            
                            <!-- Features -->
                            <div style="background-color: #f9fafb; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
                                <h2 style="font-size: 18px; color: #111827; margin-top: 0; margin-bottom: 20px;">¿Qué puedes hacer ahora?</h2>
                                
                                <div style="margin-bottom: 15px;">
                                    <div style="display: flex; align-items: flex-start; margin-bottom: 15px;">
                                        <div style="background-color: #06b6d4; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; flex-shrink: 0; font-weight: bold;">✓</div>
                                        <div>
                                            <strong style="color: #111827;">Explora nuestro catálogo</strong>
                                            <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">Descubre camisas, pantalones, chaquetas y más</p>
                                        </div>
                                    </div>
                                    
                                    <div style="display: flex; align-items: flex-start; margin-bottom: 15px;">
                                        <div style="background-color: #06b6d4; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; flex-shrink: 0; font-weight: bold;">✓</div>
                                        <div>
                                            <strong style="color: #111827;">Guarda tus favoritos</strong>
                                            <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">Marca los productos que más te gustan</p>
                                        </div>
                                    </div>
                                    
                                    <div style="display: flex; align-items: flex-start;">
                                        <div style="background-color: #06b6d4; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; flex-shrink: 0; font-weight: bold;">✓</div>
                                        <div>
                                            <strong style="color: #111827;">Envío gratis</strong>
                                            <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">En todos los pedidos, sin mínimo</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- CTA Button -->
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${request.headers.get('origin')}/productos" style="display: inline-block; background: linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                                    Explorar Productos
                                </a>
                            </div>
                            
                            <p style="font-size: 14px; color: #6b7280; margin-top: 30px; text-align: center;">
                                Si tienes alguna pregunta, estamos aquí para ayudarte.<br>
                                Responde a este correo y te atenderemos encantados.
                            </p>
                        </div>
                        
                        <!-- Footer -->
                        <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0 0 10px 0; font-size: 14px; color: #6b7280;">
                                © ${new Date().getFullYear()} FashionMarket. Todos los derechos reservados.
                            </p>
                            <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                                Moda masculina premium para el hombre moderno
                            </p>
                        </div>
                    </div>
                </body>
                </html>
            `,
        });

        if (error) {
            console.error('Error enviando correo de bienvenida:', error);
            return new Response(
                JSON.stringify({ error: 'Error al enviar el correo' }),
                {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        console.log('Correo de bienvenida enviado:', data);

        return new Response(
            JSON.stringify({ success: true, messageId: data?.id }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    } catch (error: any) {
        console.error('Error en send-welcome:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
};
