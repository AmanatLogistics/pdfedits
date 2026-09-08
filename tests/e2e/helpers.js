import path from 'node:path'
import { readFileSync } from 'node:fs'
import { unzipSync, strFromU8 } from 'fflate'

export const FIXTURES = path.resolve(process.cwd(), 'tests/fixtures')

export function fixture(name) {
  return path.join(FIXTURES, name)
}

/** Loads a fixture into the editor and waits for the first page to render. */
export async function openEditor(page, name = 'sample.pdf') {
  await page.goto('/editor')
  await page.locator('input[type=file]').first().setInputFiles(fixture(name))
  // The canvas gets real dimensions only once PDF.js has painted the page.
  await page.waitForFunction(
    () => {
      const c = document.querySelector('canvas')
      return Boolean(c) && c.width > 100 && c.height > 100
    },
    undefined,
    { timeout: 90_000 },
  )
  // Text blocks are overlaid after extraction finishes.
  await page.waitForSelector('div[title*="Double-click"]', { timeout: 90_000 })
}

/** Replaces the text of the block containing `existing`. */
export async function editTextBlock(page, existing, replacement) {
  const target = page
    .locator('div[title*="Double-click"], [contenteditable]')
    .filter({ hasText: existing })
    .first()
  await target.dblclick()
  await page.waitForTimeout(400)
  await page.keyboard.press('Control+A')
  await page.keyboard.type(replacement)
  // Click well away from the text to commit the edit on blur.
  await page.mouse.click(1450, 1050)
  await page.waitForTimeout(600)
}

/** Clicks something that triggers a download and returns the bytes. */
export async function download(page, action) {
  const [dl] = await Promise.all([
    page.waitForEvent('download', { timeout: 90_000 }),
    action(),
  ])
  const file = await dl.path()
  return { bytes: readFileSync(file), filename: dl.suggestedFilename() }
}

/**
 * Reads a PDF back with PDF.js in Node, reporting per-page text and how many
 * images were painted.
 *
 * The image count is the load-bearing assertion for export quality: an edited
 * page that comes back with no text and one image has been flattened to a
 * bitmap, which is exactly the regression this fork exists to fix.
 */
export async function inspectPdf(bytes) {
  // The legacy build is the one that runs under Node.
  const lib = await import('pdfjs-dist/legacy/build/pdf.mjs')
  const require = (await import('node:module')).createRequire(import.meta.url)
  const pdfjsRoot = path.dirname(require.resolve('pdfjs-dist/package.json'))
  const doc = await lib.getDocument({
    data: new Uint8Array(bytes),
    useSystemFonts: false,
    // Point PDF.js at its own data files, or it warns on every page.
    standardFontDataUrl: `${path.join(pdfjsRoot, 'standard_fonts')}/`,
    cMapUrl: `${path.join(pdfjsRoot, 'cmaps')}/`,
    cMapPacked: true,
  }).promise

  const pages = []
  for (let i = 1; i <= doc.numPages; i++) {
    const p = await doc.getPage(i)
    const viewport = p.getViewport({ scale: 1 })
    const content = await p.getTextContent()
    const ops = await p.getOperatorList()
    const images = ops.fnArray.filter(
      (fn) => fn === lib.OPS.paintImageXObject || fn === lib.OPS.paintJpegXObject,
    ).length
    pages.push({
      width: viewport.width,
      height: viewport.height,
      images,
      text: content.items.map((t) => t.str).join(''),
      items: content.items
        .filter((t) => t.str.trim())
        .map((t) => {
          const tx = lib.Util.transform(viewport.transform, t.transform)
          return {
            str: t.str,
            x: Math.round(tx[4] * 100) / 100,
            y: Math.round(tx[5] * 100) / 100,
            size: Math.round(Math.hypot(tx[2], tx[3]) * 100) / 100,
          }
        }),
    })
  }
  return pages
}

/** Reads the text out of a .docx without needing Word. */
export function docxText(bytes) {
  const files = unzipSync(new Uint8Array(bytes))
  const xml = strFromU8(files['word/document.xml'])
  // Paragraph and run boundaries become newlines so structure is checkable.
  return xml
    .replace(/<w:p[ >]/g, '\n<w:p ')
    .replace(/<w:br\/>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/**
 * Reads the structure of a .docx: tables, cells, borders and merges.
 *
 * Layout fidelity is not visible in the text alone — a converted form can
 * contain every word and still be useless if the boxes are gone — so these
 * counts are what the layout tests assert on.
 */
export function docxStructure(bytes) {
  const files = unzipSync(new Uint8Array(bytes))
  const xml = strFromU8(files['word/document.xml'])
  const count = (re) => (xml.match(re) || []).length
  return {
    tables: count(/<w:tbl>/g),
    rows: count(/<w:tr[ >]/g),
    cells: count(/<w:tc>/g),
    gridCols: count(/<w:gridCol /g),
    drawnBorders: count(/w:val="single"/g),
    verticalMerges: count(/<w:vMerge/g),
    columnSpans: count(/<w:gridSpan/g),
    sections: count(/<w:sectPr>/g),
    // Runs are joined with nothing between them, matching what a reader sees.
    text: [...xml.matchAll(/<w:t(?: [^>]*)?>([^<]*)<\/w:t>/g)]
      .map((m) => m[1])
      .join('')
      .replace(/&apos;/g, "'")
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"'),
  }
}

/**
 * Reads the absolutely positioned frames out of a fixed-layout .docx.
 *
 * Positions are what "same layout" means, so the layout tests assert on these
 * coordinates directly rather than on a rendering.
 */
export function docxFrames(bytes) {
  const files = unzipSync(new Uint8Array(bytes))
  const xml = strFromU8(files['word/document.xml'])
  const pgSz = xml.match(/<w:pgSz w:w="(\d+)" w:h="(\d+)"/)

  const frames = []
  for (const m of xml.matchAll(/<w:p>[\s\S]*?<\/w:p>/g)) {
    const p = m[0]
    const fp = p.match(/<w:framePr([^>]*)\/>/)
    if (!fp) continue
    const attr = (name) => {
      const found = fp[1].match(new RegExp(`w:${name}="(-?\\d+)"`))
      // Twips back to points, which is the unit the PDF is measured in.
      return found ? Number(found[1]) / 20 : 0
    }
    const shade = p.match(/<w:shd[^>]*w:fill="([0-9A-Fa-f]{6})"/)
    const text = [...p.matchAll(/<w:t(?: [^>]*)?>([^<]*)<\/w:t>/g)]
      .map((t) => t[1])
      .join('')
      .replace(/&apos;/g, "'")
      .replace(/&amp;/g, '&')
    const size = p.match(/<w:sz w:val="(\d+)"/)
    frames.push({
      x: attr('x'),
      y: attr('y'),
      width: attr('w'),
      height: attr('h'),
      fill: shade ? `#${shade[1].toLowerCase()}` : null,
      text,
      fontSize: size ? Number(size[1]) / 2 : null,
    })
  }

  return {
    pageWidth: pgSz ? Number(pgSz[1]) / 20 : 0,
    pageHeight: pgSz ? Number(pgSz[2]) / 20 : 0,
    zeroMargins: /<w:pgMar w:top="0"[^>]*w:left="0"/.test(xml),
    frames,
    shapes: frames.filter((f) => f.fill && !f.text.trim()),
    texts: frames.filter((f) => f.text.trim()),
  }
}

/** Returns the entry names inside a zip. */
export function zipEntries(bytes) {
  return Object.keys(unzipSync(new Uint8Array(bytes)))
}
