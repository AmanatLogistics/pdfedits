'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PDFFont } from 'pdf-lib';
import { useEditor } from './EditorContext';
import { PageCanvas } from './PageCanvas';
import { ElementView } from './ElementView';
import { SelectionFrame, type ResizeHandle } from './SelectionFrame';
import { InlineTextEditor } from './InlineTextEditor';
import {
  containerPointToView,
  normalizeRect,
  rectContains,
  rotatedSize,
  round,
} from '@/lib/geometry';
import { fontCacheKey, getMetricsFonts } from '@/lib/fonts';
import { layoutText } from '@/lib/textLayout';
import { sampleBackgroundColor } from '@/lib/colors';
import { extractTextRuns } from '@/lib/textExtract';
import {
  createElementFromRun,
  createHighlightElement,
  createInkElement,
  createShapeElement,
  createTextElement,
} from '@/lib/elements';
import { breakCoalescing } from '@/lib/store';
import type { PDFPageProxy } from '@/lib/pdfjs';
import type { EditorElement, PageState, Point, TextElement } from '@/lib/types';

const MIN_SIZE = 4;

type Interaction =
  | { kind: 'none' }
  | { kind: 'marquee'; start: Point; current: Point }
  | { kind: 'create'; start: Point; current: Point }
  | { kind: 'draw'; strokes: Point[][] }
  | { kind: 'move'; start: Point; origins: Map<string, Point>; moved: boolean }
  | {
      kind: 'resize';
      id: string;
      handle: ResizeHandle;
      start: Point;
      origin: { x: number; y: number; width: number; height: number };
    };

interface Props {
  page: PageState;
  index: number;
}

