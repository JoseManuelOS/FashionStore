/**
 * Admin Notifications Service
 * Sends premium email notifications to administrators for critical events.
 * Matches the dark premium theme of client-facing emails.
 */

import { Resend } from 'resend';

const resend = new Resend(import.meta.env.RESEND_API_KEY);

const ADMIN_EMAIL = import.meta.env.ADMIN_EMAIL || 'admin@fashionmarket.com';
const SITE_URL = import.meta.env.PUBLIC_SITE_URL || 'https://j4o0084kg0ssoo0wc0ocw0g8.victoriafp.online';

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);

const formatDate = (date: Date | string) =>
    new Date(date).toLocaleString('es-ES', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });

// ────────────────────────────────────────
// Shared HTML helpers for premium theme
// ────────────────────────────────────────

function wrapEmail(headerGradient: string, iconEmoji: string, title: string, subtitle: string, body: string, ctaUrl: string, ctaLabel: string) {
    const year = new Date().getFullYear();
    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #e2e8f0; margin: 0; padding: 40px 20px; background-color: #0a0a0f;">
<div style="max-width: 600px; margin: 0 auto; background-color: #0f0f1a; border-radius: 16px; overflow: hidden;">

    <!-- Header -->
    <div style="background: ${headerGradient}; padding: 48px 32px; text-align: center;">
        <div style="width: 80px; height: 80px; margin: 0 auto 20px; background: rgba(255,255,255,0.15); border-radius: 50%; border: 2px solid rgba(255,255,255,0.2);">
            <table width="100%" height="80"><tr><td align="center" valign="middle" style="color: white; font-size: 36px;">${iconEmoji}</td></tr></table>
        </div>
        <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.5px;">${title}</h1>
        <p style="color: rgba(255,255,255,0.85); margin: 12px 0 0 0; font-size: 15px;">${subtitle}</p>
        <div style="margin-top: 20px; background: rgba(255,255,255,0.12); display: inline-block; padding: 8px 20px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.15);">
            <p style="color: rgba(255,255,255,0.7); font-size: 10px; font-weight: 600; margin: 0; text-transform: uppercase; letter-spacing: 1.5px;">Panel de Administraci&oacute;n</p>
        </div>
    </div>

    <!-- Content -->
    <div style="padding: 40px 32px;">
        ${body}

        <!-- CTA Button -->
        <div style="text-align: center; margin: 32px 0 0 0;">
            <a href="${ctaUrl}"
               style="display: inline-block; background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 14px rgba(6, 182, 212, 0.3);">
                ${ctaLabel}
            </a>
        </div>
    </div>

    <!-- Footer -->
    <div style="background-color: #0a0a0f; padding: 28px 32px; text-align: center; border-top: 1px solid #2a2a3e;">
        <p style="color: #52525b; margin: 0; font-size: 12px;">
            FashionMarket Admin &bull; ${formatDate(new Date())}
        </p>
        <p style="color: #3f3f46; margin: 6px 0 0; font-size: 11px;">
            &copy; ${year} FashionMarket. Todos los derechos reservados.
        </p>
    </div>
</div>
</body>
</html>`;
}

function infoCard(label: string, value: string, valueColor: string = '#f1f5f9') {
    return `<div>
        <p style="color: #71717a; font-size: 11px; text-transform: uppercase; letter-spacing: 0.8px; margin: 0 0 6px 0; font-weight: 600;">${label}</p>
        <p style="color: ${valueColor}; font-size: 18px; font-weight: 700; margin: 0;">${value}</p>
    </div>`;
}

function card(content: string) {
    return `<div style="background: #0a0a0f; border: 1px solid #2a2a3e; border-radius: 16px; padding: 24px; margin-bottom: 20px;">
        ${content}
    </div>`;
}

/**
 * Send notification for new order
 */
export async function sendNewOrderNotification(order: {
    id: string;
    order_number?: number;
    customer_name?: string;
    customer_email?: string;
    total_price: number;
    items?: any[];
}) {
    try {
        const orderRef = `#${order.order_number || order.id.slice(0, 8)}`;

        const itemsHtml = (order.items || []).map(item => `
            <tr>
                <td style="padding: 14px 12px; border-bottom: 1px solid #1a1a2e;">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                        <tr>
                            <td width="56" valign="top">
                                ${item.product_image
                                    ? `<img src="${item.product_image}" alt="${item.product_name}" style="width: 52px; height: 52px; object-fit: cover; border-radius: 10px; background: #2a2a3e; display: block;" />`
                                    : `<div style="width: 52px; height: 52px; background: linear-gradient(135deg, #1e293b, #334155); border-radius: 10px;"></div>`}
                            </td>
                            <td style="padding-left: 14px;" valign="middle">
                                <div style="color: #e2e8f0; font-weight: 600; font-size: 14px;">${item.product_name}</div>
                                ${item.size ? `<div style="color: #71717a; font-size: 12px; margin-top: 3px;">Talla: ${item.size}</div>` : ''}
                                <div style="color: #52525b; font-size: 12px; margin-top: 2px;">Cantidad: ${item.quantity}</div>
                            </td>
                            <td style="text-align: right; vertical-align: middle;">
                                <span style="color: #22d3ee; font-weight: 700; font-size: 15px;">${formatCurrency(item.price_at_purchase * item.quantity)}</span>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        `).join('');

        const body = `
            ${card(`
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                        <td valign="top" width="50%">
                            ${infoCard('Cliente', order.customer_name || 'Invitado')}
                            <p style="color: #52525b; font-size: 13px; margin: 4px 0 0 0;">${order.customer_email || '-'}</p>
                        </td>
                        <td valign="top" width="50%" style="text-align: right;">
                            ${infoCard('Total del pedido', formatCurrency(order.total_price), '#22d3ee')}
                            <p style="color: #52525b; font-size: 13px; margin: 4px 0 0 0;">${formatDate(new Date())}</p>
                        </td>
                    </tr>
                </table>
            `)}

            ${card(`
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                        <td width="48" valign="top">
                            <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #059669, #10b981); border-radius: 10px;">
                                <table width="40" height="40"><tr><td align="center" valign="middle" style="color: white; font-size: 18px;">&#10003;</td></tr></table>
                            </div>
                        </td>
                        <td style="padding-left: 14px;" valign="middle">
                            <div style="color: #10b981; font-weight: 700; font-size: 15px;">Pago confirmado</div>
                            <div style="color: #71717a; font-size: 13px; margin-top: 2px;">Pedido listo para preparar</div>
                        </td>
                    </tr>
                </table>
            `)}

            ${order.items && order.items.length > 0 ? card(`
                <p style="color: #a1a1aa; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; margin: 0 0 16px 0;">Productos del pedido</p>
                <table style="width: 100%; border-collapse: collapse;">
                    <tbody>${itemsHtml}</tbody>
                </table>
                <table width="100%" style="margin-top: 16px; border-top: 1px solid #2a2a3e; padding-top: 16px;">
                    <tr>
                        <td><p style="color: #71717a; font-size: 13px; margin: 0; text-transform: uppercase; font-weight: 600;">Total</p></td>
                        <td style="text-align: right;"><p style="color: #22d3ee; font-size: 22px; font-weight: 700; margin: 0;">${formatCurrency(order.total_price)}</p></td>
                    </tr>
                </table>
            `) : ''}
        `;

        const html = wrapEmail(
            'linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)',
            '&#128722;',
            'Nuevo Pedido Recibido',
            `Pedido ${orderRef} &bull; ${formatCurrency(order.total_price)}`,
            body,
            `${SITE_URL}/admin/pedidos/${order.id}`,
            'Ver Pedido en Admin'
        );

        await new Promise(resolve => setTimeout(resolve, 500));
        await resend.emails.send({
            from: 'FashionMarket <noreply@roomieapp.info>',
            to: [ADMIN_EMAIL],
            subject: `Nuevo pedido ${orderRef} - ${formatCurrency(order.total_price)}`,
            html
        });
        console.log('📧 Admin notification sent: New Order');
    } catch (error) {
        console.error('Failed to send new order notification:', error);
    }
}

