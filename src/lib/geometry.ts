import type { Point, Rect } from './types';

/**
 * 2D affine matrices use the PDF/PDF.js convention: `[a, b, c, d, e, f]` maps
 * `(x, y)` to `(a·x + c·y + e, b·x + d·y + f)`.
 */
export type Matrix = [number, number, number, number, number, number];

export function applyMatrix(m: readonly number[], x: number, y: number): Point {
  return { x: m[0] * x + m[2] * y + m[4], y: m[1] * x + m[3] * y + m[5] };
}

export function invertMatrix(m: readonly number[]): Matrix {
  const det = m[0] * m[3] - m[1] * m[2];
  if (!det) throw new Error('Cannot invert a singular matrix');
  return [
    m[3] / det,
    -m[1] / det,
    -m[2] / det,
    m[0] / det,
    (m[2] * m[5] - m[3] * m[4]) / det,
    (m[1] * m[4] - m[0] * m[5]) / det,
  ];
}

/**
 * The rotation, in degrees, that `drawSvgPath`/`drawText` need in order to
 * reproduce this view-space→user-space matrix.
 *
 * pdf-lib's `drawSvgPath` emits `translate(x, y) · rotate(θ) · scale(1, -1)`,
 * and view space is exactly user space flipped in y and rotated by the page's
 * /Rotate — so the linear part is always a rotation times that same flip, and
 * a single angle reproduces it. `drawText` and `drawImage` take the same angle
 * because their local axes are the flip of view space's.
 */
export function matrixRotationDegrees(m: readonly number[]): number {
  return (Math.atan2(m[1], m[0]) * 180) / Math.PI;
}

export function normalizeRect(a: Point, b: Point): Rect {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    width: Math.abs(a.x - b.x),
    height: Math.abs(a.y - b.y),
  };
}

export function rectContains(rect: Rect, p: Point, padding = 0): boolean {
  return (
    p.x >= rect.x - padding &&
    p.x <= rect.x + rect.width + padding &&
    p.y >= rect.y - padding &&
    p.y <= rect.y + rect.height + padding
  );
}

export function boundsOf(points: Point[]): Rect {
  if (points.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Size of a page once the editor's extra rotation is applied. Rotation is a
 * display/export concern only — element coordinates always stay in the page's
 * unrotated view space, so a rotated page keeps its annotations glued to the
 * content underneath them.
 */
export function rotatedSize(
  width: number,
  height: number,
  rotation: number,
): { width: number; height: number } {
  return ((rotation % 180) + 180) % 180 === 90
    ? { width: height, height: width }
    : { width, height };
}

/**
 * Maps a point from the rotated, zoomed container that receives pointer events
 * back into the page's unrotated view space.
 */
export function containerPointToView(
  px: number,
  py: number,
  pageWidth: number,
  pageHeight: number,
  rotation: number,
  scale: number,
): Point {
  const x = px / scale;
  const y = py / scale;
  switch (((rotation % 360) + 360) % 360) {
    case 90:
      return { x: y, y: pageHeight - x };
    case 180:
      return { x: pageWidth - x, y: pageHeight - y };
    case 270:
      return { x: pageWidth - y, y: x };
    default:
      return { x, y };
  }
}

/** Rounds to a sane precision so serialized state and diffs stay readable. */
export function round(value: number, digits = 2): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
