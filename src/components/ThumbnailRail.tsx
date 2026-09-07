'use client';

import { memo, useEffect, useRef, useState } from 'react';
import { useEditor } from './EditorContext';
import { CopyIcon, RotateLeftIcon, RotateRightIcon, TrashIcon } from './icons';
import { rotatedSize } from '@/lib/geometry';
import { PDFJS_DATA_OPTIONS } from '@/lib/pdfjs';
import type { PDFDocumentProxy } from '@/lib/pdfjs';
import type { PageState } from '@/lib/types';

const THUMB_WIDTH = 132;

/** Renders one page small. Memoised on the source index so reordering is free. */
const Thumbnail = memo(function Thumbnail({
  pdf,
  sourceIndex,
  width,
  height,
}: {
  pdf: PDFDocumentProxy;
  sourceIndex: number;
  width: number;
  height: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    let task: { cancel: () => void } | null = null;
    (async () => {
      const canvas = ref.current;
      if (!canvas) return;
      const page = await pdf.getPage(sourceIndex + 1);
      if (cancelled) return;
      const scale = (THUMB_WIDTH * (window.devicePixelRatio || 1)) / width;
      const viewport = page.getViewport({ scale });
      canvas.width = Math.max(1, Math.floor(viewport.width));
      canvas.height = Math.max(1, Math.floor(viewport.height));
      const context = canvas.getContext('2d');
      if (!context) return;
      task = page.render({ canvas, canvasContext: context, viewport, ...PDFJS_DATA_OPTIONS });
      try {
        await (task as unknown as { promise: Promise<void> }).promise;
      } catch {
        // Cancelled because the panel scrolled or the document changed.
      }
    })();
    return () => {
      cancelled = true;
      task?.cancel();
    };
  }, [pdf, sourceIndex, width]);

  return (
    <canvas
      ref={ref}
      className="block bg-white"
      style={{ width: THUMB_WIDTH, height: (THUMB_WIDTH * height) / width }}
    />
  );
});

export function ThumbnailRail({ activeIndex, onSelect }: {
  activeIndex: number;
  onSelect: (index: number) => void;
}) {
  const { store, pdf } = useEditor();
  const { pages, dispatch } = store;
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  const move = (from: number, to: number) => {
    if (from === to || from === to - 1) return;
    dispatch({ type: 'movePage', from, to: to > from ? to - 1 : to });
  };

  return (
    <aside className="flex w-[190px] shrink-0 flex-col border-r border-slate-200 bg-slate-50">
      <div className="border-b border-slate-200 px-3 py-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
        Pages ({pages.length})
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-3">
        <ul className="flex flex-col gap-1">
          {pages.map((page, index) => (
            <PageThumb
              key={page.id}
              page={page}
              index={index}
              active={index === activeIndex}
              pdf={pdf}
              elementCount={page.elements.length}
              canDelete={pages.length > 1}
              isDropTarget={dropIndex === index}
              onSelect={() => onSelect(index)}
              onDragStart={() => setDragIndex(index)}
              onDragOver={(event) => {
                event.preventDefault();
                setDropIndex(index);
              }}
              onDrop={(event) => {
                event.preventDefault();
                if (dragIndex !== null) move(dragIndex, index);
                setDragIndex(null);
                setDropIndex(null);
              }}
              onDragEnd={() => {
                setDragIndex(null);
                setDropIndex(null);
              }}
              onRotate={(delta) => dispatch({ type: 'setPageRotation', pageId: page.id, delta })}
              onDuplicate={() => dispatch({ type: 'duplicatePage', pageId: page.id })}
              onDelete={() => dispatch({ type: 'deletePage', pageId: page.id })}
            />
          ))}
          {/* Lets a page be dropped after the last one. */}
          <li
            onDragOver={(event) => {
              event.preventDefault();
              setDropIndex(pages.length);
            }}
            onDrop={(event) => {
              event.preventDefault();
              if (dragIndex !== null) move(dragIndex, pages.length);
              setDragIndex(null);
              setDropIndex(null);
            }}
            className={`h-6 rounded ${dropIndex === pages.length ? 'bg-sky-200' : ''}`}
          />
        </ul>
      </div>
    </aside>
  );
}

function PageThumb({
  page, index, active, pdf, elementCount, canDelete, isDropTarget,
  onSelect, onDragStart, onDragOver, onDrop, onDragEnd,
  onRotate, onDuplicate, onDelete,
}: {
  page: PageState;
  index: number;
  active: boolean;
  pdf: PDFDocumentProxy;
  elementCount: number;
  canDelete: boolean;
  isDropTarget: boolean;
  onSelect: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onRotate: (delta: number) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const size = rotatedSize(page.width, page.height, page.rotation);

  return (
    <li
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      data-testid={`thumb-${index}`}
      className={`group rounded-md p-1.5 transition-colors ${
        isDropTarget ? 'bg-sky-100' : ''
      }`}
    >
      <button
        type="button"
        onClick={onSelect}
        className={`block w-full overflow-hidden rounded ring-2 transition-shadow ${
          active ? 'ring-sky-500' : 'ring-slate-200 hover:ring-slate-300'
        }`}
        style={{ aspectRatio: `${size.width} / ${size.height}` }}
      >
        <div
          className="flex h-full w-full items-center justify-center overflow-hidden"
          style={{ transform: `rotate(${page.rotation}deg)` }}
        >
          <Thumbnail
            pdf={pdf}
            sourceIndex={page.sourceIndex}
            width={page.width}
            height={page.height}
          />
        </div>
      </button>

      <div className="mt-1 flex items-center justify-between px-0.5">
        <span className="text-xs font-medium text-slate-500">
          {index + 1}
          {elementCount > 0 && (
            <span
              title={`${elementCount} edit${elementCount === 1 ? '' : 's'} on this page`}
              className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-sky-500 align-middle"
            />
          )}
        </span>
        <span className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          <IconButton title="Rotate left" onClick={() => onRotate(-90)}>
            <RotateLeftIcon className="h-3.5 w-3.5" />
          </IconButton>
          <IconButton title="Rotate right" onClick={() => onRotate(90)}>
            <RotateRightIcon className="h-3.5 w-3.5" />
          </IconButton>
          <IconButton title="Duplicate page" onClick={onDuplicate}>
            <CopyIcon className="h-3.5 w-3.5" />
          </IconButton>
          <IconButton
            title={canDelete ? 'Delete page' : 'A PDF needs at least one page'}
            onClick={onDelete}
            disabled={!canDelete}
          >
            <TrashIcon className="h-3.5 w-3.5" />
          </IconButton>
        </span>
      </div>
    </li>
  );
}

function IconButton({
  title, onClick, disabled, children,
}: {
  title: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      className="rounded p-0.5 text-slate-500 hover:bg-slate-200 hover:text-slate-800 disabled:opacity-30 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}
