import { expect, test } from '@playwright/test'
import { docxStructure, docxText, download, editTextBlock, fixture, inspectPdf, openEditor, zipEntries } from './helpers.js'
import { unzipSync, strFromU8 } from 'fflate'

test.describe('PDF export', () => {
  test('opens a PDF and shows its text as editable blocks', async ({ page }) => {
    await openEditor(page)
    await expect(
      page.locator('div[title*="Double-click"]').filter({ hasText: 'Original heading text' }),
    ).toHaveCount(1)
  })

  /**
   * The regression this fork was made for: upstream rasterised every edited
   * page, so the export stopped being a text document.
   */
  test('keeps edited pages as real text instead of flattening them to an image', async ({ page }) => {
    await openEditor(page)
    await editTextBlock(page, 'Original heading text', 'REPLACED HEADING')

    const { bytes } = await download(page, () =>
      page.locator('button', { hasText: /Download PDF/i }).first().click(),
    )
    const pages = await inspectPdf(bytes)

    expect(pages).toHaveLength(3)
    expect(pages[0].text).toContain('REPLACED HEADING')
    // The edited page must still be text, with no page-sized bitmap.
    expect(pages[0].images, 'edited page must not be rasterised').toBe(0)
    expect(pages[0].items.length).toBeGreaterThan(3)
    // Untouched pages keep their own text too.
    expect(pages[1].text).toContain('Invoice 1001')
    expect(pages[1].images).toBe(0)
  })

  test('places replacement text at the original position and size', async ({ page }) => {
    await openEditor(page)
    await editTextBlock(page, 'Original heading text', 'REPLACED HEADING')

    const { bytes } = await download(page, () =>
      page.locator('button', { hasText: /Download PDF/i }).first().click(),
    )
    const pages = await inspectPdf(bytes)

    const replaced = pages[0].items.find((i) => i.str.includes('REPLACED HEADING'))
    const original = pages[0].items.find((i) => i.str.includes('Original heading text'))
    expect(replaced, 'replacement text should be present').toBeTruthy()
    expect(replaced.x).toBeCloseTo(original.x, 0)
    expect(replaced.y).toBeCloseTo(original.y, 0)
    expect(replaced.size).toBeCloseTo(original.size, 0)
  })

  test('exports an unedited PDF without bloating it', async ({ page }) => {
    await openEditor(page)
    const { bytes } = await download(page, () =>
      page.locator('button', { hasText: /Download PDF/i }).first().click(),
    )
    // Upstream produced ~20x the original size once a page was rasterised.
    expect(bytes.length).toBeLessThan(20_000)
    const pages = await inspectPdf(bytes)
    expect(pages.every((p) => p.images === 0)).toBe(true)
  })
})

