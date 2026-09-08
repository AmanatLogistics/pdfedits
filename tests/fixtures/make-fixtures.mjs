// Generates the PDFs the end-to-end tests run against.
import { writeFileSync } from 'node:fs'
import { PDFDocument, StandardFonts, degrees, rgb } from 'pdf-lib'

const dir = new URL('.', import.meta.url).pathname

// Text-heavy multi-page document: the main edit -> export subject.
{
  const doc = await PDFDocument.create()
  const helv = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const times = await doc.embedFont(StandardFonts.TimesRoman)

  for (let i = 0; i < 3; i++) {
    const page = doc.addPage([595.28, 841.89])
    page.drawText(`Invoice ${1000 + i}`, { x: 60, y: 760, size: 24, font: bold })
    page.drawText('Original heading text', { x: 60, y: 700, size: 18, font: helv })
    page.drawText('Amount due: 1234.56', { x: 60, y: 660, size: 12, font: times })
    page.drawText('A tinted row follows below.', { x: 60, y: 620, size: 12, font: helv })
    page.drawRectangle({ x: 50, y: 560, width: 495, height: 34, color: rgb(0.87, 0.92, 0.98) })
    page.drawText('Row on a tinted background', { x: 60, y: 570, size: 12, font: helv })
  }
  writeFileSync(`${dir}/sample.pdf`, await doc.save())
}

// A page carrying its own /Rotate.
{
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const page = doc.addPage([595.28, 841.89])
  page.setRotation(degrees(90))
  page.drawText('Rotated source page', { x: 60, y: 700, size: 18, font })
  writeFileSync(`${dir}/rotated.pdf`, await doc.save())
}

// A long document, for the large-file path.
{
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  for (let i = 0; i < 60; i++) {
    const page = doc.addPage([595.28, 841.89])
    page.drawText(`Page ${i + 1} of the long document`, { x: 60, y: 760, size: 16, font })
    for (let line = 0; line < 30; line++) {
      page.drawText(`Line ${line} lorem ipsum dolor sit amet consectetur adipiscing`, {
        x: 60, y: 720 - line * 20, size: 10, font,
      })
    }
  }
  writeFileSync(`${dir}/large.pdf`, await doc.save())
}

// A bordered form with merged boxes and a barcode, mirroring the structure of
// real freight/invoice paperwork. Used to check that layout survives the DOCX
// conversion without putting any real customer document in the repository.
{
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const page = doc.addPage([595.28, 841.89])
  const line = (x, y, w, h) => page.drawRectangle({ x, y, width: w, height: h, color: rgb(0, 0, 0) })

  const L = 60, R = 540, T = 780, B = 400
  const rows = [780, 700, 620, 540, 460, 400]
  const cols = [60, 200, 340, 540]

  // Horizontal rules across the full width.
  for (const y of rows) line(L, y, R - L, 0.8)
  // Vertical rules. The second column stops short of the last row, which is
  // what creates a merged cell spanning two columns at the bottom.
  for (const x of cols) {
    const bottom = x === 200 ? rows[3] : B
    line(x, bottom, 0.8, T - bottom)
  }

  const labels = [
    ['Shipper Name and Address', 66, 770],
    ['Account Number', 206, 770],
    ['Air Waybill', 346, 770],
    ['Consignee Name and Address', 66, 690],
    ['Reference', 206, 690],
    ['Conditions of Contract', 346, 690],
    ['Airport of Departure', 66, 610],
    ['Routing', 206, 610],
    ['Declared Value', 346, 610],
    ['Handling Information', 66, 530],
    ['Gross Weight', 346, 530],
    ['Total Charges Due Carrier', 66, 450],
  ]
  for (const [text, x, y] of labels) page.drawText(text, { x, y, size: 6, font })
  page.drawText('ACME FREIGHT LTD', { x: 66, y: 752, size: 10, font: bold })
  page.drawText('123-45678901', { x: 346, y: 752, size: 10, font: bold })
  page.drawText('LONDON HEATHROW', { x: 66, y: 592, size: 9, font })

  // A barcode: many tightly spaced short bars. These must not become table rows.
  let by = 760
  for (let i = 0; i < 40; i++) {
    const h = i % 3 === 0 ? 1.6 : 0.8
    line(20, by, 26, h)
    by -= 2 + (i % 4)
  }

  writeFileSync(`${dir}/form.pdf`, await doc.save())
}

// Not a PDF at all.
writeFileSync(`${dir}/not-a.pdf`, Buffer.from('This is definitely not a PDF file.\n'))

console.log('fixtures written')
