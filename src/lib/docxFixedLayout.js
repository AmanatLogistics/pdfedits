/**
 * Fixed-layout Word export: reproduces a PDF page as it looks, rather than
 * guessing at its structure.
 *
 * A PDF places every glyph and every line at an absolute coordinate. Word flows
 * content, so any converter that rebuilds a page as paragraphs and tables is
 * making inferences, and the result reflows the moment a line wraps a little
 * differently. That is fine for prose and wrong for a form, where the whole
 * point is that the boxes sit exactly where they sit.
 *
 * This module takes the other route, the one LibreOffice's PDF import and most
 * "keep layout" converters take: every text run and every rule becomes its own
 * absolutely positioned frame anchored to the page. Word honours those
 * positions exactly, so the page matches the original. The trade is that the
 * result is a page of positioned boxes rather than flowing prose — you can edit
 * any piece of text in place, but you cannot retype a paragraph and have it
 * reflow.
 */
import {
  Document,
  FrameAnchorType,
  FrameWrap,
  HeightRule,
  Packer,
  PageOrientation,
  Paragraph,
  ShadingType,
  TextRun,
} from 'docx'

/** Word measures frame geometry in twentieths of a point. */
const TWIPS_PER_POINT = 20

const toTwips = (points) => Math.round(points * TWIPS_PER_POINT)
/** Word wants half-points, and will not render below 1pt. */
const toHalfPoints = (points) => Math.max(2, Math.round(points * 2))

function toHex(color) {
  const clean = String(color || '#000000').replace('#', '')
  if (clean.length === 3) return clean.split('').map((c) => c + c).join('').toUpperCase()
  return clean.length === 6 ? clean.toUpperCase() : '000000'
}

/** Maps a PDF font name onto a Word font that has the same metrics feel. */
export function wordFontFor(item) {
  const name = `${item.fontName || ''} ${item.fontFamily || ''}`.toLowerCase()
  if (name.includes('courier') || name.includes('mono')) return 'Courier New'
  if (name.includes('times') || name.includes('roman') || name.includes('serif')) {
    return 'Times New Roman'
  }
  return 'Arial'
}

/**
 * A frame anchored to the page at an exact position.
 *
 * `wrap: NONE` and page anchoring together are what stop Word from treating
 * these as flowing content and nudging them around each other.
 */
function frameAt(x, y, width, height, rule = HeightRule.EXACT) {
  return {
    type: 'absolute',
    position: { x: toTwips(x), y: toTwips(y) },
    width: toTwips(Math.max(width, 0.5)),
    height: toTwips(Math.max(height, 0.5)),
    anchor: { horizontal: FrameAnchorType.PAGE, vertical: FrameAnchorType.PAGE },
    wrap: FrameWrap.NONE,
    rule,
    space: { horizontal: 0, vertical: 0 },
  }
}

/**
 * Draws one rule or filled block as a positioned, shaded frame.
 *
 * This mirrors how the PDF itself draws them — a table border in a PDF is
 * almost always a very thin filled rectangle, so reproducing it as a thin
 * filled rectangle is exact rather than approximate.
 */
function shapeParagraph(rect, fill) {
  const width = Math.max(rect.x1 - rect.x0, 0.4)
  const height = Math.max(rect.y1 - rect.y0, 0.4)
  return new Paragraph({
    frame: frameAt(rect.x0, rect.y0, width, height),
    shading: { type: ShadingType.CLEAR, color: 'auto', fill: toHex(fill) },
    spacing: { before: 0, after: 0, line: toTwips(height), lineRule: 'exact' },
    children: [new TextRun({ text: '', size: 2 })],
  })
}

/**
 * Draws one run of text at its exact position.
 *
 * The frame is placed at the top of the glyph box and given an exact line
 * height, so Word cannot add its own leading and shift the baseline.
 */
function textParagraph(item) {
  const size = item.fontSize || 8
  // A little headroom stops descenders being clipped by the exact height.
  const boxHeight = size * 1.25
  const width = Math.max(item.width || size * item.str.length * 0.6, size)

  return new Paragraph({
    frame: frameAt(item.x, item.y, width + size, boxHeight),
    spacing: { before: 0, after: 0, line: toTwips(boxHeight), lineRule: 'exact' },
    children: [
      new TextRun({
        text: item.str,
        size: toHalfPoints(size),
        bold: Boolean(item.fontBold),
        italics: Boolean(item.fontItalic),
        color: toHex(item.color),
        font: wordFontFor(item),
      }),
    ],
  })
}

/**
 * Builds a fixed-layout Word document.
 *
 * @param {Array} pages  per-page { width, height, items, shapes }
 * @returns {Promise<Blob>}
 */
export async function buildFixedLayoutDocx(pages, options = {}) {
  const sections = pages.map((page) => {
    const children = []

    // Shapes first so text sits on top of any shading.
    for (const shape of page.shapes || []) {
      children.push(shapeParagraph(shape, shape.fill))
    }
    for (const item of page.items || []) {
      if (!String(item.str || '').trim()) continue
      children.push(textParagraph(item))
    }

    // A section needs at least one non-frame paragraph, or Word has nothing to
    // anchor the frames to.
    children.push(new Paragraph({ children: [new TextRun({ text: '', size: 2 })] }))

    return {
      properties: {
        page: {
          size: {
            width: toTwips(page.width),
            height: toTwips(page.height),
            orientation:
              page.width > page.height ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT,
          },
          // Zero margins: every frame carries its own absolute position, so a
          // margin would only shift the whole page off register.
          margin: { top: 0, right: 0, bottom: 0, left: 0, header: 0, footer: 0, gutter: 0 },
        },
      },
      children,
    }
  })

  const doc = new Document({
    creator: 'PDFZero',
    title: options.title || 'Converted PDF',
    description: 'Converted from PDF by PDFZero, preserving the original layout',
    sections,
  })

  return await Packer.toBlob(doc)
}
