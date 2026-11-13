const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const pool = require('../../config/db');

async function fetchBags(ids) {
  const r = await pool.query(
    `SELECT b.bag_number, b.qr_token, u.name AS student_name, st.enrollment_no, st.hostel, st.room_number
     FROM bags b
     LEFT JOIN users u ON u.id = b.student_id
     LEFT JOIN students st ON st.user_id = b.student_id
     WHERE b.id = ANY($1) ORDER BY b.bag_number`,
    [ids]
  );
  return r.rows;
}

// Draw one label inside a box at (x, y)
async function drawLabel(doc, bag, x, y, w, h) {
  doc.save();
  doc.roundedRect(x, y, w, h, 8).lineWidth(1).stroke('#1d4ed8');
  // Header
  doc.fillColor('#1d4ed8').fontSize(13).font('Helvetica-Bold')
    .text('DHOBI CLINIC', x + 12, y + 10, { width: w - 24 });
  doc.fillColor('#6b7280').fontSize(7).font('Helvetica')
    .text('Bennett University Laundry', x + 12, y + 26);

  // QR
  const qrPng = await QRCode.toBuffer(bag.qr_token, { margin: 0, width: 150 });
  doc.image(qrPng, x + w - 92, y + 12, { width: 78, height: 78 });

  // Details
  let ty = y + 44;
  doc.fillColor('#111827').fontSize(16).font('Helvetica-Bold').text(bag.bag_number, x + 12, ty);
  ty += 22;
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#111827').text(bag.student_name || 'Unassigned', x + 12, ty, { width: w - 100 });
  ty += 15;
  doc.fontSize(9).font('Helvetica').fillColor('#374151');
  if (bag.enrollment_no) { doc.text(`Enroll: ${bag.enrollment_no}`, x + 12, ty); ty += 12; }
  const loc = [bag.hostel, bag.room_number].filter(Boolean).join(' · ');
  if (loc) doc.text(loc, x + 12, ty);
  doc.restore();
}

// Stream a PDF of labels to res (2 columns grid)
async function streamLabels(bagIds, res) {
  const bags = await fetchBags(bagIds);
  if (!bags.length) { res.status(404).json({ error: 'No bags found' }); return; }

  const doc = new PDFDocument({ size: 'A4', margin: 28 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="bag-labels.pdf"`);
  doc.pipe(res);

  const pageW = doc.page.width - 56;   // usable width
  const cols = 2, gutter = 14;
  const lw = (pageW - gutter) / cols;
  const lh = 120;
  let x0 = 28, y0 = 28, col = 0, row = 0;
  const rowsPerPage = Math.floor((doc.page.height - 56) / (lh + gutter));

  for (let i = 0; i < bags.length; i++) {
    const x = x0 + col * (lw + gutter);
    const y = y0 + row * (lh + gutter);
    await drawLabel(doc, bags[i], x, y, lw, lh);
    col++;
    if (col >= cols) { col = 0; row++; }
    if (row >= rowsPerPage && i < bags.length - 1) { doc.addPage(); col = 0; row = 0; }
  }
  doc.end();
}

module.exports = { streamLabels };
