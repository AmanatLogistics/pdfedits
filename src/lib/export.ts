'use client';

import {
  BlendMode,
  LineCapStyle,
  PDFDocument,
  PDFFont,
  PDFPage,
  degrees,
  rgb,
} from 'pdf-lib';
import { applyMatrix, matrixRotationDegrees } from './geometry';
import { embedStandardFonts, fontCacheKey, sanitizeForFont } from './fonts';
import { layoutText } from './textLayout';
import type {
  EditorElement,
  ImageAsset,
  InkElement,
  PageState,
  Point,
  Rect,
  Rgb,
  ShapeElement,
  SourcePage,
  TextElement,
} from './types';

export interface ExportInput {
  /** The bytes of the PDF the user uploaded. */
  originalBytes: Uint8Array;
  pages: PageState[];
  sourcePages: Map<number, SourcePage>;
  assets: Map<string, ImageAsset>;
}

export interface ExportResult {
  bytes: Uint8Array;
  /** Characters that had to be substituted because the standard fonts lack them. */
  droppedCharacters: string[];
}

const toColor = (c: Rgb) => rgb(c.r, c.g, c.b);

/**
 * Everything the exporter needs to place view-space geometry onto a PDF page.
 *
 * `anchor` is where view-space (0, 0) lands in PDF user space, and `angle` is
 * the single rotation that reproduces the view→user mapping for pdf-lib's
 * drawing calls. See `matrixRotationDegrees` for why one angle suffices.
 */
interface PagePlacement {
  page: PDFPage;
  inverse: number[];
  anchor: Point;
  angle: number;
}

function placementFor(page: PDFPage, source: SourcePage): PagePlacement {
  const inverse = source.inverseTransform;
  return {
    page,
    inverse,
    anchor: applyMatrix(inverse, 0, 0),
    angle: matrixRotationDegrees(inverse),
  };
}

/** Maps a view-space point into PDF user space. */
function toUser(placement: PagePlacement, x: number, y: number): Point {
  return applyMatrix(placement.inverse, x, y);
}

/**
 * Draws an SVG path expressed in raw view-space coordinates.
 *
 * pdf-lib emits `translate(x, y) · rotate(θ) · scale(1, -1)` for SVG paths,
 * which is exactly the view→user mapping once anchored at view-space (0, 0) —
 * so path data can be handed over untouched.
 */
function drawViewPath(
  placement: PagePlacement,
  path: string,
  options: Parameters<PDFPage['drawSvgPath']>[1],
): void {
  placement.page.drawSvgPath(path, {
    ...options,
    x: placement.anchor.x,
    y: placement.anchor.y,
    rotate: degrees(placement.angle),
  });
}

function rectPath(r: Rect): string {
  return `M ${r.x} ${r.y} H ${r.x + r.width} V ${r.y + r.height} H ${r.x} Z`;
}

function ellipsePath(r: Rect): string {
  const rx = r.width / 2;
  const ry = r.height / 2;
  const cx = r.x + rx;
  const cy = r.y + ry;
  // Two arcs, because a single 360° arc is degenerate in SVG.
  return (
    `M ${cx - rx} ${cy} ` +
    `A ${rx} ${ry} 0 1 0 ${cx + rx} ${cy} ` +
    `A ${rx} ${ry} 0 1 0 ${cx - rx} ${cy} Z`
  );
}

/** Converts normalised ink strokes into a view-space SVG path. */
export function inkPath(element: InkElement): string {
  const parts: string[] = [];
  for (const stroke of element.strokes) {
    if (stroke.length === 0) continue;
    const toView = (p: Point) => ({
      x: element.x + p.x * element.width,
      y: element.y + p.y * element.height,
    });
    const first = toView(stroke[0]);
    if (stroke.length === 1) {
      // A dot: draw a hairline segment so it is still visible.
      parts.push(`M ${first.x} ${first.y} L ${first.x + 0.01} ${first.y}`);
      continue;
    }
    parts.push(`M ${first.x} ${first.y}`);
    for (let i = 1; i < stroke.length; i++) {
      const p = toView(stroke[i]);
      parts.push(`L ${p.x} ${p.y}`);
    }
  }
  return parts.join(' ');
}

