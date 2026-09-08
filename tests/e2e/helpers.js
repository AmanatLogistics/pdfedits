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

/** Returns the entry names inside a zip. */
export function zipEntries(bytes) {
  return Object.keys(unzipSync(new Uint8Array(bytes)))
}
