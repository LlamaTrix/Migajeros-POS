const PDFDocument = require('pdfkit');
const fs = require('fs');

// Ancho de ticket 80mm = ~226pt. Usamos 58mm interior = ~164pt de contenido.
const PAGE_W = 226;
const MARGIN  = 14;
const INNER_W = PAGE_W - MARGIN * 2;  // 198pt

const generateInvoicePDF = (invoice, order, items, outputPath) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: [PAGE_W, 1200],
      margins: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
    });

    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    // ── helpers ──────────────────────────────────────────────
    const x = MARGIN;
    const right = PAGE_W - MARGIN;

    const cen = (text, size = 8) => {
      doc.font('Courier').fontSize(size).text(text, x, doc.y, { width: INNER_W, align: 'center' });
    };

    const cenBold = (text, size = 8) => {
      doc.font('Courier-Bold').fontSize(size).text(text, x, doc.y, { width: INNER_W, align: 'center' });
    };

    const sep = (char = '-') => {
      const line = char.repeat(32);
      cen(line, 7);
    };

    const twoCol = (left, right, size = 7.5) => {
      const y = doc.y;
      doc.font('Courier').fontSize(size)
        .text(left, x, y, { width: INNER_W * 0.62, lineBreak: false });
      doc.font('Courier').fontSize(size)
        .text(right, x + INNER_W * 0.62, y, { width: INNER_W * 0.38, align: 'right' });
      doc.moveDown(0.25);
    };

    const gap = (n = 0.4) => doc.moveDown(n);

    // ── ENCABEZADO ────────────────────────────────────────────
    cenBold("PANINI'S MIGAJEROS", 10);
    gap(0.15);
    cen('IVAN LONGARIC MONTAÑO', 7.5);
    cen('NIT: 8160734', 7.5);
    gap(0.2);
    sep('=');
    gap(0.15);
    cenBold(order.local_name || '', 8);
    if (order.local_address) { gap(0.1); cen(order.local_address, 7); }
    gap(0.2);
    sep();

    // ── INFO FACTURA ─────────────────────────────────────────
    gap(0.15);
    const fecha = new Date(invoice.generated_at);
    const fechaStr = fecha.toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const horaStr  = fecha.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

    twoCol('Fecha:', fechaStr);
    twoCol('Hora:', horaStr);
    twoCol('Factura:', invoice.invoice_number);
    twoCol('Cajero:', order.worker_name);
    gap(0.1);
    sep();

    // ── CABECERA TABLA ────────────────────────────────────────
    gap(0.15);
    {
      const y = doc.y;
      doc.font('Courier-Bold').fontSize(7);
      doc.text('DESCRIPCION',    x,              y, { width: 90,  lineBreak: false });
      doc.text('CNT',            x + 90,         y, { width: 24,  align: 'center', lineBreak: false });
      doc.text('P.U.',           x + 114,        y, { width: 36,  align: 'right',  lineBreak: false });
      doc.text('TOTAL',          x + 150,        y, { width: 48,  align: 'right' });
      doc.moveDown(0.15);
    }
    sep();
    gap(0.1);

    // ── ITEMS ─────────────────────────────────────────────────
    items.forEach((item) => {
      const subtotal = (item.quantity * item.unit_price).toFixed(2);
      const nameLines = chunkText(item.product_name, 14); // ~14 chars por línea en 90pt

      nameLines.forEach((chunk, i) => {
        const y = doc.y;
        doc.font('Courier').fontSize(7.5);
        doc.text(chunk, x, y, { width: 90, lineBreak: false });
        if (i === 0) {
          doc.text(String(item.quantity),               x + 90,  y, { width: 24, align: 'center', lineBreak: false });
          doc.text(Number(item.unit_price).toFixed(2),  x + 114, y, { width: 36, align: 'right',  lineBreak: false });
          doc.text(subtotal,                            x + 150, y, { width: 48, align: 'right' });
        } else {
          doc.text('', x + 90, y, { width: 108 }); // avanzar línea
        }
        doc.moveDown(0.2);
      });
    });

    // ── TOTAL ─────────────────────────────────────────────────
    gap(0.1);
    sep();
    gap(0.2);
    {
      const y = doc.y;
      doc.font('Courier-Bold').fontSize(9.5);
      doc.text('TOTAL:',      x,       y, { width: 100, lineBreak: false });
      doc.text(`Bs. ${Number(order.total).toFixed(2)}`, x + 100, y, { width: 98, align: 'right' });
      doc.moveDown(0.3);
    }

    // Método de pago
    const methods = { qr: 'QR / Transferencia', cash: 'Efectivo' };
    gap(0.1);
    twoCol('Pago:', methods[order.payment_method] || order.payment_method, 7);
    gap(0.2);
    sep('=');

    // ── PIE ───────────────────────────────────────────────────
    gap(0.3);
    cen('Gracias por su preferencia', 7.5);
    gap(0.1);
    cenBold("PANINI'S MIGAJEROS", 7.5);
    gap(0.3);

    // Recortar alto al contenido
    doc.page.height = doc.y + MARGIN;
    doc.end();

    stream.on('finish', () => resolve(outputPath));
    stream.on('error', reject);
  });
};

// Parte un string en trozos de máx n caracteres sin cortar palabras
function chunkText(text, n) {
  const words = text.split(' ');
  const lines = [];
  let current = '';
  for (const word of words) {
    if ((current + ' ' + word).trim().length > n) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = (current + ' ' + word).trim();
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [text];
}

module.exports = { generateInvoicePDF };
