/**
 * Admin Notifications Service
 * Sends email notifications to administrators for critical events
 */

import { Resend } from 'resend';

const resend = new Resend(import.meta.env.RESEND_API_KEY);

// Admin email - can be configured via environment variable
const ADMIN_EMAIL = import.meta.env.ADMIN_EMAIL || 'admin@fashionmarket.com';
const SITE_URL = import.meta.env.PUBLIC_SITE_URL || 'http://localhost:4321';

// Common email styles
const emailStyles = {
    body: 'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 0; background-color: #0a0a0f;',
    container: 'max-width: 600px; margin: 0 auto; background-color: #0f0f1a;',
    headerSuccess: 'background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 40px; text-align: center;',
    headerWarning: 'background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%); padding: 40px; text-align: center;',
    headerDanger: 'background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); padding: 40px; text-align: center;',
    headerInfo: 'background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%); padding: 40px; text-align: center;',
    title: 'color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;',
    subtitle: 'color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;',
    content: 'padding: 32px;',
    card: 'background: #0a0a0f; border: 1px solid #2a2a3e; border-radius: 12px; padding: 20px; margin-bottom: 20px;',
    label: 'color: #71717a; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;',
    value: 'color: #f1f5f9; font-size: 16px; font-weight: 600;',
    button: 'display: inline-block; background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 14px;',
    footer: 'background: #0a0a0f; padding: 24px; text-align: center; border-top: 1px solid #2a2a3e; color: #71717a; font-size: 12px;'
};

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);

