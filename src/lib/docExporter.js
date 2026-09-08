/**
 * Document export: Word (.docx), plain text, and page images.
 *
 * These three were stubbed out in the UI and did nothing. They work by reading
 * the text PDF.js extracted for each page, applying whatever the user has
 * edited on top, grouping the fragments back into lines and paragraphs, and
 * writing a real document.
 *
 * PDF has no notion of a paragraph — it stores positioned glyph runs — so the
 * structure here is reconstructed from geometry: fragments sharing a baseline
 * become a line, and consecutive lines become a paragraph until the vertical
 * gap or the indentation says otherwise.
 */
import {
  AlignmentType,
  Document,
  HeadingLevel,
  PageBreak,
  PageOrientation,
  Packer,
  Paragraph,
  TextRun,
} from 'docx'
import { zipSync, strToU8 } from 'fflate'
import { BASE_SCALE, extractTextItems, getPdfDocument, renderPage } from './pdfRenderer.js'
import { extractVectorGeometry, mergeRules, separateBarGraphics } from './pdfVectorExtract.js'
import { assignTextToCells, buildGrid } from './tableReconstruct.js'
import { gridToTable, looseParagraphs, toTwips } from './docxLayout.js'
import { buildFixedLayoutDocx } from './docxFixedLayout.js'

/** Fragments whose baselines differ by less than this are on the same line. */
const LINE_TOLERANCE_RATIO = 0.5
/** A vertical gap larger than this many line-heights starts a new paragraph. */
const PARAGRAPH_GAP_RATIO = 1.6

function toDocxColor(hex) {
  const clean = String(hex || '#000000').replace('#', '')
  if (clean.length === 3) return clean.split('').map((c) => c + c).join('').toUpperCase()
  return clean.length === 6 ? clean.toUpperCase() : '000000'
}

/**
 * Applies the user's edits to the text PDF.js extracted for a page.
 *
 * `editLayers` is the authoritative record — it is what the PDF exporter draws
 * from, and it holds the latest keystroke. `extractedEdits` is consulted as a
 * fallback for edits committed before a block object existed. Edited originals
 * are replaced in place so they keep their position and styling; text boxes the
 * user added are appended and placed into the flow by geometry like everything
 * else.
 */
function applyEdits(items, pageEdits, layer) {
  const overrides = new Map(Object.entries(pageEdits || {}))
  for (const block of layer?.texts || []) {
    if (block.originalId) overrides.set(block.originalId, block.str ?? '')
  }

  const result = items
    .map((item) => (overrides.has(item.id) ? { ...item, str: overrides.get(item.id) } : item))
    // An edit that cleared the text removes the run from the document.
    .filter((item) => String(item.str || '').trim() !== '')

  for (const block of layer?.texts || []) {
    // Edited originals are handled by the override map above; only the user's
    // own text boxes still need adding.
    if (block.originalId || block.isEdited) continue
    if (!String(block.str || '').trim()) continue
    result.push({
      id: block.id,
      str: block.str,
      x: block.x,
      y: block.y,
      width: block.width,
      height: block.height,
      fontSize: block.fontSize,
      fontBold: block.fontBold,
      fontItalic: block.fontItalic,
      color: block.color || '#000000',
      fontName: block.fontName || '',
    })
  }

  return result
}

/** Groups positioned fragments into lines, top to bottom, left to right. */
function groupIntoLines(items) {
  const sorted = [...items].sort((a, b) => a.y - b.y || a.x - b.x)
  const lines = []

  for (const item of sorted) {
    const tolerance = Math.max((item.fontSize || 12) * LINE_TOLERANCE_RATIO, 2)
    const line = lines[lines.length - 1]
    if (line && Math.abs(item.y - line.y) <= tolerance) {
      line.items.push(item)
      line.maxFontSize = Math.max(line.maxFontSize, item.fontSize || 0)
      continue
    }
    lines.push({ y: item.y, items: [item], maxFontSize: item.fontSize || 12 })
  }

  for (const line of lines) line.items.sort((a, b) => a.x - b.x)
  return lines
}

