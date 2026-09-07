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

// Not a PDF at all.
writeFileSync(`${dir}/not-a.pdf`, Buffer.from('This is definitely not a PDF file.\n'))

console.log('fixtures written')
