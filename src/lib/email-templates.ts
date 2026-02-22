// ============================================
// Shared email HTML templates
// Used by both verify-session.ts and stripe.ts webhook
// ============================================

interface OrderEmailData {
    customerName: string;
    orderRef: string;
    orderItems: Array<{
        product_image?: string | null;
        product_name: string;
        size?: string | null;
        quantity: number;
        price_at_purchase: number;
    }>;
    totalPrice: number;
    shippingAddress: string;
    siteUrl?: string;
}

interface InvoiceEmailData {
    customerName: string;
    customerEmail: string;
    invoiceNumber: string;
    invoiceDate: string;
    items: Array<{
        product_name: string;
        size?: string | null;
        quantity: number;
        price: number;
        total: number;
    }>;
    subtotal: number;
    ivaAmount: number;
    total: number;
}

/**
 * Order confirmation email — dark premium theme matching corporate identity.
 * Uses text characters (✓, 📍) instead of inline SVG to avoid spam filters.
 */
export function buildOrderConfirmationHTML(data: OrderEmailData): string {
    const year = new Date().getFullYear();
    const siteUrl = data.siteUrl || 'https://j4o0084kg0ssoo0wc0ocw0g8.victoriafp.online';

    const itemsHTML = data.orderItems.map((item) => `
        <tr>
            <td style="padding: 12px; border-bottom: 1px solid #2a2a3e;">
                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                        <td width="64" valign="top">
                            ${item.product_image
                                ? `<img src="${item.product_image}" alt="${item.product_name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; background: #2a2a3e; display: block;">`
                                : `<div style="width: 60px; height: 60px; background: #2a2a3e; border-radius: 8px;"></div>`
                            }
                        </td>
                        <td style="padding-left: 12px;" valign="middle">
                            <p style="margin: 0; font-weight: 600; color: #f1f5f9;">${item.product_name}</p>
                            ${item.size ? `<p style="margin: 4px 0 0; font-size: 12px; color: #71717a;">Talla: ${item.size}</p>` : ''}
                        </td>
                    </tr>
                </table>
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #2a2a3e; text-align: center; color: #a1a1aa; vertical-align: middle;">${item.quantity}</td>
            <td style="padding: 12px; border-bottom: 1px solid #2a2a3e; text-align: right; color: #22d3ee; font-weight: 600; vertical-align: middle;">${(item.price_at_purchase * item.quantity).toFixed(2)} &euro;</td>
        </tr>
    `).join('');

    const addressSection = data.shippingAddress ? `
        <div style="background: #0a0a0f; border: 1px solid #2a2a3e; border-radius: 16px; padding: 24px; margin-bottom: 24px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                    <td width="48" valign="top">
                        <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #f97316, #ea580c); border-radius: 10px; text-align: center; line-height: 40px; font-size: 18px;">
                            &#128205;
                        </div>
                    </td>
                    <td style="padding-left: 16px;">
                        <div style="font-size: 12px; color: #71717a; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Direcci&oacute;n de env&iacute;o</div>
                        <div style="color: #e2e8f0; line-height: 1.6; white-space: pre-line;">${data.shippingAddress}</div>
                    </td>
                </tr>
            </table>
        </div>
    ` : '';

    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Confirmaci&oacute;n de Pedido ${data.orderRef}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #e2e8f0; margin: 0; padding: 40px 20px; background-color: #0a0a0f;">
<div style="max-width: 600px; margin: 0 auto; background-color: #0f0f1a; border-radius: 16px; overflow: hidden;">

    <!-- Header -->
    <div style="background: linear-gradient(135deg, #0891b2 0%, #06b6d4 50%, #22d3ee 100%); padding: 48px 32px; text-align: center;">
        <div style="width: 80px; height: 80px; margin: 0 auto 20px; background: rgba(255,255,255,0.2); border-radius: 50%;">
            <table width="100%" height="80"><tr><td align="center" valign="middle" style="color: white; font-size: 40px; font-weight: 300;">&#10003;</td></tr></table>
        </div>
        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Pedido Confirmado</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 12px 0 0 0; font-size: 16px;">Gracias por tu compra</p>
        <div style="margin-top: 24px; background: rgba(255,255,255,0.15); display: inline-block; padding: 12px 24px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.2);">
            <p style="color: rgba(255,255,255,0.8); font-size: 12px; font-weight: 500; margin: 0; text-transform: uppercase; letter-spacing: 1px;">Referencia del pedido</p>
            <p style="color: #ffffff; font-size: 20px; font-weight: 700; margin: 4px 0 0;">${data.orderRef}</p>
        </div>
    </div>

    <!-- Content -->
    <div style="padding: 40px 32px;">

        <!-- Order Info Card -->
        <div style="background: #0a0a0f; border: 1px solid #2a2a3e; border-radius: 16px; padding: 24px; margin-bottom: 24px;">
            <table width="100%" style="margin-bottom: 16px; border-bottom: 1px solid #2a2a3e; padding-bottom: 16px;">
                <tr>
                    <td>
                        <p style="color: #71717a; font-size: 12px; margin: 0; text-transform: uppercase;">N&uacute;mero de pedido</p>
                        <p style="color: #22d3ee; font-size: 18px; font-weight: 700; margin: 4px 0 0;">${data.orderRef}</p>
                    </td>
                    <td style="text-align: right;">
                        <p style="color: #71717a; font-size: 12px; margin: 0; text-transform: uppercase;">Total</p>
                        <p style="color: #f1f5f9; font-size: 24px; font-weight: 700; margin: 4px 0 0;">${data.totalPrice.toFixed(2)} &euro;</p>
                    </td>
                </tr>
            </table>

            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr>
                        <th style="padding: 12px; text-align: left; color: #71717a; font-size: 12px; text-transform: uppercase; border-bottom: 1px solid #2a2a3e;">Producto</th>
                        <th style="padding: 12px; text-align: center; color: #71717a; font-size: 12px; text-transform: uppercase; border-bottom: 1px solid #2a2a3e;">Cant.</th>
                        <th style="padding: 12px; text-align: right; color: #71717a; font-size: 12px; text-transform: uppercase; border-bottom: 1px solid #2a2a3e;">Precio</th>
                    </tr>
                </thead>
                <tbody>${itemsHTML}</tbody>
            </table>
        </div>

        <!-- Shipping Address -->
        ${addressSection}

        <!-- Order Status Progress -->
        <div style="background: #0a0a0f; border: 1px solid #2a2a3e; border-radius: 16px; padding: 28px; margin-bottom: 24px;">
            <h3 style="font-size: 14px; color: #a1a1aa; margin: 0 0 24px 0; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Estado del pedido</h3>
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                    <td width="25%" align="center" style="padding-bottom: 8px;">
                        <div style="width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #06b6d4, #0891b2); margin: 0 auto;">
                            <table width="36" height="36"><tr><td align="center" valign="middle" style="color: white; font-size: 18px;">&#10003;</td></tr></table>
                        </div>
                    </td>
                    <td width="25%" align="center" style="padding-bottom: 8px;">
                        <div style="width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #06b6d4, #0891b2); margin: 0 auto;">
                            <table width="36" height="36"><tr><td align="center" valign="middle" style="color: white; font-size: 18px;">&#10003;</td></tr></table>
                        </div>
                    </td>
                    <td width="25%" align="center" style="padding-bottom: 8px;">
                        <div style="width: 36px; height: 36px; border-radius: 50%; border: 3px solid #06b6d4; background: #0f0f1a; margin: 0 auto;">
                            <table width="36" height="36"><tr><td align="center" valign="middle" style="color: #22d3ee; font-weight: 700; font-size: 14px;">3</td></tr></table>
                        </div>
                    </td>
                    <td width="25%" align="center" style="padding-bottom: 8px;">
                        <div style="width: 36px; height: 36px; border-radius: 50%; background: #2a2a3e; margin: 0 auto;">
                            <table width="36" height="36"><tr><td align="center" valign="middle" style="color: #71717a; font-weight: 600; font-size: 14px;">4</td></tr></table>
                        </div>
                    </td>
                </tr>
                <tr>
                    <td align="center" style="font-size: 11px; color: #22d3ee; font-weight: 500;">Confirmado</td>
                    <td align="center" style="font-size: 11px; color: #22d3ee; font-weight: 500;">Pagado</td>
                    <td align="center" style="font-size: 11px; color: #22d3ee; font-weight: 500;">Preparando</td>
                    <td align="center" style="font-size: 11px; color: #71717a;">Enviado</td>
                </tr>
            </table>
            <p style="margin: 20px 0 0 0; font-size: 13px; color: #71717a; text-align: center;">
                Te notificaremos cuando tu pedido sea enviado.
            </p>
        </div>

        <!-- CTA Button -->
        <div style="text-align: center; margin: 32px 0;">
            <a href="${siteUrl}/cuenta/pedidos"
               style="display: inline-block; background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 600; font-size: 16px;">
                Ver mis pedidos
            </a>
        </div>

        <p style="font-size: 14px; color: #71717a; margin: 24px 0 0 0; text-align: center;">
            &iquest;Tienes alguna pregunta? Responde a este correo y te ayudaremos.
        </p>
    </div>

    <!-- Footer -->
    <div style="background-color: #0a0a0f; padding: 32px; text-align: center; border-top: 1px solid #2a2a3e;">
        <p style="color: #71717a; margin: 0; font-size: 13px;">
            &copy; ${year} FashionMarket. Todos los derechos reservados.
        </p>
    </div>
</div>
</body>
</html>`;
}

// ============================================
// Order Delivered Email — dark premium theme matching corporate identity
// ============================================

interface OrderDeliveredEmailData {
    customerName: string;
    orderRef: string;
    orderItems: Array<{
        product_image?: string | null;
        product_name: string;
        size?: string | null;
        quantity: number;
        price_at_purchase: number;
    }>;
    totalPrice: number;
    deliveredDate?: string;
    siteUrl?: string;
}

export function buildOrderDeliveredHTML(data: OrderDeliveredEmailData): string {
    const year = new Date().getFullYear();
    const siteUrl = data.siteUrl || 'https://j4o0084kg0ssoo0wc0ocw0g8.victoriafp.online';

    const deliveredDate = data.deliveredDate
        ? new Date(data.deliveredDate).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
        : new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const itemsHTML = data.orderItems.map((item) => `
        <tr>
            <td style="padding: 16px; border-bottom: 1px solid #2a2a3e;">
                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                        <td width="72" valign="top">
                            ${item.product_image
                                ? `<img src="${item.product_image}" alt="${item.product_name}" style="width: 68px; height: 68px; object-fit: cover; border-radius: 10px; background: #2a2a3e; display: block;">`
                                : `<div style="width: 68px; height: 68px; background: #2a2a3e; border-radius: 10px;"></div>`
                            }
                        </td>
                        <td style="padding-left: 14px;" valign="middle">
                            <p style="margin: 0; font-weight: 600; color: #f1f5f9; font-size: 15px;">${item.product_name}</p>
                            ${item.size ? `<p style="margin: 4px 0 0; font-size: 12px; color: #71717a;">Talla: ${item.size}</p>` : ''}
                            <p style="margin: 4px 0 0; font-size: 12px; color: #a1a1aa;">Cantidad: ${item.quantity}</p>
                        </td>
                        <td style="text-align: right; vertical-align: middle;">
                            <p style="margin: 0; color: #10b981; font-weight: 600; font-size: 15px;">${(item.price_at_purchase * item.quantity).toFixed(2)} &euro;</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    `).join('');

    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Pedido Entregado - ${data.orderRef}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #e2e8f0; margin: 0; padding: 40px 20px; background-color: #0a0a0f;">
<div style="max-width: 600px; margin: 0 auto; background-color: #0f0f1a; border-radius: 16px; overflow: hidden;">

    <!-- Header -->
    <div style="background: linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%); padding: 48px 32px; text-align: center;">
        <div style="width: 80px; height: 80px; margin: 0 auto 20px; background: rgba(255,255,255,0.2); border-radius: 50%;">
            <table width="100%" height="80"><tr><td align="center" valign="middle" style="color: white; font-size: 40px; font-weight: 300;">&#10003;</td></tr></table>
        </div>
        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Pedido Entregado</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 12px 0 0 0; font-size: 16px;">Tu pedido ha llegado a su destino</p>
        <div style="margin-top: 24px; background: rgba(255,255,255,0.15); display: inline-block; padding: 12px 24px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.2);">
            <p style="color: rgba(255,255,255,0.8); font-size: 12px; font-weight: 500; margin: 0; text-transform: uppercase; letter-spacing: 1px;">Pedido</p>
            <p style="color: #ffffff; font-size: 20px; font-weight: 700; margin: 4px 0 0;">#${data.orderRef}</p>
        </div>
    </div>

    <!-- Content -->
    <div style="padding: 40px 32px;">

        <p style="font-size: 16px; margin: 0 0 24px 0; color: #e2e8f0;">
            Hola <strong style="color: #34d399;">${data.customerName}</strong>,
        </p>

        <p style="font-size: 16px; margin: 0 0 32px 0; color: #a1a1aa;">
            &iexcl;Tu pedido <strong style="color: #10b981;">#${data.orderRef}</strong> ha sido entregado con &eacute;xito! Esperamos que disfrutes de tus productos.
        </p>

        <!-- Delivery Confirmation Card -->
        <div style="background: #0a0a0f; border: 1px solid #2a2a3e; border-radius: 16px; padding: 24px; margin-bottom: 24px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                    <td width="56" valign="top">
                        <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 12px;">
                            <table width="48" height="48"><tr><td align="center" valign="middle" style="color: white; font-size: 22px;">&#128230;</td></tr></table>
                        </div>
                    </td>
                    <td style="padding-left: 16px;" valign="middle">
                        <div style="font-size: 12px; color: #71717a; text-transform: uppercase; letter-spacing: 1px;">Fecha de entrega</div>
                        <div style="font-size: 16px; color: #10b981; font-weight: 700; margin-top: 4px;">${deliveredDate}</div>
                    </td>
                </tr>
            </table>
        </div>

        <!-- Products Card -->
        <div style="background: #0a0a0f; border: 1px solid #2a2a3e; border-radius: 16px; padding: 24px; margin-bottom: 24px;">
            <h2 style="font-size: 14px; color: #a1a1aa; margin: 0 0 16px 0; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Productos entregados</h2>
            <table style="width: 100%; border-collapse: collapse;">
                <tbody>${itemsHTML}</tbody>
            </table>
            <table width="100%" style="margin-top: 16px; border-top: 1px solid #2a2a3e; padding-top: 16px;">
                <tr>
                    <td>
                        <p style="color: #71717a; font-size: 14px; margin: 0; text-transform: uppercase;">Total del pedido</p>
                    </td>
                    <td style="text-align: right;">
                        <p style="color: #f1f5f9; font-size: 22px; font-weight: 700; margin: 0;">${data.totalPrice.toFixed(2)} &euro;</p>
                    </td>
                </tr>
            </table>
        </div>

        <!-- Order Status Progress - All Complete -->
        <div style="background: #0a0a0f; border: 1px solid #2a2a3e; border-radius: 16px; padding: 28px; margin-bottom: 24px;">
            <h3 style="font-size: 14px; color: #a1a1aa; margin: 0 0 24px 0; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Estado del pedido</h3>
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                    <td width="25%" align="center" style="padding-bottom: 8px;">
                        <div style="width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #10b981, #059669); margin: 0 auto;">
                            <table width="36" height="36"><tr><td align="center" valign="middle" style="color: white; font-size: 18px;">&#10003;</td></tr></table>
                        </div>
                    </td>
                    <td width="25%" align="center" style="padding-bottom: 8px;">
                        <div style="width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #10b981, #059669); margin: 0 auto;">
                            <table width="36" height="36"><tr><td align="center" valign="middle" style="color: white; font-size: 18px;">&#10003;</td></tr></table>
                        </div>
                    </td>
                    <td width="25%" align="center" style="padding-bottom: 8px;">
                        <div style="width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #10b981, #059669); margin: 0 auto;">
                            <table width="36" height="36"><tr><td align="center" valign="middle" style="color: white; font-size: 18px;">&#10003;</td></tr></table>
                        </div>
                    </td>
                    <td width="25%" align="center" style="padding-bottom: 8px;">
                        <div style="width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #10b981, #059669); margin: 0 auto;">
                            <table width="36" height="36"><tr><td align="center" valign="middle" style="color: white; font-size: 18px;">&#10003;</td></tr></table>
                        </div>
                    </td>
                </tr>
                <tr>
                    <td align="center" style="font-size: 11px; color: #34d399; font-weight: 500;">Confirmado</td>
                    <td align="center" style="font-size: 11px; color: #34d399; font-weight: 500;">Preparado</td>
                    <td align="center" style="font-size: 11px; color: #34d399; font-weight: 500;">Enviado</td>
                    <td align="center" style="font-size: 11px; color: #34d399; font-weight: 600;">Entregado</td>
                </tr>
            </table>
        </div>

        <!-- Satisfaction Notice -->
        <div style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.1)); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 16px; padding: 24px; margin-bottom: 24px; text-align: center;">
            <p style="font-size: 15px; margin: 0 0 8px 0; color: #e2e8f0; font-weight: 600;">&iquest;C&oacute;mo fue tu experiencia?</p>
            <p style="font-size: 13px; margin: 0; color: #a1a1aa;">
                Tu opini&oacute;n nos ayuda a mejorar. Si tienes alg&uacute;n problema con tu pedido, no dudes en contactarnos.
            </p>
        </div>

        <!-- Return Info -->
        <div style="background: #0a0a0f; border: 1px solid #2a2a3e; border-radius: 16px; padding: 24px; margin-bottom: 24px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                    <td width="56" valign="top">
                        <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #8b5cf6, #7c3aed); border-radius: 12px;">
                            <table width="48" height="48"><tr><td align="center" valign="middle" style="color: white; font-size: 22px;">&#128260;</td></tr></table>
                        </div>
                    </td>
                    <td style="padding-left: 16px;" valign="middle">
                        <div style="font-size: 14px; color: #e2e8f0; font-weight: 600;">Pol&iacute;tica de devoluciones</div>
                        <div style="font-size: 13px; color: #a1a1aa; margin-top: 4px;">Tienes <strong style="color: #8b5cf6;">30 d&iacute;as</strong> desde la entrega para solicitar una devoluci&oacute;n desde tu cuenta.</div>
                    </td>
                </tr>
            </table>
        </div>

        <!-- CTA Button -->
        <div style="text-align: center; margin: 32px 0;">
            <a href="${siteUrl}/cuenta/pedidos"
               style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);">
                Ver mis pedidos
            </a>
        </div>

        <p style="font-size: 14px; color: #71717a; margin: 24px 0 0 0; text-align: center;">
            &iquest;Tienes alguna pregunta? Responde a este correo y te ayudaremos.
        </p>
    </div>

    <!-- Footer -->
    <div style="background-color: #0a0a0f; padding: 32px; text-align: center; border-top: 1px solid #2a2a3e;">
        <p style="color: #71717a; margin: 0; font-size: 13px;">
            &copy; ${year} FashionMarket. Todos los derechos reservados.
        </p>
    </div>
</div>
</body>
</html>`;
}

