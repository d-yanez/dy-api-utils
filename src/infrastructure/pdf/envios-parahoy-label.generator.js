const PDFDocument = require('pdfkit');

function formatAmount(amount) {
  const formatter = new Intl.NumberFormat('es-CL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
  return `$${formatter.format(Number(amount) || 0)}.-`;
}

function drawRow(doc, x, y, width, height, label, value) {
  const lineY = y + height;
  doc.rect(x, y, width, height).stroke();

  doc.font('Helvetica-Bold').fontSize(11).text(label, x + 8, y + 8, {
    width: 140
  });

  doc.font('Helvetica').fontSize(11).text(value || '', x + 150, y + 8, {
    width: width - 160
  });

  return lineY;
}

function generateLabelPdf(data) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const buffers = [];

    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', (err) => reject(err));

    doc.font('Helvetica-Bold').fontSize(18).text('Etiqueta Envíos Para Hoy', {
      align: 'center'
    });
    doc.moveDown();

    const rows = [
      ['Proveedor', 'DYSHOPNOW'],
      ['Nombre', data.name],
      ['Dirección', data.address],
      ['Depto', data.depto || ''],
      ['Comuna', data.commune],
      ['Correo', data.email || ''],
      ['Telefono', data.phone],
      ['Cambio', data.change || 'NO'],
      ['Tipo Entrega', 'Pago contra entrega'],
      ['Monto', formatAmount(data.amount)],
      ['Logística', 'ENVIOSPARAHOY'],
      ['Extra', data.extra || '']
    ];

    let y = doc.y;
    const tableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const rowHeight = 32;

    rows.forEach(([label, value]) => {
      y = drawRow(doc, doc.x, y, tableWidth, rowHeight, label, value);
    });

    doc.end();
  });
}

module.exports = {
  generateLabelPdf,
  formatAmount
};