/**
 * Send low stock alert
 */
export async function sendLowStockAlert(products: Array<{
    id: string;
    name: string;
    size?: string;
    currentStock: number;
}>) {
    if (products.length === 0) return;

    try {
        const outOfStock = products.filter(p => p.currentStock === 0).length;
        const lowStock = products.length - outOfStock;

        const productsHtml = products.map(p => `
            <tr>
                <td style="padding: 14px 12px; border-bottom: 1px solid #1a1a2e;">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                        <tr>
                            <td width="44" valign="top">
                                <div style="width: 36px; height: 36px; background: ${p.currentStock === 0 ? 'linear-gradient(135deg, #dc2626, #ef4444)' : 'linear-gradient(135deg, #d97706, #f59e0b)'}; border-radius: 8px;">
                                    <table width="36" height="36"><tr><td align="center" valign="middle" style="color: white; font-size: 14px; font-weight: 700;">${p.currentStock}</td></tr></table>
                                </div>
                            </td>
                            <td style="padding-left: 12px;" valign="middle">
                                <div style="color: #e2e8f0; font-weight: 600; font-size: 14px;">${p.name}</div>
                                <div style="color: #71717a; font-size: 12px; margin-top: 2px;">Talla: ${p.size || '&Uacute;nica'}</div>
                            </td>
                            <td style="text-align: right; vertical-align: middle;">
                                <span style="background: ${p.currentStock === 0 ? 'linear-gradient(135deg, #dc2626, #b91c1c)' : 'linear-gradient(135deg, #d97706, #b45309)'}; color: white; padding: 5px 14px; border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 0.3px;">
                                    ${p.currentStock === 0 ? 'AGOTADO' : 'BAJO'}
                                </span>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        `).join('');

        const body = `
            ${card(`
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                        <td valign="top" width="33%" style="text-align: center;">
                            ${infoCard('Total alertas', `${products.length}`)}
                        </td>
                        <td valign="top" width="33%" style="text-align: center;">
                            ${infoCard('Agotados', `${outOfStock}`, '#ef4444')}
                        </td>
                        <td valign="top" width="33%" style="text-align: center;">
                            ${infoCard('Stock bajo', `${lowStock}`, '#f59e0b')}
                        </td>
                    </tr>
                </table>
            `)}

            ${card(`
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                        <td width="48" valign="top">
                            <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #d97706, #f59e0b); border-radius: 10px;">
                                <table width="40" height="40"><tr><td align="center" valign="middle" style="color: white; font-size: 18px;">&#9888;</td></tr></table>
                            </div>
                        </td>
                        <td style="padding-left: 14px;" valign="middle">
                            <div style="color: #fbbf24; font-weight: 700; font-size: 15px;">Acci&oacute;n requerida</div>
                            <div style="color: #71717a; font-size: 13px; margin-top: 2px;">Reponer inventario para evitar p&eacute;rdida de ventas</div>
                        </td>
                    </tr>
                </table>
            `)}

            ${card(`
                <p style="color: #a1a1aa; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; margin: 0 0 16px 0;">Productos afectados</p>
                <table style="width: 100%; border-collapse: collapse;">
                    <tbody>${productsHtml}</tbody>
                </table>
            `)}
        `;

        const html = wrapEmail(
            'linear-gradient(135deg, #d97706 0%, #f59e0b 50%, #fbbf24 100%)',
            '&#9888;&#65039;',
            'Alerta de Stock Bajo',
            `${products.length} producto(s) necesitan reposici&oacute;n`,
            body,
            `${SITE_URL}/admin/productos`,
            'Gestionar Inventario'
        );

        await new Promise(resolve => setTimeout(resolve, 500));
        await resend.emails.send({
            from: 'FashionMarket <noreply@roomieapp.info>',
            to: [ADMIN_EMAIL],
            subject: `Alerta de Stock: ${products.length} producto(s) con stock bajo`,
            html
        });
        console.log('📧 Admin notification sent: Low Stock Alert');
    } catch (error) {
        console.error('Failed to send low stock alert:', error);
    }
}