/**
 * Build clean, white-background invoice email HTML.
 */
export function buildInvoiceHTML(data: InvoiceEmailData): string {
    const year = new Date().getFullYear();
    // subtotal is now stored as base imponible (without IVA)
    const baseImponible = data.subtotal;

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);

    const itemsHTML = data.items.map((item) => `
        <tr>
            <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #374151;">
                <div style="font-weight: 600;">${item.product_name}</div>
                ${item.size ? `<div style="font-size: 12px; color: #6b7280;">Talla: ${item.size}</div>` : ''}
            </td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; text-align: center; color: #374151;">${item.quantity}</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #374151;">${formatCurrency(item.price)}</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600; color: #111827;">${formatCurrency(item.total)}</td>
        </tr>
    `).join('');

    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Factura ${data.invoiceNumber}</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f3f4f6;padding:40px 20px;">
<tr><td align="center">
<table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

  <!-- Header -->
  <tr>
    <td style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 32px; text-align: center;">
      <h1 style="font-size: 22px; font-weight: 700; color: #06b6d4; margin: 0 0 8px 0;">FASHIONMARKET</h1>
      <p style="color: #94a3b8; font-size: 16px; margin: 0; font-weight: 600;">Factura ${data.invoiceNumber}</p>
    </td>
  </tr>

  <!-- Body -->
  <tr>
    <td style="padding: 32px;">

      <!-- From / To -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
        <tr>
          <td valign="top" width="50%">
            <p style="margin: 0 0 4px 0; font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; letter-spacing: 1px;">De:</p>
            <p style="margin: 0; color: #111827; font-weight: 600;">FashionMarket S.L.</p>
            <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 13px;">CIF: B12345678</p>
            <p style="margin: 2px 0 0 0; color: #6b7280; font-size: 13px;">Calle Comercio 123, 28001 Madrid</p>
          </td>
          <td valign="top" width="50%" style="text-align: right;">
            <p style="margin: 0 0 4px 0; font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; letter-spacing: 1px;">Para:</p>
            <p style="margin: 0; color: #111827; font-weight: 600;">${data.customerName}</p>
            <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 13px;">${data.customerEmail}</p>
          </td>
        </tr>
      </table>

      <!-- Date / Number -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
        <tr>
          <td style="padding: 14px 20px;"><span style="font-size: 12px; color: #6b7280;">Fecha:</span> <strong style="color: #111827;">${data.invoiceDate}</strong></td>
          <td style="padding: 14px 20px; text-align: right;"><span style="font-size: 12px; color: #6b7280;">Factura:</span> <strong style="color: #111827;">${data.invoiceNumber}</strong></td>
        </tr>
      </table>

      <!-- Items table -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
        <thead>
          <tr style="background: #f9fafb;">
            <th style="padding: 10px 16px; text-align: left; font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px;">Producto</th>
            <th style="padding: 10px 16px; text-align: center; font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px;">Cant.</th>
            <th style="padding: 10px 16px; text-align: right; font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px;">Precio</th>
            <th style="padding: 10px 16px; text-align: right; font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px;">Total</th>
          </tr>
        </thead>
        <tbody>${itemsHTML}</tbody>
      </table>

      <!-- Totals -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td width="55%"></td><td>
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
            <tr><td style="padding: 10px 16px; color: #6b7280; font-size: 14px;">Base imponible</td><td style="padding: 10px 16px; text-align: right; color: #374151;">${formatCurrency(baseImponible)}</td></tr>
            <tr><td style="padding: 10px 16px; color: #6b7280; font-size: 14px;">IVA (21%)</td><td style="padding: 10px 16px; text-align: right; color: #374151;">${formatCurrency(data.ivaAmount)}</td></tr>
            <tr><td style="padding: 10px 16px; color: #6b7280; font-size: 14px;">Env&iacute;o</td><td style="padding: 10px 16px; text-align: right; color: #15803d; font-weight: 600;">Gratis</td></tr>
            <tr><td colspan="2" style="padding: 12px 16px 10px; border-top: 1px solid #e5e7eb;">
              <table width="100%"><tr>
                <td style="font-size: 16px; font-weight: 700; color: #111827;">Total</td>
                <td style="font-size: 18px; font-weight: 700; color: #0e7490; text-align: right;">${formatCurrency(data.total)}</td>
              </tr></table>
            </td></tr>
          </table>
        </td></tr>
      </table>

    </td>
  </tr>

  <!-- Footer -->
  <tr>
    <td style="background:#f9fafb;padding:20px 32px;text-align:center;border-top:1px solid #e5e7eb;">
      <p style="margin:0;color:#9ca3af;font-size:12px;">Esta factura ha sido generada electr&oacute;nicamente y es v&aacute;lida sin firma.</p>
      <p style="margin:6px 0 0;color:#9ca3af;font-size:12px;">&copy; ${year} FashionMarket. Todos los derechos reservados.</p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

