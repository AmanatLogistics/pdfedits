/**
 * Core document model.
 *
 * Every geometric value in this file lives in "view space": PDF points, origin
 * at the top-left of the page as the viewer displays it (so the page's own
 * /Rotate is already applied), x to the right and y downwards. This is the one
 * coordinate system the whole app shares — the renderer scales it by the zoom
 * factor, and the exporter maps it back into PDF user space with the inverse
 * viewport matrix captured at load time. Keeping a single canonical space is
 * what makes the exported PDF line up with the on-screen preview.
 */

export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** sRGB components in the 0..1 range, matching pdf-lib's `rgb()`. */
export interface Rgb {
  r: number;
  g: number;
  b: number;
}

/** The three font families that map onto PDF's built-in standard fonts. */
export type FontFamily = 'sans' | 'serif' | 'mono';

export type TextAlign = 'left' | 'center' | 'right';

export interface ElementBase {
  id: string;
  /** Bounding box in view space. */
  x: number;
  y: number;
  width: number;
  height: number;
  /** Set once an element has been locked from accidental edits. */
  locked?: boolean;
}

/**
 * A text block. `cover` is set when this element replaces text that was baked
 * into the original page: the exporter (and the preview) paint that rectangle
 * in the sampled page-background colour first, which is how "editing" original
 * text works given that a PDF's existing glyphs cannot be mutated in place.
 */
export interface TextElement extends ElementBase {
  type: 'text';
  text: string;
  fontSize: number;
  fontFamily: FontFamily;
  bold: boolean;
  italic: boolean;
  color: Rgb;
  align: TextAlign;
  /** Multiple of the font size used as the baseline-to-baseline distance. */
  lineHeight: number;
  /** True when this element was derived from text already present in the PDF. */
  fromOriginal: boolean;
  cover?: { rect: Rect; color: Rgb };
}

export interface ImageElement extends ElementBase {
  type: 'image';
  assetId: string;
  opacity: number;
}

export type ShapeKind = 'rectangle' | 'ellipse' | 'line' | 'arrow';

export interface ShapeElement extends ElementBase {
  type: 'shape';
  shape: ShapeKind;
  strokeColor: Rgb;
  strokeWidth: number;
  /** `null` means no fill (stroke only). */
  fillColor: Rgb | null;
  opacity: number;
}

export interface HighlightElement extends ElementBase {
  type: 'highlight';
  color: Rgb;
  opacity: number;
}

/**
 * Freehand ink — used both by the pen tool and by signatures. Strokes are
 * stored in normalised element-local coordinates (0..1 across the bounding
 * box) so that moving and resizing the element is a pure box transform.
 */
export interface InkElement extends ElementBase {
  type: 'ink';
  strokes: Point[][];
  color: Rgb;
  strokeWidth: number;
  opacity: number;
  /** Signatures behave like ink but get their own label and default styling. */
  signature: boolean;
}

export type EditorElement =
  | TextElement
  | ImageElement
  | ShapeElement
  | HighlightElement
  | InkElement;

export type ElementType = EditorElement['type'];

/**
 * A run of text found in the original PDF, grouped from the fragments PDF.js
 * reports. These are not part of the editable document — they are the hit
 * targets that let a click on existing text turn into a TextElement.
 */
export interface OriginalTextRun {
  id: string;
  text: string;
  /** Bounding box of the glyphs, view space. */
  rect: Rect;
  /** y of the text baseline, view space. */
  baseline: number;
  fontSize: number;
  fontFamily: FontFamily;
  bold: boolean;
  italic: boolean;
}

export interface PageState {
  id: string;
  /** Index of the page in the uploaded document; several pages may share one. */
  sourceIndex: number;
  /** View-space page size in points. */
  width: number;
  height: number;
  /** Extra rotation applied in the editor, in degrees clockwise (0/90/180/270). */
  rotation: number;
  elements: EditorElement[];
}

/** Immutable per-source-page data derived once at load time. */
export interface SourcePage {
  index: number;
  width: number;
  height: number;
  /**
   * Maps view space to PDF user space. Captured from the PDF.js viewport so it
   * accounts for the page's /Rotate and any CropBox offset.
   */
  inverseTransform: number[];
}

export interface ImageAsset {
  id: string;
  /** PNG or JPEG bytes, ready for pdf-lib to embed. */
  bytes: Uint8Array;
  mimeType: 'image/png' | 'image/jpeg';
  width: number;
  height: number;
  objectUrl: string;
}

/** The part of the editor state that undo/redo snapshots. */
export interface DocumentState {
  pages: PageState[];
}

export type ToolId =
  | 'select'
  | 'text'
  | 'image'
  | 'draw'
  | 'highlight'
  | 'rectangle'
  | 'ellipse'
  | 'line'
  | 'arrow'
  | 'signature';
