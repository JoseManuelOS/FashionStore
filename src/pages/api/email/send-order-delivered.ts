export const prerender = false;
import type { APIRoute } from 'astro';
import { Resend } from 'resend';
import { buildOrderDeliveredHTML } from '../../../lib/email-templates';

const resend = new Resend(import.meta.env.RESEND_API_KEY);

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const { to, customerName, orderRef, orderItems, totalPrice, deliveredDate } = body;

        if (!to || !orderRef) {
            return new Response(
                JSON.stringify({ error: 'Faltan datos requeridos (to, orderRef)' }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        const html = buildOrderDeliveredHTML({
            customerName: customerName || 'Cliente',
            orderRef,
            orderItems: orderItems || [],
            totalPrice: totalPrice || 0,
            deliveredDate: deliveredDate || new Date().toISOString()
        });

        const { data, error } = await resend.emails.send({
            from: 'FashionMarket <noreply@roomieapp.info>',
            to: [to],
            subject: `Tu pedido #${orderRef} ha sido entregado - FashionMarket`,
            html
        });

        if (error) {
            console.error('Error sending order delivered email:', error);
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
