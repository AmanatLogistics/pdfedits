'use client';

import { useEffect, useRef, useState } from 'react';
import type { PDFFont } from 'pdf-lib';
import { CSS_FONT_STACK } from '@/lib/fonts';
import { layoutText } from '@/lib/textLayout';
import { rgbToCss } from '@/lib/colors';
import type { TextElement } from '@/lib/types';

interface Props {
  element: TextElement;
  scale: number;
  font?: PDFFont;
  onChange: (text: string, measuredHeight: number) => void;
  onCommit: () => void;
}

/**
 * A textarea overlaid exactly on top of a text element.
 *
 * Editing happens in a real form control — so caret movement, selection, IME
 * and clipboard all behave natively — while the styling is driven by the same
 * layout the renderer and exporter use. The textarea's own soft wrapping is
 * turned off and the value is pre-wrapped with PDF font metrics, which keeps
 * the line breaks the user sees identical to the ones that get exported.
 */
export function InlineTextEditor({ element, scale, font, onChange, onCommit }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    setFocused(false);
    // React renders discrete events synchronously, so this component mounts
    // while the originating pointerdown is still being handled. Focusing now
    // would be undone a moment later by the browser's own click focus
    // handling, which would blur us and close the editor instantly; waiting a
    // frame puts the focus in after the whole click has settled.
    const frame = requestAnimationFrame(() => {
      node.focus({ preventScroll: true });
      // Put the caret at the end so typing extends existing text.
      node.setSelectionRange(node.value.length, node.value.length);
    });
    return () => cancelAnimationFrame(frame);
  }, [element.id]);

  const lineStep = element.fontSize * element.lineHeight * scale;

  return (
    <textarea
      ref={ref}
      data-testid={`text-editor-${element.id}`}
      value={element.text}
      spellCheck={false}
      // Soft wrapping keeps typing in step with the committed layout: the CSS
      // stacks are metric-compatible with the PDF standard fonts and both
      // algorithms are greedy by word, so lines break in the same places.
      wrap="soft"
      onChange={(event) => {
        const text = event.target.value;
        const height = font
          ? layoutText({ ...element, text }, font).height
          : element.height;
        onChange(text, height);
      }}
      onFocus={() => setFocused(true)}
      // Ignore the stray blur that can arrive before focus has been taken.
      onBlur={() => focused && onCommit()}
      onKeyDown={(event) => {
        // Escape leaves the editor; Enter inserts a newline as in any editor.
        if (event.key === 'Escape') {
          event.preventDefault();
          onCommit();
        }
        event.stopPropagation();
      }}
      onPointerDown={(event) => event.stopPropagation()}
      className="absolute resize-none overflow-hidden border-0 bg-transparent p-0 outline-2 outline-offset-2 outline-sky-500"
      style={{
        left: element.x * scale,
        top: element.y * scale,
        width: element.width * scale,
        height: Math.max(element.height, element.fontSize * element.lineHeight) * scale,
        fontFamily: CSS_FONT_STACK[element.fontFamily],
        fontSize: element.fontSize * scale,
        fontWeight: element.bold ? 700 : 400,
        fontStyle: element.italic ? 'italic' : 'normal',
        color: rgbToCss(element.color),
        textAlign: element.align,
        lineHeight: `${lineStep}px`,
        whiteSpace: 'pre-wrap',
        // Matches layoutText, which breaks a word too long for the box.
        overflowWrap: 'break-word',
      }}
    />
  );
}
