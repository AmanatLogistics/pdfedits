import { expect, test, type Download, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { exposePdfJs, inspectPdf, openFixture, fixture, samplePixels } from './helpers';

/** Clicks at a point given in page-view coordinates (PDF points at zoom 1). */
async function clickOnPage(page: Page, pageIndex: number, x: number, y: number, options: { clickCount?: number } = {}) {
  const target = page.locator(`[data-page-index="${pageIndex}"] [data-page-id]`).first();
  const box = (await target.boundingBox())!;
  const scale = await page.evaluate((index) => {
    const el = document.querySelector(`[data-page-index="${index}"] canvas`) as HTMLElement;
    return el.getBoundingClientRect().width;
  }, pageIndex);
  const factor = scale / 595.28;
  await page.mouse.click(box.x + x * factor, box.y + y * factor, options);
}

async function pageScale(page: Page, pageIndex = 0): Promise<number> {
  return page.evaluate((index) => {
    const el = document.querySelector(`[data-page-index="${index}"] canvas`) as HTMLElement;
    return el.getBoundingClientRect().width / 595.28;
  }, pageIndex);
}

async function dragOnPage(
  page: Page,
  pageIndex: number,
  from: { x: number; y: number },
  to: { x: number; y: number },
) {
  const target = page.locator(`[data-page-index="${pageIndex}"] [data-page-id]`).first();
  const box = (await target.boundingBox())!;
  const f = await pageScale(page, pageIndex);
  await page.mouse.move(box.x + from.x * f, box.y + from.y * f);
  await page.mouse.down();
  // Intermediate moves so the pointer handlers see a real drag.
  for (let step = 1; step <= 6; step++) {
    await page.mouse.move(
      box.x + (from.x + ((to.x - from.x) * step) / 6) * f,
      box.y + (from.y + ((to.y - from.y) * step) / 6) * f,
      { steps: 2 },
    );
  }
  await page.mouse.up();
}

async function downloadBytes(page: Page): Promise<Buffer> {
  const [download]: [Download] = await Promise.all([
    page.waitForEvent('download', { timeout: 60_000 }),
    page.click('[data-testid="download"]'),
  ]);
  const path = await download.path();
  return readFileSync(path!);
}

test.describe('PDF editor end to end', () => {
  test('uploads, renders and reports page count', async ({ page }) => {
    await openFixture(page, 'sample.pdf');
    await expect(page.locator('[data-page-index]')).toHaveCount(3);
    await expect(page.getByText('Pages (3)')).toBeVisible();
  });

  test('rejects a file that is not a PDF', async ({ page }) => {
    await page.goto('/');
    await page.setInputFiles('[data-testid="file-input"]', fixture('not-a.pdf'));
    await expect(page.locator('[data-testid="upload-error"]')).toContainText(
      /not a valid PDF|too damaged/i,
    );
  });

  test('edits text that is already in the PDF and exports it', async ({ page }) => {
    await openFixture(page, 'sample.pdf');

    // "Original heading text" sits at y=700 from the bottom of an A4 page,
    // i.e. ~141.89 from the top, with an 18pt font.
    await clickOnPage(page, 0, 120, 135);

    const editor = page.locator('textarea[data-testid^="text-editor-"]');
    await expect(editor).toBeVisible();
    await expect(editor).toHaveValue(/Original heading text/);

    await editor.fill('Replaced heading!');
    await page.keyboard.press('Escape');

    await exposePdfJs(page);
    const bytes = await downloadBytes(page);
    const pages = await inspectPdf(page, bytes);

    expect(pages).toHaveLength(3);
    const text = pages[0].items.map((i) => i.str).join(' ');
    expect(text).toContain('Replaced heading!');

    // The original glyphs are still in the content stream (a PDF cannot have
    // them removed) but must be covered; check the replacement landed on the
    // same baseline so the patch lines up.
    const replaced = pages[0].items.find((i) => i.str.includes('Replaced heading!'))!;
    const original = pages[0].items.find((i) => i.str.includes('Original heading text'))!;
    expect(Math.abs(replaced.y - original.y)).toBeLessThan(1.5);
    expect(Math.abs(replaced.x - original.x)).toBeLessThan(1.5);
    expect(replaced.size).toBeCloseTo(18, 0);
  });

  test('adds a text box, shape, highlight and drawing, and exports them', async ({ page }) => {
    await openFixture(page, 'sample.pdf');

    // New text box.
    await page.click('[data-testid="tool-text"]');
    await clickOnPage(page, 0, 100, 300);
    const editor = page.locator('textarea[data-testid^="text-editor-"]');
    await expect(editor).toBeVisible();
    await editor.fill('Added by the editor');
    await page.keyboard.press('Escape');

    // Rectangle.
    await page.click('[data-testid="tool-rectangle"]');
    await dragOnPage(page, 0, { x: 100, y: 380 }, { x: 300, y: 450 });

    // Highlight.
    await page.click('[data-testid="tool-highlight"]');
    await dragOnPage(page, 0, { x: 60, y: 480 }, { x: 320, y: 500 });

    // Freehand drawing.
    await page.click('[data-testid="tool-draw"]');
    await dragOnPage(page, 0, { x: 380, y: 380 }, { x: 500, y: 470 });

    await exposePdfJs(page);
    const bytes = await downloadBytes(page);
    const pages = await inspectPdf(page, bytes);

    const text = pages[0].items.map((i) => i.str).join(' ');
    expect(text).toContain('Added by the editor');

    const added = pages[0].items.find((i) => i.str.includes('Added by the editor'))!;
    // The text box top is at y=300; the first baseline sits a little below it.
    expect(added.x).toBeCloseTo(100, 0);
    expect(added.y).toBeGreaterThan(300);
    expect(added.y).toBeLessThan(320);

    // Vector content produces no text items, so verify it by rendering the
    // exported PDF and sampling where each element was drawn.
    const [rectEdge, rectMiddle, highlight, ink, blank, originalTint] =
      await samplePixels(page, bytes, 0, [
        { x: 200, y: 380 }, // top edge of the rectangle: red stroke
        { x: 200, y: 415 }, // inside the rectangle: unfilled, so still white
        { x: 190, y: 490 }, // inside the highlight band: yellow
        { x: 440, y: 425 }, // along the freehand stroke: blue
        { x: 450, y: 210 }, // untouched area: still white
        { x: 520, y: 265 }, // the source PDF's tinted band, which must survive
      ]);

    expect(rectEdge.r).toBeGreaterThan(150);
    expect(rectEdge.g).toBeLessThan(120);
    expect(rectEdge.b).toBeLessThan(120);

    expect(rectMiddle.r).toBeGreaterThan(240);
    expect(rectMiddle.g).toBeGreaterThan(240);

    expect(highlight.r).toBeGreaterThan(200);
    expect(highlight.g).toBeGreaterThan(200);
    expect(highlight.b).toBeLessThan(200);

    expect(ink.b).toBeGreaterThan(120);
    expect(ink.b).toBeGreaterThan(ink.r + 40);

    expect(blank).toEqual({ r: 255, g: 255, b: 255 });

    // The original page content has to come through untouched.
    expect(originalTint.r).toBeCloseTo(222, -1);
    expect(originalTint.g).toBeCloseTo(235, -1);
    expect(originalTint.b).toBeCloseTo(250, -1);
  });

  test('supports undo and redo', async ({ page }) => {
    await openFixture(page, 'sample.pdf');

    await page.click('[data-testid="tool-text"]');
    await clickOnPage(page, 0, 100, 300);
    const editor = page.locator('textarea[data-testid^="text-editor-"]');
    await editor.fill('Temporary');
    await page.keyboard.press('Escape');

    await expect(page.locator('[data-element-id]')).toHaveCount(1);
    await expect(page.locator('[data-element-id]')).toContainText('Temporary');

    // Creating the box and typing into it are separate undo steps, as in any
    // editor: the first undo takes back the text, the second the box itself.
    await page.click('[data-testid="undo"]');
    await expect(page.locator('[data-element-id]')).toHaveCount(1);
    await expect(page.locator('[data-element-id]')).not.toContainText('Temporary');

    await page.click('[data-testid="undo"]');
    await expect(page.locator('[data-element-id]')).toHaveCount(0);

    await page.click('[data-testid="redo"]');
    await expect(page.locator('[data-element-id]')).toHaveCount(1);
    await page.click('[data-testid="redo"]');
    await expect(page.locator('[data-element-id]')).toContainText('Temporary');
  });

  test('reorders, rotates, duplicates and deletes pages', async ({ page }) => {
    await openFixture(page, 'sample.pdf');

    // Duplicate page 1 -> 4 pages.
    await page.locator('[data-testid="thumb-0"]').hover();
    await page.locator('[data-testid="thumb-0"] button[aria-label="Duplicate page"]').click();
    await expect(page.getByText('Pages (4)')).toBeVisible();

    // Rotate page 1.
    await page.locator('[data-testid="thumb-0"]').hover();
    await page.locator('[data-testid="thumb-0"] button[aria-label="Rotate right"]').click();

    // Delete the last page -> 3 pages.
    await page.locator('[data-testid="thumb-3"]').hover();
    await page.locator('[data-testid="thumb-3"] button[aria-label="Delete page"]').click();
    await expect(page.getByText('Pages (3)')).toBeVisible();

    await exposePdfJs(page);
    const bytes = await downloadBytes(page);
    const pages = await inspectPdf(page, bytes);

    expect(pages).toHaveLength(3);
    // The rotated first page reports swapped dimensions.
    expect(pages[0].width).toBeCloseTo(841.89, 0);
    expect(pages[0].height).toBeCloseTo(595.28, 0);
  });

  test('places an annotation correctly on a page the source already rotates', async ({ page }) => {
    await openFixture(page, 'rotated.pdf');

    await page.click('[data-testid="tool-text"]');
    // The displayed page is 841.89 x 595.28 because of the source /Rotate.
    const target = page.locator('[data-page-id]').first();
    const box = (await target.boundingBox())!;
    const factor = box.width / 841.89;
    await page.mouse.click(box.x + 200 * factor, box.y + 150 * factor);

    const editor = page.locator('textarea[data-testid^="text-editor-"]');
    await expect(editor).toBeVisible();
    await editor.fill('OnRotated');
    await page.keyboard.press('Escape');

    await exposePdfJs(page);
    const bytes = await downloadBytes(page);
    const pages = await inspectPdf(page, bytes);

    const found = pages[0].items.find((i) => i.str.includes('OnRotated'));
    expect(found, 'annotation should survive export on a rotated page').toBeTruthy();
    // It must land where it was placed, in the rotated view the user sees.
    expect(found!.x).toBeCloseTo(200, 0);
    expect(found!.y).toBeGreaterThan(150);
    expect(found!.y).toBeLessThan(170);
  });

  test('handles a 150-page document', async ({ page }) => {
    test.setTimeout(180_000);
    await openFixture(page, 'large.pdf');
    await expect(page.getByText('Pages (150)')).toBeVisible();

    await page.click('[data-testid="tool-text"]');
    await clickOnPage(page, 0, 100, 300);
    const editor = page.locator('textarea[data-testid^="text-editor-"]');
    await editor.fill('Large doc edit');
    await page.keyboard.press('Escape');

    await exposePdfJs(page);
    const bytes = await downloadBytes(page);
    const pages = await inspectPdf(page, bytes);
    expect(pages).toHaveLength(150);
    expect(pages[0].items.map((i) => i.str).join(' ')).toContain('Large doc edit');
  });

  test('hides the original glyphs behind a background-matched patch', async ({ page }) => {
    await openFixture(page, 'sample.pdf');

    // Replace the long heading with a short string: the tail of the original
    // must be covered, not left showing.
    await clickOnPage(page, 0, 120, 135);
    const editor = page.locator('textarea[data-testid^="text-editor-"]');
    await expect(editor).toBeVisible();
    await editor.fill('Hi');
    await page.keyboard.press('Escape');

    await exposePdfJs(page);
    const bytes = await downloadBytes(page);

    // x=200 is well past the end of "Hi" but inside where "heading text" was.
    const [covered] = await samplePixels(page, bytes, 0, [{ x: 200, y: 136 }]);
    expect(covered, 'the original glyphs should be painted over').toEqual({
      r: 255, g: 255, b: 255,
    });
  });

  test('samples a tinted background when patching text on a coloured row', async ({ page }) => {
    await openFixture(page, 'sample.pdf');

    // "Row on a tinted background" sits on the light blue band.
    await clickOnPage(page, 0, 120, 268);
    const editor = page.locator('textarea[data-testid^="text-editor-"]');
    await expect(editor).toBeVisible();
    await expect(editor).toHaveValue(/tinted background/);
    await editor.fill('Short');
    await page.keyboard.press('Escape');

    await exposePdfJs(page);
    const bytes = await downloadBytes(page);

    // The patch must take the band's colour, not white, or it would show as a
    // pale rectangle punched out of the row.
    const [patched] = await samplePixels(page, bytes, 0, [{ x: 210, y: 268 }]);
    expect(patched.r).toBeCloseTo(222, -1);
    expect(patched.g).toBeCloseTo(235, -1);
    expect(patched.b).toBeCloseTo(250, -1);
  });

  test('places an image and exports it', async ({ page }) => {
    await openFixture(page, 'sample.pdf');

    await page.click('[data-testid="tool-image"]');
    // The tool opens the file picker on the next click on the page.
    await clickOnPage(page, 0, 300, 400);
    await page.setInputFiles('[data-testid="image-input"]', fixture('swatch.png'));

    await expect(page.locator('[data-element-id] img')).toBeVisible();

    await exposePdfJs(page);
    const bytes = await downloadBytes(page);
    const [pixel] = await samplePixels(page, bytes, 0, [{ x: 300, y: 400 }]);
    expect(pixel.r).toBeGreaterThan(200);
    expect(pixel.g).toBeLessThan(80);
    expect(pixel.b).toBeGreaterThan(200);
  });

  test('draws and places a signature', async ({ page }) => {
    await openFixture(page, 'sample.pdf');

    await page.click('[data-testid="tool-signature"]');
    await clickOnPage(page, 0, 300, 500);

    const pad = page.locator('[data-testid="signature-pad"]');
    await expect(pad).toBeVisible();
    const box = (await pad.boundingBox())!;
    await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.6);
    await page.mouse.down();
    for (let i = 1; i <= 10; i++) {
      await page.mouse.move(
        box.x + box.width * (0.2 + 0.06 * i),
        box.y + box.height * (0.6 - 0.03 * (i % 3)),
      );
    }
    await page.mouse.up();
    await page.click('[data-testid="signature-confirm"]');

    await expect(page.locator('[data-element-id] svg path')).toBeVisible();

    await exposePdfJs(page);
    const bytes = await downloadBytes(page);
    // The signature is ink centred on the click point.
    const [pixel] = await samplePixels(page, bytes, 0, [{ x: 300, y: 500 }]);
    expect(pixel.r + pixel.g + pixel.b).toBeLessThan(600);
  });

  test('moves an element and the export follows', async ({ page }) => {
    await openFixture(page, 'sample.pdf');

    await page.click('[data-testid="tool-text"]');
    await clickOnPage(page, 0, 100, 300);
    const editor = page.locator('textarea[data-testid^="text-editor-"]');
    await editor.fill('Movable');
    await page.keyboard.press('Escape');

    // Select it, then drag it 120pt to the right and 60pt down.
    await clickOnPage(page, 0, 120, 306);
    await dragOnPage(page, 0, { x: 120, y: 306 }, { x: 240, y: 366 });

    await exposePdfJs(page);
    const bytes = await downloadBytes(page);
    const pages = await inspectPdf(page, bytes);
    const moved = pages[0].items.find((i) => i.str.includes('Movable'));
    expect(moved, 'the moved text should be in the export').toBeTruthy();
    expect(moved!.x).toBeCloseTo(220, 0);
    expect(moved!.y).toBeGreaterThan(365);
    expect(moved!.y).toBeLessThan(385);
  });

  test('resizes an element from a handle', async ({ page }) => {
    await openFixture(page, 'sample.pdf');

    await page.click('[data-testid="tool-rectangle"]');
    await dragOnPage(page, 0, { x: 100, y: 300 }, { x: 260, y: 400 });

    // The new rectangle is selected, so its handles are on screen. Drag the
    // south-east one out by 100pt in each direction.
    await dragOnPage(page, 0, { x: 260, y: 400 }, { x: 360, y: 500 });

    const size = await page.evaluate(() => {
      const el = document.querySelector('[data-element-id]') as HTMLElement;
      const r = el.getBoundingClientRect();
      return { w: r.width, h: r.height };
    });
    const scale = await pageScale(page);
    expect(size.w / scale).toBeCloseTo(260, 0);
    expect(size.h / scale).toBeCloseTo(200, 0);

    await exposePdfJs(page);
    const bytes = await downloadBytes(page);
    // The far corner of the enlarged rectangle must now carry the stroke.
    const [corner] = await samplePixels(page, bytes, 0, [{ x: 360, y: 450 }]);
    expect(corner.r).toBeGreaterThan(150);
    expect(corner.g).toBeLessThan(120);
  });

  test('wraps long text the same way in the editor and the export', async ({ page }) => {
    await openFixture(page, 'sample.pdf');

    await page.click('[data-testid="tool-text"]');
    await clickOnPage(page, 0, 80, 300);
    const editor = page.locator('textarea[data-testid^="text-editor-"]');
    await editor.fill(
      'The quick brown fox jumps over the lazy dog while the editor wraps this sentence',
    );
    await page.keyboard.press('Escape');

    // The default box is 220pt wide, so this has to break into several lines.
    const previewLines = await page.evaluate(
      () => document.querySelectorAll('[data-element-id] span').length,
    );
    expect(previewLines).toBeGreaterThan(2);

    await exposePdfJs(page);
    const bytes = await downloadBytes(page);
    const pages = await inspectPdf(page, bytes);
    const lines = pages[0].items.filter((i) => i.y > 300 && i.y < 400 && i.x > 70 && i.x < 320);

    // Same number of lines as the preview showed, each starting at the box edge.
    expect(lines).toHaveLength(previewLines);
    for (const line of lines) expect(line.x).toBeCloseTo(80, 0);

    // Baselines must be exactly one line step apart (14pt * 1.2).
    const ys = lines.map((l) => l.y).sort((a, b) => a - b);
    for (let i = 1; i < ys.length; i++) {
      expect(ys[i] - ys[i - 1]).toBeCloseTo(14 * 1.2, 1);
    }
  });
});
