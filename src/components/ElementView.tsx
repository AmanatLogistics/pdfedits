'use client';

import { memo, useMemo } from 'react';
import type { PDFFont } from 'pdf-lib';
import { CSS_FONT_STACK } from '@/lib/fonts';
import { layoutText } from '@/lib/textLayout';
import { rgbToCss } from '@/lib/colors';
import { inkPath } from '@/lib/export';
import type { EditorElement, ImageAsset, InkElement, ShapeElement } from '@/lib/types';

interface Props {
  element: EditorElement;
  scale: number;
  assets: Map<string, ImageAsset>;
  font?: PDFFont;
  /** Reserved for selection-specific rendering; the frame is drawn separately. */
  selected?: boolean;
  /** Hidden while the inline text editor is open over the top of it. */
  hidden?: boolean;
}

/**
 * Draws shapes and ink with the same geometry the exporter uses.
 *
 * The SVG is given a viewBox in page points and the element's pixel size, so
 * one path string serves both the preview and `drawSvgPath` at export time.
 */
function VectorOverlay({
  element,
  scale,
  path,
  stroke,
  strokeWidth,
  fill,
  opacity,
}: {
  element: EditorElement;
  scale: number;
  path: string;
  stroke?: string;
  strokeWidth: number;
  fill: string;
  opacity: number;
}) {
  // Strokes are centred on the path, so half of the width spills outside the
  // element box; pad the SVG to keep it from being clipped.
  const pad = strokeWidth / 2 + 1;
  return (
    <svg
      className="pointer-events-none absolute"
      style={{
        left: -pad * scale,
        top: -pad * scale,
        width: (element.width + pad * 2) * scale,
        height: (element.height + pad * 2) * scale,
        overflow: 'visible',
      }}
      viewBox={`${element.x - pad} ${element.y - pad} ${element.width + pad * 2} ${element.height + pad * 2}`}
    >
      <path
        d={path}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={opacity}
      />
    </svg>
  );
}

function shapePath(element: ShapeElement): string {
  const { x, y, width, height } = element;
  switch (element.shape) {
    case 'rectangle':
      return `M ${x} ${y} H ${x + width} V ${y + height} H ${x} Z`;
    case 'ellipse': {
      const rx = width / 2;
      const ry = height / 2;
      const cx = x + rx;
      const cy = y + ry;
      return (
        `M ${cx - rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx + rx} ${cy} ` +
        `A ${rx} ${ry} 0 1 0 ${cx - rx} ${cy} Z`
      );
    }
    case 'line':
      return `M ${x} ${y} L ${x + width} ${y + height}`;
    case 'arrow': {
      const to = { x: x + width, y: y + height };
      const angle = Math.atan2(height, width);
      const size = Math.max(6, element.strokeWidth * 3.5);
      const wing = (offset: number) => ({
        x: to.x - size * Math.cos(angle - offset),
        y: to.y - size * Math.sin(angle - offset),
      });
      const a = wing(Math.PI / 7);
      const b = wing(-Math.PI / 7);
      return `M ${x} ${y} L ${to.x} ${to.y} M ${a.x} ${a.y} L ${to.x} ${to.y} L ${b.x} ${b.y}`;
    }
  }
}

function TextBody({
  element,
  scale,
  font,
}: {
  element: Extract<EditorElement, { type: 'text' }>;
  scale: number;
  font?: PDFFont;
}) {
  const layout = useMemo(
    () => (font ? layoutText(element, font) : null),
    [element, font],
  );

  if (!layout) return null;

  return (
    <>
      {layout.lines.map((line, index) => (
        <span
          key={index}
          className="absolute whitespace-pre"
          style={{
            left: line.x * scale,
            // Position by baseline, exactly as the exporter does.
            top: (line.baseline - element.fontSize * 0.718) * scale,
            fontFamily: CSS_FONT_STACK[element.fontFamily],
            fontSize: element.fontSize * scale,
            fontWeight: element.bold ? 700 : 400,
            fontStyle: element.italic ? 'italic' : 'normal',
            color: rgbToCss(element.color),
            lineHeight: 1,
          }}
        >
          {line.text}
        </span>
      ))}
    </>
  );
}

function ElementViewImpl({ element, scale, assets, font, hidden }: Props) {
  const box = {
    left: element.x * scale,
    top: element.y * scale,
    width: element.width * scale,
    height: element.height * scale,
  };

  if (element.type === 'text') {
    return (
      <>
        {/* Painted first, and identically at export, so replacing original
            text looks the same on screen as in the downloaded file. */}
        {element.cover && (
          <div
            className="pointer-events-none absolute"
            style={{
              left: element.cover.rect.x * scale,
              top: element.cover.rect.y * scale,
              width: element.cover.rect.width * scale,
              height: element.cover.rect.height * scale,
              background: rgbToCss(element.cover.color),
            }}
          />
        )}
        <div
          data-element-id={element.id}
          className="absolute"
          style={{ ...box, visibility: hidden ? 'hidden' : 'visible' }}
        >
          <TextBody element={element} scale={scale} font={font} />
        </div>
      </>
    );
  }

  if (element.type === 'image') {
    const asset = assets.get(element.assetId);
    return (
      <div data-element-id={element.id} className="absolute" style={box}>
        {asset ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={asset.objectUrl}
            alt=""
            draggable={false}
            className="h-full w-full select-none"
            style={{ opacity: element.opacity }}
          />
        ) : (
          <div className="h-full w-full bg-slate-200" />
        )}
      </div>
    );
  }

  if (element.type === 'highlight') {
    return (
      <div
        data-element-id={element.id}
        className="absolute"
        style={{
          ...box,
          background: rgbToCss(element.color),
          opacity: element.opacity,
          // Matches BlendMode.Multiply in the exported PDF.
          mixBlendMode: 'multiply',
        }}
      />
    );
  }

  if (element.type === 'shape') {
    return (
      <div data-element-id={element.id} className="absolute" style={box}>
        <VectorOverlay
          element={element}
          scale={scale}
          path={shapePath(element)}
          stroke={rgbToCss(element.strokeColor)}
          strokeWidth={element.strokeWidth}
          fill={element.fillColor ? rgbToCss(element.fillColor) : 'none'}
          opacity={element.opacity}
        />
      </div>
    );
  }

  const ink = element as InkElement;
  return (
    <div data-element-id={element.id} className="absolute" style={box}>
      <VectorOverlay
        element={ink}
        scale={scale}
        path={inkPath(ink)}
        stroke={rgbToCss(ink.color)}
        strokeWidth={ink.strokeWidth}
        fill="none"
        opacity={ink.opacity}
      />
    </div>
  );
}

export const ElementView = memo(ElementViewImpl);
