import type { APIRoute } from 'astro';
import { getFacturacionByOrderId, getFacturacionById, getOrderById } from '../../../lib/supabase';

export const GET: APIRoute = async ({ params, url }) => {
    const orderId = params.orderId;

    if (!orderId) {
        return new Response('Order ID required', { status: 400 });
    }

    try {
        // Support fetching specific invoice by ID (for admin preview of credit notes)
        const invoiceIdParam = url.searchParams.get('invoiceId');
        let invoice;

        if (invoiceIdParam) {
            invoice = await getFacturacionById(Number(invoiceIdParam));
        }

        // Fallback to order-based lookup (original invoice)
        if (!invoice) {
            invoice = await getFacturacionByOrderId(orderId);
        }

        if (!invoice) {
            return new Response('Invoice not found', { status: 404 });
        }

        // Get order for additional details
        const order = await getOrderById(orderId);

        // Detect credit note
        const isCreditNote = invoice.invoice_number?.startsWith('FR-');

        // Parse items from JSON
        const items = invoice.items || [];

        // Format currency — uses Intl so negative values get proper formatting
        const formatCurrency = (amount: number) =>
            new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);

        // Generate items HTML
        const itemsHtml = items.map((item: any, index: number) => `
            <tr>
                <td style="padding: 16px 20px; border-bottom: 1px solid #e5e7eb; color: #374151;">${index + 1}</td>
                <td style="padding: 16px 20px; border-bottom: 1px solid #e5e7eb;">
                    <div style="font-weight: 600; color: #111827;">${item.product_name}</div>
                    ${item.size ? `<div style="font-size: 13px; color: #6b7280; margin-top: 2px;">Talla: ${item.size}</div>` : ''}
                    ${item.color ? `<div style="font-size: 13px; color: #6b7280; margin-top: 2px;">Color: ${item.color}</div>` : ''}
                </td>
                <td style="padding: 16px 20px; border-bottom: 1px solid #e5e7eb; text-align: center; color: #374151;">${item.quantity}</td>
                <td style="padding: 16px 20px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #374151;">${formatCurrency(item.price)}</td>
                <td style="padding: 16px 20px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600; color: ${isCreditNote ? '#dc2626' : '#111827'};">${formatCurrency(item.total || item.price * item.quantity)}</td>
            </tr>
        `).join('');

        // Format date
        const invoiceDate = new Date(invoice.created_at || Date.now()).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });

        // Header colors based on type
        const headerBg = isCreditNote
            ? '#7f1d1d'
            : 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)';
        const accentColor = isCreditNote ? '#f87171' : '#06b6d4';
        const accentBg = isCreditNote
            ? 'rgba(248, 113, 113, 0.1)'
            : 'rgba(6, 182, 212, 0.1)';
        const accentBorder = isCreditNote
            ? 'rgba(248, 113, 113, 0.3)'
            : 'rgba(6, 182, 212, 0.3)';
        const typeLabel = isCreditNote ? 'Factura Rectificativa' : 'Factura';
        const totalBg = isCreditNote
            ? '#7f1d1d'
            : 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)';
        const totalColor = isCreditNote ? '#f87171' : '#06b6d4';

        // Generate premium HTML invoice
        const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${typeLabel} ${invoice.invoice_number} - FashionMarket</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: #f8fafc;
            color: #1f2937;
            line-height: 1.6;
        }
        .invoice-container {
            max-width: 800px;
            margin: 40px auto;
            background: white;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            border-radius: 12px;
            overflow: hidden;
        }
        @media print {
            body { background: white; }
            .invoice-container { 
                box-shadow: none;
                margin: 0;
                max-width: 100%;
            }
            .no-print { display: none !important; }
        }
    </style>
