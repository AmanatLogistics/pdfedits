/**
 * Rebuilds a page's table structure from its ruling lines.
 *
 * The approach follows what pdf2docx does for bordered tables: collect the
 * horizontal and vertical rules, snap them into a set of grid lines, then treat
 * every rectangle between adjacent grid lines as a candidate cell. Cells are
 * merged across any edge where no rule was actually drawn, which is what turns
 * a uniform grid back into the irregular boxes a form is really made of — and
 * it means merged regions fall out of the geometry instead of being guessed.
 */

/** Grid lines closer together than this are the same line. */
const SNAP_TOLERANCE = 2.5
/** A rule must cover this fraction of an edge to count as drawn on it. */
const EDGE_COVERAGE = 0.7
/** Grid cells thinner than this are snapping artefacts. */
const MIN_CELL_SIZE = 2

/**
 * Collapses nearby coordinates into single grid lines, keeping the mean of
 * each cluster so the grid sits where the ink actually is.
 */
function snapPositions(values, tolerance = SNAP_TOLERANCE) {
  const sorted = [...values].sort((a, b) => a - b)
  const clusters = []
  for (const value of sorted) {
    const last = clusters[clusters.length - 1]
    if (last && value - last[last.length - 1] <= tolerance) last.push(value)
    else clusters.push([value])
  }
  return clusters.map((c) => c.reduce((s, v) => s + v, 0) / c.length)
}

/** How much of [from,to] along an axis is covered by the given rules. */
function coverage(rules, position, from, to, axisKey, spanFrom, spanTo) {
  const length = to - from
  if (length <= 0) return 1

  const relevant = rules.filter((r) => Math.abs(r[axisKey] - position) <= SNAP_TOLERANCE)
  if (relevant.length === 0) return 0

  // Union the covered intervals, so several abutting rules count once.
  const intervals = relevant
    .map((r) => [Math.max(r[spanFrom], from), Math.min(r[spanTo], to)])
    .filter(([a, b]) => b > a)
    .sort((a, b) => a[0] - b[0])

  let covered = 0
  let cursor = -Infinity
  for (const [a, b] of intervals) {
    const start = Math.max(a, cursor)
    if (b > start) {
      covered += b - start
      cursor = b
    }
  }
  return covered / length
}

/**
 * @typedef {object} GridCell
 * @property {number} row      top row index in the grid
 * @property {number} col      left column index
 * @property {number} rowSpan
 * @property {number} colSpan
 * @property {number} x0,y0,x1,y1   bounds in page points
 * @property {{top:boolean,right:boolean,bottom:boolean,left:boolean}} borders
 */

/**
 * Builds a table grid from extracted rules.
 *
 * @returns {null | { xs: number[], ys: number[], cells: GridCell[], bounds: object }}
 *   null when the page has too little structure to be worth treating as a table
 */