// ============================================
// Shipping Update Email — dark theme matching corporate identity
// Uses text characters instead of SVGs to avoid spam filters
// ============================================

interface ShippingUpdateEmailData {
    customerName: string;
    orderRef: string;
    carrierName: string;
    trackingNumber: string;
    trackingUrl?: string | null;
}

export function buildShippingUpdateHTML(data: ShippingUpdateEmailData): string {
    const year = new Date().getFullYear();

    const trackingButton = data.trackingUrl ? `
            <a href="${data.trackingUrl}"
               style="display: block; text-align: center; padding: 16px 32px; background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); color: white; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; margin-bottom: 24px; box-shadow: 0 4px 14px rgba(6, 182, 212, 0.4);">
                Rastrear mi pedido
            </a>
    ` : '';

    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Tu pedido est&aacute; en camino - ${data.orderRef}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #e2e8f0; margin: 0; padding: 40px 20px; background-color: #0a0a0f;">
<div style="max-width: 600px; margin: 0 auto; background-color: #0f0f1a; border-radius: 16px; overflow: hidden;">

    <!-- Header -->
    <div style="background: linear-gradient(135deg, #0891b2 0%, #06b6d4 50%, #22d3ee 100%); padding: 48px 32px; text-align: center;">
        <div style="width: 80px; height: 80px; margin: 0 auto 20px; background: rgba(255,255,255,0.2); border-radius: 50%;">
            <table width="100%" height="80"><tr><td align="center" valign="middle" style="color: white; font-size: 36px;">&#128666;</td></tr></table>
        </div>
        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Tu pedido est&aacute; en camino</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 12px 0 0 0; font-size: 16px;">Pedido #${data.orderRef}</p>
    </div>

    <!-- Content -->
    <div style="padding: 40px 32px;">
        <p style="font-size: 16px; margin: 0 0 24px 0; color: #e2e8f0;">
            Hola <strong style="color: #22d3ee;">${data.customerName}</strong>,
        </p>

        <p style="font-size: 16px; margin: 0 0 32px 0; color: #a1a1aa;">
            Buenas noticias. Tu pedido ha sido enviado y est&aacute; en camino hacia ti.
        </p>

        <!-- Tracking Card -->
        <div style="background: #0a0a0f; border: 1px solid #2a2a3e; border-radius: 16px; padding: 28px; margin-bottom: 24px;">
            <h2 style="font-size: 14px; color: #a1a1aa; margin: 0 0 20px 0; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Informaci&oacute;n de seguimiento</h2>

            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 16px; border-bottom: 1px solid #2a2a3e; padding-bottom: 16px;">
                <tr>
                    <td width="48" valign="top">
                        <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #06b6d4, #0891b2); border-radius: 10px;">
                            <table width="40" height="40"><tr><td align="center" valign="middle" style="color: white; font-size: 18px;">&#128666;</td></tr></table>
                        </div>
                    </td>
                    <td style="padding-left: 16px;">
                        <div style="font-size: 12px; color: #71717a; margin-bottom: 4px;">Transportista</div>
                        <div style="font-size: 16px; color: #f1f5f9; font-weight: 600;">${data.carrierName}</div>
                    </td>
                </tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                    <td width="48" valign="top">
                        <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #8b5cf6, #7c3aed); border-radius: 10px;">
                            <table width="40" height="40"><tr><td align="center" valign="middle" style="color: white; font-size: 18px;">&#128231;</td></tr></table>
                        </div>
                    </td>
                    <td style="padding-left: 16px;">
                        <div style="font-size: 12px; color: #71717a; margin-bottom: 4px;">C&oacute;digo de seguimiento</div>
                        <div style="font-size: 16px; color: #22d3ee; font-weight: 600; font-family: 'SF Mono', Monaco, monospace;">${data.trackingNumber}</div>
                    </td>
                </tr>
            </table>
        </div>

        <!-- CTA Button -->
        ${trackingButton}

        <!-- Order Status Progress -->
        <div style="background: #0a0a0f; border: 1px solid #2a2a3e; border-radius: 16px; padding: 28px; margin-bottom: 24px;">
            <h3 style="font-size: 14px; color: #a1a1aa; margin: 0 0 24px 0; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Estado del pedido</h3>
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                    <td width="25%" align="center" style="padding-bottom: 8px;">
                        <div style="width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #06b6d4, #0891b2); margin: 0 auto;">
                            <table width="36" height="36"><tr><td align="center" valign="middle" style="color: white; font-size: 18px;">&#10003;</td></tr></table>
                        </div>
                    </td>
                    <td width="25%" align="center" style="padding-bottom: 8px;">
                        <div style="width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #06b6d4, #0891b2); margin: 0 auto;">
                            <table width="36" height="36"><tr><td align="center" valign="middle" style="color: white; font-size: 18px;">&#10003;</td></tr></table>
                        </div>
                    </td>
                    <td width="25%" align="center" style="padding-bottom: 8px;">
                        <div style="width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #06b6d4, #0891b2); margin: 0 auto;">
                            <table width="36" height="36"><tr><td align="center" valign="middle" style="color: white; font-size: 18px;">&#10003;</td></tr></table>
                        </div>
                    </td>
                    <td width="25%" align="center" style="padding-bottom: 8px;">
                        <div style="width: 36px; height: 36px; border-radius: 50%; background: #2a2a3e; margin: 0 auto;">
                            <table width="36" height="36"><tr><td align="center" valign="middle" style="color: #71717a; font-weight: 600; font-size: 14px;">4</td></tr></table>
                        </div>
                    </td>
                </tr>
                <tr>
                    <td align="center" style="font-size: 11px; color: #22d3ee; font-weight: 500;">Confirmado</td>
                    <td align="center" style="font-size: 11px; color: #22d3ee; font-weight: 500;">Preparado</td>
                    <td align="center" style="font-size: 11px; color: #22d3ee; font-weight: 500;">Enviado</td>
                    <td align="center" style="font-size: 11px; color: #71717a;">Entregado</td>
                </tr>
            </table>
        </div>

        <!-- Delivery Estimate -->
        <div style="background: #0a0a0f; border: 1px solid #2a2a3e; border-radius: 16px; padding: 24px; margin-bottom: 24px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                    <td width="56" valign="top">
                        <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 12px;">
                            <table width="48" height="48"><tr><td align="center" valign="middle" style="color: white; font-size: 22px;">&#9201;</td></tr></table>
                        </div>
                    </td>
                    <td style="padding-left: 16px;" valign="middle">
                        <div style="font-size: 12px; color: #71717a; margin-bottom: 4px;">Entrega estimada</div>
                        <div style="font-size: 18px; color: #10b981; font-weight: 700;">2-5 d&iacute;as laborables</div>
                    </td>
                </tr>
            </table>
        </div>

        <p style="font-size: 14px; color: #71717a; margin: 24px 0 0 0; text-align: center;">
            &iquest;Tienes alguna pregunta? Responde a este correo y te ayudaremos.
        </p>
    </div>

    <!-- Footer -->
    <div style="background-color: #0a0a0f; padding: 32px; text-align: center; border-top: 1px solid #2a2a3e;">
        <p style="color: #71717a; margin: 0; font-size: 13px;">
            &copy; ${year} FashionMarket. Todos los derechos reservados.
        </p>
    </div>
</div>
</body>
</html>`;
}

// ============================================
// Order Cancellation Email Template
// ============================================

interface CancellationEmailData {
    customerName: string;
    orderRef: string;
    orderItems: Array<{
        product_name: string;
        size?: string | null;
        quantity: number;
        price: number;
    }>;
    totalRefund: number;
    originalInvoiceNumber: string;
    creditNoteNumber: string;
}

/**
 * Order cancellation email — dark premium theme matching corporate identity.
 * Informs customer that their order has been cancelled and refund is being processed.
 */
export function buildCancellationHTML(data: CancellationEmailData): string {
    const year = new Date().getFullYear();

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(Math.abs(amount));

    const itemsHTML = data.orderItems.map((item) => `
        <tr>
            <td style="padding: 12px; border-bottom: 1px solid #2a2a3e;">
                <p style="margin: 0; font-weight: 600; color: #f1f5f9;">${item.product_name}</p>
                ${item.size ? `<p style="margin: 4px 0 0; font-size: 12px; color: #71717a;">Talla: ${item.size}</p>` : ''}
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #2a2a3e; text-align: center; color: #a1a1aa; vertical-align: middle;">${Math.abs(item.quantity)}</td>
            <td style="padding: 12px; border-bottom: 1px solid #2a2a3e; text-align: right; color: #22d3ee; font-weight: 600; vertical-align: middle;">${formatCurrency(item.price * Math.abs(item.quantity))}</td>
        </tr>
    `).join('');

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
<div style="max-width: 600px; margin: 0 auto; background-color: #111113; border: 1px solid #2a2a3e;">

    <!-- Header -->
    <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%); padding: 40px 32px; text-align: center;">
        <div style="width: 64px; height: 64px; margin: 0 auto 16px; background: rgba(255,255,255,0.15); border-radius: 50%;">
            <table width="64" height="64"><tr><td align="center" valign="middle" style="color: white; font-size: 32px; font-weight: bold;">&#10005;</td></tr></table>
        </div>
        <h1 style="margin: 0; font-size: 26px; font-weight: 700; color: white; letter-spacing: -0.5px;">Pedido Cancelado</h1>
        <p style="margin: 10px 0 0; font-size: 15px; color: rgba(255,255,255,0.8);">Pedido ${data.orderRef}</p>
    </div>

    <!-- Content -->
    <div style="padding: 32px;">
        <p style="color: #e2e8f0; font-size: 16px; margin: 0 0 24px;">
            Hola <strong>${data.customerName}</strong>,
        </p>
        <p style="color: #a1a1aa; font-size: 15px; margin: 0 0 32px; line-height: 1.6;">
            Tu pedido ha sido <strong style="color: #ef4444;">cancelado</strong>. 
            Hemos procesado el reembolso que se reflejar&aacute; en tu m&eacute;todo de pago original en un plazo de <strong style="color: #e2e8f0;">5 a 10 d&iacute;as h&aacute;biles</strong>.
        </p>

        <!-- Refund Amount Card -->
        <div style="background: linear-gradient(135deg, #7f1d1d, #991b1b); border: 1px solid #ef4444; border-radius: 16px; padding: 24px; margin-bottom: 24px; text-align: center;">
            <p style="margin: 0 0 8px; font-size: 12px; color: #fca5a5; text-transform: uppercase; letter-spacing: 1px;">Importe reembolsado</p>
            <p style="margin: 0; font-size: 32px; font-weight: 700; color: #ffffff;">${formatCurrency(data.totalRefund)}</p>
        </div>

        <!-- Products Table -->
        <div style="background: #0a0a0f; border: 1px solid #2a2a3e; border-radius: 16px; overflow: hidden; margin-bottom: 24px;">
            <div style="padding: 16px 16px 8px; border-bottom: 1px solid #2a2a3e;">
                <p style="margin: 0; font-size: 14px; font-weight: 600; color: #e2e8f0;">Art&iacute;culos cancelados</p>
            </div>
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <thead>
                    <tr style="background: #0f0f14;">
                        <th style="padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #71717a; font-weight: 600; border-bottom: 1px solid #2a2a3e;">Producto</th>
                        <th style="padding: 10px 12px; text-align: center; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #71717a; font-weight: 600; border-bottom: 1px solid #2a2a3e;">Cant.</th>
                        <th style="padding: 10px 12px; text-align: right; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #71717a; font-weight: 600; border-bottom: 1px solid #2a2a3e;">Importe</th>
                    </tr>
                </thead>
                <tbody>${itemsHTML}</tbody>
            </table>
        </div>

        <!-- Documents Info -->
        <div style="background: #0a0a0f; border: 1px solid #2a2a3e; border-radius: 16px; padding: 20px; margin-bottom: 24px;">
            <p style="margin: 0 0 12px; font-size: 14px; font-weight: 600; color: #e2e8f0;">&#128196; Documentos adjuntos</p>
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                    <td style="padding: 8px 0;">
                        <span style="color: #22d3ee; font-size: 14px;">&#9679;</span>
                        <span style="color: #a1a1aa; font-size: 14px; margin-left: 8px;">Factura original: <strong style="color: #e2e8f0;">${data.originalInvoiceNumber}</strong></span>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 8px 0;">
                        <span style="color: #ef4444; font-size: 14px;">&#9679;</span>
                        <span style="color: #a1a1aa; font-size: 14px; margin-left: 8px;">Factura rectificativa: <strong style="color: #e2e8f0;">${data.creditNoteNumber}</strong></span>
                    </td>
                </tr>
            </table>
        </div>

        <p style="font-size: 14px; color: #71717a; margin: 24px 0 0 0; text-align: center;">
            &iquest;Tienes alguna pregunta? Responde a este correo y te ayudaremos.
        </p>
    </div>

    <!-- Footer -->
    <div style="background-color: #0a0a0f; padding: 32px; text-align: center; border-top: 1px solid #2a2a3e;">
        <p style="color: #71717a; margin: 0; font-size: 13px;">
            &copy; ${year} FashionMarket. Todos los derechos reservados.
        </p>
    </div>
</div>
</body>
</html>`;
}

