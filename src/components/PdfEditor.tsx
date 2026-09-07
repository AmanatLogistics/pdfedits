'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EditorProvider } from './EditorContext';
import { Toolbar } from './Toolbar';
import { ThumbnailRail } from './ThumbnailRail';
import { PageView } from './PageView';
import { PropertiesPanel } from './PropertiesPanel';
import { SignatureDialog } from './SignatureDialog';
import { UploadScreen } from './UploadScreen';
import { useEditorStore, breakCoalescing } from '@/lib/store';
import { openPdf, PdfPasswordRequired, type PDFDocumentProxy } from '@/lib/pdfjs';
import { invertMatrix, clamp, rotatedSize } from '@/lib/geometry';
import { exportPdf } from '@/lib/export';
import {
  ACCEPTED_IMAGE_TYPES,
  createImageAsset,
} from '@/lib/assets';
import {
  DEFAULT_TOOL_SETTINGS,
  createImageElement,
  createInkElement,
  type ToolDefaults,
} from '@/lib/elements';
import type {
  ImageAsset,
  OriginalTextRun,
  PageState,
  Point,
  SourcePage,
  ToolId,
} from '@/lib/types';

const ZOOM_STEPS = [0.25, 0.35, 0.5, 0.65, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 4];
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 6;

/** Keyboard shortcut for each tool. */
const TOOL_KEYS: Record<string, ToolId> = {
  v: 'select', t: 'text', i: 'image', d: 'draw',
  h: 'highlight', r: 'rectangle', o: 'ellipse',
  l: 'line', a: 'arrow', s: 'signature',
};

interface LoadedDocument {
  pdf: PDFDocumentProxy;
  bytes: Uint8Array;
  sourcePages: Map<number, SourcePage>;
  fileName: string;
}