/**
 * Joins a line's fragments, restoring the spaces that a PDF encodes as gaps in
 * positioning rather than as space characters.
 */
function lineText(line) {
  let text = ''
  let previous = null
  for (const item of line.items) {
    if (previous) {
      const gap = item.x - (previous.x + (previous.width || 0))
      const spaceWidth = (previous.fontSize || 12) * 0.22
      if (gap > spaceWidth && !text.endsWith(' ') && !String(item.str).startsWith(' ')) {
        text += ' '
      }
    }
    text += item.str
    previous = item
  }
  return text
}

/** Splits lines into paragraphs on vertical gaps. */
function groupIntoParagraphs(lines) {
  const paragraphs = []
  let current = null

  for (const line of lines) {
    const text = lineText(line).trim()
    if (!text) continue

    const gap = current ? line.y - current.lastY : 0
    const threshold = (current?.maxFontSize || line.maxFontSize) * PARAGRAPH_GAP_RATIO

    if (!current || gap > threshold) {
      if (current) paragraphs.push(current)
      current = {
        lines: [text],
        lastY: line.y,
        maxFontSize: line.maxFontSize,
        first: line.items[0],
      }
    } else {
      current.lines.push(text)
      current.lastY = line.y
      current.maxFontSize = Math.max(current.maxFontSize, line.maxFontSize)
    }
  }
  if (current) paragraphs.push(current)
  return paragraphs
}

/**
 * Reads a whole document's text, page by page, with the user's edits applied.
 * @returns {Promise<Array<{ pageNum: number, paragraphs: Array }>>}
 */
export async function extractDocumentContent(pageCount, extractedEdits = {}, editLayers = {}) {
  const pages = []
  for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
    let items = []
    try {
      items = await extractTextItems(pageNum)
    } catch (err) {
      console.warn(`Could not read text on page ${pageNum}`, err)
    }
    const merged = applyEdits(items, extractedEdits[pageNum], editLayers[pageNum])
    pages.push({ pageNum, paragraphs: groupIntoParagraphs(groupIntoLines(merged)) })
  }
  return pages
}

/**
 * Chooses a Word heading level from a paragraph's size relative to the
 * document's body text, so headings survive the round trip as real headings
 * rather than as large body text.
 */
function headingFor(fontSize, bodySize) {
  if (!bodySize) return undefined
  const ratio = fontSize / bodySize
  if (ratio >= 1.8) return HeadingLevel.HEADING_1
  if (ratio >= 1.45) return HeadingLevel.HEADING_2
  if (ratio >= 1.2) return HeadingLevel.HEADING_3
  return undefined
}

/** The most common font size, used as the body-text baseline. */
function dominantFontSize(pages) {
  const counts = new Map()
  for (const page of pages) {
    for (const paragraph of page.paragraphs) {
      const size = Math.round(paragraph.maxFontSize)
      counts.set(size, (counts.get(size) || 0) + paragraph.lines.length)
    }
  }
  let best = 12
  let bestCount = -1
  for (const [size, count] of counts) {
    if (count > bestCount) {
      bestCount = count
      best = size
    }
  }
  return best
}

/**
 * Reads one page's geometry: its size, its table grid (if it has one), and the
 * text placed into that grid.
 */
