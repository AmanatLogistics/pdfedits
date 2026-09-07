import type { PDFFont } from 'pdf-lib';
import { ascentAtSize, measureText, sanitizeForFont } from './fonts';
import type { TextAlign, TextElement } from './types';

export interface LaidOutLine {
  text: string;
  width: number;
  /** x offset inside the element box, honouring alignment. */
  x: number;
  /** Baseline y offset inside the element box. */
  baseline: number;
}

export interface TextLayout {
  lines: LaidOutLine[];
  /** Total height the text occupies; drives auto-growing the element box. */
  height: number;
  /** Width of the widest line, used when auto-sizing a new text box. */
  maxWidth: number;
  /** Characters that cannot be encoded and were substituted with "?". */
  dropped: string[];
}

/**
 * Greedy word wrap using pdf-lib's own metrics.
 *
 * The exporter and the preview both call this, which is what guarantees the
 * downloaded PDF breaks lines in the same places as the editor showed.
 */
function wrapParagraph(
  font: PDFFont,
  paragraph: string,
  size: number,
  maxWidth: number,
): string[] {
  if (paragraph === '') return [''];
  // No usable width to wrap into: keep the paragraph on one line.
  if (!(maxWidth > 0)) return [paragraph];

  const lines: string[] = [];
  // Split on spaces but keep them attached to the preceding word so that
  // measuring a candidate line matches what actually gets drawn.
  const words = paragraph.split(/(?<=\s)/);
  let current = '';

  for (const word of words) {
    const candidate = current + word;
    if (current !== '' && measureText(font, candidate.trimEnd(), size) > maxWidth) {
      lines.push(current.trimEnd());
      current = word.trimStart();
    } else {
      current = candidate;
    }

    // A single word longer than the box still has to be broken somewhere.
    while (measureText(font, current.trimEnd(), size) > maxWidth && current.trim().length > 1) {
      let fit = current.length - 1;
      while (fit > 1 && measureText(font, current.slice(0, fit), size) > maxWidth) fit--;
      lines.push(current.slice(0, fit));
      current = current.slice(fit);
    }
  }
  lines.push(current.trimEnd());
  return lines;
}

function alignOffset(align: TextAlign, boxWidth: number, lineWidth: number): number {
  if (align === 'center') return (boxWidth - lineWidth) / 2;
  if (align === 'right') return boxWidth - lineWidth;
  return 0;
}

/**
 * Lays out a text element inside its box. Returns positions in view-space
 * points relative to the element's top-left corner.
 */
export function layoutText(
  element: Pick<
    TextElement,
    'text' | 'fontSize' | 'align' | 'lineHeight' | 'width'
  >,
  font: PDFFont,
  widthOverride?: number,
): TextLayout {
  const { text: safeText, dropped } = sanitizeForFont(font, element.text);
  const size = element.fontSize;
  const boxWidth = widthOverride ?? element.width;
  const lineStep = size * element.lineHeight;
  const ascent = ascentAtSize(font, size);

  const lines: LaidOutLine[] = [];
  let maxWidth = 0;

  for (const paragraph of safeText.split('\n')) {
    for (const lineText of wrapParagraph(font, paragraph, size, boxWidth)) {
      const width = lineText ? font.widthOfTextAtSize(lineText, size) : 0;
      maxWidth = Math.max(maxWidth, width);
      lines.push({
        text: lineText,
        width,
        x: alignOffset(element.align, boxWidth, width),
        // The extra leading of a line box sits above the ascender, matching how
        // browsers centre a line inside `line-height`.
        baseline: lines.length * lineStep + (lineStep - size) / 2 + ascent,
      });
    }
  }

  return {
    lines,
    height: Math.max(lines.length * lineStep, lineStep),
    maxWidth,
    dropped,
  };
}
