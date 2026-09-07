'use client';

import type { EditorElement } from '@/lib/types';

export type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

/** Handles offered per element type; lines and arrows resize by their endpoints. */
const BOX_HANDLES: ResizeHandle[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
const LINE_HANDLES: ResizeHandle[] = ['nw', 'se'];

const CURSORS: Record<ResizeHandle, string> = {
  nw: 'nwse-resize',
  n: 'ns-resize',
  ne: 'nesw-resize',
  e: 'ew-resize',
  se: 'nwse-resize',
  s: 'ns-resize',
  sw: 'nesw-resize',
  w: 'ew-resize',
};

function handlePosition(handle: ResizeHandle): { left: string; top: string } {
  return {
    left: handle.includes('w') ? '0%' : handle.includes('e') ? '100%' : '50%',
    top: handle.includes('n') ? '0%' : handle.includes('s') ? '100%' : '50%',
  };
}

interface Props {
  element: EditorElement;
  scale: number;
  /** Counter-rotates the handles so they stay square on a rotated page. */
  pageRotation: number;
  onResizeStart: (handle: ResizeHandle, event: React.PointerEvent) => void;
}

export function SelectionFrame({ element, scale, pageRotation, onResizeStart }: Props) {
  const isLine = element.type === 'shape' && (element.shape === 'line' || element.shape === 'arrow');
  const handles = isLine ? LINE_HANDLES : BOX_HANDLES;

  return (
    <div
      className="pointer-events-none absolute outline-2 outline-offset-1 outline-sky-500"
      style={{
        left: element.x * scale,
        top: element.y * scale,
        width: element.width * scale,
        height: element.height * scale,
      }}
    >
      {handles.map((handle) => (
        <div
          key={handle}
          data-resize-handle={handle}
          onPointerDown={(event) => {
            event.stopPropagation();
            onResizeStart(handle, event);
          }}
          className="pointer-events-auto absolute h-2.5 w-2.5 rounded-full border border-white bg-sky-500 shadow-sm"
          style={{
            ...handlePosition(handle),
            // The handle is rotated back to screen-upright so its resize cursor
            // still points the way the user will actually drag.
            transform: `translate(-50%, -50%) rotate(${-pageRotation}deg)`,
            cursor: CURSORS[handle],
          }}
        />
      ))}
    </div>
  );
}