// ============================================
// Return Accepted Email Template
// ============================================

interface ReturnAcceptedEmailData {
    customerName: string;
    orderRef: string;
    orderItems: Array<{
        product_name: string;
        size?: string | null;
        quantity: number;
        price: number;
    }>;
    totalRefund: number;
    originalInvoiceNumber: string;
    creditNoteNumber: string;
}

/**
 * Return accepted email — dark premium theme matching corporate identity.
 * Informs customer that their return has been accepted and refund is being processed.
 */
export function buildReturnAcceptedHTML(data: ReturnAcceptedEmailData): string {
    const year = new Date().getFullYear();

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(Math.abs(amount));

    const itemsHTML = data.orderItems.map((item) => `
        <tr>
            <td style="padding: 12px; border-bottom: 1px solid #2a2a3e;">
                <p style="margin: 0; font-weight: 600; color: #f1f5f9;">${item.product_name}</p>
                ${item.size ? `<p style="margin: 4px 0 0; font-size: 12px; color: #71717a;">Talla: ${item.size}</p>` : ''}
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #2a2a3e; text-align: center; color: #a1a1aa; vertical-align: middle;">${Math.abs(item.quantity)}</td>
            <td style="padding: 12px; border-bottom: 1px solid #2a2a3e; text-align: right; color: #22d3ee; font-weight: 600; vertical-align: middle;">${formatCurrency(item.price * Math.abs(item.quantity))}</td>
        </tr>
    `).join('');

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
<div style="max-width: 600px; margin: 0 auto; background-color: #111113; border: 1px solid #2a2a3e;">

    <!-- Header -->
    <div style="background: linear-gradient(135deg, #059669 0%, #047857 50%, #065f46 100%); padding: 40px 32px; text-align: center;">
        <div style="width: 64px; height: 64px; margin: 0 auto 16px; background: rgba(255,255,255,0.15); border-radius: 50%;">
            <table width="64" height="64"><tr><td align="center" valign="middle" style="color: white; font-size: 32px; font-weight: bold;">&#10003;</td></tr></table>
        </div>
        <h1 style="margin: 0; font-size: 26px; font-weight: 700; color: white; letter-spacing: -0.5px;">Devoluci&oacute;n Aceptada</h1>
        <p style="margin: 10px 0 0; font-size: 15px; color: rgba(255,255,255,0.8);">Pedido ${data.orderRef}</p>
    </div>

    <!-- Content -->
    <div style="padding: 32px;">
        <p style="color: #e2e8f0; font-size: 16px; margin: 0 0 24px;">
            Hola <strong>${data.customerName}</strong>,
        </p>
        <p style="color: #a1a1aa; font-size: 15px; margin: 0 0 32px; line-height: 1.6;">
            Tu solicitud de devoluci&oacute;n ha sido <strong style="color: #10b981;">aceptada</strong>. 
            Hemos procesado el reembolso que se reflejar&aacute; en tu m&eacute;todo de pago original en un plazo de <strong style="color: #e2e8f0;">5 a 10 d&iacute;as h&aacute;biles</strong>.
        </p>

        <!-- Refund Amount Card -->
        <div style="background: linear-gradient(135deg, #064e3b, #065f46); border: 1px solid #10b981; border-radius: 16px; padding: 24px; margin-bottom: 24px; text-align: center;">
            <p style="margin: 0 0 8px; font-size: 12px; color: #6ee7b7; text-transform: uppercase; letter-spacing: 1px;">Importe reembolsado</p>
            <p style="margin: 0; font-size: 32px; font-weight: 700; color: #ffffff;">${formatCurrency(data.totalRefund)}</p>
        </div>

        <!-- Products Table -->
        <div style="background: #0a0a0f; border: 1px solid #2a2a3e; border-radius: 16px; overflow: hidden; margin-bottom: 24px;">
            <div style="padding: 16px 16px 8px; border-bottom: 1px solid #2a2a3e;">
                <p style="margin: 0; font-size: 14px; font-weight: 600; color: #e2e8f0;">Art&iacute;culos devueltos</p>
            </div>
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <thead>
                    <tr style="background: #0f0f14;">
                        <th style="padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #71717a; font-weight: 600; border-bottom: 1px solid #2a2a3e;">Producto</th>
                        <th style="padding: 10px 12px; text-align: center; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #71717a; font-weight: 600; border-bottom: 1px solid #2a2a3e;">Cant.</th>
                        <th style="padding: 10px 12px; text-align: right; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #71717a; font-weight: 600; border-bottom: 1px solid #2a2a3e;">Importe</th>
                    </tr>
                </thead>
                <tbody>${itemsHTML}</tbody>
            </table>
        </div>

        <!-- Documents Info -->
        <div style="background: #0a0a0f; border: 1px solid #2a2a3e; border-radius: 16px; padding: 20px; margin-bottom: 24px;">
            <p style="margin: 0 0 12px; font-size: 14px; font-weight: 600; color: #e2e8f0;">&#128196; Documentos adjuntos</p>
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                    <td style="padding: 8px 0;">
                        <span style="color: #22d3ee; font-size: 14px;">&#9679;</span>
                        <span style="color: #a1a1aa; font-size: 14px; margin-left: 8px;">Factura original: <strong style="color: #e2e8f0;">${data.originalInvoiceNumber}</strong></span>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 8px 0;">
                        <span style="color: #10b981; font-size: 14px;">&#9679;</span>
                        <span style="color: #a1a1aa; font-size: 14px; margin-left: 8px;">Factura rectificativa: <strong style="color: #e2e8f0;">${data.creditNoteNumber}</strong></span>
                    </td>
                </tr>
            </table>
        </div>

        <p style="font-size: 14px; color: #71717a; margin: 24px 0 0 0; text-align: center;">
            &iquest;Tienes alguna pregunta? Responde a este correo y te ayudaremos.
        </p>
    </div>

    <!-- Footer -->
    <div style="background-color: #0a0a0f; padding: 32px; text-align: center; border-top: 1px solid #2a2a3e;">
        <p style="color: #71717a; margin: 0; font-size: 13px;">
            &copy; ${year} FashionMarket. Todos los derechos reservados.
        </p>
    </div>
</div>
</body>
</html>`;
}
