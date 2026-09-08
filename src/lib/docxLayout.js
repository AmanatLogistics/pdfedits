/**
 * Converts a reconstructed page grid into Word table objects.
 *
 * Borders are real Word borders, not a picture: a cell edge is drawn only
 * where the PDF actually had a rule, which is what makes a converted form look
 * like the form instead of like a paragraph of loose text.
 */
import {
  AlignmentType,
  BorderStyle,
  HeightRule,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from 'docx'

/** Word measures most lengths in twentieths of a point. */
export const TWIPS_PER_POINT = 20
/** Border widths are in eighths of a point. */
const EIGHTHS_PER_POINT = 8

export const toTwips = (points) => Math.max(0, Math.round(points * TWIPS_PER_POINT))

/** Word wants half-points, and refuses anything below 1pt. */
const toHalfPoints = (points) => Math.max(2, Math.round(points * 2))

function toHex(color) {
  const clean = String(color || '#000000').replace('#', '')
  if (clean.length === 3) return clean.split('').map((c) => c + c).join('').toUpperCase()
  return clean.length === 6 ? clean.toUpperCase() : '000000'
}

function borderSpec(present, thickness) {
  if (!present) return { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }
  return {
    style: BorderStyle.SINGLE,
    size: Math.max(2, Math.min(48, Math.round(thickness * EIGHTHS_PER_POINT))),
    color: '000000',
  }
}

/**
 * Groups a cell's text items into visual lines, then into runs that keep their
 * own size and weight.
 */
function cellParagraphs(items, options = {}) {
  if (!items || items.length === 0) return [new Paragraph({ children: [] })]

  const sorted = [...items].sort((a, b) => a.y - b.y || a.x - b.x)
  const lines = []
  for (const item of sorted) {
    const tolerance = Math.max((item.height || 8) * 0.5, 1.5)
    const line = lines[lines.length - 1]
    if (line && Math.abs(item.y - line.y) <= tolerance) {
      line.items.push(item)
    } else {
      lines.push({ y: item.y, items: [item] })
    }
  }

  return lines.map((line, index) => {
    const ordered = [...line.items].sort((a, b) => a.x - b.x)
    const children = []
    let previous = null

    for (const item of ordered) {
      let text = item.str
      if (previous) {
        // Restore spacing that the PDF expressed as a positional gap.
        const gap = item.x - (previous.x + (previous.width || 0))
        if (gap > (previous.height || 8) * 0.2 && !text.startsWith(' ')) text = ` ${text}`
      }
      children.push(
        new TextRun({
          text,
          bold: Boolean(item.fontBold),
          italics: Boolean(item.fontItalic),
          size: toHalfPoints(item.fontSize || 8),
          color: toHex(item.color),
          font: item.docxFont || undefined,
        }),
      )
      previous = item
    }

    return new Paragraph({
      children,
      alignment: options.alignment || AlignmentType.LEFT,
      spacing: { before: 0, after: 0, line: 240, lineRule: 'auto' },
    })
  }).slice(0, 200) // guard against pathological cells
}

/**
 * Builds a Word table mirroring the grid.
 *
 * @param {object} grid       from buildGrid
 * @param {Map} assignments   cell key -> text items, from assignTextToCells
 * @param {object[]} blocks   filled rectangles, used for cell shading
 */
export function gridToTable(grid, assignments, blocks = []) {
  const { xs, ys, cells } = grid
  const columnWidths = []
  for (let i = 1; i < xs.length; i++) columnWidths.push(toTwips(xs[i] - xs[i - 1]))

  const byRow = new Map()
  for (const cell of cells) {
    if (!byRow.has(cell.row)) byRow.set(cell.row, [])
    byRow.get(cell.row).push(cell)
  }

  const rows = []
  for (let r = 0; r < ys.length - 1; r++) {
    const rowCells = (byRow.get(r) || []).sort((a, b) => a.col - b.col)
    // Rows made up entirely of continuation cells carry no starting cell; the
    // docx builder fills those in from the rowSpan above.
    if (rowCells.length === 0) {
      rows.push(new TableRow({ children: [], height: rowHeight(ys, r) }))
      continue
    }

    const children = rowCells.map((cell) => {
      const items = assignments.get(`${cell.row}:${cell.col}`) || []
      const shade = shadingFor(cell, blocks)
      return new TableCell({
        columnSpan: cell.colSpan,
        rowSpan: cell.rowSpan,
        verticalAlign: VerticalAlign.TOP,
        width: {
          size: columnWidths
            .slice(cell.col, cell.col + cell.colSpan)
            .reduce((sum, w) => sum + w, 0),
          type: WidthType.DXA,
        },
        borders: {
          top: borderSpec(cell.borders.top, 0.75),
          bottom: borderSpec(cell.borders.bottom, 0.75),
          left: borderSpec(cell.borders.left, 0.75),
          right: borderSpec(cell.borders.right, 0.75),
        },
        shading: shade
          ? { type: ShadingType.CLEAR, color: 'auto', fill: shade }
          : undefined,
        margins: { top: 10, bottom: 10, left: 40, right: 40 },
        children: cellParagraphs(items),
      })
    })

    rows.push(new TableRow({ children, height: rowHeight(ys, r) }))
  }

  return new Table({
    columnWidths,
    // Fixed layout makes Word honour the column widths we computed rather than
    // resizing columns to fit their contents.
    layout: TableLayoutType.FIXED,
    width: {
      size: columnWidths.reduce((sum, w) => sum + w, 0),
      type: WidthType.DXA,
    },
    rows,
  })
}

/**
 * Row heights use ATLEAST rather than EXACT: matching the PDF exactly would
 * clip any line that reflows slightly wider in Word, and silently losing text
 * is worse than a row growing a point or two.
 */
function rowHeight(ys, r) {
  return { value: toTwips(ys[r + 1] - ys[r]), rule: HeightRule.ATLEAST }
}

/** A filled block covering most of a cell becomes cell shading. */
function shadingFor(cell, blocks) {
  const area = (cell.x1 - cell.x0) * (cell.y1 - cell.y0)
  if (area <= 0) return null
  for (const block of blocks) {
    const w = Math.min(cell.x1, block.x1) - Math.max(cell.x0, block.x0)
    const h = Math.min(cell.y1, block.y1) - Math.max(cell.y0, block.y0)
    if (w > 0 && h > 0 && (w * h) / area > 0.6) {
      return block.fill ? toHex(block.fill) : 'D9D9D9'
    }
  }
  return null
}

/** Paragraphs for text that falls outside any table, keeping size and weight. */
export function looseParagraphs(items) {
  if (!items || items.length === 0) return []
  return cellParagraphs(items)
}