export function PageView({ page, index }: Props) {
  const {
    store,
    pdf,
    assets,
    tool,
    setTool,
    defaults,
    scale,
    getTextRuns,
    setTextRuns,
    setInteracting,
    requestImage,
    requestSignature,
  } = useEditor();
  const { dispatch, state } = store;

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [interaction, setInteraction] = useState<Interaction>({ kind: 'none' });
  const [hoverRunId, setHoverRunId] = useState<string | null>(null);
  const [fonts, setFonts] = useState<Map<string, PDFFont> | null>(null);

  useEffect(() => {
    getMetricsFonts().then(setFonts);
  }, []);

  const outer = rotatedSize(page.width, page.height, page.rotation);
  const displayWidth = outer.width * scale;
  const displayHeight = outer.height * scale;

  /** Only render pages that are near the viewport, so long PDFs stay responsive. */
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: '400px 0px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const textRuns = getTextRuns(page.sourceIndex);

  /**
   * Extracts the page's existing text once it has rendered — at that point
   * PDF.js has resolved the real fonts, which is what makes bold/italic
   * detection on original text reliable.
   */
  const handleCanvasReady = useCallback(
    async (canvas: HTMLCanvasElement | null, pdfPage: PDFPageProxy) => {
      canvasRef.current = canvas;
      if (getTextRuns(page.sourceIndex)) return;
      try {
        const viewport = pdfPage.getViewport({ scale: 1 });
        setTextRuns(page.sourceIndex, await extractTextRuns(pdfPage, viewport));
      } catch (error) {
        console.error('Could not read text on this page', error);
        setTextRuns(page.sourceIndex, []);
      }
    },
    [getTextRuns, setTextRuns, page.sourceIndex],
  );

  const toView = useCallback(
    (event: { clientX: number; clientY: number }): Point => {
      const rect = containerRef.current!.getBoundingClientRect();
      return containerPointToView(
        event.clientX - rect.left,
        event.clientY - rect.top,
        page.width,
        page.height,
        page.rotation,
        scale,
      );
    },
    [page.width, page.height, page.rotation, scale],
  );

  const fontFor = useCallback(
    (element: TextElement) =>
      fonts?.get(
        fontCacheKey({
          family: element.fontFamily,
          bold: element.bold,
          italic: element.italic,
        }),
      ),
    [fonts],
  );

  /** Topmost element under a point, so overlapping annotations pick correctly. */
  const hitTest = useCallback(
    (point: Point): EditorElement | undefined => {
      for (let i = page.elements.length - 1; i >= 0; i--) {
        const element = page.elements[i];
        if (element.locked) continue;
        const padding = element.type === 'shape' ? element.strokeWidth / 2 + 2 : 0;
        if (rectContains(element, point, padding)) return element;
      }
      return undefined;
    },
    [page.elements],
  );

  const runAt = useCallback(
    (point: Point) => textRuns?.find((run) => rectContains(run.rect, point, 1)),
    [textRuns],
  );

  /**
   * Converts a run of the PDF's own text into an editable element, sampling the
   * page background so the cover rectangle blends into whatever is behind it.
   */
  const beginEditingOriginal = useCallback(
    (runId: string) => {
      const run = textRuns?.find((r) => r.id === runId);
      const canvas = canvasRef.current;
      if (!run) return;

      const background = canvas
        ? sampleBackgroundColor(canvas, {
            // The canvas is rendered at its own device scale, not the zoom.
            x: (run.rect.x * canvas.width) / page.width,
            y: (run.rect.y * canvas.height) / page.height,
            width: (run.rect.width * canvas.width) / page.width,
            height: (run.rect.height * canvas.height) / page.height,
          })
        : { r: 1, g: 1, b: 1 };

      const element = createElementFromRun(run, background, defaults.textColor);
      breakCoalescing();
      dispatch({ type: 'addElement', pageId: page.id, element });
      dispatch({ type: 'setEditing', id: element.id });
      setTool('select');
    },
    [textRuns, page.id, page.width, page.height, defaults.textColor, dispatch, setTool],
  );

  const commitInteraction = useCallback(
    (finished: Interaction) => {
      if (finished.kind === 'create') {
        const rect = normalizeRect(finished.start, finished.current);
        const isLine = tool === 'line' || tool === 'arrow';
        // A click without a drag should still produce something usable.
        if (!isLine && (rect.width < MIN_SIZE || rect.height < MIN_SIZE)) return;
        if (isLine && Math.hypot(rect.width, rect.height) < MIN_SIZE) return;

        let element: EditorElement | null = null;
        if (tool === 'highlight') {
          element = createHighlightElement(rect, defaults);
        } else if (tool === 'rectangle' || tool === 'ellipse') {
          element = createShapeElement(tool, rect, defaults);
        } else if (isLine) {
          // Lines keep their true direction rather than being normalised.
          element = createShapeElement(tool, {
            x: finished.start.x,
            y: finished.start.y,
            width: finished.current.x - finished.start.x,
            height: finished.current.y - finished.start.y,
          }, defaults);
        }
        if (element) {
          breakCoalescing();
          dispatch({ type: 'addElement', pageId: page.id, element });
          setTool('select');
        }
        return;
      }

      if (finished.kind === 'draw') {
        const element = createInkElement(
          finished.strokes,
          defaults.inkColor,
          defaults.inkWidth,
        );
        if (element) {
          breakCoalescing();
          dispatch({ type: 'addElement', pageId: page.id, element, select: false });
        }
      }
    },
    [tool, defaults, dispatch, page.id, setTool],
  );

  const onPointerDown = useCallback(
    (event: React.PointerEvent) => {
      if (event.button !== 0) return;
      const point = toView(event);
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
      setInteracting(true);

      if (tool === 'image') {
        requestImage(page.id, point);
        return;
      }
      if (tool === 'signature') {
        requestSignature(page.id, point);
        return;
      }
      if (tool === 'text') {
        const element = createTextElement(point, defaults);
        breakCoalescing();
        dispatch({ type: 'addElement', pageId: page.id, element });
        dispatch({ type: 'setEditing', id: element.id });
        setTool('select');
        return;
      }
      if (tool === 'draw') {
        setInteraction({ kind: 'draw', strokes: [[point]] });
        return;
      }
      if (tool !== 'select') {
        setInteraction({ kind: 'create', start: point, current: point });
        return;
      }

      // Select tool: an annotation wins over the PDF's own text underneath it.
      const hit = hitTest(point);
      if (hit) {
        const alreadySelected = state.selectedIds.includes(hit.id);
        const ids = event.shiftKey
          ? alreadySelected
            ? state.selectedIds.filter((id) => id !== hit.id)
            : [...state.selectedIds, hit.id]
          : alreadySelected
            ? state.selectedIds
            : [hit.id];
        if (!alreadySelected || event.shiftKey) dispatch({ type: 'select', ids });

        const origins = new Map<string, Point>();
        for (const element of page.elements) {
          if (ids.includes(element.id)) origins.set(element.id, { x: element.x, y: element.y });
        }
        setInteraction({ kind: 'move', start: point, origins, moved: false });
        return;
      }

      const run = runAt(point);
      if (run) {
        beginEditingOriginal(run.id);
        return;
      }

      dispatch({ type: 'select', ids: [] });
      setInteraction({ kind: 'marquee', start: point, current: point });
    },
    [
      toView, tool, page.id, page.elements, defaults, dispatch, setTool, hitTest,
      runAt, beginEditingOriginal, state.selectedIds, setInteracting,
      requestImage, requestSignature,
    ],
  );

  const onPointerMove = useCallback(
    (event: React.PointerEvent) => {
      const point = toView(event);

      if (interaction.kind === 'none') {
        // Highlight the run of original text under the cursor so it is obvious
        // that existing content can be edited in place.
        if (tool === 'select') {
          const hit = hitTest(point);
          setHoverRunId(hit ? null : (runAt(point)?.id ?? null));
        } else if (hoverRunId) {
          setHoverRunId(null);
        }
        return;
      }

      switch (interaction.kind) {
        case 'marquee':
        case 'create':
          setInteraction({ ...interaction, current: point });
          break;

        case 'draw': {
          const strokes = [...interaction.strokes];
          strokes[strokes.length - 1] = [...strokes[strokes.length - 1], point];
          setInteraction({ kind: 'draw', strokes });
          break;
        }

        case 'move': {
          const dx = point.x - interaction.start.x;
          const dy = point.y - interaction.start.y;
          if (!interaction.moved && Math.hypot(dx, dy) < 1.5) return;
          const changes = [...interaction.origins].map(([id, origin]) => ({
            id,
            patch: { x: round(origin.x + dx), y: round(origin.y + dy) },
          }));
          dispatch({ type: 'updateElements', changes, coalesce: `move:${interaction.start.x}` });
          if (!interaction.moved) setInteraction({ ...interaction, moved: true });
          break;
        }

        case 'resize': {
          const { origin, handle } = interaction;
          const dx = point.x - interaction.start.x;
          const dy = point.y - interaction.start.y;

          const element = page.elements.find((el) => el.id === interaction.id);
          const isLine =
            element?.type === 'shape' && (element.shape === 'line' || element.shape === 'arrow');

          let next: { x: number; y: number; width: number; height: number };
          if (isLine) {
            // Lines are defined by their endpoints, so signed extents are kept.
            next =
              handle === 'nw'
                ? {
                    x: origin.x + dx,
                    y: origin.y + dy,
                    width: origin.width - dx,
                    height: origin.height - dy,
                  }
                : {
                    x: origin.x,
                    y: origin.y,
                    width: origin.width + dx,
                    height: origin.height + dy,
                  };
          } else {
            let { x, y, width, height } = origin;
            if (handle.includes('w')) {
              x = origin.x + dx;
              width = origin.width - dx;
            }
            if (handle.includes('e')) width = origin.width + dx;
            if (handle.includes('n')) {
              y = origin.y + dy;
              height = origin.height - dy;
            }
            if (handle.includes('s')) height = origin.height + dy;

            // Flipping through zero is confusing; clamp instead.
            if (width < MIN_SIZE) {
              if (handle.includes('w')) x = origin.x + origin.width - MIN_SIZE;
              width = MIN_SIZE;
            }
            if (height < MIN_SIZE) {
              if (handle.includes('n')) y = origin.y + origin.height - MIN_SIZE;
              height = MIN_SIZE;
            }
            next = { x, y, width, height };
          }

          const patch: Partial<EditorElement> = {
            x: round(next.x),
            y: round(next.y),
            width: round(next.width),
            height: round(next.height),
          };

          // Re-wrapping a text box changes how tall it needs to be.
          if (element?.type === 'text') {
            const font = fontFor(element);
            if (font) {
              (patch as Partial<TextElement>).height = round(
                layoutText({ ...element, width: next.width }, font).height,
              );
            }
          }

          dispatch({
            type: 'updateElements',
            changes: [{ id: interaction.id, patch }],
            coalesce: `resize:${interaction.id}`,
          });
          break;
        }
      }
    },
    [toView, interaction, tool, hitTest, runAt, hoverRunId, dispatch, page.elements, fontFor],
  );

  const onPointerUp = useCallback(
    (event: React.PointerEvent) => {
      try {
        (event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId);
      } catch {
        // The capture may already have been released; nothing to do.
      }
      setInteracting(false);

      if (interaction.kind === 'marquee') {
        const rect = normalizeRect(interaction.start, interaction.current);
        if (rect.width > 3 && rect.height > 3) {
          const ids = page.elements
            .filter(
              (el) =>
                el.x < rect.x + rect.width &&
                el.x + el.width > rect.x &&
                el.y < rect.y + rect.height &&
                el.y + el.height > rect.y,
            )
            .map((el) => el.id);
          dispatch({ type: 'select', ids });
        }
      } else {
        commitInteraction(interaction);
      }

      breakCoalescing();
      setInteraction({ kind: 'none' });
    },
    [interaction, commitInteraction, dispatch, page.elements, setInteracting],
  );

  const onDoubleClick = useCallback(
    (event: React.MouseEvent) => {
      const point = toView(event);
      const hit = hitTest(point);
      if (hit?.type === 'text') {
        dispatch({ type: 'setEditing', id: hit.id });
        return;
      }
      const run = runAt(point);
      if (run) beginEditingOriginal(run.id);
    },
    [toView, hitTest, runAt, dispatch, beginEditingOriginal],
  );

  const onResizeStart = useCallback(
    (handle: ResizeHandle, event: React.PointerEvent) => {
      const element = page.elements.find((el) => el.id === state.selectedIds[0]);
      if (!element) return;
      containerRef.current?.setPointerCapture(event.pointerId);
      setInteracting(true);
      breakCoalescing();
      setInteraction({
        kind: 'resize',
        id: element.id,
        handle,
        start: toView(event),
        origin: {
          x: element.x,
          y: element.y,
          width: element.width,
          height: element.height,
        },
      });
    },
    [page.elements, state.selectedIds, toView, setInteracting],
  );

  const editingElement = useMemo(() => {
    const found = page.elements.find((el) => el.id === state.editingId);
    return found?.type === 'text' ? found : null;
  }, [page.elements, state.editingId]);

  const selectedOnThisPage = page.elements.filter((el) => state.selectedIds.includes(el.id));
  const hoveredRun = hoverRunId ? textRuns?.find((run) => run.id === hoverRunId) : undefined;

  const cursor =
    tool === 'select' ? (hoverRunId ? 'text' : 'default') : tool === 'draw' ? 'crosshair' : 'crosshair';

  /** Live preview of a shape or highlight while it is being dragged out. */
  const previewRect =
    interaction.kind === 'create' || interaction.kind === 'marquee'
      ? normalizeRect(interaction.start, interaction.current)
      : null;

  return (
    <div
      className="relative shadow-lg ring-1 ring-slate-300"
      style={{ width: displayWidth, height: displayHeight, background: 'white' }}
      data-page-id={page.id}
    >
      <div
        ref={containerRef}
        className="absolute inset-0 touch-none"
        style={{ cursor }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={onDoubleClick}
      >
        {/* The page and its annotations share one rotated frame, so an
            annotation stays glued to the content it was placed on. */}
        <div
          className="absolute origin-top-left"
          style={{
            width: page.width * scale,
            height: page.height * scale,
            transform:
              page.rotation === 90
                ? `translate(${displayWidth}px, 0) rotate(90deg)`
                : page.rotation === 180
                  ? `translate(${displayWidth}px, ${displayHeight}px) rotate(180deg)`
                  : page.rotation === 270
                    ? `translate(0, ${displayHeight}px) rotate(270deg)`
                    : undefined,
          }}
        >
          <PageCanvas
            pdf={pdf}
            sourceIndex={page.sourceIndex}
            width={page.width}
            height={page.height}
            scale={scale}
            active={visible}
            onCanvasReady={handleCanvasReady}
          />

          {hoveredRun && (
            <div
              className="pointer-events-none absolute rounded-[1px] bg-sky-400/20 ring-1 ring-sky-500/70"
              style={{
                left: hoveredRun.rect.x * scale,
                top: hoveredRun.rect.y * scale,
                width: hoveredRun.rect.width * scale,
                height: hoveredRun.rect.height * scale,
              }}
              title="Click to edit this text"
            />
          )}

          {page.elements.map((element) => (
            <ElementView
              key={element.id}
              element={element}
              scale={scale}
              assets={assets}
              font={element.type === 'text' ? fontFor(element) : undefined}
              selected={state.selectedIds.includes(element.id)}
              hidden={element.id === state.editingId}
            />
          ))}

          {interaction.kind === 'draw' && (
            <svg
              className="pointer-events-none absolute inset-0"
              width={page.width * scale}
              height={page.height * scale}
              viewBox={`0 0 ${page.width} ${page.height}`}
            >
              {interaction.strokes.map((stroke, i) => (
                <polyline
                  key={i}
                  points={stroke.map((p) => `${p.x},${p.y}`).join(' ')}
                  fill="none"
                  stroke={`rgb(${defaults.inkColor.r * 255},${defaults.inkColor.g * 255},${defaults.inkColor.b * 255})`}
                  strokeWidth={defaults.inkWidth}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}
            </svg>
          )}

          {previewRect && (
            <div
              className={
                interaction.kind === 'marquee'
                  ? 'pointer-events-none absolute border border-sky-500 bg-sky-500/10'
                  : 'pointer-events-none absolute border border-dashed border-sky-600 bg-sky-500/10'
              }
              style={{
                left: previewRect.x * scale,
                top: previewRect.y * scale,
                width: previewRect.width * scale,
                height: previewRect.height * scale,
              }}
            />
          )}

          {!editingElement &&
            selectedOnThisPage.map((element) => (
              <SelectionFrame
                key={element.id}
                element={element}
                scale={scale}
                pageRotation={page.rotation}
                onResizeStart={onResizeStart}
              />
            ))}

          {editingElement && (
            <InlineTextEditor
              element={editingElement}
              scale={scale}
              font={fontFor(editingElement)}
              onChange={(text, height) =>
                dispatch({
                  type: 'updateElements',
                  changes: [{ id: editingElement.id, patch: { text, height: round(height) } }],
                  coalesce: `type:${editingElement.id}`,
                })
              }
              onCommit={() => {
                breakCoalescing();
                // An empty new text box is almost always an accidental click.
                if (!editingElement.text.trim() && !editingElement.fromOriginal) {
                  dispatch({ type: 'deleteElements', ids: [editingElement.id] });
                }
                dispatch({ type: 'setEditing', id: null });
              }}
            />
          )}
        </div>
      </div>

      <div className="pointer-events-none absolute -bottom-6 left-0 text-xs font-medium text-slate-500">
        Page {index + 1}
      </div>
    </div>
  );
}