</head>
<body>
    <!-- Print Button -->
    <div class="no-print" style="text-align: center; padding: 20px;">
        <button onclick="window.print()" style="background: ${headerBg}; color: white; border: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; cursor: pointer; font-family: inherit;">
            🖨️ Imprimir ${typeLabel}
        </button>
    </div>

    <div class="invoice-container">
        <!-- Header -->
        <div style="background: ${headerBg}; padding: 40px; display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
                <h1 style="font-size: 28px; font-weight: 700; color: ${accentColor}; letter-spacing: -0.5px; margin-bottom: 8px;">FASHIONMARKET</h1>
                <p style="color: #94a3b8; font-size: 14px;">Moda Premium • Estilo Único</p>
            </div>
            <div style="text-align: right;">
                <div style="background: ${accentBg}; border: 1px solid ${accentBorder}; padding: 16px 24px; border-radius: 8px;">
                    <p style="color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">${typeLabel}</p>
                    <p style="color: ${accentColor}; font-size: 20px; font-weight: 700;">${invoice.invoice_number}</p>
                </div>
            </div>
        </div>

        <!-- Info Section -->
        <div style="padding: 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; background: #fafafa; border-bottom: 1px solid #e5e7eb;">
            <!-- Customer Info -->
            <div>
                <h3 style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; margin-bottom: 12px; font-weight: 600;">Facturar a</h3>
                <p style="font-weight: 600; color: #111827; font-size: 16px; margin-bottom: 4px;">${invoice.customer_name || 'Cliente'}</p>
                <p style="color: #6b7280; font-size: 14px;">${invoice.customer_email || ''}</p>
                ${invoice.shipping_address ? `
                    <p style="color: #6b7280; font-size: 14px; margin-top: 8px; white-space: pre-line;">${invoice.shipping_address.split('\n').filter((l: string) => l && !l.includes('null')).join('\n')}</p>
                ` : ''}
            </div>
            <!-- Invoice Details -->
            <div style="text-align: right;">
                <h3 style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; margin-bottom: 12px; font-weight: 600;">Detalles</h3>
                <div style="display: flex; justify-content: flex-end; gap: 40px;">
                    <div>
                        <p style="color: #6b7280; font-size: 13px;">Fecha de emisión</p>
                        <p style="font-weight: 600; color: #111827;">${invoiceDate}</p>
                    </div>
                    <div>
                        <p style="color: #6b7280; font-size: 13px;">Pedido</p>
                        <p style="font-weight: 600; color: #111827;">#${order?.order_number || orderId.slice(0, 8)}</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Items Table -->
        <div style="padding: 0 40px 40px;">
            <table style="width: 100%; border-collapse: collapse; margin-top: 32px;">
                <thead>
                    <tr style="background: #f1f5f9;">
                        <th style="padding: 14px 20px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; font-weight: 600; border-bottom: 2px solid #e2e8f0;">#</th>
                        <th style="padding: 14px 20px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; font-weight: 600; border-bottom: 2px solid #e2e8f0;">Descripción</th>
                        <th style="padding: 14px 20px; text-align: center; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; font-weight: 600; border-bottom: 2px solid #e2e8f0;">Cant.</th>
                        <th style="padding: 14px 20px; text-align: right; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; font-weight: 600; border-bottom: 2px solid #e2e8f0;">Precio Unit.</th>
                        <th style="padding: 14px 20px; text-align: right; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; font-weight: 600; border-bottom: 2px solid #e2e8f0;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
            </table>

            <!-- Totals -->
            <div style="display: flex; justify-content: flex-end; margin-top: 32px;">
                <div style="width: 300px;">
                    <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                        <span style="color: #6b7280;">Base imponible</span>
                        <span style="font-weight: 500; color: ${isCreditNote ? '#dc2626' : '#374151'};">${formatCurrency(invoice.subtotal || 0)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                        <span style="color: #6b7280;">IVA (21%)</span>
                        <span style="font-weight: 500; color: ${isCreditNote ? '#dc2626' : '#374151'};">${formatCurrency(invoice.iva_amount || 0)}</span>
                    </div>
                    ${invoice.shipping_cost && invoice.shipping_cost !== 0 ? `
                    <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                        <span style="color: #6b7280;">Gastos de envío</span>
                        <span style="font-weight: 500; color: ${isCreditNote ? '#dc2626' : '#374151'};">${formatCurrency(invoice.shipping_cost)}</span>
                    </div>
                    ` : ''}
                    <div style="display: flex; justify-content: space-between; padding: 16px 0; background: ${totalBg}; margin: 16px -20px -20px; padding: 20px; border-radius: 0 0 8px 8px;">
                        <span style="color: white; font-weight: 600; font-size: 16px;">TOTAL</span>
                        <span style="color: ${totalColor}; font-weight: 700; font-size: 20px;">${formatCurrency(invoice.total || 0)}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div style="background: #fafafa; padding: 24px 40px; border-top: 1px solid #e5e7eb; text-align: center;">
            <p style="color: #6b7280; font-size: 13px;">
                ${isCreditNote ? 'Esta factura rectificativa anula la factura original.' : 'Gracias por tu compra en FashionMarket'}
            </p>
            <p style="color: #9ca3af; font-size: 12px; margin-top: 8px;">
                Esta factura ha sido generada automáticamente y es válida sin firma.
            </p>
        </div>
    </div>
</body>
</html>
        `;

        return new Response(html, {
            status: 200,
            headers: {
                'Content-Type': 'text/html; charset=utf-8'
            }
        });

    } catch (error: any) {
        console.error('Error generating invoice:', error);
        return new Response(`Error generating invoice: ${error.message}`, { status: 500 });
    }
};