const formatDate = (date: Date | string) =>
    new Date(date).toLocaleString('es-ES', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });

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
        const itemsHtml = (order.items || []).map(item => `
            <tr>
                <td style="padding: 12px 8px; border-bottom: 1px solid #2a2a3e;">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                        <tr>
                            <td width="60" valign="top">
                                ${item.product_image ? `<img src="${item.product_image}" alt="${item.product_name}" style="width: 56px; height: 56px; object-fit: cover; border-radius: 8px; background: #2a2a3e; display: block;" />` : `<div style="width: 56px; height: 56px; background: #2a2a3e; border-radius: 8px;"></div>`}
                            </td>
                            <td style="padding-left: 12px;" valign="middle">
                                <div style="color: #e2e8f0; font-weight: 600; font-size: 14px;">${item.product_name}</div>
                                ${item.size ? `<div style="color: #71717a; font-size: 12px; margin-top: 2px;">Talla: ${item.size}</div>` : ''}
                            </td>
                        </tr>
                    </table>
                </td>
                <td style="padding: 12px 8px; border-bottom: 1px solid #2a2a3e; color: #71717a; text-align: center; vertical-align: middle;">${item.quantity}</td>
                <td style="padding: 12px 8px; border-bottom: 1px solid #2a2a3e; color: #22d3ee; text-align: right; font-weight: 600; vertical-align: middle;">${formatCurrency(item.price_at_purchase * item.quantity)}</td>
            </tr>
        `).join('');

        await new Promise(resolve => setTimeout(resolve, 500));
        await resend.emails.send({
            from: 'FashionMarket <noreply@roomieapp.info>',
            to: [ADMIN_EMAIL],
            subject: `Nuevo pedido #${order.order_number || order.id.slice(0, 8)} - ${formatCurrency(order.total_price)}`,
            html: `
                <div style="${emailStyles.body}">
                    <div style="${emailStyles.container}">
                        <div style="${emailStyles.headerSuccess}">
                            <div style="width: 60px; height: 60px; background: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 16px;">
                                <table width="60" height="60"><tr><td align="center" valign="middle" style="color: white; font-size: 28px;">🛒</td></tr></table>
                            </div>
                            <h1 style="${emailStyles.title}">Nuevo Pedido Recibido</h1>
                            <p style="${emailStyles.subtitle}">Pedido #${order.order_number || order.id.slice(0, 8)}</p>
                        </div>
                        <div style="${emailStyles.content}">
                            <div style="${emailStyles.card}">
                                <table width="100%">
                                    <tr>
                                        <td>
                                            <p style="${emailStyles.label}">Cliente</p>
                                            <p style="${emailStyles.value}">${order.customer_name || 'Invitado'}</p>
                                            <p style="color: #71717a; font-size: 13px; margin: 2px 0 0 0;">${order.customer_email || '-'}</p>
                                        </td>
                                        <td style="text-align: right;">
                                            <p style="${emailStyles.label}">Total</p>
                                            <p style="color: #22d3ee; font-size: 24px; font-weight: 700; margin: 0;">${formatCurrency(order.total_price)}</p>
                                        </td>
                                    </tr>
                                </table>
                            </div>
                            ${order.items && order.items.length > 0 ? `
                            <div style="${emailStyles.card}">
                                <p style="${emailStyles.label}; margin-bottom: 12px;">Productos</p>
                                <table style="width: 100%; border-collapse: collapse;">
                                    <thead>
                                        <tr>
                                            <th style="padding: 8px; text-align: left; color: #71717a; font-size: 11px; text-transform: uppercase; border-bottom: 1px solid #2a2a3e;">Producto</th>
                                            <th style="padding: 8px; text-align: center; color: #71717a; font-size: 11px; text-transform: uppercase; border-bottom: 1px solid #2a2a3e;">Cant.</th>
                                            <th style="padding: 8px; text-align: right; color: #71717a; font-size: 11px; text-transform: uppercase; border-bottom: 1px solid #2a2a3e;">Precio</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${itemsHtml}
                                    </tbody>
                                </table>
                            </div>
                            ` : ''}
                            <div style="text-align: center; margin-top: 24px;">
                                <a href="${SITE_URL}/admin/pedidos/${order.id}" style="${emailStyles.button}">
                                    Ver Pedido en Admin
                                </a>
                            </div>
                        </div>
                        <div style="${emailStyles.footer}">
                            FashionMarket Admin • ${formatDate(new Date())}
                        </div>
                    </div>
                </div>
            `
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
        const productsHtml = products.map(p => `
            <tr>
                <td style="padding: 12px; border-bottom: 1px solid #2a2a3e; color: #e2e8f0;">${p.name}</td>
                <td style="padding: 12px; border-bottom: 1px solid #2a2a3e; color: #71717a; text-align: center;">${p.size || 'Única'}</td>
                <td style="padding: 12px; border-bottom: 1px solid #2a2a3e; text-align: center;">
                    <span style="background: ${p.currentStock === 0 ? '#dc2626' : '#f59e0b'}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">
                        ${p.currentStock === 0 ? 'AGOTADO' : p.currentStock + ' unidades'}
                    </span>
                </td>
            </tr>
        `).join('');

        await new Promise(resolve => setTimeout(resolve, 500));
        await resend.emails.send({
            from: 'FashionMarket <noreply@roomieapp.info>',
            to: [ADMIN_EMAIL],
            subject: `Alerta de Stock: ${products.length} producto(s) con stock bajo`,
            html: `
                <div style="${emailStyles.body}">
                    <div style="${emailStyles.container}">
                        <div style="${emailStyles.headerWarning}">
                            <div style="width: 60px; height: 60px; background: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 16px;">
                                <table width="60" height="60"><tr><td align="center" valign="middle" style="color: white; font-size: 28px;">⚠️</td></tr></table>
                            </div>
                            <h1 style="${emailStyles.title}">Alerta de Stock Bajo</h1>
                            <p style="${emailStyles.subtitle}">${products.length} producto(s) necesitan reposición</p>
                        </div>
                        <div style="${emailStyles.content}">
                            <div style="${emailStyles.card}">
                                <table style="width: 100%; border-collapse: collapse;">
                                    <thead>
                                        <tr>
                                            <th style="padding: 12px; text-align: left; color: #71717a; font-size: 11px; text-transform: uppercase; border-bottom: 1px solid #2a2a3e;">Producto</th>
                                            <th style="padding: 12px; text-align: center; color: #71717a; font-size: 11px; text-transform: uppercase; border-bottom: 1px solid #2a2a3e;">Talla</th>
                                            <th style="padding: 12px; text-align: center; color: #71717a; font-size: 11px; text-transform: uppercase; border-bottom: 1px solid #2a2a3e;">Stock</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${productsHtml}
                                    </tbody>
                                </table>
                            </div>
                            <div style="text-align: center; margin-top: 24px;">
                                <a href="${SITE_URL}/admin/productos" style="${emailStyles.button}">
                                    Gestionar Inventario
                                </a>
                            </div>
                        </div>
                        <div style="${emailStyles.footer}">
                            FashionMarket Admin • ${formatDate(new Date())}
                        </div>
                    </div>
                </div>
            `
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
        await new Promise(resolve => setTimeout(resolve, 500));
        await resend.emails.send({
            from: 'FashionMarket <noreply@roomieapp.info>',
            to: [ADMIN_EMAIL],
            subject: `Pedido #${order.order_number || order.id.slice(0, 8)} Cancelado`,
            html: `
                <div style="${emailStyles.body}">
                    <div style="${emailStyles.container}">
                        <div style="${emailStyles.headerDanger}">
                            <div style="width: 60px; height: 60px; background: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 16px;">
                                <table width="60" height="60"><tr><td align="center" valign="middle" style="color: white; font-size: 28px;">🚫</td></tr></table>
                            </div>
                            <h1 style="${emailStyles.title}">Pedido Cancelado</h1>
                            <p style="${emailStyles.subtitle}">Pedido #${order.order_number || order.id.slice(0, 8)}</p>
                        </div>
                        <div style="${emailStyles.content}">
                            <div style="${emailStyles.card}">
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                                    <div>
                                        <p style="${emailStyles.label}">Cliente</p>
                                        <p style="${emailStyles.value}">${order.customer_name || 'Invitado'}</p>
                                        <p style="color: #71717a; font-size: 13px; margin-top: 2px;">${order.customer_email || '-'}</p>
                                    </div>
                                    <div style="text-align: right;">
                                        <p style="${emailStyles.label}">Importe reembolsado</p>
                                        <p style="color: #ef4444; font-size: 24px; font-weight: 700;">${formatCurrency(order.total_price)}</p>
                                    </div>
                                </div>
                            </div>
                            ${reason ? `
                            <div style="${emailStyles.card}">
                                <p style="${emailStyles.label}">Motivo de cancelación</p>
                                <p style="color: #e2e8f0; margin-top: 8px;">${reason}</p>
                            </div>
                            ` : ''}
                            <div style="text-align: center; margin-top: 24px;">
                                <a href="${SITE_URL}/admin/pedidos/${order.id}" style="${emailStyles.button}">
                                    Ver Detalles
                                </a>
                            </div>
                        </div>
                        <div style="${emailStyles.footer}">
                            FashionMarket Admin • ${formatDate(new Date())}
                        </div>
                    </div>
                </div>
            `
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
        await new Promise(resolve => setTimeout(resolve, 500));
        await resend.emails.send({
            from: 'FashionMarket <noreply@roomieapp.info>',
            to: [ADMIN_EMAIL],
            subject: `Solicitud de Devolución - Pedido #${order.order_number || order.id.slice(0, 8)}`,
            html: `
                <div style="${emailStyles.body}">
                    <div style="${emailStyles.container}">
                        <div style="${emailStyles.headerInfo}">
                            <div style="width: 60px; height: 60px; background: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 16px;">
                                <table width="60" height="60"><tr><td align="center" valign="middle" style="color: white; font-size: 28px;">↩️</td></tr></table>
                            </div>
                            <h1 style="${emailStyles.title}">Solicitud de Devolución</h1>
                            <p style="${emailStyles.subtitle}">Requiere revisión</p>
                        </div>
                        <div style="${emailStyles.content}">
                            <div style="${emailStyles.card}">
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                                    <div>
                                        <p style="${emailStyles.label}">Pedido</p>
                                        <p style="${emailStyles.value}">#${order.order_number || order.id.slice(0, 8)}</p>
                                    </div>
                                    <div>
                                        <p style="${emailStyles.label}">Cliente</p>
                                        <p style="${emailStyles.value}">${order.customer_name || 'Invitado'}</p>
                                        <p style="color: #71717a; font-size: 13px; margin-top: 2px;">${order.customer_email || '-'}</p>
                                    </div>
                                </div>
                            </div>
                            <div style="${emailStyles.card}">
                                <p style="${emailStyles.label}">Motivo de devolución</p>
                                <p style="color: #e2e8f0; margin-top: 8px; line-height: 1.6;">${reason}</p>
                            </div>
                            <div style="text-align: center; margin-top: 24px;">
                                <a href="${SITE_URL}/admin/pedidos/${order.id}" style="${emailStyles.button}">
                                    Revisar Solicitud
                                </a>
                            </div>
                        </div>
                        <div style="${emailStyles.footer}">
                            FashionMarket Admin • ${formatDate(new Date())}
                        </div>
                    </div>
                </div>
            `
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
        const ordersHtml = orders.map(o => `
            <tr>
                <td style="padding: 12px; border-bottom: 1px solid #2a2a3e; color: #22d3ee; font-weight: 600;">#${o.order_number || o.id.slice(0, 8)}</td>
                <td style="padding: 12px; border-bottom: 1px solid #2a2a3e; color: #e2e8f0;">${o.customer_name || 'Invitado'}</td>
                <td style="padding: 12px; border-bottom: 1px solid #2a2a3e; color: #71717a;">${formatDate(o.created_at)}</td>
                <td style="padding: 12px; border-bottom: 1px solid #2a2a3e; color: #e2e8f0; text-align: right;">${formatCurrency(o.total_price)}</td>
            </tr>
        `).join('');

        await new Promise(resolve => setTimeout(resolve, 500));
        await resend.emails.send({
            from: 'FashionMarket <noreply@roomieapp.info>',
            to: [ADMIN_EMAIL],
            subject: `Recordatorio: ${orders.length} pedido(s) pendientes de envío`,
            html: `
                <div style="${emailStyles.body}">
                    <div style="${emailStyles.container}">
                        <div style="${emailStyles.headerWarning}">
                            <div style="width: 60px; height: 60px; background: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 16px;">
                                <table width="60" height="60"><tr><td align="center" valign="middle" style="color: white; font-size: 28px;">📦</td></tr></table>
                            </div>
                            <h1 style="${emailStyles.title}">Pedidos Pendientes de Envío</h1>
                            <p style="${emailStyles.subtitle}">${orders.length} pedido(s) esperando ser enviados</p>
                        </div>
                        <div style="${emailStyles.content}">
                            <div style="${emailStyles.card}">
                                <table style="width: 100%; border-collapse: collapse;">
                                    <thead>
                                        <tr>
                                            <th style="padding: 12px; text-align: left; color: #71717a; font-size: 11px; text-transform: uppercase; border-bottom: 1px solid #2a2a3e;">Pedido</th>
                                            <th style="padding: 12px; text-align: left; color: #71717a; font-size: 11px; text-transform: uppercase; border-bottom: 1px solid #2a2a3e;">Cliente</th>
                                            <th style="padding: 12px; text-align: left; color: #71717a; font-size: 11px; text-transform: uppercase; border-bottom: 1px solid #2a2a3e;">Fecha</th>
                                            <th style="padding: 12px; text-align: right; color: #71717a; font-size: 11px; text-transform: uppercase; border-bottom: 1px solid #2a2a3e;">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${ordersHtml}
                                    </tbody>
                                </table>
                            </div>
                            <div style="text-align: center; margin-top: 24px;">
                                <a href="${SITE_URL}/admin/pedidos" style="${emailStyles.button}">
                                    Ver Todos los Pedidos
                                </a>
                            </div>
                        </div>
                        <div style="${emailStyles.footer}">
                            FashionMarket Admin • ${formatDate(new Date())}
                        </div>
                    </div>
                </div>
            `
        });
        console.log('📧 Admin notification sent: Pending Shipments');
    } catch (error) {
        console.error('Failed to send pending shipments summary:', error);
    }
}
