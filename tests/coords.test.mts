/**
 * Verifies the view-space <-> PDF user-space round trip that the exporter
 * relies on, including pages that carry their own /Rotate, and checks that a
 * duplicated page really does get an independent content stream.
 *
 * Run with: npx tsx tests/coords.test.mts
 */
import assert from 'node:assert/strict';
import { PDFDocument, StandardFonts, degrees } from 'pdf-lib';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import { exportPdf } from '../src/lib/export.ts';
import { invertMatrix } from '../src/lib/geometry.ts';
import type { PageState, SourcePage, TextElement } from '../src/lib/types.ts';

pdfjs.GlobalWorkerOptions.workerSrc = 'pdfjs-dist/legacy/build/pdf.worker.mjs';

async function buildSource(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (const rotation of [0, 90, 180, 270]) {
    const page = doc.addPage([400, 600]);
    page.setRotation(degrees(rotation));
    page.drawText(`base ${rotation}`, { x: 20, y: 20, size: 10, font });
  }
  return doc.save();
}

async function describePages(bytes: Uint8Array) {
  const doc = await pdfjs.getDocument({ data: bytes.slice(), useSystemFonts: false }).promise;
  const out = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();
    type Item = { str: string; transform: number[] };
    const items = content.items
      .filter((it): it is Item => 'str' in it && (it as Item).str.trim() !== '')
      .map((it) => {
        const tx = pdfjs.Util.transform(viewport.transform, it.transform);
        // Use the full linear part: for text rotated by the page's /Rotate the
        // glyph height moves out of tx[3] and into tx[1]/tx[2].
        return {
          str: it.str,
          x: tx[4],
          y: tx[5],
          size: Math.hypot(tx[2], tx[3]),
        };
      });
    out.push({
      index: i - 1,
      width: viewport.width,
      height: viewport.height,
      inverseTransform: invertMatrix(viewport.transform),
      items,
    });
  }
  return out;
}

const TEXT_AT = { x: 120, y: 80 };

function textElement(id: string, label: string): TextElement {
  return {
    id,
    type: 'text',
    x: TEXT_AT.x,
    y: TEXT_AT.y,
    width: 200,
    height: 20,
    text: label,
    fontSize: 14,
    fontFamily: 'sans',
    bold: false,
    italic: false,
    color: { r: 0, g: 0, b: 0 },
    align: 'left',
    lineHeight: 1.2,
    fromOriginal: false,
  };
}

const originalBytes = await buildSource();
const described = await describePages(originalBytes);

const sourcePages = new Map<number, SourcePage>(
  described.map((p) => [
    p.index,
    {
      index: p.index,
      width: p.width,
      height: p.height,
      inverseTransform: p.inverseTransform,
    },
  ]),
);

// Four rotated pages, plus a duplicate of page 0 carrying different text.
const pages: PageState[] = described.map((p, i) => ({
  id: `page-${i}`,
  sourceIndex: p.index,
  width: p.width,
  height: p.height,
  rotation: 0,
  elements: [textElement(`el-${i}`, `MARK${i}`)],
}));
pages.push({
  id: 'page-dup',
  sourceIndex: 0,
  width: described[0].width,
  height: described[0].height,
  rotation: 0,
  elements: [textElement('el-dup', 'DUPTEXT')],
});
// Editor-applied rotation: annotations live in unrotated view space and must
// stay glued to the page content when the user rotates the page.
for (const [i, delta] of [90, 180, 270].entries()) {
  pages.push({
    id: `page-rot${delta}`,
    sourceIndex: 0,
    width: described[0].width,
    height: described[0].height,
    rotation: delta,
    elements: [textElement(`el-rot${delta}`, `ROT${i}`)],
  });
}

const { bytes, droppedCharacters } = await exportPdf({
  originalBytes,
  pages,
  sourcePages,
  assets: new Map(),
});
assert.deepEqual(droppedCharacters, [], 'no characters should be dropped');

const result = await describePages(bytes);
assert.equal(result.length, 8, 'exported page count');

let failures = 0;
const labels = ['MARK0', 'MARK1', 'MARK2', 'MARK3', 'DUPTEXT', 'ROT0', 'ROT1', 'ROT2'];
for (let i = 0; i < labels.length; i++) {
  const label = labels[i];
  const found = result[i].items.find((it) => it.str.replace(/\s/g, '') === label);
  if (!found) {
    console.error(`page ${i}: MISSING "${label}"; items = ${JSON.stringify(result[i].items)}`);
    failures++;
    continue;
  }
  // layoutText puts the baseline at (lineStep - size)/2 + ascent below the box top.
  const ascent = 14 * 0.718;
  const baseX = TEXT_AT.x;
  const baseY = TEXT_AT.y + (14 * 1.2 - 14) / 2 + ascent;
  // Pages the user rotated in the editor carry a /Rotate, so PDF.js reports the
  // annotation in the *rotated* view space. Applying the same rotation to the
  // expected point is what proves the annotation stayed glued to the content.
  const delta = pages[i].rotation;
  const [pw, ph] = [pages[i].width, pages[i].height];
  const expected =
    delta === 90
      ? { x: ph - baseY, y: baseX }
      : delta === 180
        ? { x: pw - baseX, y: ph - baseY }
        : delta === 270
          ? { x: baseY, y: pw - baseX }
          : { x: baseX, y: baseY };
  const dx = Math.abs(found.x - expected.x);
  const dy = Math.abs(found.y - expected.y);
  const ds = Math.abs(found.size - 14);
  const ok = dx < 0.6 && dy < 0.6 && ds < 0.2;
  console.log(
    `page ${i} ${label.padEnd(8)}: ` +
      `x=${found.x.toFixed(2)} (dx ${dx.toFixed(3)}) ` +
      `y=${found.y.toFixed(2)} (dy ${dy.toFixed(3)}) size=${found.size.toFixed(2)} ${ok ? 'OK' : 'FAIL'}`,
  );
  if (!ok) failures++;
}

// Independence: the duplicate must not have inherited page 0's MARK0, and
// page 0 must not have picked up DUPTEXT.
const page0 = result[0].items.map((i) => i.str).join('');
const dup = result[4].items.map((i) => i.str).join('');
assert.ok(!page0.includes('DUPTEXT'), `page 0 leaked duplicate text: ${page0}`);
assert.ok(!dup.includes('MARK0'), `duplicate leaked page 0 text: ${dup}`);
console.log('duplicate page isolation OK');

if (failures) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log('\nAll coordinate checks passed.');
