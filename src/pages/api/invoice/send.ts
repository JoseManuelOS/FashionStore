/**
 * API Endpoint: Send Invoice Email
 * 
 * Sends the invoice as a beautiful HTML email to the customer
 */

import type { APIRoute } from 'astro';
import { Resend } from 'resend';
import { getFacturacionByOrderId, getOrderById } from '../../../lib/supabase';
import { generateInvoicePDFBase64 } from '../../../lib/pdf-generator';

const resend = new Resend(import.meta.env.RESEND_API_KEY);

export const POST: APIRoute = async ({ request }) => {
    try {
        const { orderId } = await request.json();

        if (!orderId) {
            return new Response(
                JSON.stringify({ error: 'Order ID required' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Get invoice data
        const invoice = await getFacturacionByOrderId(orderId);
        if (!invoice) {
            return new Response(
                JSON.stringify({ error: 'Invoice not found' }),
                { status: 404, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Get order for customer email
        const order = await getOrderById(orderId);
        if (!order || !order.customer_email) {
            return new Response(
                JSON.stringify({ error: 'Customer email not found' }),
                { status: 404, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Format currency
        const formatCurrency = (amount: number) =>
            new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);

        // Parse items
        const items = invoice.items || [];

        // Generate items HTML for email
        const itemsHtml = items.map((item: any) => `
            <tr>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #374151;">
                    <div style="font-weight: 600;">${item.product_name}</div>
                    ${item.size ? `<div style="font-size: 12px; color: #6b7280;">Talla: ${item.size}</div>` : ''}
                </td>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center; color: #374151;">${item.quantity}</td>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #374151;">${formatCurrency(item.price)}</td>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600; color: #111827;">${formatCurrency(item.total || item.price * item.quantity)}</td>
            </tr>
        `).join('');

        // Format date
        const invoiceDate = new Date(invoice.created_at || Date.now()).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });

        // Generate PDF attachment as Base64
        const orderNumber = order.order_number || orderId.slice(0, 8);
        const pdfBase64 = generateInvoicePDFBase64(invoice, orderNumber, false);

        // Send email
        const { data, error } = await resend.emails.send({
            from: 'FashionMarket <noreply@roomieapp.info>',
            to: [order.customer_email],
            subject: `Factura ${invoice.invoice_number || '#' + invoice.id} - FashionMarket`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f3f4f6;">
                    <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                        <!-- Header -->
                        <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 40px; text-align: center;">
                            <h1 style="font-size: 24px; font-weight: 700; color: #06b6d4; margin: 0 0 8px 0;">FASHIONMARKET</h1>
                            <p style="color: #94a3b8; font-size: 14px; margin: 0;">Factura ${invoice.invoice_number || '#' + invoice.id}</p>
                        </div>

                        <!-- Invoice Info -->
                        <div style="padding: 32px; border-bottom: 1px solid #e5e7eb;">
                            <table style="width: 100%;">
                                <tr>
                                    <td style="vertical-align: top;">
                                        <p style="font-size: 12px; color: #6b7280; margin: 0 0 4px 0; text-transform: uppercase;">Facturar a</p>
                                        <p style="font-weight: 600; color: #111827; margin: 0;">${invoice.customer_name || order.customer_name || 'Cliente'}</p>
                                        <p style="color: #6b7280; font-size: 14px; margin: 4px 0 0 0;">${invoice.customer_email || order.customer_email}</p>
                                    </td>
                                    <td style="vertical-align: top; text-align: right;">
                                        <p style="font-size: 12px; color: #6b7280; margin: 0 0 4px 0; text-transform: uppercase;">Fecha</p>
                                        <p style="font-weight: 600; color: #111827; margin: 0;">${invoiceDate}</p>
                                        <p style="color: #6b7280; font-size: 14px; margin: 4px 0 0 0;">Pedido #${order.order_number || orderId.slice(0, 8)}</p>
                                    </td>
                                </tr>
                            </table>
                        </div>

                        <!-- Items -->
                        <div style="padding: 0 32px;">
                            <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
                                <thead>
                                    <tr style="background: #f1f5f9;">
                                        <th style="padding: 12px; text-align: left; font-size: 11px; color: #64748b; text-transform: uppercase;">Producto</th>
                                        <th style="padding: 12px; text-align: center; font-size: 11px; color: #64748b; text-transform: uppercase;">Cant.</th>
                                        <th style="padding: 12px; text-align: right; font-size: 11px; color: #64748b; text-transform: uppercase;">Precio</th>
                                        <th style="padding: 12px; text-align: right; font-size: 11px; color: #64748b; text-transform: uppercase;">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${itemsHtml}
                                </tbody>
                            </table>
                        </div>

                        <!-- Totals -->
                        <div style="padding: 24px 32px; background: #f9fafb;">
                            <table style="width: 100%; max-width: 280px; margin-left: auto;">
                                <tr>
                                    <td style="padding: 8px 0; color: #6b7280;">Base imponible</td>
                                    <td style="padding: 8px 0; text-align: right; font-weight: 500; color: #374151;">${formatCurrency(invoice.subtotal || 0)}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #6b7280;">IVA (21%)</td>
                                    <td style="padding: 8px 0; text-align: right; font-weight: 500; color: #374151;">${formatCurrency(invoice.iva_amount || 0)}</td>
                                </tr>
                                ${invoice.shipping_cost > 0 ? `
                                <tr>
                                    <td style="padding: 8px 0; color: #6b7280;">Envío</td>
                                    <td style="padding: 8px 0; text-align: right; font-weight: 500; color: #374151;">${formatCurrency(invoice.shipping_cost)}</td>
                                </tr>
                                ` : ''}
                                <tr style="border-top: 2px solid #e5e7eb;">
                                    <td style="padding: 16px 0 8px; font-weight: 700; color: #111827; font-size: 16px;">TOTAL</td>
                                    <td style="padding: 16px 0 8px; text-align: right; font-weight: 700; color: #06b6d4; font-size: 20px;">${formatCurrency(invoice.total || 0)}</td>
                                </tr>
                            </table>
                        </div>

                        <!-- Footer -->
                        <div style="padding: 24px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="color: #6b7280; font-size: 13px; margin: 0;">Gracias por tu compra en FashionMarket</p>
                            <p style="color: #9ca3af; font-size: 12px; margin: 8px 0 0 0;">Esta factura ha sido generada automáticamente</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
            attachments: [
                {
                    filename: `Factura_${invoice.invoice_number || invoice.id}.pdf`,
                    content: Buffer.from(pdfBase64, 'base64')
                }
            ]
        });

        if (error) {
            console.error('Error sending invoice email:', error);
            return new Response(
                JSON.stringify({ error: 'Failed to send email: ' + error.message }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }

        console.log('📧 Invoice email sent to:', order.customer_email);

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Invoice sent successfully',
                email: order.customer_email,
                invoice_number: invoice.invoice_number
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );

    } catch (error: any) {
        console.error('Error in send invoice API:', error);
        return new Response(
            JSON.stringify({ error: error.message || 'Internal server error' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
};