/** The arrow head for the arrow shape, as a view-space path. */
function arrowPath(element: ShapeElement): string {
  const from = { x: element.x, y: element.y };
  const to = { x: element.x + element.width, y: element.y + element.height };
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  const size = Math.max(6, element.strokeWidth * 3.5);
  const wing = (offset: number) => ({
    x: to.x - size * Math.cos(angle - offset),
    y: to.y - size * Math.sin(angle - offset),
  });
  const a = wing(Math.PI / 7);
  const b = wing(-Math.PI / 7);
  return (
    `M ${from.x} ${from.y} L ${to.x} ${to.y} ` +
    `M ${a.x} ${a.y} L ${to.x} ${to.y} L ${b.x} ${b.y}`
  );
}

function drawText(
  placement: PagePlacement,
  element: TextElement,
  fonts: Map<string, PDFFont>,
  dropped: Set<string>,
): void {
  const font = fonts.get(
    fontCacheKey({
      family: element.fontFamily,
      bold: element.bold,
      italic: element.italic,
    }),
  );
  if (!font) return;

  // Cover the original glyphs first when this element replaces baked-in text.
  if (element.cover) {
    drawViewPath(placement, rectPath(element.cover.rect), {
      color: toColor(element.cover.color),
      borderWidth: 0,
    });
  }

  const layout = layoutText(element, font);
  for (const char of layout.dropped) dropped.add(char);

  for (const line of layout.lines) {
    if (!line.text) continue;
    const { text } = sanitizeForFont(font, line.text);
    const origin = toUser(
      placement,
      element.x + line.x,
      element.y + line.baseline,
    );
    placement.page.drawText(text, {
      x: origin.x,
      y: origin.y,
      font,
      size: element.fontSize,
      color: toColor(element.color),
      rotate: degrees(placement.angle),
    });
  }
}

async function drawImage(
  doc: PDFDocument,
  placement: PagePlacement,
  element: { x: number; y: number; width: number; height: number; assetId: string; opacity: number },
  assets: Map<string, ImageAsset>,
  embedded: Map<string, Awaited<ReturnType<PDFDocument['embedPng']>>>,
): Promise<void> {
  const asset = assets.get(element.assetId);
  if (!asset) return;

  let image = embedded.get(asset.id);
  if (!image) {
    image =
      asset.mimeType === 'image/jpeg'
        ? await doc.embedJpg(asset.bytes)
        : await doc.embedPng(asset.bytes);
    embedded.set(asset.id, image);
  }

  // pdf-lib anchors an image at its bottom-left and extends it along the
  // rotated axes, so the anchor is the view-space *bottom*-left corner.
  const origin = toUser(placement, element.x, element.y + element.height);
  placement.page.drawImage(image, {
    x: origin.x,
    y: origin.y,
    width: element.width,
    height: element.height,
    rotate: degrees(placement.angle),
    opacity: element.opacity,
  });
}

function drawShape(placement: PagePlacement, element: ShapeElement): void {
  const common = {
    borderWidth: element.strokeWidth,
    borderColor: toColor(element.strokeColor),
    borderOpacity: element.opacity,
    opacity: element.opacity,
    borderLineCap: LineCapStyle.Round,
  };
  const fill = element.fillColor ? { color: toColor(element.fillColor) } : {};

  switch (element.shape) {
    case 'rectangle':
      drawViewPath(placement, rectPath(element), { ...common, ...fill });
      break;
    case 'ellipse':
      drawViewPath(placement, ellipsePath(element), { ...common, ...fill });
      break;
    case 'line':
      drawViewPath(
        placement,
        `M ${element.x} ${element.y} L ${element.x + element.width} ${element.y + element.height}`,
        common,
      );
      break;
    case 'arrow':
      drawViewPath(placement, arrowPath(element), common);
      break;
  }
}