async function analysePage(pageNum, extractedEdits, editLayers) {
  const pdf = getPdfDocument()
  const page = await pdf.getPage(pageNum)
  // Work at scale 1 so every measurement is already in PDF points.
  const viewport = page.getViewport({ scale: 1 })

  const rawItems = await extractTextItems(pageNum)
  const edited = applyEdits(rawItems, extractedEdits?.[pageNum], editLayers?.[pageNum])
  // extractTextItems reports in BASE_SCALE canvas units; the rules are in
  // points, so bring the text into the same space before matching them up.
  const items = edited.map((item) => ({
    ...item,
    x: item.x / BASE_SCALE,
    y: item.y / BASE_SCALE,
    width: (item.width || 0) / BASE_SCALE,
    height: (item.height || 0) / BASE_SCALE,
    fontSize: (item.fontSize || 12) / BASE_SCALE,
  }))

  let grid = null
  let blocks = []
  let graphics = []
  let shapes = []
  try {
    const geometry = await extractVectorGeometry(page, viewport)
    blocks = geometry.blocks
    shapes = geometry.shapes || []

    // Barcodes and similar bar graphics must come out of the ruling set before
    // the grid is built, or every bar becomes a grid line.
    const h = separateBarGraphics(mergeRules(geometry.hRules, 'h'), 'h')
    const v = separateBarGraphics(mergeRules(geometry.vRules, 'v'), 'v')
    graphics = [...h.graphics, ...v.graphics]
    grid = buildGrid(h.rules, v.rules)
  } catch (err) {
    // A page whose vector content cannot be read still converts as flowing text.
    console.warn(`Could not read vector geometry on page ${pageNum}`, err)
  }

  return {
    pageNum,
    width: viewport.width,
    height: viewport.height,
    items,
    grid,
    blocks,
    graphics,
    shapes,
  }
}

/** Flowing-paragraph rendering, for pages with no table structure. */
function flowingParagraphs(items, bodySize) {
  const paragraphs = groupIntoParagraphs(groupIntoLines(items))
  return paragraphs.map((paragraph) => {
    const source = paragraph.first || {}
    const heading = headingFor(paragraph.maxFontSize, bodySize)
    return new Paragraph({
      heading,
      alignment: AlignmentType.LEFT,
      spacing: { after: 120 },
      children: paragraph.lines.map(
        (line, lineIndex) =>
          new TextRun({
            text: line,
            break: lineIndex > 0 ? 1 : 0,
            bold: Boolean(source.fontBold),
            italics: Boolean(source.fontItalic),
            color: String(source.color || '#000000').replace('#', '').toUpperCase() || '000000',
            size: heading ? undefined : Math.max(2, Math.round((paragraph.maxFontSize || bodySize) * 2)),
          }),
      ),
    })
  })
}

/**
 * Builds a Word document from the PDF.
 *
 * Each page is converted in whichever way suits it. A page with ruling lines —
 * an invoice, an air waybill, any form — is rebuilt as a real Word table so its
 * boxes and borders survive and stay editable. A page of prose has no grid to
 * recover, so it converts to flowing paragraphs instead. Word sections are
 * created per page so each keeps the original page size and orientation.
 *
 * @returns {Promise<Blob>} the .docx file
 */
