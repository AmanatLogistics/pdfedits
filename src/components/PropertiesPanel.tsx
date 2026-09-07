'use client';

import { useEditor } from './EditorContext';
import { LayersIcon, TrashIcon } from './icons';
import { hexToRgb, rgbToHex } from '@/lib/colors';
import { ELEMENT_LABELS } from '@/lib/elements';
import { FONT_FAMILY_LABELS, getMetricsFonts, fontCacheKey, sanitizeForFont } from '@/lib/fonts';
import { breakCoalescing } from '@/lib/store';
import { useEffect, useMemo, useState } from 'react';
import type { PDFFont } from 'pdf-lib';
import type { EditorElement, FontFamily, TextAlign } from '@/lib/types';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex items-center justify-between gap-2 text-xs text-slate-600">
      <span className="shrink-0">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  'w-24 rounded border border-slate-200 bg-white px-1.5 py-1 text-right text-xs text-slate-800 focus:border-sky-500 focus:outline-none';
const selectClass =
  'w-28 rounded border border-slate-200 bg-white px-1.5 py-1 text-xs text-slate-800 focus:border-sky-500 focus:outline-none';

function ColorInput({
  value, onChange, allowNone, isNone, onNone,
}: {
  value: string;
  onChange: (hex: string) => void;
  allowNone?: boolean;
  isNone?: boolean;
  onNone?: (none: boolean) => void;
}) {
  return (
    <span className="flex items-center gap-1.5">
      {allowNone && (
        <button
          type="button"
          title={isNone ? 'Add a fill' : 'Remove the fill'}
          onClick={() => onNone?.(!isNone)}
          className={`rounded border px-1.5 py-1 text-[10px] ${
            isNone ? 'border-sky-500 bg-sky-50 text-sky-700' : 'border-slate-200 text-slate-500'
          }`}
        >
          None
        </button>
      )}
      <input
        type="color"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-7 w-9 cursor-pointer rounded border border-slate-200 bg-white p-0.5"
      />
    </span>
  );
}

