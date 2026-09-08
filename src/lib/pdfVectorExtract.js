/**
 * Extracts the ruling lines and filled blocks that draw a PDF's table and form
 * borders.
 *
 * PDF has no table object — a form like an air waybill is just text sitting on
 * top of a lot of thin rectangles and line segments. To rebuild that as a real
 * Word table we first have to recover those rules, which means walking the
 * page's operator list ourselves: PDF.js exposes text and images through its
 * API, but not vector graphics.
 *
 * Two details matter for correctness:
 *
 *  - A single `constructPath` can hold many independent subpaths. Using its
 *    `minMax` bounding box would merge unrelated lines into one huge rectangle,
 *    so each subpath is decomposed into its own segments.
 *  - Coordinates are in the space of the current transformation matrix, so the
 *    CTM is tracked through save/restore/transform and applied per point.
 */
import * as pdfjsLib from 'pdfjs-dist'

const OPS = pdfjsLib.OPS
const Util = pdfjsLib.Util

/** A rule counts as a line rather than a box below this thickness, in points. */
export const MAX_RULE_THICKNESS = 3.5
/** Segments shorter than this are decoration (ticks, dots), not structure. */
const MIN_RULE_LENGTH = 3
/** Tolerance for treating a segment as exactly horizontal or vertical. */
const AXIS_TOLERANCE = 0.6

function transformPoint(x, y, ctm) {
  const [px, py] = Util.applyTransform([x, y], ctm)
  return { x: px, y: py }
}

/**
 * Walks one `constructPath` argument set, yielding straight segments and
 * closed rectangles in page space.
 */
function decodePath(subOps, coords, ctm, out) {
  let c = 0
  let start = null
  let current = null

  const point = (x, y) => transformPoint(x, y, ctm)

  for (const op of subOps) {
    switch (op) {
      case OPS.moveTo: {
        current = point(coords[c], coords[c + 1])
        start = current
        c += 2
        break
      }
      case OPS.lineTo: {
        const next = point(coords[c], coords[c + 1])
        c += 2
        if (current) out.segments.push({ a: current, b: next })
        current = next
        break
      }
      case OPS.curveTo: {
        // Curves are not table structure; skip to the end point.
        current = point(coords[c + 4], coords[c + 5])
        c += 6
        break
      }
      case OPS.curveTo2:
      case OPS.curveTo3: {
        current = point(coords[c + 2], coords[c + 3])
        c += 4
        break
      }
      case OPS.closePath: {
        if (current && start) out.segments.push({ a: current, b: start })
        current = start
        break
      }
      case OPS.rectangle: {
        const [x, y, w, h] = [coords[c], coords[c + 1], coords[c + 2], coords[c + 3]]
        c += 4
        const p1 = point(x, y)
        const p2 = point(x + w, y)
        const p3 = point(x + w, y + h)
        const p4 = point(x, y + h)
        out.segments.push({ a: p1, b: p2 }, { a: p2, b: p3 }, { a: p3, b: p4 }, { a: p4, b: p1 })
        out.rects.push(boundsOfPoints([p1, p2, p3, p4]))
        current = p1
        start = p1
        break
      }
      default:
        break
    }
  }
}

function boundsOfPoints(points) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  for (const p of points) {
    if (p.x < x0) x0 = p.x
    if (p.y < y0) y0 = p.y
    if (p.x > x1) x1 = p.x
    if (p.y > y1) y1 = p.y
  }
  return { x0, y0, x1, y1, width: x1 - x0, height: y1 - y0 }
}

/**
 * @typedef {{ x: number, y0: number, y1: number, thickness: number }} VRule
 * @typedef {{ y: number, x0: number, x1: number, thickness: number }} HRule
 */

/**
 * Reads a page's vector content.
 *
 * @param {import('pdfjs-dist').PDFPageProxy} page
 * @param {object} viewport  a PDF.js viewport; its transform defines the
 *   output space (top-left origin, y down, scaled by the viewport scale)
 * @returns {Promise<{ hRules: HRule[], vRules: VRule[], blocks: object[] }>}
 */
