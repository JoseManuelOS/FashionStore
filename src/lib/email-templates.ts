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
 * Build clean, white-background order confirmation email HTML.
 * Designed to pass Gmail/Outlook spam filters:
 * - No SVG tags
 * - No dark backgrounds
 * - No display:flex
 * - Table-based layout
 * - HTML entities for special chars
 */
export function buildOrderConfirmationHTML(data: OrderEmailData): string {
    const year = new Date().getFullYear();
    const siteUrl = data.siteUrl || 'https://j4o0084kg0ssoo0wc0ocw0g8.victoriafp.online';

    const itemsHTML = data.orderItems.map((item) => `
        <tr>
            <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb;">
                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                        <td width="64" valign="top">
                            ${item.product_image
                                ? `<img src="${item.product_image}" alt="${item.product_name}" style="width: 56px; height: 56px; object-fit: cover; border-radius: 8px; border: 1px solid #e5e7eb;">`
                                : `<div style="width: 56px; height: 56px; background: #f3f4f6; border-radius: 8px;"></div>`
                            }
                        </td>
                        <td style="padding-left: 12px;" valign="middle">
                            <div style="font-weight: 600; color: #111827; font-size: 14px;">${item.product_name}</div>
                            <div style="color: #6b7280; font-size: 13px; margin-top: 2px;">${item.size ? `Talla: ${item.size} &nbsp;|&nbsp; ` : ''}Cant: ${item.quantity}</div>
                        </td>
                        <td width="90" align="right" valign="middle">
                            <div style="font-weight: 700; color: #111827; font-size: 14px;">${(item.price_at_purchase * item.quantity).toFixed(2)} &euro;</div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    `).join('');

    const addressSection = data.shippingAddress ? `
        <tr>
            <td style="padding: 0 0 24px 0;">
                <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background: #f9fafb; border-radius: 10px; border: 1px solid #e5e7eb;">
                    <tr>
                        <td style="padding: 16px 20px;">
                            <div style="font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Direcci&oacute;n de env&iacute;o</div>
                            <div style="color: #374151; font-size: 14px; line-height: 1.7; white-space: pre-line;">${data.shippingAddress}</div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    ` : '';

    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Confirmaci&oacute;n de Pedido ${data.orderRef}</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f3f4f6;padding:40px 20px;">
<tr><td align="center">
<table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

  <!-- Header -->
  <tr>
    <td style="background:#0e7490;padding:40px 32px;text-align:center;">
      <div style="width:60px;height:60px;background:rgba(255,255,255,0.2);border-radius:50%;margin:0 auto 16px;line-height:60px;font-size:28px;color:white;">&#10003;</div>
      <h1 style="color:#ffffff;margin:0;font-size:26px;font-weight:700;">Pedido Confirmado</h1>
      <p style="color:rgba(255,255,255,0.85);margin:10px 0 0;font-size:15px;">Gracias por tu compra, <strong>${data.customerName}</strong></p>
      <div style="margin-top:20px;display:inline-block;background:rgba(255,255,255,0.15);padding:10px 24px;border-radius:8px;border:1px solid rgba(255,255,255,0.25);">
        <span style="color:rgba(255,255,255,0.75);font-size:12px;text-transform:uppercase;letter-spacing:1px;">Referencia</span>
        <div style="color:#ffffff;font-size:20px;font-weight:700;margin-top:2px;">${data.orderRef}</div>
      </div>
    </td>
  </tr>

  <!-- Body -->
  <tr>
    <td style="padding:32px 32px 0;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%">

        <!-- Message -->
        <tr>
          <td style="padding-bottom:24px;">
            <p style="margin:0;color:#374151;font-size:15px;line-height:1.6;">
              Tu pedido ha sido procesado correctamente y est&aacute; siendo preparado para su env&iacute;o. Recibir&aacute;s otro email cuando sea enviado.
            </p>
          </td>
        </tr>

        <!-- Items table -->
        <tr>
          <td style="padding-bottom:24px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-radius:10px;border:1px solid #e5e7eb;overflow:hidden;">
              <tr style="background:#f9fafb;">
                <th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #e5e7eb;">Producto</th>
                <th style="padding:10px 16px;text-align:right;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #e5e7eb;">Total</th>
              </tr>
              ${itemsHTML}
              <tr style="background:#f9fafb;">
                <td style="padding:14px 16px;font-weight:700;color:#111827;font-size:15px;">TOTAL</td>
                <td style="padding:14px 16px;text-align:right;font-weight:700;color:#0e7490;font-size:18px;">${data.totalPrice.toFixed(2)} &euro;</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Shipping address -->
        ${addressSection}

        <!-- Delivery info -->
        <tr>
          <td style="padding-bottom:24px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f0fdf4;border-radius:10px;border:1px solid #bbf7d0;">
              <tr>
                <td style="padding:16px 20px;">
                  <div style="font-size:11px;font-weight:600;color:#166534;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Tiempo estimado de entrega</div>
                  <div style="font-size:16px;font-weight:700;color:#15803d;">3-7 d&iacute;as laborables</div>
                  <div style="font-size:13px;color:#166534;margin-top:2px;">Env&iacute;o gratuito a toda Espa&ntilde;a</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td style="padding-bottom:32px;text-align:center;">
            <a href="${siteUrl}/cuenta/pedidos"
               style="display:inline-block;background:#0e7490;color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:8px;font-weight:600;font-size:15px;">
              Ver mis pedidos
            </a>
          </td>
        </tr>

      </table>
    </td>
  </tr>

  <!-- Footer -->
  <tr>
    <td style="background:#f9fafb;padding:24px 32px;text-align:center;border-top:1px solid #e5e7eb;">
      <p style="margin:0;color:#9ca3af;font-size:13px;">&copy; ${year} FashionMarket. Todos los derechos reservados.</p>
      <p style="margin:8px 0 0;color:#9ca3af;font-size:12px;">Si tienes alguna pregunta responde a este correo.</p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

/**
 * Build clean, white-background invoice email HTML.
 */
export function buildInvoiceHTML(data: InvoiceEmailData): string {
    const year = new Date().getFullYear();
    const baseImponible = data.subtotal / 1.21;

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