/**
 * Send order cancellation notification
 */
export async function sendCancellationNotification(order: {
    id: string;
    order_number?: number;
    customer_name?: string;
    customer_email?: string;
    total_price: number;
}, reason?: string) {
    try {
        const orderRef = `#${order.order_number || order.id.slice(0, 8)}`;

        const body = `
            ${card(`
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                        <td valign="top" width="50%">
                            ${infoCard('Pedido', orderRef, '#ef4444')}
                        </td>
                        <td valign="top" width="50%" style="text-align: right;">
                            ${infoCard('Importe', formatCurrency(order.total_price), '#ef4444')}
                        </td>
                    </tr>
                </table>
            `)}

            ${card(`
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                        <td width="48" valign="top">
                            <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #3f3f46, #52525b); border-radius: 10px;">
                                <table width="40" height="40"><tr><td align="center" valign="middle" style="color: white; font-size: 18px;">&#128100;</td></tr></table>
                            </div>
                        </td>
                        <td style="padding-left: 14px;" valign="middle">
                            <div style="color: #e2e8f0; font-weight: 600; font-size: 15px;">${order.customer_name || 'Invitado'}</div>
                            <div style="color: #71717a; font-size: 13px; margin-top: 2px;">${order.customer_email || '-'}</div>
                        </td>
                    </tr>
                </table>
            `)}

            ${card(`
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                        <td width="48" valign="top">
                            <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #dc2626, #ef4444); border-radius: 10px;">
                                <table width="40" height="40"><tr><td align="center" valign="middle" style="color: white; font-size: 18px;">&#128176;</td></tr></table>
                            </div>
                        </td>
                        <td style="padding-left: 14px;" valign="middle">
                            <div style="color: #ef4444; font-weight: 700; font-size: 15px;">Reembolso: ${formatCurrency(order.total_price)}</div>
                            <div style="color: #71717a; font-size: 13px; margin-top: 2px;">Se reembolsar&aacute; al m&eacute;todo de pago original</div>
                        </td>
                    </tr>
                </table>
            `)}

            ${reason ? card(`
                <p style="color: #a1a1aa; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; margin: 0 0 12px 0;">Motivo de cancelaci&oacute;n</p>
                <div style="background: #111118; border: 1px solid #2a2a3e; border-radius: 10px; padding: 16px;">
                    <p style="color: #e2e8f0; font-size: 15px; margin: 0; line-height: 1.6;">${reason}</p>
                </div>
            `) : ''}
        `;

        const html = wrapEmail(
            'linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #f87171 100%)',
            '&#128683;',
            'Pedido Cancelado',
            `Pedido ${orderRef} &bull; ${formatCurrency(order.total_price)}`,
            body,
            `${SITE_URL}/admin/pedidos/${order.id}`,
            'Ver Detalles del Pedido'
        );

        await new Promise(resolve => setTimeout(resolve, 500));
        await resend.emails.send({
            from: 'FashionMarket <noreply@roomieapp.info>',
            to: [ADMIN_EMAIL],
            subject: `Pedido ${orderRef} Cancelado - ${formatCurrency(order.total_price)}`,
            html
        });
        console.log('📧 Admin notification sent: Cancellation');
    } catch (error) {
        console.error('Failed to send cancellation notification:', error);
    }
}

