// Generates the PDFs the end-to-end tests exercise.
import { writeFileSync } from 'node:fs';
import { PDFDocument, StandardFonts, degrees, rgb } from 'pdf-lib';

const dir = new URL('.', import.meta.url).pathname;

// A small, text-heavy document: the main upload -> edit -> export subject.
{
  const doc = await PDFDocument.create();
  const helv = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const times = await doc.embedFont(StandardFonts.TimesRoman);

  for (let i = 0; i < 3; i++) {
    const page = doc.addPage([595.28, 841.89]); // A4
    page.drawText(`Invoice ${1000 + i}`, { x: 60, y: 760, size: 24, font: bold });
    page.drawText('Original heading text', { x: 60, y: 700, size: 18, font: helv });
    page.drawText('Amount due: 1234.56', { x: 60, y: 660, size: 12, font: times });
    page.drawText('A tinted row follows below.', { x: 60, y: 620, size: 12, font: helv });
    // A coloured band, so background sampling has something other than white.
    page.drawRectangle({ x: 50, y: 560, width: 495, height: 34, color: rgb(0.87, 0.92, 0.98) });
    page.drawText('Row on a tinted background', { x: 60, y: 570, size: 12, font: helv });
  }
  writeFileSync(`${dir}/sample.pdf`, await doc.save());
}

// A page carrying its own /Rotate, to prove rotated sources export correctly.
{
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage([595.28, 841.89]);
  page.setRotation(degrees(90));
  page.drawText('Rotated source page', { x: 60, y: 700, size: 18, font });
  writeFileSync(`${dir}/rotated.pdf`, await doc.save());
}

// A deliberately large document, for the large-file path.
{
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 0; i < 150; i++) {
    const page = doc.addPage([595.28, 841.89]);
    page.drawText(`Page ${i + 1} of the long document`, { x: 60, y: 760, size: 16, font });
    for (let line = 0; line < 40; line++) {
      page.drawText(`Line ${line} lorem ipsum dolor sit amet consectetur adipiscing elit`, {
        x: 60, y: 720 - line * 17, size: 10, font,
      });
    }
  }
  writeFileSync(`${dir}/large.pdf`, await doc.save());
}

// Not a PDF at all.
writeFileSync(`${dir}/not-a.pdf`, Buffer.from('This is definitely not a PDF file.\n'));

console.log('fixtures written');

// A small solid-magenta PNG for the image-placement test.
{
  const { PNG } = await import('node:zlib').then(async () => ({ PNG: null }));
  void PNG;
  // Hand-build a 2x2 magenta PNG so the fixture needs no image library.
  const zlib = await import('node:zlib');
  const crc = (buf) => {
    let c = ~0;
    for (const byte of buf) {
      c ^= byte;
      for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
    }
    return ~c >>> 0;
  };
  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc(body));
    return Buffer.concat([len, body, crcBuf]);
  };
  const size = 2;
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 2;  // colour type: truecolour
  // One filter byte per row, then RGB triples.
  const raw = Buffer.concat(
    Array.from({ length: size }, () =>
      Buffer.concat([Buffer.from([0]), ...Array.from({ length: size }, () => Buffer.from([255, 0, 255]))]),
    ),
  );
  writeFileSync(
    `${dir}/swatch.png`,
    Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      chunk('IHDR', ihdr),
      chunk('IDAT', zlib.deflateSync(raw)),
      chunk('IEND', Buffer.alloc(0)),
    ]),
  );
}
console.log('image fixture written');
