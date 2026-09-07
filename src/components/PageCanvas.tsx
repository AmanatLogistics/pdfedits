'use client';

import { memo, useEffect, useRef, useState } from 'react';
import type { PDFDocumentProxy, PDFPageProxy } from '@/lib/pdfjs';
import { PDFJS_DATA_OPTIONS } from '@/lib/pdfjs';

/** Caps backing-store resolution so a 400% zoom on A3 cannot exhaust memory. */
const MAX_CANVAS_PIXELS = 24_000_000;

interface Props {
  pdf: PDFDocumentProxy;
  sourceIndex: number;
  /** Unrotated page size in points. */
  width: number;
  height: number;
  scale: number;
  /** Rendering is skipped entirely while a page is far off-screen. */
  active: boolean;
  onCanvasReady?: (canvas: HTMLCanvasElement | null, page: PDFPageProxy) => void;
}

/**
 * Renders one PDF page to a canvas.
 *
 * Kept separate and memoised so that adding or dragging an annotation never
 * re-rasterises the page underneath it.
 */
function PageCanvasImpl({
  pdf,
  sourceIndex,
  width,
  height,
  scale,
  active,
  onCanvasReady,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rendered, setRendered] = useState(false);
  // Held in a ref so a new callback identity does not re-trigger rendering.
  const readyRef = useRef(onCanvasReady);
  useEffect(() => {
    readyRef.current = onCanvasReady;
  }, [onCanvasReady]);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    let cancelled = false;
    let task: { cancel: () => void } | null = null;

    (async () => {
      const page = await pdf.getPage(sourceIndex + 1);
      if (cancelled) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const viewport = page.getViewport({ scale: scale * dpr });
      // Fall back to a lower resolution rather than failing on huge pages.
      const pixels = viewport.width * viewport.height;
      const limiter = pixels > MAX_CANVAS_PIXELS ? Math.sqrt(MAX_CANVAS_PIXELS / pixels) : 1;
      const finalViewport =
        limiter < 1 ? page.getViewport({ scale: scale * dpr * limiter }) : viewport;

      canvas.width = Math.max(1, Math.floor(finalViewport.width));
      canvas.height = Math.max(1, Math.floor(finalViewport.height));

      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) return;

      task = page.render({
        canvas,
        canvasContext: context,
        viewport: finalViewport,
        ...PDFJS_DATA_OPTIONS,
      });

      try {
        await (task as unknown as { promise: Promise<void> }).promise;
        if (cancelled) return;
        setRendered(true);
        readyRef.current?.(canvas, page);
      } catch (error) {
        // A cancelled render is the normal result of zooming or scrolling away.
        if ((error as { name?: string })?.name !== 'RenderingCancelledException') {
          console.error(`Failed to render page ${sourceIndex + 1}`, error);
        }
      }
    })();

    return () => {
      cancelled = true;
      task?.cancel();
    };
  }, [pdf, sourceIndex, scale, active]);

  return (
    <canvas
      ref={canvasRef}
      className="block h-full w-full"
      style={{
        width: width * scale,
        height: height * scale,
        // Avoid a flash of stale pixels while a new zoom level rasterises.
        opacity: rendered ? 1 : 0,
        transition: 'opacity 120ms ease-out',
      }}
      aria-label={`Page ${sourceIndex + 1}`}
    />
  );
}

export const PageCanvas = memo(PageCanvasImpl);
