// Binary files generated at startup, so the repo has no binary blobs.

// 1x1 transparent GIF.
const GIF = Buffer.from('R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==', 'base64');

// Minimal 1x1 JPEG.
const JPEG = Buffer.from(
  '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=',
  'base64'
);

// 24-bit BMP of arbitrary size (used for "image over 100 KB" tests).
function bmp(w, h) {
  const row = Math.ceil((w * 3) / 4) * 4;
  const size = 54 + row * h;
  const b = Buffer.alloc(size);
  b.write('BM', 0);
  b.writeUInt32LE(size, 2);
  b.writeUInt32LE(54, 10);
  b.writeUInt32LE(40, 14);
  b.writeInt32LE(w, 18);
  b.writeInt32LE(h, 22);
  b.writeUInt16LE(1, 26);
  b.writeUInt16LE(24, 28);
  b.writeUInt32LE(row * h, 34);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const o = 54 + y * row + x * 3;
      b[o] = (x * 255) / w;
      b[o + 1] = (y * 255) / h;
      b[o + 2] = 160;
    }
  }
  return b;
}

// Valid one-page PDF with a /Title and one link annotation (crawlers extract PDF links).
function pdf(title, text, linkUrl) {
  const stream = `BT /F1 18 Tf 72 720 Td (${text}) Tj ET\nBT /F1 12 Tf 72 690 Td (Link: ${linkUrl}) Tj ET`;
  const objs = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> /Annots [7 0 R] >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Title (${title}) /Author (SEO Crawler Test Site) /Subject (Crawler test PDF) >>`,
    `<< /Type /Annot /Subtype /Link /Rect [72 680 540 704] /Border [0 0 0] /A << /S /URI /URI (${linkUrl}) >> >>`,
  ];
  let out = '%PDF-1.4\n';
  const offsets = [];
  objs.forEach((o, i) => {
    offsets.push(out.length);
    out += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  out += offsets.map((o) => String(o).padStart(10, '0') + ' 00000 n \n').join('');
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R /Info 6 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(out, 'latin1');
}

// Arbitrary bytes for file types we only need a Content-Type for (SWF, ZIP...).
function blob(header, size) {
  const b = Buffer.alloc(size, 0x20);
  Buffer.from(header, 'latin1').copy(b);
  return b;
}

module.exports = { GIF, JPEG, bmp, pdf, blob };
