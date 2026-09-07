# Browser PDF Editor

A PDF editor that runs entirely in the browser. Open a PDF, edit the text that
is already in it, add images, shapes, highlights, drawings and signatures,
reorganise the pages, and download the result.

**Nothing is uploaded.** The file is read with `FileReader`, rendered with
PDF.js, and rewritten with pdf-lib — all in the tab. There is no backend, no
API key, and no external service.

## Running it

```bash
npm install
npm run dev          # http://localhost:3000
```

```bash
npm run build && npm run start   # production
npm test                         # lint, typecheck, coordinate tests, e2e tests
```

`npm install` and `npm run dev`/`build` copy the PDF.js worker, cmaps and
standard-font data into `public/pdfjs/` via `scripts/copy-pdfjs-assets.mjs`.
That directory is generated, and git-ignored.

## What it does

| Area | Details |
| --- | --- |
| Text already in the PDF | Click it and type. Detects the font family, weight, slant and size from the document. |
| New text | Font size, family (Helvetica / Times / Courier), bold, italic, alignment, line height, colour. |
| Images | PNG and JPEG embed directly; WebP, GIF, BMP and AVIF are converted to PNG first. |
| Shapes | Rectangle, ellipse, line, arrow — stroke colour and width, optional fill, opacity. |
| Highlight | Drawn with a multiply blend, so the text underneath stays readable. |
| Freehand and signatures | Captured as vector strokes, not bitmaps, so they stay sharp at any zoom. |
| Pages | Reorder by dragging a thumbnail, rotate, duplicate, delete. |
| History | Undo/redo with related edits coalesced into single steps. |
| Zoom | 10%–600% plus fit-width. |

Keyboard: `V` select, `T` text, `I` image, `D` draw, `H` highlight, `R`
rectangle, `O` ellipse, `L` line, `A` arrow, `S` signature; `Ctrl/Cmd+Z` and
`Ctrl/Cmd+Shift+Z` for history, `Ctrl/Cmd +/-/0` for zoom, arrow keys to nudge
(hold `Shift` for 10pt steps), `Delete` to remove, `Esc` to deselect.

## How it fits together

```
src/lib/          the parts that have nothing to do with React
  types.ts        the document model
  geometry.ts     affine transforms, hit testing, rotation
  fonts.ts        pdf-lib standard-font metrics, WinAnsi encodability
  textLayout.ts   word wrap and alignment, shared by preview and export
  textExtract.ts  turns PDF.js text items into editable runs
  colors.ts       colour conversion, page-background sampling
  elements.ts     element factories and defaults
  assets.ts       image decoding and transcoding
  export.ts       writes the PDF with pdf-lib
  store.ts        reducer, selection, undo/redo
  pdfjs.ts        PDF.js loading and error translation
src/components/   the UI
```

### One coordinate system

Every element stores its geometry in **view space**: PDF points, origin at the
top-left of the page *as displayed* (the page's own `/Rotate` already applied),
y increasing downwards. The renderer multiplies by the zoom factor; the
exporter maps back into PDF user space using the inverse of the PDF.js viewport
matrix, captured once per page at load.

That inverse matrix is also what makes rotated pages work. pdf-lib's
`drawSvgPath` emits `translate(x, y) · rotate(θ) · scale(1, -1)`, and view space
is always user space flipped in y and rotated by `/Rotate` — so a single angle,
recovered with `atan2` from the matrix, positions text, images, shapes and ink
alike. No special cases per rotation. `tests/coords.test.mts` checks the round
trip against all four page rotations to three decimal places.

Rotation applied *in the editor* is a page property, not an element one:
elements stay in the unrotated view space and the exporter calls
`setRotation`, so annotations rotate with the content they were placed on.

### Text that matches on export

Preview and export measure with the **same pdf-lib `PDFFont` objects** and run
the same `layoutText`, so line breaks, alignment and baselines are identical in
the editor and in the downloaded file. The CSS stacks are metric-compatible
with the PDF standard fonts (Arial/Helvetica and Courier New/Courier share
width tables), so the rasterised preview agrees too.

### Editing text that is already in the PDF

A PDF's glyphs are drawing instructions in a content stream; they cannot be
edited in place, and pdf-lib cannot remove them. So the editor does what PDF
editors generally do:

1. `getTextContent()` gives per-fragment transforms, which are stitched back
   into whole lines (PDF.js splits a sentence across many items).
2. Clicking a run samples the rendered page for the dominant colour in a ring
   around the glyphs — white paper, a tinted table row, a coloured callout.
3. A patch rectangle in that colour is painted over the original text, and the
   new text is drawn on top. The editor paints the same patch, so the preview
   and the export agree.

Elements derived this way are marked **from PDF** in the properties panel, and
the patch colour is editable if the sampled colour is wrong.

## Known limits

- **Non-Latin text.** Only PDF's built-in fonts are embedded, which are limited
  to WinAnsi. Cyrillic, Greek, CJK, and characters such as `→` cannot be
  encoded; they are flagged in the properties panel as you type, exported as
  `?`, and listed after download. Lifting this means embedding a Unicode TTF
  with `@pdf-lib/fontkit` — `fonts.ts` is where that would go.
- **Rotated and sheared original text** is not offered for inline editing (the
  hit-test rejects it), because a horizontal editing box would misrepresent it.
  It still renders and exports untouched.
- **Scanned PDFs** have no text layer, so there is nothing to click; annotation
  tools work normally.
- Text is patched, not removed, so the original glyphs remain in the file
  underneath the patch. This is not a redaction tool.

## Tests

`tests/coords.test.mts` (Node) checks the view↔user round trip across all four
page rotations, editor-applied rotation, and that a duplicated page gets an
independent content stream rather than a second reference to the first.

`tests/e2e/` (Playwright) drives the real app: upload → edit → export →
**re-open the exported PDF and verify it**. Text is checked by position and
size; shapes, highlights, ink and images have no text items, so those are
verified by rendering the exported PDF and sampling pixels where each element
was drawn. It also covers the invalid-file path, a 150-page document, page
reordering/rotation/duplication/deletion, and that preview and export wrap long
text into the same lines.

```bash
npm run test:coords
npm run test:e2e
```

## A note on the canvas layer

The brief suggested Fabric.js or Konva for the editing layer. This uses
positioned DOM elements with inline SVG for vector content instead, because the
hard requirement here is that the export matches the preview: both are driven
by the same view-space model and the same font metrics, and an SVG path string
is handed to `drawSvgPath` unchanged. Routing geometry through a canvas
library's own model would add a translation step between what is shown and what
is written, which is exactly where fidelity is lost. It also means text editing
uses a real `<textarea>`, so caret movement, selection, IME and clipboard
behave natively. `ElementView.tsx` is the single place a new element type needs
rendering, next to `export.ts` for its drawing.
