'use client';

import { boundsOf, round } from './geometry';
import type {
  EditorElement,
  FontFamily,
  ImageAsset,
  InkElement,
  OriginalTextRun,
  Point,
  Rect,
  Rgb,
  ShapeElement,
  ShapeKind,
  TextElement,
} from './types';

export const newId = () => `el-${crypto.randomUUID()}`;

export const BLACK: Rgb = { r: 0, g: 0, b: 0 };
export const YELLOW: Rgb = { r: 1, g: 0.92, b: 0.23 };
export const RED: Rgb = { r: 0.85, g: 0.15, b: 0.15 };
export const BLUE: Rgb = { r: 0.11, g: 0.35, b: 0.85 };

/** Defaults carried between newly created elements so styling feels sticky. */
export interface ToolDefaults {
  fontSize: number;
  fontFamily: FontFamily;
  textColor: Rgb;
  strokeColor: Rgb;
  strokeWidth: number;
  fillColor: Rgb | null;
  highlightColor: Rgb;
  inkColor: Rgb;
  inkWidth: number;
}

export const DEFAULT_TOOL_SETTINGS: ToolDefaults = {
  fontSize: 14,
  fontFamily: 'sans',
  textColor: BLACK,
  strokeColor: RED,
  strokeWidth: 2,
  fillColor: null,
  highlightColor: YELLOW,
  inkColor: BLUE,
  inkWidth: 2.5,
};

export function createTextElement(
  at: Point,
  defaults: ToolDefaults,
  overrides: Partial<TextElement> = {},
): TextElement {
  const fontSize = overrides.fontSize ?? defaults.fontSize;
  return {
    id: newId(),
    type: 'text',
    x: round(at.x),
    y: round(at.y),
    width: 220,
    height: round(fontSize * 1.2),
    text: '',
    fontSize,
    fontFamily: defaults.fontFamily,
    bold: false,
    italic: false,
    color: defaults.textColor,
    align: 'left',
    lineHeight: 1.2,
    fromOriginal: false,
    ...overrides,
  };
}

/**
 * Builds an editable element from a run of text that is part of the original
 * page.
 *
 * The PDF's own glyphs cannot be removed, so the element carries a `cover`
 * rectangle painted in the page's background colour. The editor draws that
 * rectangle too, which is why the preview and the exported file agree.
 */
export function createElementFromRun(
  run: OriginalTextRun,
  backgroundColor: Rgb,
  textColor: Rgb,
): TextElement {
  // A little slack so anti-aliased glyph edges are fully covered.
  const padX = Math.max(0.5, run.fontSize * 0.06);
  const padTop = run.fontSize * 0.28;
  const padBottom = run.fontSize * 0.28;

  const lineHeight = 1.2;
  const boxHeight = run.fontSize * lineHeight;
  // Position the box so the first baseline lands exactly on the original one.
  const ascent = run.fontSize * 0.718;
  const y = run.baseline - ascent - (boxHeight - run.fontSize) / 2;

  return {
    id: newId(),
    type: 'text',
    x: round(run.rect.x),
    y: round(y),
    // Leave room to type more than the original without immediately wrapping.
    width: round(Math.max(run.rect.width + run.fontSize * 2, run.fontSize * 4)),
    height: round(boxHeight),
    text: run.text,
    fontSize: run.fontSize,
    fontFamily: run.fontFamily,
    bold: run.bold,
    italic: run.italic,
    color: textColor,
    align: 'left',
    lineHeight,
    fromOriginal: true,
    cover: {
      // Spans the full ascender-to-descender band of the original glyphs.
      rect: {
        x: round(run.rect.x - padX),
        y: round(run.baseline - ascent - padTop),
        width: round(run.rect.width + padX * 2),
        height: round(run.fontSize + padTop + padBottom),
      },
      color: backgroundColor,
    },
  };
}

export function createShapeElement(
  shape: ShapeKind,
  rect: Rect,
  defaults: ToolDefaults,
): ShapeElement {
  return {
    id: newId(),
    type: 'shape',
    shape,
    x: round(rect.x),
    y: round(rect.y),
    width: round(rect.width),
    height: round(rect.height),
    strokeColor: defaults.strokeColor,
    strokeWidth: defaults.strokeWidth,
    fillColor: shape === 'line' || shape === 'arrow' ? null : defaults.fillColor,
    opacity: 1,
  };
}

export function createHighlightElement(rect: Rect, defaults: ToolDefaults): EditorElement {
  return {
    id: newId(),
    type: 'highlight',
    x: round(rect.x),
    y: round(rect.y),
    width: round(rect.width),
    height: round(rect.height),
    color: defaults.highlightColor,
    opacity: 0.45,
  };
}

/**
 * Normalises captured pointer positions into an ink element whose strokes are
 * stored as fractions of its bounding box, so resizing is a pure box transform.
 */
export function createInkElement(
  strokes: Point[][],
  color: Rgb,
  strokeWidth: number,
  signature = false,
): InkElement | null {
  const all = strokes.flat();
  if (all.length === 0) return null;

  const bounds = boundsOf(all);
  // A perfectly straight horizontal or vertical stroke has zero extent in one
  // axis; give it the stroke width so the box stays usable.
  const width = Math.max(bounds.width, strokeWidth);
  const height = Math.max(bounds.height, strokeWidth);

  return {
    id: newId(),
    type: 'ink',
    x: round(bounds.x),
    y: round(bounds.y),
    width: round(width),
    height: round(height),
    strokes: strokes
      .filter((s) => s.length > 0)
      .map((stroke) =>
        stroke.map((p) => ({
          x: round((p.x - bounds.x) / width, 5),
          y: round((p.y - bounds.y) / height, 5),
        })),
      ),
    color,
    strokeWidth,
    opacity: 1,
    signature,
  };
}

export function createImageElement(
  asset: ImageAsset,
  at: Point,
  maxWidth: number,
  maxHeight: number,
): EditorElement {
  // Fit inside the page while preserving the aspect ratio.
  const scale = Math.min(1, maxWidth / asset.width, maxHeight / asset.height, 0.5);
  const width = Math.max(12, asset.width * scale);
  const height = Math.max(12, asset.height * scale);
  return {
    id: newId(),
    type: 'image',
    assetId: asset.id,
    x: round(Math.max(0, at.x - width / 2)),
    y: round(Math.max(0, at.y - height / 2)),
    width: round(width),
    height: round(height),
    opacity: 1,
  };
}

export const ELEMENT_LABELS: Record<EditorElement['type'], string> = {
  text: 'Text',
  image: 'Image',
  shape: 'Shape',
  highlight: 'Highlight',
  ink: 'Drawing',
};
