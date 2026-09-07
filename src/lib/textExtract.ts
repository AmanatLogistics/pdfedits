'use client';

import type { PDFPageProxy } from 'pdfjs-dist/types/src/display/api';
import type { PageViewport } from 'pdfjs-dist/types/src/display/page_viewport';
import { loadPdfJs } from './pdfjs';
import { round } from './geometry';
import type { FontFamily, OriginalTextRun } from './types';

interface Fragment {
  text: string;
  x: number;
  baseline: number;
  width: number;
  fontSize: number;
  fontKey: string;
  family: FontFamily;
  bold: boolean;
  italic: boolean;
}

function familyFromCss(css: string | undefined, realName: string): FontFamily {
  const haystack = `${css ?? ''} ${realName}`.toLowerCase();
  if (haystack.includes('mono') || haystack.includes('courier')) return 'mono';
  if (haystack.includes('sans')) return 'sans';
  if (haystack.includes('serif') || haystack.includes('times') || haystack.includes('roman')) {
    return 'serif';
  }
  return 'sans';
}

/**
 * Resolves the real style of a PDF font.
 *
 * PDF.js reports an internal name like `g_d0_f1` on each text item, but once a
 * page has rendered, the translated font object is available on `commonObjs`
 * and carries the true PostScript name plus bold/italic flags. We fall back to
 * sniffing the name when the font has not been resolved yet.
 */
function resolveFontStyle(
  page: PDFPageProxy,
  fontName: string,
  cssFamily: string | undefined,
): { family: FontFamily; bold: boolean; italic: boolean } {
  let realName = fontName;
  let bold: boolean | undefined;
  let italic: boolean | undefined;

  const objs = page.commonObjs as unknown as {
    has(name: string): boolean;
    get(name: string): { name?: string; bold?: boolean; italic?: boolean } | null;
  };
  try {
    if (objs.has(fontName)) {
      const font = objs.get(fontName);
      if (font) {
        realName = font.name ?? fontName;
        bold = Boolean(font.bold);
        italic = Boolean(font.italic);
      }
    }
  } catch {
    // The font is not ready yet; fall through to name-based detection.
  }

  const lower = realName.toLowerCase();
  return {
    family: familyFromCss(cssFamily, realName),
    bold: bold ?? /bold|black|heavy|semibold|demi/.test(lower),
    italic: italic ?? /italic|oblique/.test(lower),
  };
}

/** Items that are rotated, sheared or empty are not offered for inline editing. */
function isHorizontal(tx: number[]): boolean {
  return Math.abs(tx[1]) < 1e-3 && Math.abs(tx[2]) < 1e-3 && tx[0] > 0 && tx[3] < 0;
}

/**
 * Extracts the page's existing text as editable runs, in view space.
 *
 * PDF.js hands back one item per drawing operation, which frequently splits a
 * single visual line into many fragments (kerning pairs, style changes, even
 * individual words). We stitch fragments back into runs so that clicking a
 * sentence gives you the whole sentence to edit rather than one syllable.
 */
export async function extractTextRuns(
  page: PDFPageProxy,
  viewport: PageViewport,
): Promise<OriginalTextRun[]> {
  const pdfjs = await loadPdfJs();
  const content = await page.getTextContent();
  const fragments: Fragment[] = [];

  for (const item of content.items) {
    if (!('str' in item)) continue;
    const str = item.str;
    if (!str || item.width <= 0) continue;

    const tx = pdfjs.Util.transform(viewport.transform, item.transform);
    if (!isHorizontal(tx)) continue;

    // tx[3] is negative because the viewport flips the y axis; its magnitude is
    // the glyph height in view-space points.
    const fontSize = Math.abs(tx[3]) || item.height;
    if (fontSize <= 0) continue;

    const style = content.styles?.[item.fontName];
    const resolved = resolveFontStyle(page, item.fontName, style?.fontFamily);

    fragments.push({
      text: str,
      x: tx[4],
      baseline: tx[5],
      width: item.width,
      fontSize,
      fontKey: item.fontName,
      ...resolved,
    });
  }

  fragments.sort((a, b) => a.baseline - b.baseline || a.x - b.x);

  const runs: OriginalTextRun[] = [];
  let current: Fragment[] = [];

  const flush = () => {
    if (current.length === 0) return;
    const first = current[0];
    const last = current[current.length - 1];
    const text = current.map((f) => f.text).join('');
    if (text.trim() === '') {
      current = [];
      return;
    }
    const left = first.x;
    const right = last.x + last.width;
    const fontSize = Math.max(...current.map((f) => f.fontSize));
    const baseline = first.baseline;
    runs.push({
      id: `run-${runs.length}`,
      text,
      // Approximate the glyph box from the baseline: standard Latin ascenders
      // reach ~0.78em above it and descenders ~0.22em below.
      rect: {
        x: round(left),
        y: round(baseline - fontSize * 0.78),
        width: round(right - left),
        height: round(fontSize),
      },
      baseline: round(baseline),
      fontSize: round(fontSize),
      fontFamily: first.family,
      bold: first.bold,
      italic: first.italic,
    });
    current = [];
  };

  for (const fragment of fragments) {
    if (current.length === 0) {
      current = [fragment];
      continue;
    }
    const prev = current[current.length - 1];
    const sameLine = Math.abs(fragment.baseline - prev.baseline) <= prev.fontSize * 0.2;
    const sameStyle =
      fragment.fontKey === prev.fontKey &&
      Math.abs(fragment.fontSize - prev.fontSize) <= prev.fontSize * 0.06;
    const gap = fragment.x - (prev.x + prev.width);
    // A gap wider than a couple of spaces means a new column or a table cell,
    // which should stay a separate editable run.
    const adjacent = gap > -prev.fontSize * 0.5 && gap < prev.fontSize * 0.9;

    if (sameLine && sameStyle && adjacent) {
      // Restore the space that the PDF encoded as positioning rather than text.
      if (gap > prev.fontSize * 0.12 && !prev.text.endsWith(' ') && !fragment.text.startsWith(' ')) {
        prev.text += ' ';
        prev.width += gap;
      }
      current.push(fragment);
    } else {
      flush();
      current = [fragment];
    }
  }
  flush();

  return runs;
}
