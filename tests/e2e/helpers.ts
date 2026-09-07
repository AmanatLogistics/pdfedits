import path from 'node:path';
import { readFileSync } from 'node:fs';
import type { Page } from '@playwright/test';

export const FIXTURES = path.resolve(__dirname, '../fixtures');

export function fixture(name: string): string {
  return path.join(FIXTURES, name);
}

/** Uploads a fixture and waits for the first page to finish rendering. */
export async function openFixture(page: Page, name: string): Promise<void> {
  await page.goto('/');
  await page.setInputFiles('[data-testid="file-input"]', fixture(name));
  await page.waitForSelector('[data-testid="workspace"]', { timeout: 60_000 });
  await page.waitForFunction(
    () => {
      const canvas = document.querySelector<HTMLCanvasElement>('[data-page-index="0"] canvas');
      return !!canvas && canvas.width > 0 && getComputedStyle(canvas).opacity === '1';
    },
    undefined,
    { timeout: 60_000 },
  );
}

export interface ExtractedItem {
  str: string;
  x: number;
  y: number;
  size: number;
}

export interface ExtractedPage {
  width: number;
  height: number;
  items: ExtractedItem[];
}

/**
 * Reads back an exported PDF with PDF.js inside the browser under test, so the
 * assertions are made against the same renderer the editor uses.
 */
export async function inspectPdf(page: Page, bytes: Buffer): Promise<ExtractedPage[]> {
  return page.evaluate(async (data: number[]) => {
    const lib = (window as unknown as { __pdfjs: typeof import('pdfjs-dist') }).__pdfjs;
    const doc = await lib.getDocument({
      data: new Uint8Array(data),
      cMapUrl: '/pdfjs/cmaps/',
      cMapPacked: true,
      standardFontDataUrl: '/pdfjs/standard_fonts/',
    }).promise;

    const pages = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const pdfPage = await doc.getPage(i);
      const viewport = pdfPage.getViewport({ scale: 1 });
      const content = await pdfPage.getTextContent();
      const items = content.items
        .filter((it: unknown): it is { str: string; transform: number[] } => 'str' in (it as object))
        .filter((it) => it.str.trim() !== '')
        .map((it) => {
          const tx = lib.Util.transform(viewport.transform, it.transform);
          return {
            str: it.str,
            x: Math.round(tx[4] * 100) / 100,
            y: Math.round(tx[5] * 100) / 100,
            size: Math.round(Math.hypot(tx[2], tx[3]) * 100) / 100,
          };
        });
      pages.push({ width: viewport.width, height: viewport.height, items });
    }
    return pages;
  }, Array.from(bytes));
}

/** Exposes PDF.js on `window` inside the page so `inspectPdf` can use it. */
export async function exposePdfJs(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const { installMapPolyfill } = await import('/pdfjs/map-polyfill.mjs' as string);
    installMapPolyfill();
    const lib = await import('/pdfjs/pdf.min.mjs' as string);
    lib.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.entry.mjs';
    (window as unknown as { __pdfjs: unknown }).__pdfjs = lib;
  });
}

export function readFixture(name: string): Buffer {
  return readFileSync(fixture(name));
}

export interface Rgb255 {
  r: number;
  g: number;
  b: number;
}

/**
 * Renders an exported PDF page and reads back the colour at given view-space
 * points (PDF points from the page's top-left).
 *
 * This is the strongest available check that vector content — shapes, ink,
 * highlights — not only survived export but landed in the right place, since
 * none of it produces text items to inspect.
 */
export async function samplePixels(
  page: Page,
  bytes: Buffer,
  pageIndex: number,
  points: { x: number; y: number }[],
): Promise<Rgb255[]> {
  return page.evaluate(
    async ({ data, pageIndex, points }) => {
      const lib = (window as unknown as { __pdfjs: typeof import('pdfjs-dist') }).__pdfjs;
      const doc = await lib.getDocument({
        data: new Uint8Array(data),
        cMapUrl: '/pdfjs/cmaps/',
        cMapPacked: true,
        standardFontDataUrl: '/pdfjs/standard_fonts/',
      }).promise;
      const pdfPage = await doc.getPage(pageIndex + 1);

      // Render at 2x so a thin stroke covers a solid block of pixels.
      const scale = 2;
      const viewport = pdfPage.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
      // PDF pages are transparent; paint the paper white as a viewer would.
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await pdfPage.render({ canvas, canvasContext: ctx, viewport }).promise;

      return points.map((p) => {
        // Take the most saturated pixel in a small neighbourhood so that a
        // 1-2pt stroke is found even if it lands between sample points.
        let best = { r: 255, g: 255, b: 255 };
        let bestSpread = -1;
        const cx = Math.round(p.x * scale);
        const cy = Math.round(p.y * scale);
        const radius = 4;
        const x0 = Math.max(0, cx - radius);
        const y0 = Math.max(0, cy - radius);
        const w = Math.min(canvas.width - x0, radius * 2 + 1);
        const h = Math.min(canvas.height - y0, radius * 2 + 1);
        if (w <= 0 || h <= 0) return best;
        const img = ctx.getImageData(x0, y0, w, h).data;
        for (let i = 0; i < img.length; i += 4) {
          const [r, g, b] = [img[i], img[i + 1], img[i + 2]];
          // Distance from white: picks up both coloured and dark ink.
          const spread = 255 * 3 - (r + g + b);
          if (spread > bestSpread) {
            bestSpread = spread;
            best = { r, g, b };
          }
        }
        return best;
      });
    },
    { data: Array.from(bytes), pageIndex, points },
  );
}