/**
 * Send return request notification
 */
export async function sendReturnRequestNotification(order: {
    id: string;
    order_number?: number;
    customer_name?: string;
    customer_email?: string;
    total_price: number;
}, reason: string) {
    try {
        const orderRef = `#${order.order_number || order.id.slice(0, 8)}`;

        const body = `
            ${card(`
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                        <td valign="top" width="50%">
                            ${infoCard('Pedido', orderRef, '#22d3ee')}
                        </td>
                        <td valign="top" width="50%" style="text-align: right;">
                            ${infoCard('Importe', formatCurrency(order.total_price), '#f1f5f9')}
                        </td>
                    </tr>
                </table>
            `)}

            ${card(`
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                        <td width="48" valign="top">
                            <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #3f3f46, #52525b); border-radius: 10px;">
                                <table width="40" height="40"><tr><td align="center" valign="middle" style="color: white; font-size: 18px;">&#128100;</td></tr></table>
                            </div>
                        </td>
                        <td style="padding-left: 14px;" valign="middle">
                            <div style="color: #e2e8f0; font-weight: 600; font-size: 15px;">${order.customer_name || 'Invitado'}</div>
                            <div style="color: #71717a; font-size: 13px; margin-top: 2px;">${order.customer_email || '-'}</div>
                        </td>
                    </tr>
                </table>
            `)}

            ${card(`
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                        <td width="48" valign="top">
                            <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #0891b2, #06b6d4); border-radius: 10px;">
                                <table width="40" height="40"><tr><td align="center" valign="middle" style="color: white; font-size: 18px;">&#8617;</td></tr></table>
                            </div>
                        </td>
                        <td style="padding-left: 14px;" valign="middle">
                            <div style="color: #22d3ee; font-weight: 700; font-size: 15px;">Revisi&oacute;n necesaria</div>
                            <div style="color: #71717a; font-size: 13px; margin-top: 2px;">Aprueba o rechaza la devoluci&oacute;n desde el panel</div>
                        </td>
                    </tr>
                </table>
            `)}

            ${card(`
                <p style="color: #a1a1aa; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; margin: 0 0 12px 0;">Motivo de devoluci&oacute;n</p>
                <div style="background: #111118; border: 1px solid #2a2a3e; border-radius: 10px; padding: 16px;">
                    <p style="color: #e2e8f0; font-size: 15px; margin: 0; line-height: 1.7;">${reason}</p>
                </div>
            `)}
        `;

        const html = wrapEmail(
            'linear-gradient(135deg, #0891b2 0%, #06b6d4 50%, #22d3ee 100%)',
            '&#8617;&#65039;',
            'Solicitud de Devoluci&oacute;n',
            `Pedido ${orderRef} &bull; Requiere revisi&oacute;n`,
            body,
            `${SITE_URL}/admin/pedidos/${order.id}`,
            'Revisar Solicitud'
        );

        await new Promise(resolve => setTimeout(resolve, 500));
        await resend.emails.send({
            from: 'FashionMarket <noreply@roomieapp.info>',
            to: [ADMIN_EMAIL],
            subject: `Solicitud de Devolución - Pedido ${orderRef}`,
            html
        });
        console.log('📧 Admin notification sent: Return Request');
    } catch (error) {
        console.error('Failed to send return request notification:', error);
    }
}