test.describe('Document export', () => {
  test('offers flattening as an explicit choice, not the default', async ({ page }) => {
    await openEditor(page)
    await editTextBlock(page, 'Original heading text', 'REPLACED HEADING')

    const { bytes, filename } = await download(page, () =>
      page.locator('[data-testid="export-flat"]').click(),
    )
    expect(filename).toMatch(/flattened\.pdf$/)

    const pages = await inspectPdf(bytes)
    // This path deliberately rasterises: the edited page becomes one image.
    expect(pages[0].images).toBe(1)
    expect(pages[0].items).toHaveLength(0)
  })

  test('exports a real .docx containing the edited text', async ({ page }) => {
    await openEditor(page)
    await editTextBlock(page, 'Original heading text', 'REPLACED HEADING')

    const { bytes, filename } = await download(page, () =>
      page.locator('[data-testid="export-docx"]').click(),
    )
    expect(filename).toMatch(/\.docx$/)

    // A .docx is a zip of OOXML parts; check it really is one.
    const entries = zipEntries(bytes)
    expect(entries).toContain('word/document.xml')
    expect(entries).toContain('[Content_Types].xml')

    const text = docxText(bytes)
    expect(text).toContain('REPLACED HEADING')
    expect(text).toContain('Invoice 1000')
    // All three pages should be represented.
    expect(text).toContain('Invoice 1001')
    expect(text).toContain('Invoice 1002')
    // The edit replaces the original rather than sitting beside it. The
    // fixture repeats that heading on all three pages and only page 1 was
    // edited, so exactly two occurrences should survive.
    expect(text.split('Original heading text')).toHaveLength(3)
  })

  test('exports plain text with the edit applied', async ({ page }) => {
    await openEditor(page)
    await editTextBlock(page, 'Original heading text', 'REPLACED HEADING')

    const { bytes, filename } = await download(page, () =>
      page.locator('[data-testid="export-txt"]').click(),
    )
    expect(filename).toMatch(/\.txt$/)

    const text = Buffer.from(bytes).toString('utf8')
    expect(text).toContain('REPLACED HEADING')
    expect(text).toContain('Amount due: 1234.56')

    // Pages are separated by a form feed.
    const [first, ...rest] = text.split('\f')
    expect(rest).toHaveLength(2)
    // Only the edited page loses the original heading.
    expect(first).toContain('REPLACED HEADING')
    expect(first).not.toContain('Original heading text')
    expect(rest[0]).toContain('Original heading text')
  })

  test('exports page images as a zip for a multi-page document', async ({ page }) => {
    await openEditor(page)

    const { bytes, filename } = await download(page, () =>
      page.locator('[data-testid="export-png"]').click(),
    )
    expect(filename).toMatch(/\.zip$/)

    const entries = zipEntries(bytes).filter((n) => n.endsWith('.png'))
    expect(entries).toHaveLength(3)
    expect(entries[0]).toMatch(/page-001\.png$/)
  })

  test('exports a single page as a plain PNG', async ({ page }) => {
    await openEditor(page, 'rotated.pdf')

    const { bytes, filename } = await download(page, () =>
      page.locator('[data-testid="export-png"]').click(),
    )
    expect(filename).toMatch(/\.png$/)
    // PNG magic number.
    expect(Buffer.from(bytes.subarray(0, 8))).toEqual(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    )
  })

  test('handles a long document', async ({ page }) => {
    test.setTimeout(240_000)
    await openEditor(page, 'large.pdf')

    const { bytes } = await download(page, () =>
      page.locator('[data-testid="export-txt"]').click(),
    )
    const text = Buffer.from(bytes).toString('utf8')
    expect(text).toContain('Page 1 of the long document')
    expect(text).toContain('Page 60 of the long document')
  })
})

test.describe('DOCX layout fidelity', () => {
  /**
   * The complaint this addresses: a converted form used to arrive as bare
   * text, with every box and border gone. A form must come back as a real
   * Word table.
   */
  test('rebuilds a bordered form as a Word table, not loose text', async ({ page }) => {
    await openEditor(page, 'form.pdf')

    const { bytes } = await download(page, () =>
      page.locator('[data-testid="export-docx"]').click(),
    )
    const s = docxStructure(bytes)

    expect(s.tables, 'the form should become a table').toBeGreaterThanOrEqual(1)
    expect(s.cells).toBeGreaterThan(10)
    expect(s.drawnBorders, 'cells should carry real Word borders').toBeGreaterThan(20)
    // Boxes that span several grid columns or rows must come back merged.
    expect(s.columnSpans + s.verticalMerges).toBeGreaterThan(0)

    // And the content is still all there.
    expect(s.text).toContain('Shipper Name and Address')
    expect(s.text).toContain('ACME FREIGHT LTD')
    expect(s.text).toContain('LONDON HEATHROW')
    expect(s.text).toContain('Total Charges Due Carrier')
  })

  test('keeps a barcode from shattering the table into sliver rows', async ({ page }) => {
    await openEditor(page, 'form.pdf')

    const { bytes } = await download(page, () =>
      page.locator('[data-testid="export-docx"]').click(),
    )
    const s = docxStructure(bytes)

    // The fixture's barcode is 40 tightly spaced bars. Treated as rules they
    // would each add a row; the form itself has only five.
    expect(s.rows, 'barcode bars must not become table rows').toBeLessThan(20)
  })

  test('still uses flowing paragraphs for a page with no table structure', async ({ page }) => {
    await openEditor(page, 'sample.pdf')

    const { bytes } = await download(page, () =>
      page.locator('[data-testid="export-docx"]').click(),
    )
    const s = docxStructure(bytes)

    // sample.pdf is prose with a single tinted band — no grid to recover, so
    // forcing it into a table would be worse than leaving it as paragraphs.
    expect(s.tables).toBe(0)
    expect(s.text).toContain('Invoice 1000')
  })

  test('gives each page its own section at the original page size', async ({ page }) => {
    await openEditor(page, 'form.pdf')

    const { bytes } = await download(page, () =>
      page.locator('[data-testid="export-docx"]').click(),
    )
    const files = unzipSync(new Uint8Array(bytes))
    const xml = strFromU8(files['word/document.xml'])
    // A4 is 595.28 x 841.89pt, which is 11906 x 16838 twips.
    expect(xml).toMatch(/w:w="119\d\d"/)
    expect(xml).toMatch(/w:h="168\d\d"/)
  })
})
