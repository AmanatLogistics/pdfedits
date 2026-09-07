'use client';

import { useEditor } from './EditorContext';
import {
  ArrowIcon, CircleIcon, CursorIcon, DownloadIcon, FileIcon, HighlightIcon,
  ImageIcon, LineIcon, PenIcon, RedoIcon, SignatureIcon, SquareIcon, TextIcon,
  UndoIcon, ZoomInIcon, ZoomOutIcon,
} from './icons';
import type { ToolId } from '@/lib/types';

interface ToolSpec {
  id: ToolId;
  label: string;
  hint: string;
  Icon: (p: { className?: string }) => React.ReactElement;
}

const TOOL_GROUPS: ToolSpec[][] = [
  [
    { id: 'select', label: 'Select', hint: 'Select and move (V)', Icon: CursorIcon },
    { id: 'text', label: 'Text', hint: 'Add a text box (T)', Icon: TextIcon },
    { id: 'image', label: 'Image', hint: 'Place an image (I)', Icon: ImageIcon },
  ],
  [
    { id: 'draw', label: 'Draw', hint: 'Freehand pen (D)', Icon: PenIcon },
    { id: 'highlight', label: 'Highlight', hint: 'Highlight an area (H)', Icon: HighlightIcon },
    { id: 'signature', label: 'Sign', hint: 'Draw a signature (S)', Icon: SignatureIcon },
  ],
  [
    { id: 'rectangle', label: 'Rectangle', hint: 'Rectangle (R)', Icon: SquareIcon },
    { id: 'ellipse', label: 'Ellipse', hint: 'Ellipse (O)', Icon: CircleIcon },
    { id: 'line', label: 'Line', hint: 'Line (L)', Icon: LineIcon },
    { id: 'arrow', label: 'Arrow', hint: 'Arrow (A)', Icon: ArrowIcon },
  ],
];

interface Props {
  fileName: string;
  zoom: number;
  onZoom: (value: number | 'in' | 'out' | 'fit') => void;
  onDownload: () => void;
  onReset: () => void;
  exporting: boolean;
}

export function Toolbar({ fileName, zoom, onZoom, onDownload, onReset, exporting }: Props) {
  const { tool, setTool, store } = useEditor();
  const { dispatch, canUndo, canRedo } = store;

  return (
    <header className="flex flex-wrap items-center gap-x-2 gap-y-2 border-b border-slate-200 bg-white px-3 py-2">
      <button
        type="button"
        onClick={onReset}
        title="Open a different PDF"
        className="flex max-w-56 items-center gap-2 rounded-md px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
      >
        <FileIcon className="h-4 w-4 shrink-0" />
        <span className="truncate font-medium">{fileName}</span>
      </button>

      <div className="mx-1 h-6 w-px bg-slate-200" />

      {TOOL_GROUPS.map((group, index) => (
        <div key={index} className="flex items-center gap-0.5">
          {index > 0 && <div className="mr-1.5 h-6 w-px bg-slate-200" />}
          {group.map(({ id, label, hint, Icon }) => (
            <button
              key={id}
              type="button"
              title={hint}
              aria-label={label}
              aria-pressed={tool === id}
              data-testid={`tool-${id}`}
              onClick={() => setTool(id)}
              className={`flex h-9 w-9 items-center justify-center rounded-md transition-colors ${
                tool === id
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon />
            </button>
          ))}
        </div>
      ))}

      <div className="mx-1 h-6 w-px bg-slate-200" />

      <button
        type="button"
        title="Undo (Ctrl+Z)"
        aria-label="Undo"
        data-testid="undo"
        disabled={!canUndo}
        onClick={() => dispatch({ type: 'undo' })}
        className="flex h-9 w-9 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
      >
        <UndoIcon />
      </button>
      <button
        type="button"
        title="Redo (Ctrl+Shift+Z)"
        aria-label="Redo"
        data-testid="redo"
        disabled={!canRedo}
        onClick={() => dispatch({ type: 'redo' })}
        className="flex h-9 w-9 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
      >
        <RedoIcon />
      </button>

      <div className="ml-auto flex items-center gap-1">
        <button
          type="button"
          title="Zoom out"
          aria-label="Zoom out"
          onClick={() => onZoom('out')}
          className="flex h-9 w-9 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100"
        >
          <ZoomOutIcon />
        </button>
        <select
          value={zoom}
          aria-label="Zoom level"
          data-testid="zoom-select"
          onChange={(event) =>
            onZoom(event.target.value === 'fit' ? 'fit' : Number(event.target.value))
          }
          className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-700"
        >
          <option value="fit">Fit width</option>
          {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4].map((value) => (
            <option key={value} value={value}>
              {Math.round(value * 100)}%
            </option>
          ))}
          {![0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4].includes(zoom) && (
            <option value={zoom}>{Math.round(zoom * 100)}%</option>
          )}
        </select>
        <button
          type="button"
          title="Zoom in"
          aria-label="Zoom in"
          onClick={() => onZoom('in')}
          className="flex h-9 w-9 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100"
        >
          <ZoomInIcon />
        </button>

        <button
          type="button"
          onClick={onDownload}
          disabled={exporting}
          data-testid="download"
          className="ml-2 flex items-center gap-2 rounded-md bg-sky-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-sky-700 disabled:opacity-60"
        >
          <DownloadIcon className="h-4 w-4" />
          {exporting ? 'Preparing…' : 'Download'}
        </button>
      </div>
    </header>
  );
}