/**
 * Send pending shipments summary
 */
export async function sendPendingShipmentsSummary(orders: Array<{
    id: string;
    order_number?: number;
    customer_name?: string;
    total_price: number;
    created_at: string;
}>) {
    if (orders.length === 0) return;

    try {
        const totalValue = orders.reduce((sum, o) => sum + o.total_price, 0);

        const ordersListHtml = orders.map((o, i) => `
            <tr>
                <td style="padding: 14px 12px; border-bottom: 1px solid #1e1e2e;" valign="middle">
                    <div style="width: 28px; height: 28px; background: linear-gradient(135deg, #f59e0b, #f97316); border-radius: 8px; display: inline-block;">
                        <table width="28" height="28"><tr><td align="center" valign="middle" style="color: white; font-size: 12px; font-weight: 700;">${i + 1}</td></tr></table>
                    </div>
                </td>
                <td style="padding: 14px 8px; border-bottom: 1px solid #1e1e2e;">
                    <div style="color: #22d3ee; font-weight: 700; font-size: 14px;">#${o.order_number || o.id.slice(0, 8)}</div>
                    <div style="color: #71717a; font-size: 12px; margin-top: 2px;">${formatDate(o.created_at)}</div>
                </td>
                <td style="padding: 14px 8px; border-bottom: 1px solid #1e1e2e; color: #e2e8f0; font-size: 14px;">${o.customer_name || 'Invitado'}</td>
                <td style="padding: 14px 12px; border-bottom: 1px solid #1e1e2e; color: #e2e8f0; font-weight: 600; font-size: 14px; text-align: right;">${formatCurrency(o.total_price)}</td>
            </tr>
        `).join('');

        const body = `
            ${card(`
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                        <td valign="top" width="50%">
                            ${infoCard('Pendientes', String(orders.length), '#f59e0b')}
                        </td>
                        <td valign="top" width="50%" style="text-align: right;">
                            ${infoCard('Valor total', formatCurrency(totalValue), '#f1f5f9')}
                        </td>
                    </tr>
                </table>
            `)}

            ${card(`
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                        <td width="48" valign="top">
                            <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #b45309, #f59e0b); border-radius: 10px;">
                                <table width="40" height="40"><tr><td align="center" valign="middle" style="color: white; font-size: 18px;">&#9888;&#65039;</td></tr></table>
                            </div>
                        </td>
                        <td style="padding-left: 14px;" valign="middle">
                            <div style="color: #f59e0b; font-weight: 700; font-size: 15px;">Acci&oacute;n requerida</div>
                            <div style="color: #71717a; font-size: 13px; margin-top: 2px;">Estos pedidos necesitan ser procesados y enviados</div>
                        </td>
                    </tr>
                </table>
            `)}

            ${card(`
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr>
                            <th style="padding: 10px 12px; text-align: left; color: #71717a; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #2a2a3e;" width="40"></th>
                            <th style="padding: 10px 8px; text-align: left; color: #71717a; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #2a2a3e;">Pedido</th>
                            <th style="padding: 10px 8px; text-align: left; color: #71717a; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #2a2a3e;">Cliente</th>
                            <th style="padding: 10px 12px; text-align: right; color: #71717a; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #2a2a3e;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${ordersListHtml}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="3" style="padding: 14px 12px; color: #a1a1aa; font-weight: 600; font-size: 13px;">TOTAL PENDIENTE</td>
                            <td style="padding: 14px 12px; text-align: right; color: #22d3ee; font-weight: 700; font-size: 15px;">${formatCurrency(totalValue)}</td>
                        </tr>
                    </tfoot>
                </table>
            `)}
        `;

        const html = wrapEmail(
            'linear-gradient(135deg, #b45309 0%, #f59e0b 50%, #fbbf24 100%)',
            '&#128230;',
            'Pedidos Pendientes de Env&iacute;o',
            `${orders.length} pedido(s) esperando ser enviados`,
            body,
            `${SITE_URL}/admin/pedidos`,
            'Ver Todos los Pedidos'
        );

        await new Promise(resolve => setTimeout(resolve, 500));
        await resend.emails.send({
            from: 'FashionMarket <noreply@roomieapp.info>',
            to: [ADMIN_EMAIL],
            subject: `Recordatorio: ${orders.length} pedido(s) pendientes de envío`,
            html
        });
        console.log('📧 Admin notification sent: Pending Shipments');
    } catch (error) {
        console.error('Failed to send pending shipments summary:', error);
    }
}
