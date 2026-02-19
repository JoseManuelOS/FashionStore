import type { APIRoute } from 'astro';
import { Resend } from 'resend';
import { buildShippingUpdateHTML } from '../../../lib/email-templates';

const resend = new Resend(import.meta.env.RESEND_API_KEY);

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const { to, customerName, orderId, trackingNumber, trackingUrl, carrierName, orderNumber } = body;

        if (!to || !orderId || !trackingNumber) {
            return new Response(
                JSON.stringify({ error: 'Faltan datos requeridos (to, orderId, trackingNumber)' }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        const orderRef = orderNumber ? String(orderNumber) : orderId.slice(0, 8).toUpperCase();

        const html = buildShippingUpdateHTML({
            customerName: customerName || 'Cliente',
            orderRef,
            carrierName: carrierName || 'Transportista',
            trackingNumber,
            trackingUrl: trackingUrl || null
        });

        const { data, error } = await resend.emails.send({
            from: 'FashionMarket <noreply@roomieapp.info>',
            to: [to],
            subject: `Tu pedido #${orderRef} está en camino - FashionMarket`,
            html
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