export async function extractVectorGeometry(page, viewport) {
  const list = await page.getOperatorList()

  let ctm = viewport.transform.slice()
  const stack = []
  const hRules = []
  const vRules = []
  const blocks = []

  const addSegment = (a, b, thickness) => {
    const dx = Math.abs(a.x - b.x)
    const dy = Math.abs(a.y - b.y)
    if (dy <= AXIS_TOLERANCE && dx >= MIN_RULE_LENGTH) {
      hRules.push({
        y: (a.y + b.y) / 2,
        x0: Math.min(a.x, b.x),
        x1: Math.max(a.x, b.x),
        thickness,
      })
    } else if (dx <= AXIS_TOLERANCE && dy >= MIN_RULE_LENGTH) {
      vRules.push({
        x: (a.x + b.x) / 2,
        y0: Math.min(a.y, b.y),
        y1: Math.max(a.y, b.y),
        thickness,
      })
    }
  }

  let lineWidth = 1

  for (let i = 0; i < list.fnArray.length; i++) {
    const fn = list.fnArray[i]
    const args = list.argsArray[i]

    if (fn === OPS.save) {
      stack.push(ctm.slice())
      continue
    }
    if (fn === OPS.restore) {
      ctm = stack.pop() || viewport.transform.slice()
      continue
    }
    if (fn === OPS.transform) {
      ctm = Util.transform(ctm, args)
      continue
    }
    if (fn === OPS.setLineWidth) {
      lineWidth = args[0]
      continue
    }
    if (fn !== OPS.constructPath) continue

    // The paint operator that follows decides what this path means.
    const paint = list.fnArray[i + 1]
    const isFill = paint === OPS.fill || paint === OPS.eoFill
    const isStroke =
      paint === OPS.stroke || paint === OPS.closeStroke
    const isBoth =
      paint === OPS.fillStroke || paint === OPS.eoFillStroke || paint === OPS.closeFillStroke
    if (!isFill && !isStroke && !isBoth) continue

    const [subOps, coords] = args
    const decoded = { segments: [], rects: [] }
    decodePath(subOps, coords, ctm, decoded)
    if (decoded.segments.length === 0) continue

    // Scale the stroke width into output space so thickness stays comparable.
    const scale = Math.hypot(ctm[0], ctm[1]) || 1
    const strokeThickness = Math.max(lineWidth * scale, 0.5)

    if (isStroke || isBoth) {
      for (const seg of decoded.segments) addSegment(seg.a, seg.b, strokeThickness)
    }

    if (isFill || isBoth) {
      // A filled shape is either a thin bar acting as a rule, or a solid block
      // (shading behind a heading, a signature box, a barcode background).
      const bounds = boundsOfPoints(decoded.segments.flatMap((s) => [s.a, s.b]))
      const thin = Math.min(bounds.width, bounds.height)
      const long = Math.max(bounds.width, bounds.height)
      if (thin <= MAX_RULE_THICKNESS && long >= MIN_RULE_LENGTH) {
        if (bounds.width >= bounds.height) {
          hRules.push({
            y: (bounds.y0 + bounds.y1) / 2,
            x0: bounds.x0,
            x1: bounds.x1,
            thickness: Math.max(thin, 0.5),
          })
        } else {
          vRules.push({
            x: (bounds.x0 + bounds.x1) / 2,
            y0: bounds.y0,
            y1: bounds.y1,
            thickness: Math.max(thin, 0.5),
          })
        }
      } else if (long >= MIN_RULE_LENGTH) {
        blocks.push(bounds)
      }
    }
  }

  return { hRules, vRules, blocks }
}

/**
 * Merges rules that describe the same line.
 *
 * Forms routinely draw one visual rule as several abutting segments, and
 * hairlines land a fraction of a point apart. Without snapping, the grid picks
 * up dozens of near-duplicate columns.
 *
 * @param {Array} rules      output of extractVectorGeometry
 * @param {'h'|'v'} axis
 * @param {number} tolerance how far apart two rules can be and still be one
 */