export function buildGrid(hRules, vRules, options = {}) {
  const minLines = options.minLines ?? 3

  if (hRules.length < minLines || vRules.length < minLines) return null

  const xs = snapPositions(vRules.map((r) => r.x))
  const ys = snapPositions(hRules.map((r) => r.y))

  // Extend the grid to the outer extent of the rules, so content that sits
  // just outside the outermost rule still has a cell to live in.
  const xMin = Math.min(...hRules.map((r) => r.x0), ...xs)
  const xMax = Math.max(...hRules.map((r) => r.x1), ...xs)
  const yMin = Math.min(...vRules.map((r) => r.y0), ...ys)
  const yMax = Math.max(...vRules.map((r) => r.y1), ...ys)

  if (xs[0] - xMin > SNAP_TOLERANCE) xs.unshift(xMin)
  if (xMax - xs[xs.length - 1] > SNAP_TOLERANCE) xs.push(xMax)
  if (ys[0] - yMin > SNAP_TOLERANCE) ys.unshift(yMin)
  if (yMax - ys[ys.length - 1] > SNAP_TOLERANCE) ys.push(yMax)

  // Drop grid lines that would make degenerate cells.
  const cleanXs = xs.filter((x, i) => i === 0 || x - xs[i - 1] >= MIN_CELL_SIZE)
  const cleanYs = ys.filter((y, i) => i === 0 || y - ys[i - 1] >= MIN_CELL_SIZE)

  const cols = cleanXs.length - 1
  const rows = cleanYs.length - 1
  if (cols < 1 || rows < 1) return null

  // Which edges of each grid square actually have ink on them.
  const hasTop = []
  const hasLeft = []
  for (let r = 0; r < rows; r++) {
    hasTop[r] = []
    hasLeft[r] = []
    for (let c = 0; c < cols; c++) {
      hasTop[r][c] =
        coverage(hRules, cleanYs[r], cleanXs[c], cleanXs[c + 1], 'y', 'x0', 'x1') >= EDGE_COVERAGE
      hasLeft[r][c] =
        coverage(vRules, cleanXs[c], cleanYs[r], cleanYs[r + 1], 'x', 'y0', 'y1') >= EDGE_COVERAGE
    }
  }
  const hasBottom = (r, c) =>
    coverage(hRules, cleanYs[r + 1], cleanXs[c], cleanXs[c + 1], 'y', 'x0', 'x1') >= EDGE_COVERAGE
  const hasRight = (r, c) =>
    coverage(vRules, cleanXs[c + 1], cleanYs[r], cleanYs[r + 1], 'x', 'y0', 'y1') >= EDGE_COVERAGE

  // Grow each unconsumed square right and down across missing edges. A region
  // only extends when the whole shared edge is open, which keeps regions
  // rectangular — Word cannot represent anything else.
  const consumed = Array.from({ length: rows }, () => new Array(cols).fill(false))
  const cells = []

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (consumed[r][c]) continue

      let colSpan = 1
      while (
        c + colSpan < cols &&
        !consumed[r][c + colSpan] &&
        !hasRight(r, c + colSpan - 1)
      ) {
        colSpan++
      }

      let rowSpan = 1
      grow: while (r + rowSpan < rows) {
        for (let k = 0; k < colSpan; k++) {
          if (consumed[r + rowSpan][c + k]) break grow
          if (hasBottom(r + rowSpan - 1, c + k)) break grow
        }
        // The new row must also be open across the same columns internally.
        for (let k = 1; k < colSpan; k++) {
          if (hasRight(r + rowSpan, c + k - 1)) break grow
        }
        rowSpan++
      }

      for (let rr = r; rr < r + rowSpan; rr++) {
        for (let cc = c; cc < c + colSpan; cc++) consumed[rr][cc] = true
      }

      cells.push({
        row: r,
        col: c,
        rowSpan,
        colSpan,
        x0: cleanXs[c],
        y0: cleanYs[r],
        x1: cleanXs[c + colSpan],
        y1: cleanYs[r + rowSpan],
        borders: {
          top: hasTop[r][c],
          left: hasLeft[r][c],
          bottom: hasBottom(r + rowSpan - 1, c),
          right: hasRight(r, c + colSpan - 1),
        },
      })
    }
  }

  return {
    xs: cleanXs,
    ys: cleanYs,
    cells,
    bounds: {
      x0: cleanXs[0],
      y0: cleanYs[0],
      x1: cleanXs[cleanXs.length - 1],
      y1: cleanYs[cleanYs.length - 1],
    },
  }
}

/**
 * Assigns text items to the cell that contains them.
 *
 * Items are matched on their centre point so a glyph that overhangs a rule by
 * a fraction of a point still lands in the right box.
 */
export function assignTextToCells(grid, items) {
  const assignments = new Map()
  const outside = []

  for (const item of items) {
    const cx = item.x + (item.width || 0) / 2
    const cy = item.y + (item.height || 0) / 2

    const cell = grid.cells.find(
      (c) => cx >= c.x0 && cx <= c.x1 && cy >= c.y0 && cy <= c.y1,
    )
    if (!cell) {
      outside.push(item)
      continue
    }
    const key = `${cell.row}:${cell.col}`
    if (!assignments.has(key)) assignments.set(key, [])
    assignments.get(key).push(item)
  }

  return { assignments, outside }
}