export async function exportDocx(pageCount, extractedEdits, editLayers, options = {}) {
  // 'exact'  — every run and rule placed at its PDF coordinate. Looks like the
  //            original; each piece of text is edited in place.
  // 'flow'   — tables and paragraphs reconstructed. Reflows like a normal Word
  //            document, at the cost of matching the page exactly.
  const mode = options.mode || 'exact'

  const analysed = []
  for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
    try {
      analysed.push(await analysePage(pageNum, extractedEdits, editLayers))
    } catch (err) {
      console.warn(`Could not analyse page ${pageNum}`, err)
      analysed.push({ pageNum, width: 595.28, height: 841.89, items: [], grid: null, blocks: [] })
    }
  }

  if (mode === 'exact') {
    return await buildFixedLayoutDocx(
      analysed.map((page) => ({
        width: page.width,
        height: page.height,
        items: page.items,
        shapes: page.shapes,
      })),
      { title: options.title },
    )
  }

  // Body size is measured from the flowing pages, where headings are meaningful.
  const bodySize = dominantFontSize(
    analysed.map((p) => ({ paragraphs: groupIntoParagraphs(groupIntoLines(p.items)) })),
  )

  const sections = analysed.map((page) => {
    const useTable = Boolean(page.grid)
    const children = []

    if (useTable) {
      const { assignments, outside } = assignTextToCells(page.grid, page.items)
      // Anything above the grid keeps its place ahead of the table.
      const above = outside.filter((i) => i.y < page.grid.bounds.y0)
      const below = outside.filter((i) => i.y >= page.grid.bounds.y0)
      children.push(...looseParagraphs(above))
      children.push(gridToTable(page.grid, assignments, page.blocks))
      children.push(...looseParagraphs(below))
    } else {
      children.push(...flowingParagraphs(page.items, bodySize))
    }

    if (children.length === 0) children.push(new Paragraph({ children: [] }))

    // Margins align the table with where the content sat on the PDF page.
    const bounds = useTable ? page.grid.bounds : null
    const margin = bounds
      ? {
          top: toTwips(Math.max(bounds.y0, 0)),
          left: toTwips(Math.max(bounds.x0, 0)),
          right: toTwips(Math.max(page.width - bounds.x1, 0)),
          bottom: toTwips(Math.max(page.height - bounds.y1, 0)),
        }
      : { top: 720, left: 720, right: 720, bottom: 720 }

    return {
      properties: {
        page: {
          size: {
            width: toTwips(page.width),
            height: toTwips(page.height),
            orientation:
              page.width > page.height ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT,
          },
          margin,
        },
      },
      children,
    }
  })

  const doc = new Document({
    creator: 'PDFZero',
    title: options.title || 'Converted PDF',
    description: 'Converted from PDF by PDFZero',
    sections,
  })

  // toBlob is the browser-safe packer; toBuffer would need a Buffer polyfill.
  return await Packer.toBlob(doc)
}

/**
 * Extracts the document as plain text, one blank line between paragraphs and a
 * form feed between pages.
 * @returns {Promise<string>}
 */
export async function exportPlainText(pageCount, extractedEdits, editLayers) {
  const pages = await extractDocumentContent(pageCount, extractedEdits, editLayers)
  return pages
    .map((page) => page.paragraphs.map((p) => p.lines.join('\n')).join('\n\n'))
    .join('\n\n\f\n\n')
    .trim()
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not encode the page image.'))),
      type,
      quality,
    )
  })
}

/**
 * Renders pages to PNG. A single page comes back as a plain PNG; several pages
 * are bundled into a zip so one click yields one file.
 *
 * @returns {Promise<{ bytes: Uint8Array, filename: string, mimeType: string }>}
 */
export async function exportPageImages(pageCount, baseName = 'document', options = {}) {
  const scale = options.scale || 2
  const onProgress = options.onProgress
  const images = []

  for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
    const { canvas } = await renderPage(pageNum, scale)
    const blob = await canvasToBlob(canvas, 'image/png')
    images.push({
      name: `${baseName}-page-${String(pageNum).padStart(3, '0')}.png`,
      bytes: new Uint8Array(await blob.arrayBuffer()),
    })
    onProgress?.(pageNum / pageCount)
  }

  if (images.length === 0) throw new Error('There are no pages to export.')

  if (images.length === 1) {
    return {
      bytes: images[0].bytes,
      filename: images[0].name,
      mimeType: 'image/png',
    }
  }

  const entries = {}
  for (const image of images) entries[image.name] = image.bytes
  // PNG is already deflated; storing avoids a pointless second pass.
  entries['README.txt'] = strToU8(
    `${images.length} pages exported from ${baseName}.pdf by PDFZero.\n`,
  )
  return {
    bytes: zipSync(entries, { level: 0 }),
    filename: `${baseName}-pages.zip`,
    mimeType: 'application/zip',
  }
}

/** Downloads arbitrary bytes with the right MIME type. */
export function downloadFile(bytes, filename, mimeType) {
  const blob = bytes instanceof Blob ? bytes : new Blob([bytes], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  // Firefox only follows a programmatic click on an anchor that is in the DOM.
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

export const MIME = {
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  txt: 'text/plain;charset=utf-8',
  png: 'image/png',
  zip: 'application/zip',
}
