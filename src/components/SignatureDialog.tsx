'use client';

import { useCallback, useRef, useState } from 'react';
import { CloseIcon } from './icons';
import { rgbToCss } from '@/lib/colors';
import { BLACK, BLUE } from '@/lib/elements';
import type { Point, Rgb } from '@/lib/types';

const COLORS: { label: string; value: Rgb }[] = [
  { label: 'Black', value: BLACK },
  { label: 'Blue', value: BLUE },
];

interface Props {
  onCancel: () => void;
  /** Strokes are in dialog-canvas pixels; the caller scales them onto the page. */
  onConfirm: (strokes: Point[][], color: Rgb, width: number, canvasSize: { width: number; height: number }) => void;
}

const CANVAS = { width: 560, height: 200 };

/**
 * Captures a signature as vector strokes rather than a bitmap, so it exports as
 * crisp PDF path geometry at any size.
 */
export function SignatureDialog({ onCancel, onConfirm }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [strokes, setStrokes] = useState<Point[][]>([]);
  const [drawing, setDrawing] = useState(false);
  const [color, setColor] = useState<Rgb>(BLACK);
  const [width, setWidth] = useState(2.5);

  const pointFrom = useCallback((event: React.PointerEvent): Point => {
    const rect = svgRef.current!.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * CANVAS.width,
      y: ((event.clientY - rect.top) / rect.height) * CANVAS.height,
    };
  }, []);

  const isEmpty = strokes.every((s) => s.length === 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Draw your signature"
    >
      <div className="w-full max-w-xl rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-800">Draw your signature</h2>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="px-4 py-3">
          <svg
            ref={svgRef}
            data-testid="signature-pad"
            viewBox={`0 0 ${CANVAS.width} ${CANVAS.height}`}
            className="w-full touch-none rounded border-2 border-dashed border-slate-300 bg-slate-50"
            style={{ aspectRatio: `${CANVAS.width} / ${CANVAS.height}`, cursor: 'crosshair' }}
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              setDrawing(true);
              setStrokes((prev) => [...prev, [pointFrom(event)]]);
            }}
            onPointerMove={(event) => {
              if (!drawing) return;
              const point = pointFrom(event);
              setStrokes((prev) => {
                const next = [...prev];
                next[next.length - 1] = [...next[next.length - 1], point];
                return next;
              });
            }}
            onPointerUp={() => setDrawing(false)}
            onPointerCancel={() => setDrawing(false)}
          >
            <line
              x1="30" y1={CANVAS.height - 45}
              x2={CANVAS.width - 30} y2={CANVAS.height - 45}
              stroke="#cbd5e1" strokeWidth="1"
            />
            {strokes.map((stroke, index) => (
              <polyline
                key={index}
                points={stroke.map((p) => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke={rgbToCss(color)}
                strokeWidth={width * 2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
          </svg>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1.5">
              {COLORS.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  aria-label={option.label}
                  onClick={() => setColor(option.value)}
                  className={`h-6 w-6 rounded-full border-2 ${
                    color === option.value ? 'border-sky-500' : 'border-slate-200'
                  }`}
                  style={{ background: rgbToCss(option.value) }}
                />
              ))}
            </span>
            <label className="flex items-center gap-2 text-xs text-slate-600">
              Thickness
              <input
                type="range" min={1} max={6} step={0.5}
                value={width}
                onChange={(event) => setWidth(Number(event.target.value))}
                className="accent-sky-600"
              />
            </label>
            <button
              type="button"
              onClick={() => setStrokes([])}
              className="ml-auto rounded border border-slate-200 px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 px-4 py-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="button"
            data-testid="signature-confirm"
            disabled={isEmpty}
            onClick={() => onConfirm(strokes, color, width, CANVAS)}
            className="rounded-md bg-sky-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
          >
            Place signature
          </button>
        </div>
      </div>
    </div>
  );
}