export function PropertiesPanel() {
  const { store, defaults, setDefaults } = useEditor();
  const { dispatch, selectedElements, state } = store;
  const [fonts, setFonts] = useState<Map<string, PDFFont> | null>(null);

  const element = selectedElements.length === 1 ? selectedElements[0] : null;

  useEffect(() => {
    let cancelled = false;
    getMetricsFonts().then((loaded) => {
      if (!cancelled) setFonts(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  /** Characters the built-in PDF fonts cannot encode, warned about as they are typed. */
  const warning = useMemo(() => {
    if (element?.type !== 'text' || !fonts) return [];
    const font = fonts.get(
      fontCacheKey({
        family: element.fontFamily,
        bold: element.bold,
        italic: element.italic,
      }),
    );
    return font ? sanitizeForFont(font, element.text).dropped : [];
  }, [element, fonts]);

  const patch = (changes: Partial<EditorElement>) => {
    if (!element) return;
    breakCoalescing();
    dispatch({ type: 'updateElements', changes: [{ id: element.id, patch: changes }] });
  };

  if (selectedElements.length > 1) {
    return (
      <Panel>
        <p className="text-sm text-slate-600">{selectedElements.length} elements selected</p>
        <button
          type="button"
          onClick={() => dispatch({ type: 'deleteElements', ids: state.selectedIds })}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-md border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
        >
          <TrashIcon className="h-4 w-4" />
          Delete all
        </button>
      </Panel>
    );
  }

  if (!element) {
    return (
      <Panel>
        <p className="text-sm font-medium text-slate-700">Nothing selected</p>
        <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
          Click any text already in the PDF to edit it in place, or pick a tool to add
          something new.
        </p>

        <Section title="Tool defaults">
          <Field label="Font size">
            <input
              type="number"
              min={4}
              max={200}
              value={defaults.fontSize}
              onChange={(e) => setDefaults({ fontSize: Number(e.target.value) || 14 })}
              className={inputClass}
            />
          </Field>
          <Field label="Font">
            <select
              value={defaults.fontFamily}
              onChange={(e) => setDefaults({ fontFamily: e.target.value as FontFamily })}
              className={selectClass}
            >
              {Object.entries(FONT_FAMILY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </Field>
          <Field label="Text colour">
            <ColorInput
              value={rgbToHex(defaults.textColor)}
              onChange={(hex) => setDefaults({ textColor: hexToRgb(hex) })}
            />
          </Field>
          <Field label="Pen colour">
            <ColorInput
              value={rgbToHex(defaults.inkColor)}
              onChange={(hex) => setDefaults({ inkColor: hexToRgb(hex) })}
            />
          </Field>
          <Field label="Pen width">
            <input
              type="number" min={0.5} max={40} step={0.5}
              value={defaults.inkWidth}
              onChange={(e) => setDefaults({ inkWidth: Number(e.target.value) || 1 })}
              className={inputClass}
            />
          </Field>
          <Field label="Highlight">
            <ColorInput
              value={rgbToHex(defaults.highlightColor)}
              onChange={(hex) => setDefaults({ highlightColor: hexToRgb(hex) })}
            />
          </Field>
          <Field label="Shape stroke">
            <ColorInput
              value={rgbToHex(defaults.strokeColor)}
              onChange={(hex) => setDefaults({ strokeColor: hexToRgb(hex) })}
            />
          </Field>
        </Section>
      </Panel>
    );
  }

  return (
    <Panel>
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-800">
          {ELEMENT_LABELS[element.type]}
          {element.type === 'text' && element.fromOriginal && (
            <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
              from PDF
            </span>
          )}
        </p>
        <button
          type="button"
          title="Delete (Del)"
          aria-label="Delete element"
          data-testid="delete-element"
          onClick={() => dispatch({ type: 'deleteElements', ids: [element.id] })}
          className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>

      {element.type === 'text' && element.fromOriginal && (
        <p className="mt-2 rounded bg-amber-50 px-2 py-1.5 text-[11px] leading-snug text-amber-800">
          The original text is hidden behind a patch in the page&apos;s background colour and
          redrawn from this box.
        </p>
      )}

      {warning.length > 0 && (
        <p className="mt-2 rounded bg-red-50 px-2 py-1.5 text-[11px] leading-snug text-red-700">
          {warning.join(' ')} cannot be shown with the built-in PDF fonts and will export
          as &ldquo;?&rdquo;.
        </p>
      )}

      <Section title="Position">
        <div className="grid grid-cols-2 gap-2">
          {(['x', 'y', 'width', 'height'] as const).map((key) => (
            <label key={key} className="flex flex-col gap-0.5 text-[10px] uppercase text-slate-400">
              {key}
              <input
                type="number"
                value={Math.round(element[key])}
                onChange={(e) => patch({ [key]: Number(e.target.value) } as Partial<EditorElement>)}
                className="w-full rounded border border-slate-200 px-1.5 py-1 text-right text-xs text-slate-800 focus:border-sky-500 focus:outline-none"
              />
            </label>
          ))}
        </div>
      </Section>

      {element.type === 'text' && (
        <Section title="Text">
          <Field label="Size">
            <input
              type="number" min={4} max={400}
              value={element.fontSize}
              onChange={(e) => patch({ fontSize: Number(e.target.value) || 12 })}
              className={inputClass}
            />
          </Field>
          <Field label="Font">
            <select
              value={element.fontFamily}
              onChange={(e) => patch({ fontFamily: e.target.value as FontFamily })}
              className={selectClass}
            >
              {Object.entries(FONT_FAMILY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </Field>
          <Field label="Style">
            <span className="flex gap-1">
              <ToggleButton
                active={element.bold}
                onClick={() => patch({ bold: !element.bold })}
                label="Bold"
              >
                <span className="font-bold">B</span>
              </ToggleButton>
              <ToggleButton
                active={element.italic}
                onClick={() => patch({ italic: !element.italic })}
                label="Italic"
              >
                <span className="font-serif italic">I</span>
              </ToggleButton>
            </span>
          </Field>
          <Field label="Align">
            <span className="flex gap-1">
              {(['left', 'center', 'right'] as TextAlign[]).map((align) => (
                <ToggleButton
                  key={align}
                  active={element.align === align}
                  onClick={() => patch({ align })}
                  label={`Align ${align}`}
                >
                  <AlignGlyph align={align} />
                </ToggleButton>
              ))}
            </span>
          </Field>
          <Field label="Line height">
            <input
              type="number" min={0.8} max={4} step={0.05}
              value={element.lineHeight}
              onChange={(e) => patch({ lineHeight: Number(e.target.value) || 1.2 })}
              className={inputClass}
            />
          </Field>
          <Field label="Colour">
            <ColorInput
              value={rgbToHex(element.color)}
              onChange={(hex) => patch({ color: hexToRgb(hex) })}
            />
          </Field>
          {element.cover && (
            <Field label="Patch colour">
              <ColorInput
                value={rgbToHex(element.cover.color)}
                onChange={(hex) =>
                  patch({ cover: { ...element.cover!, color: hexToRgb(hex) } })
                }
              />
            </Field>
          )}
        </Section>
      )}

      {element.type === 'shape' && (
        <Section title="Shape">
          <Field label="Stroke">
            <ColorInput
              value={rgbToHex(element.strokeColor)}
              onChange={(hex) => patch({ strokeColor: hexToRgb(hex) })}
            />
          </Field>
          <Field label="Width">
            <input
              type="number" min={0} max={60} step={0.5}
              value={element.strokeWidth}
              onChange={(e) => patch({ strokeWidth: Number(e.target.value) })}
              className={inputClass}
            />
          </Field>
          {element.shape !== 'line' && element.shape !== 'arrow' && (
            <Field label="Fill">
              <ColorInput
                allowNone
                isNone={element.fillColor === null}
                onNone={(none) =>
                  patch({ fillColor: none ? null : { r: 0.9, g: 0.9, b: 0.95 } })
                }
                value={rgbToHex(element.fillColor ?? { r: 1, g: 1, b: 1 })}
                onChange={(hex) => patch({ fillColor: hexToRgb(hex) })}
              />
            </Field>
          )}
          <OpacityField value={element.opacity} onChange={(opacity) => patch({ opacity })} />
        </Section>
      )}

      {element.type === 'highlight' && (
        <Section title="Highlight">
          <Field label="Colour">
            <ColorInput
              value={rgbToHex(element.color)}
              onChange={(hex) => patch({ color: hexToRgb(hex) })}
            />
          </Field>
          <OpacityField value={element.opacity} onChange={(opacity) => patch({ opacity })} />
        </Section>
      )}

      {element.type === 'ink' && (
        <Section title={element.signature ? 'Signature' : 'Drawing'}>
          <Field label="Colour">
            <ColorInput
              value={rgbToHex(element.color)}
              onChange={(hex) => patch({ color: hexToRgb(hex) })}
            />
          </Field>
          <Field label="Width">
            <input
              type="number" min={0.5} max={40} step={0.5}
              value={element.strokeWidth}
              onChange={(e) => patch({ strokeWidth: Number(e.target.value) || 1 })}
              className={inputClass}
            />
          </Field>
          <OpacityField value={element.opacity} onChange={(opacity) => patch({ opacity })} />
        </Section>
      )}

      {element.type === 'image' && (
        <Section title="Image">
          <OpacityField value={element.opacity} onChange={(opacity) => patch({ opacity })} />
        </Section>
      )}

      <Section title="Arrange">
        <div className="grid grid-cols-2 gap-1.5">
          {([
            ['front', 'Bring to front'],
            ['forward', 'Forward'],
            ['backward', 'Backward'],
            ['back', 'Send to back'],
          ] as const).map(([direction, label]) => (
            <button
              key={direction}
              type="button"
              onClick={() => {
                breakCoalescing();
                dispatch({ type: 'reorderElement', id: element.id, direction });
              }}
              className="flex items-center justify-center gap-1 rounded border border-slate-200 px-2 py-1.5 text-[11px] text-slate-600 hover:bg-slate-50"
            >
              <LayersIcon className="h-3 w-3" />
              {label}
            </button>
          ))}
        </div>
      </Section>
    </Panel>
  );
}

function AlignGlyph({ align }: { align: TextAlign }) {
  const widths = align === 'left' ? [10, 6] : align === 'right' ? [10, 6] : [10, 6];
  return (
    <svg viewBox="0 0 12 10" className="h-3 w-3" aria-hidden="true">
      {widths.map((w, i) => (
        <rect
          key={i}
          x={align === 'left' ? 1 : align === 'right' ? 11 - w : (12 - w) / 2}
          y={i * 4 + 1}
          width={w}
          height="2"
          fill="currentColor"
        />
      ))}
    </svg>
  );
}

function OpacityField({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <Field label="Opacity">
      <span className="flex items-center gap-1.5">
        <input
          type="range" min={0.05} max={1} step={0.05}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-16 accent-sky-600"
        />
        <span className="w-8 text-right text-[11px] tabular-nums text-slate-500">
          {Math.round(value * 100)}%
        </span>
      </span>
    </Field>
  );
}

function ToggleButton({
  active, onClick, label, children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={`flex h-7 w-7 items-center justify-center rounded border text-xs ${
        active
          ? 'border-sky-500 bg-sky-50 text-sky-700'
          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
      }`}
    >
      {children}
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-4 border-t border-slate-100 pt-3">
      <h3 className="mb-2 text-[10px] font-semibold tracking-wide text-slate-400 uppercase">
        {title}
      </h3>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <aside className="w-[260px] shrink-0 overflow-y-auto border-l border-slate-200 bg-white px-3.5 py-3">
      {children}
    </aside>
  );
}