export function PdfEditor() {
  const store = useEditorStore();
  const { dispatch, pages, state } = store;

  const [document_, setDocument] = useState<LoadedDocument | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [passwordPrompt, setPasswordPrompt] = useState<{ wrongPassword: boolean } | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const [tool, setTool] = useState<ToolId>('select');
  const [defaults, setDefaultsState] = useState<ToolDefaults>(DEFAULT_TOOL_SETTINGS);
  const [zoom, setZoom] = useState<number | 'fit'>('fit');
  const [fitScale, setFitScale] = useState(1);
  const [exporting, setExporting] = useState(false);
  // Tracked so future affordances (e.g. hiding hover hints mid-drag) have a
  // single source of truth; PageView owns the gesture itself.
  const [, setInteracting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Images and extracted text runs are ordinary state: they are read during
  // render, and both are small (bytes are shared by reference, not copied).
  const [assets, setAssets] = useState<Map<string, ImageAsset>>(() => new Map());
  const [textRuns, setTextRunsState] = useState<Map<number, OriginalTextRun[]>>(() => new Map());
  const scrollRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef(new Map<string, HTMLDivElement>());

  /** Where a pending image or signature will be placed once it is ready. */
  const placementRef = useRef<{ pageId: string; at: Point } | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [signatureOpen, setSignatureOpen] = useState(false);

  const setDefaults = useCallback((patch: Partial<ToolDefaults>) => {
    setDefaultsState((prev) => ({ ...prev, ...patch }));
  }, []);

  // ---------------------------------------------------------------- loading

  const load = useCallback(
    async (file: File, password?: string) => {
      setLoading(true);
      setError(null);
      setProgress(0);
      try {
        const bytes = new Uint8Array(await file.arrayBuffer());
        const pdf = await openPdf(bytes, password);

        // Capture each page's geometry once. The inverse viewport matrix is what
        // lets the exporter put annotations back into PDF user space exactly.
        const sourcePages = new Map<number, SourcePage>();
        const pageStates: PageState[] = [];
        for (let i = 0; i < pdf.numPages; i++) {
          const page = await pdf.getPage(i + 1);
          const viewport = page.getViewport({ scale: 1 });
          sourcePages.set(i, {
            index: i,
            width: viewport.width,
            height: viewport.height,
            inverseTransform: invertMatrix(viewport.transform),
          });
          pageStates.push({
            id: `page-${i}-${crypto.randomUUID()}`,
            sourceIndex: i,
            width: viewport.width,
            height: viewport.height,
            rotation: 0,
            elements: [],
          });
          if (i % 10 === 0 || i === pdf.numPages - 1) {
            setProgress((i + 1) / pdf.numPages);
            // Yield so the progress bar can paint on very long documents.
            await new Promise((resolve) => setTimeout(resolve, 0));
          }
        }

        setTextRunsState(new Map());
        setAssets(new Map());
        setDocument({ pdf, bytes, sourcePages, fileName: file.name });
        dispatch({ type: 'init', pages: pageStates });
        setPasswordPrompt(null);
        setPendingFile(null);
      } catch (caught) {
        if (caught instanceof PdfPasswordRequired) {
          setPendingFile(file);
          setPasswordPrompt({ wrongPassword: caught.wrongPassword });
        } else {
          setError((caught as Error).message || 'The PDF could not be opened.');
        }
      } finally {
        setLoading(false);
        setProgress(null);
      }
    },
    [dispatch],
  );

  const reset = useCallback(() => {
    for (const asset of assets.values()) URL.revokeObjectURL(asset.objectUrl);
    setAssets(new Map());
    setTextRunsState(new Map());
    // Releasing the worker is done through the loading task, not the proxy.
    void document_?.pdf.loadingTask.destroy();
    setDocument(null);
    setError(null);
    setPasswordPrompt(null);
    setPendingFile(null);
    dispatch({ type: 'init', pages: [] });
  }, [document_, dispatch, assets]);

  // ------------------------------------------------------------------ zoom

  const currentPage = pages[activeIndex] ?? pages[0];

  /** Recomputes the fit-width scale whenever the viewport or page changes. */
  useEffect(() => {
    const node = scrollRef.current;
    if (!node || !currentPage) return;
    const update = () => {
      const size = rotatedSize(currentPage.width, currentPage.height, currentPage.rotation);
      // 64px of breathing room either side of the page.
      setFitScale(clamp((node.clientWidth - 64) / size.width, MIN_ZOOM, MAX_ZOOM));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, [currentPage]);

  const scale = zoom === 'fit' ? fitScale : zoom;

  const changeZoom = useCallback(
    (value: number | 'in' | 'out' | 'fit') => {
      if (value === 'fit') {
        setZoom('fit');
        return;
      }
      if (typeof value === 'number') {
        setZoom(clamp(value, MIN_ZOOM, MAX_ZOOM));
        return;
      }
      setZoom((prev) => {
        const current = prev === 'fit' ? fitScale : prev;
        const steps = value === 'in' ? ZOOM_STEPS : [...ZOOM_STEPS].reverse();
        const next = steps.find((step) =>
          value === 'in' ? step > current + 0.001 : step < current - 0.001,
        );
        return clamp(next ?? current, MIN_ZOOM, MAX_ZOOM);
      });
    },
    [fitScale],
  );

  // ------------------------------------------------------- active page sync

  useEffect(() => {
    const root = scrollRef.current;
    if (!root || pages.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        // The page occupying most of the viewport is the "current" one.
        const best = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!best) return;
        const index = Number((best.target as HTMLElement).dataset.pageIndex);
        if (!Number.isNaN(index)) setActiveIndex(index);
      },
      { root, threshold: [0.1, 0.5, 0.9] },
    );
    for (const node of pageRefs.current.values()) observer.observe(node);
    return () => observer.disconnect();
  }, [pages]);

  const scrollToPage = useCallback((index: number) => {
    const page = pages[index];
    if (!page) return;
    pageRefs.current.get(page.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveIndex(index);
  }, [pages]);

  // -------------------------------------------------------------- placement

  const registerAsset = useCallback((asset: ImageAsset) => {
    setAssets((prev) => new Map(prev).set(asset.id, asset));
  }, []);

  const setTextRuns = useCallback((index: number, runs: OriginalTextRun[]) => {
    setTextRunsState((prev) => (prev.has(index) ? prev : new Map(prev).set(index, runs)));
  }, []);

  const requestImage = useCallback((pageId: string, at: Point) => {
    placementRef.current = { pageId, at };
    imageInputRef.current?.click();
  }, []);

  const requestSignature = useCallback((pageId: string, at: Point) => {
    placementRef.current = { pageId, at };
    setSignatureOpen(true);
  }, []);

  const placeImage = useCallback(
    async (file: File) => {
      const target = placementRef.current;
      if (!target) return;
      const page = pages.find((p) => p.id === target.pageId);
      if (!page) return;
      try {
        const asset = await createImageAsset(file);
        registerAsset(asset);
        breakCoalescing();
        dispatch({
          type: 'addElement',
          pageId: page.id,
          element: createImageElement(asset, target.at, page.width * 0.8, page.height * 0.8),
        });
        setTool('select');
      } catch (caught) {
        setNotice((caught as Error).message || 'That image could not be added.');
      } finally {
        placementRef.current = null;
      }
    },
    [pages, dispatch, registerAsset],
  );

  const placeSignature = useCallback(
    (
      strokes: Point[][],
      color: { r: number; g: number; b: number },
      width: number,
      canvasSize: { width: number; height: number },
    ) => {
      const target = placementRef.current;
      setSignatureOpen(false);
      if (!target) return;
      const page = pages.find((p) => p.id === target.pageId);
      if (!page) return;

      // Scale the dialog's drawing down to a sensible on-page size, anchored
      // where the user clicked.
      const targetWidth = Math.min(page.width * 0.35, 200);
      const factor = targetWidth / canvasSize.width;
      const scaled = strokes.map((stroke) =>
        stroke.map((p) => ({
          x: target.at.x + (p.x - canvasSize.width / 2) * factor,
          y: target.at.y + (p.y - canvasSize.height / 2) * factor,
        })),
      );

      const element = createInkElement(scaled, color, Math.max(0.5, width * factor * 2), true);
      if (element) {
        breakCoalescing();
        dispatch({ type: 'addElement', pageId: page.id, element });
      }
      setTool('select');
      placementRef.current = null;
    },
    [pages, dispatch],
  );

  // -------------------------------------------------------------- shortcuts

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      // Never hijack keys while the user is typing in a field.
      if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) {
        return;
      }
      const mod = event.metaKey || event.ctrlKey;

      if (mod && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        dispatch({ type: event.shiftKey ? 'redo' : 'undo' });
        return;
      }
      if (mod && event.key.toLowerCase() === 'y') {
        event.preventDefault();
        dispatch({ type: 'redo' });
        return;
      }
      if (mod && (event.key === '=' || event.key === '+')) {
        event.preventDefault();
        changeZoom('in');
        return;
      }
      if (mod && event.key === '-') {
        event.preventDefault();
        changeZoom('out');
        return;
      }
      if (mod && event.key === '0') {
        event.preventDefault();
        changeZoom('fit');
        return;
      }
      if (mod) return;

      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (state.selectedIds.length) {
          event.preventDefault();
          breakCoalescing();
          dispatch({ type: 'deleteElements', ids: state.selectedIds });
        }
        return;
      }
      if (event.key === 'Escape') {
        dispatch({ type: 'select', ids: [] });
        setTool('select');
        return;
      }
      // Nudge the selection with the arrow keys.
      if (event.key.startsWith('Arrow') && state.selectedIds.length) {
        event.preventDefault();
        const step = event.shiftKey ? 10 : 1;
        const dx = event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0;
        const dy = event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0;
        const changes = state.selectedIds
          .map((id) => store.findElement(id))
          .filter((found) => found !== undefined)
          .map((found) => ({
            id: found.element.id,
            patch: { x: found.element.x + dx, y: found.element.y + dy },
          }));
        dispatch({ type: 'updateElements', changes, coalesce: 'nudge' });
        return;
      }

      const nextTool = TOOL_KEYS[event.key.toLowerCase()];
      if (nextTool) setTool(nextTool);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [dispatch, changeZoom, state.selectedIds, store]);

  // ---------------------------------------------------------------- export

  const download = useCallback(async () => {
    if (!document_) return;
    setExporting(true);
    setNotice(null);
    try {
      const { bytes, droppedCharacters } = await exportPdf({
        originalBytes: document_.bytes,
        pages,
        sourcePages: document_.sourcePages,
        assets,
      });

      const blob = new Blob([bytes.slice().buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = document_.fileName.replace(/\.pdf$/i, '') + '-edited.pdf';
      window.document.body.appendChild(link);
      link.click();
      link.remove();
      // Give the browser a moment to start the download before releasing it.
      setTimeout(() => URL.revokeObjectURL(url), 10_000);

      if (droppedCharacters.length) {
        setNotice(
          `Exported. These characters are not available in the built-in PDF fonts and were ` +
            `replaced with "?": ${droppedCharacters.join(' ')}`,
        );
      }
    } catch (caught) {
      console.error(caught);
      setNotice(
        `The PDF could not be exported: ${(caught as Error).message || 'unknown error'}`,
      );
    } finally {
      setExporting(false);
    }
  }, [document_, pages, assets]);

  // ----------------------------------------------------------------- render

  const contextValue = useMemo(
    () => ({
      store,
      pdf: document_?.pdf as PDFDocumentProxy,
      sourcePages: document_?.sourcePages ?? new Map(),
      assets,
      registerAsset,
      tool,
      setTool,
      defaults,
      setDefaults,
      scale,
      getTextRuns: (index: number) => textRuns.get(index),
      setTextRuns,
      setInteracting,
      requestImage,
      requestSignature,
    }),
    [
      store, document_, assets, registerAsset, tool, defaults, setDefaults, scale,
      textRuns, setTextRuns, setInteracting, requestImage, requestSignature,
    ],
  );

  if (!document_) {
    return (
      <UploadScreen
        onFile={(file) => load(file)}
        loading={loading}
        error={error}
        progress={progress}
        passwordPrompt={passwordPrompt}
        onPassword={(password) => pendingFile && load(pendingFile, password)}
      />
    );
  }

  return (
    <EditorProvider value={contextValue}>
      <div className="flex h-screen flex-col overflow-hidden bg-slate-100">
        <Toolbar
          fileName={document_.fileName}
          zoom={zoom === 'fit' ? fitScale : zoom}
          onZoom={changeZoom}
          onDownload={download}
          onReset={reset}
          exporting={exporting}
        />

        {notice && (
          <div
            role="status"
            data-testid="notice"
            className="flex items-start gap-3 border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900"
          >
            <span className="flex-1">{notice}</span>
            <button
              type="button"
              onClick={() => setNotice(null)}
              className="shrink-0 font-medium underline"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="flex min-h-0 flex-1">
          <ThumbnailRail activeIndex={activeIndex} onSelect={scrollToPage} />

          <main
            ref={scrollRef}
            data-testid="workspace"
            className="flex-1 overflow-auto"
            onPointerDown={(event) => {
              // A click on the grey surround clears the selection.
              if (event.target === event.currentTarget) dispatch({ type: 'select', ids: [] });
            }}
          >
            <div className="flex flex-col items-center gap-10 px-8 py-8">
              {pages.map((page, index) => (
                <div
                  key={page.id}
                  ref={(node) => {
                    if (node) pageRefs.current.set(page.id, node);
                    else pageRefs.current.delete(page.id);
                  }}
                  data-page-index={index}
                >
                  <PageView page={page} index={index} />
                </div>
              ))}
            </div>
          </main>

          <PropertiesPanel />
        </div>
      </div>

      <input
        ref={imageInputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES}
        data-testid="image-input"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (file) void placeImage(file);
          else {
            // The picker was dismissed; drop back to the select tool.
            placementRef.current = null;
            setTool('select');
          }
        }}
      />

      {signatureOpen && (
        <SignatureDialog
          onCancel={() => {
            setSignatureOpen(false);
            placementRef.current = null;
            setTool('select');
          }}
          onConfirm={placeSignature}
        />
      )}
    </EditorProvider>
  );
}