async function drawElement(
  doc: PDFDocument,
  placement: PagePlacement,
  element: EditorElement,
  fonts: Map<string, PDFFont>,
  assets: Map<string, ImageAsset>,
  embedded: Map<string, Awaited<ReturnType<PDFDocument['embedPng']>>>,
  dropped: Set<string>,
): Promise<void> {
  switch (element.type) {
    case 'text':
      drawText(placement, element, fonts, dropped);
      break;
    case 'image':
      await drawImage(doc, placement, element, assets, embedded);
      break;
    case 'shape':
      drawShape(placement, element);
      break;
    case 'highlight':
      // Multiply keeps the text underneath readable, like a real marker pen.
      drawViewPath(placement, rectPath(element), {
        color: toColor(element.color),
        opacity: element.opacity,
        borderWidth: 0,
        blendMode: BlendMode.Multiply,
      });
      break;
    case 'ink': {
      const path = inkPath(element);
      if (path) {
        drawViewPath(placement, path, {
          borderColor: toColor(element.color),
          borderWidth: element.strokeWidth,
          borderOpacity: element.opacity,
          borderLineCap: LineCapStyle.Round,
        });
      }
      break;
    }
  }
}

/**
 * Builds the edited PDF.
 *
 * The original pages are copied wholesale with `copyPages`, which preserves
 * their content streams, fonts and resources exactly; edits are then drawn on
 * top. Page order, duplication and deletion fall out of the order in which we
 * copy, and rotation is applied with `setRotation` so that annotations — being
 * part of the page content — rotate along with the page.
 */
export async function exportPdf(input: ExportInput): Promise<ExportResult> {
  const { originalBytes, pages, sourcePages, assets } = input;

  const source = await PDFDocument.load(originalBytes, {
    // Some PDFs are encrypted with an empty owner password; we are only
    // reading pages the user already opened, so decryption is expected here.
    ignoreEncryption: true,
  });
  const out = await PDFDocument.create();
  out.setProducer('Browser PDF Editor');
  out.setCreator('Browser PDF Editor');

  const fonts = await embedStandardFonts(out);
  const embeddedImages = new Map<string, Awaited<ReturnType<PDFDocument['embedPng']>>>();
  const dropped = new Set<string>();

  // Copy the pages in output order. pdf-lib's object copier memoises by
  // reference within a single `copyPages` call, so a page that the user
  // duplicated is copied through its own call: that gives it a fresh copier and
  // therefore a genuinely independent page object, rather than a second
  // reference to the first copy that would share (and duplicate) its edits.
  const firstOccurrence = [...new Set(pages.map((p) => p.sourceIndex))];
  const shared = await out.copyPages(source, firstOccurrence);
  const unusedCopies = new Map(firstOccurrence.map((index, i) => [index, shared[i]]));

  for (const pageState of pages) {
    const sourcePage = sourcePages.get(pageState.sourceIndex);
    if (!sourcePage) continue;

    let page = unusedCopies.get(pageState.sourceIndex);
    if (page) {
      unusedCopies.delete(pageState.sourceIndex);
    } else {
      [page] = await out.copyPages(source, [pageState.sourceIndex]);
    }

    const baseRotation = page.getRotation().angle;
    out.addPage(page);

    if (pageState.rotation % 360 !== 0) {
      page.setRotation(degrees(((baseRotation + pageState.rotation) % 360 + 360) % 360));
    }

    const placement = placementFor(page, sourcePage);
    for (const element of pageState.elements) {
      await drawElement(out, placement, element, fonts, assets, embeddedImages, dropped);
    }
  }

  const bytes = await out.save({ useObjectStreams: true });
  return { bytes, droppedCharacters: [...dropped] };
}
