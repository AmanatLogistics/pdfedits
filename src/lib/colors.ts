import type { Rgb } from './types';

export function hexToRgb(hex: string): Rgb {
  const value = hex.replace('#', '');
  const full =
    value.length === 3
      ? value
          .split('')
          .map((c) => c + c)
          .join('')
      : value;
  const int = parseInt(full, 16);
  if (Number.isNaN(int)) return { r: 0, g: 0, b: 0 };
  return {
    r: ((int >> 16) & 255) / 255,
    g: ((int >> 8) & 255) / 255,
    b: (int & 255) / 255,
  };
}

export function rgbToHex({ r, g, b }: Rgb): string {
  const part = (v: number) =>
    Math.round(Math.min(1, Math.max(0, v)) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${part(r)}${part(g)}${part(b)}`;
}

export function rgbToCss({ r, g, b }: Rgb, alpha = 1): string {
  const part = (v: number) => Math.round(Math.min(1, Math.max(0, v)) * 255);
  return alpha >= 1
    ? `rgb(${part(r)}, ${part(g)}, ${part(b)})`
    : `rgba(${part(r)}, ${part(g)}, ${part(b)}, ${alpha})`;
}

/**
 * Finds the dominant colour in a ring of pixels just outside `rect` on the
 * rendered page.
 *
 * This is how "editing" original text stays invisible: a PDF's baked-in glyphs
 * cannot be removed, so we cover them with a rectangle painted in whatever the
 * surrounding page colour actually is (white paper, a tinted table row, a
 * coloured callout) rather than assuming white.
 *
 * @param canvas   the page as rendered by PDF.js
 * @param rect     the glyph box, in canvas pixels
 */
export function sampleBackgroundColor(
  canvas: HTMLCanvasElement,
  rect: { x: number; y: number; width: number; height: number },
): Rgb {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const fallback: Rgb = { r: 1, g: 1, b: 1 };
  if (!ctx) return fallback;

  const pad = 3;
  const x0 = Math.max(0, Math.floor(rect.x - pad));
  const y0 = Math.max(0, Math.floor(rect.y - pad));
  const x1 = Math.min(canvas.width, Math.ceil(rect.x + rect.width + pad));
  const y1 = Math.min(canvas.height, Math.ceil(rect.y + rect.height + pad));
  if (x1 <= x0 || y1 <= y0) return fallback;

  let data: Uint8ClampedArray;
  try {
    data = ctx.getImageData(x0, y0, x1 - x0, y1 - y0).data;
  } catch {
    return fallback;
  }

  const width = x1 - x0;
  const height = y1 - y0;
  // Quantise to 4 bits per channel so anti-aliasing noise collapses into the
  // same bucket as the flat background it came from.
  const counts = new Map<number, number>();
  const isRing = (px: number, py: number) =>
    px < pad || py < pad || px >= width - pad || py >= height - pad;

  for (let py = 0; py < height; py++) {
    for (let px = 0; px < width; px++) {
      if (!isRing(px, py)) continue;
      const i = (py * width + px) * 4;
      if (data[i + 3] < 128) continue;
      const key =
        ((data[i] >> 4) << 8) | ((data[i + 1] >> 4) << 4) | (data[i + 2] >> 4);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  if (counts.size === 0) return fallback;

  let bestKey = 0;
  let bestCount = -1;
  for (const [key, count] of counts) {
    if (count > bestCount) {
      bestCount = count;
      bestKey = key;
    }
  }

  // Average the true pixel values within the winning bucket for a precise match.
  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  let n = 0;
  for (let py = 0; py < height; py++) {
    for (let px = 0; px < width; px++) {
      if (!isRing(px, py)) continue;
      const i = (py * width + px) * 4;
      if (data[i + 3] < 128) continue;
      const key =
        ((data[i] >> 4) << 8) | ((data[i + 1] >> 4) << 4) | (data[i + 2] >> 4);
      if (key !== bestKey) continue;
      sumR += data[i];
      sumG += data[i + 1];
      sumB += data[i + 2];
      n++;
    }
  }
  if (n === 0) return fallback;
  return { r: sumR / n / 255, g: sumG / n / 255, b: sumB / n / 255 };
}
