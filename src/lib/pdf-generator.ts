/**
 * Shared PDF Invoice/Credit Note Generator
 * 
 * Generates professional PDF documents from facturacion data.
 * Used by: webhook invoice emails, manual invoice sends, return credit notes.
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generate a professional PDF invoice/credit note from facturacion data.
 */
export function generateInvoicePDF(factura: any, orderNumber: number | string, isCreditNote: boolean = false): Buffer {
    const doc = new jsPDF();

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);

    const formatDate = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString('es-ES', {
            day: '2-digit', month: 'long', year: 'numeric'
        });

    const primaryColor: [number, number, number] = isCreditNote ? [5, 150, 105] : [6, 182, 212];
    const headerBg: [number, number, number] = [15, 23, 42];

    // Header background
    doc.setFillColor(...headerBg);
    doc.rect(0, 0, 210, 50, 'F');

    // Brand name
    doc.setTextColor(...primaryColor);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('FASHIONMARKET', 20, 25);

    doc.setTextColor(148, 163, 184);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Moda Premium · Estilo Único', 20, 33);

    // Invoice/Credit Note label
    const docLabel = isCreditNote ? 'FACTURA RECTIFICATIVA' : 'FACTURA';
    doc.setTextColor(...primaryColor);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(docLabel, 190, 20, { align: 'right' });

    doc.setFontSize(16);
    doc.text(factura.invoice_number, 190, 30, { align: 'right' });

    // Info section
    const infoY = 60;

    // Customer info
    doc.setTextColor(107, 114, 128);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('FACTURAR A', 20, infoY);

    doc.setTextColor(17, 24, 39);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(factura.customer_name || 'Cliente', 20, infoY + 8);

    doc.setTextColor(107, 114, 128);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(factura.customer_email || '', 20, infoY + 15);

    if (factura.shipping_address) {
        const addressLines = factura.shipping_address
            .split('\n')
            .filter((l: string) => l && l.trim() !== '' && !l.includes('null'));
        let addressY = infoY + 23;
        for (const line of addressLines) {
            doc.text(line, 20, addressY);
            addressY += 6;
        }
    }

    // Details
    doc.setTextColor(107, 114, 128);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('DETALLES', 190, infoY, { align: 'right' });

    doc.setTextColor(107, 114, 128);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Fecha de emisión', 150, infoY + 8);
    doc.setTextColor(17, 24, 39);
    doc.setFont('helvetica', 'bold');
    doc.text(formatDate(factura.created_at || new Date().toISOString()), 150, infoY + 14);

    doc.setTextColor(107, 114, 128);
    doc.setFont('helvetica', 'normal');
    doc.text('Pedido', 150, infoY + 22);
    doc.setTextColor(17, 24, 39);
    doc.setFont('helvetica', 'bold');
    doc.text(`#${orderNumber}`, 150, infoY + 28);

    if (isCreditNote) {
        doc.setTextColor(220, 38, 38);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('NOTA DE CRÉDITO / RECTIFICATIVA', 150, infoY + 38);
    }

    // Items table
    const items = (factura.items || []).map((item: any, index: number) => [
        index + 1,
        `${item.product_name}${item.size ? ` (Talla: ${item.size})` : ''}`,
        Math.abs(item.quantity),
        formatCurrency(Math.abs(item.price)),
        formatCurrency(Math.abs(item.total || item.price * Math.abs(item.quantity)))
    ]);

    const tableStartY = isCreditNote ? infoY + 48 : infoY + 38;

    autoTable(doc, {
        startY: tableStartY,
        head: [['#', 'Descripción', 'Cant.', 'Precio Unit.', 'Total']],
        body: items,
        theme: 'plain',
        headStyles: {
            fillColor: [241, 245, 249],
            textColor: [100, 116, 139],
            fontStyle: 'bold',
            fontSize: 9,
        },
        bodyStyles: {
            textColor: [55, 65, 81],
            fontSize: 10,
        },
        columnStyles: {
            0: { cellWidth: 15, halign: 'center' },
            1: { cellWidth: 80 },
            2: { cellWidth: 20, halign: 'center' },
            3: { cellWidth: 35, halign: 'right' },
            4: { cellWidth: 35, halign: 'right', fontStyle: 'bold' },
        },
        margin: { left: 20, right: 20 },
    });

    // Totals
    const finalY = (doc as any).lastAutoTable.finalY + 15;

    const totalsX = 130;
    const totalsValueX = 190;

    // Base imponible
    doc.setTextColor(107, 114, 128);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Base imponible', totalsX, finalY);
    doc.setTextColor(55, 65, 81);
    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(Math.abs(factura.subtotal || 0)), totalsValueX, finalY, { align: 'right' });

    // IVA
    doc.setTextColor(107, 114, 128);
    doc.setFont('helvetica', 'normal');
    doc.text('IVA (21%)', totalsX, finalY + 8);
    doc.setTextColor(55, 65, 81);
    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(Math.abs(factura.iva_amount || 0)), totalsValueX, finalY + 8, { align: 'right' });

    // Line
    doc.setDrawColor(229, 231, 235);
    doc.line(totalsX, finalY + 13, totalsValueX, finalY + 13);

    // Total
    doc.setFillColor(...headerBg);
    doc.roundedRect(totalsX - 5, finalY + 16, totalsValueX - totalsX + 10, 16, 3, 3, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL', totalsX, finalY + 27);
    doc.setTextColor(...primaryColor);
    doc.setFontSize(14);
    doc.text(
        (isCreditNote ? '-' : '') + formatCurrency(Math.abs(factura.total || 0)),
        totalsValueX, finalY + 27, { align: 'right' }
    );

    // Footer
    const footerY = 275;
    doc.setTextColor(107, 114, 128);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Gracias por tu compra en FashionMarket', 105, footerY, { align: 'center' });
    doc.setTextColor(156, 163, 175);
    doc.setFontSize(8);
    doc.text('Esta factura ha sido generada automáticamente y es válida sin firma.', 105, footerY + 6, { align: 'center' });

    // Return as Buffer
    const arrayBuffer = doc.output('arraybuffer');
    const buffer = Buffer.from(arrayBuffer);
    return buffer;
}

/**
 * Generate a PDF invoice and return it as a Base64-encoded string.
 * Use this for email attachments via Resend API.
 */
export function generateInvoicePDFBase64(factura: any, orderNumber: number | string, isCreditNote: boolean = false): string {
    const buffer = generateInvoicePDF(factura, orderNumber, isCreditNote);
    return buffer.toString('base64');
}