export function mergeRules(rules, axis, tolerance = 2) {
  const pos = axis === 'h' ? 'y' : 'x'
  const from = axis === 'h' ? 'x0' : 'y0'
  const to = axis === 'h' ? 'x1' : 'y1'

  const sorted = [...rules].sort((a, b) => a[pos] - b[pos] || a[from] - b[from])
  const merged = []

  for (const rule of sorted) {
    // Look for an existing rule at the same position that this one touches or
    // overlaps, and extend it rather than adding a duplicate.
    const match = merged.find(
      (m) =>
        Math.abs(m[pos] - rule[pos]) <= tolerance &&
        rule[from] <= m[to] + tolerance &&
        rule[to] >= m[from] - tolerance,
    )
    if (match) {
      match[from] = Math.min(match[from], rule[from])
      match[to] = Math.max(match[to], rule[to])
      match.thickness = Math.max(match.thickness, rule.thickness)
    } else {
      merged.push({ ...rule })
    }
  }

  return merged
}

/**
 * Separates barcodes and similar dense bar graphics from real table rules.
 *
 * A barcode is drawn as dozens of thin parallel bars. Left in the ruling set,
 * each bar becomes a grid line, which shatters the reconstructed table into
 * sliver rows and drags the layout out of shape.
 *
 * Two properties tell a barcode apart from a form's rules, and both are needed:
 * its bars are packed within a few points of each other, where table rules are
 * a line-height or more apart; and they all span the same short stretch, where
 * table rules run the width of the box they close. Filtering on density alone
 * eats legitimate rows on a dense form.
 *
 * @param {Array} rules   rules along one axis
 * @param {'h'|'v'} axis
 * @returns {{ rules: Array, graphics: Array }} the rules worth keeping, and the
 *   bounding boxes of the clusters that were removed
 */
export function separateBarGraphics(rules, axis, options = {}) {
  const maxGap = options.maxGap ?? 6
  const minCount = options.minCount ?? 8
  const minOverlap = options.minOverlap ?? 0.7

  const pos = axis === 'h' ? 'y' : 'x'
  const from = axis === 'h' ? 'x0' : 'y0'
  const to = axis === 'h' ? 'x1' : 'y1'

  const sorted = [...rules].sort((a, b) => a[pos] - b[pos])
  const removed = new Set()
  const graphics = []

  const overlapRatio = (a, b) => {
    const shared = Math.min(a[to], b[to]) - Math.max(a[from], b[from])
    const shortest = Math.min(a[to] - a[from], b[to] - b[from])
    return shortest > 0 ? shared / shortest : 0
  }

  let i = 0
  while (i < sorted.length) {
    // Grow a run of bars that are both tightly spaced and aligned with the run.
    let j = i + 1
    while (
      j < sorted.length &&
      sorted[j][pos] - sorted[j - 1][pos] <= maxGap &&
      overlapRatio(sorted[i], sorted[j]) >= minOverlap
    ) {
      j++
    }

    if (j - i >= minCount) {
      const group = sorted.slice(i, j)
      for (const rule of group) removed.add(rule)
      const spanFrom = Math.min(...group.map((r) => r[from]))
      const spanTo = Math.max(...group.map((r) => r[to]))
      graphics.push(
        axis === 'h'
          ? { x0: spanFrom, x1: spanTo, y0: group[0][pos], y1: group[group.length - 1][pos] }
          : { x0: group[0][pos], x1: group[group.length - 1][pos], y0: spanFrom, y1: spanTo },
      )
      i = j
    } else {
      i++
    }
  }

  // A barcode's wider bars and quiet zones break the run, leaving strays behind
  // that would still each punch a grid line across the whole table. Sweep the
  // band a detected cluster occupies and take any similar short rule with it.
  for (const box of graphics) {
    const pad = maxGap * 2
    for (const rule of sorted) {
      if (removed.has(rule)) continue
      const along = axis === 'h' ? [box.y0, box.y1] : [box.x0, box.x1]
      const across = axis === 'h' ? [box.x0, box.x1] : [box.y0, box.y1]
      const withinBand = rule[pos] >= along[0] - pad && rule[pos] <= along[1] + pad
      const sameSpan =
        rule[from] >= across[0] - pad && rule[to] <= across[1] + pad
      if (withinBand && sameSpan) removed.add(rule)
    }
  }

  return { rules: rules.filter((r) => !removed.has(r)), graphics }
}
