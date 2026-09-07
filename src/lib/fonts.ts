import { PDFDocument, PDFFont, StandardFonts } from 'pdf-lib';
import type { FontFamily } from './types';

/**
 * Font metrics shared by the on-screen preview and the PDF exporter.
 *
 * Both sides measure with the *same* pdf-lib `PDFFont` objects, so line
 * wrapping and alignment computed while editing are exactly what gets written
 * to the file. The CSS stacks below are the screen equivalents of the PDF
 * standard fonts (Arial and Helvetica share a width table, as do Courier New
 * and Courier), which keeps the rasterised preview visually in step too.
 */

export interface FontKey {
  family: FontFamily;
  bold: boolean;
  italic: boolean;
}

const STANDARD_FONTS: Record<FontFamily, Record<string, StandardFonts>> = {
  sans: {
    regular: StandardFonts.Helvetica,
    bold: StandardFonts.HelveticaBold,
    italic: StandardFonts.HelveticaOblique,
    boldItalic: StandardFonts.HelveticaBoldOblique,
  },
  serif: {
    regular: StandardFonts.TimesRoman,
    bold: StandardFonts.TimesRomanBold,
    italic: StandardFonts.TimesRomanItalic,
    boldItalic: StandardFonts.TimesRomanBoldItalic,
  },
  mono: {
    regular: StandardFonts.Courier,
    bold: StandardFonts.CourierBold,
    italic: StandardFonts.CourierOblique,
    boldItalic: StandardFonts.CourierBoldOblique,
  },
};

export const CSS_FONT_STACK: Record<FontFamily, string> = {
  sans: 'Helvetica, Arial, "Liberation Sans", sans-serif',
  serif: '"Times New Roman", Times, "Liberation Serif", serif',
  mono: '"Courier New", Courier, "Liberation Mono", monospace',
};

export const FONT_FAMILY_LABELS: Record<FontFamily, string> = {
  sans: 'Helvetica / Arial',
  serif: 'Times',
  mono: 'Courier',
};

function variantOf(key: FontKey): string {
  if (key.bold && key.italic) return 'boldItalic';
  if (key.bold) return 'bold';
  if (key.italic) return 'italic';
  return 'regular';
}

export function standardFontFor(key: FontKey): StandardFonts {
  return STANDARD_FONTS[key.family][variantOf(key)];
}

export function fontCacheKey(key: FontKey): string {
  return `${key.family}:${variantOf(key)}`;
}

/**
 * Embeds every standard font into `doc` and returns a lookup. Used both for the
 * scratch document that backs preview measurement and for the real export.
 */
export async function embedStandardFonts(
  doc: PDFDocument,
): Promise<Map<string, PDFFont>> {
  const fonts = new Map<string, PDFFont>();
  const families: FontFamily[] = ['sans', 'serif', 'mono'];
  for (const family of families) {
    for (const bold of [false, true]) {
      for (const italic of [false, true]) {
        const key = { family, bold, italic };
        fonts.set(fontCacheKey(key), await doc.embedFont(standardFontFor(key)));
      }
    }
  }
  return fonts;
}

let metricsPromise: Promise<Map<string, PDFFont>> | null = null;

/** Lazily-created measurement fonts, shared across the whole editor session. */
export function getMetricsFonts(): Promise<Map<string, PDFFont>> {
  if (!metricsPromise) {
    metricsPromise = (async () => {
      const doc = await PDFDocument.create();
      return embedStandardFonts(doc);
    })();
  }
  return metricsPromise;
}

const supportCache = new Map<string, boolean>();

/**
 * Whether a character survives WinAnsi encoding. The standard PDF fonts only
 * cover that single-byte encoding, so anything outside it (Cyrillic, CJK,
 * typographic arrows, even a literal tab) would make pdf-lib throw mid-export.
 * We probe once per character and cache the answer.
 */
export function isEncodable(font: PDFFont, char: string): boolean {
  const cacheKey = `${font.name}:${char}`;
  const cached = supportCache.get(cacheKey);
  if (cached !== undefined) return cached;
  let ok = true;
  try {
    font.widthOfTextAtSize(char, 12);
  } catch {
    ok = false;
  }
  supportCache.set(cacheKey, ok);
  return ok;
}

export interface SanitizeResult {
  text: string;
  /** Distinct characters that had to be replaced, for user-facing warnings. */
  dropped: string[];
}

/**
 * Replaces characters the standard fonts cannot encode so that export never
 * fails outright. Tabs become spaces; anything else unsupported becomes "?".
 */
export function sanitizeForFont(font: PDFFont, text: string): SanitizeResult {
  const dropped = new Set<string>();
  let out = '';
  for (const char of text) {
    if (char === '\t') {
      out += '    ';
      continue;
    }
    if (isEncodable(font, char)) {
      out += char;
    } else {
      out += '?';
      dropped.add(char);
    }
  }
  return { text: out, dropped: [...dropped] };
}

/** Width of a string, with unsupported characters already substituted. */
export function measureText(font: PDFFont, text: string, size: number): number {
  if (!text) return 0;
  return font.widthOfTextAtSize(sanitizeForFont(font, text).text, size);
}

/** Distance from the top of a line box down to the baseline. */
export function ascentAtSize(font: PDFFont, size: number): number {
  return font.heightAtSize(size, { descender: false });
}
