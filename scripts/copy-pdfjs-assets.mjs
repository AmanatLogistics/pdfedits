// Copies the PDF.js worker plus the cmap/standard-font data files into public/.
// The worker must be served as a static asset, and the data files are what let
// PDF.js render documents that rely on non-embedded fonts or CJK encodings.
import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const pdfjsRoot = path.dirname(require.resolve('pdfjs-dist/package.json'));
const publicDir = path.resolve('public', 'pdfjs');

await rm(publicDir, { recursive: true, force: true });
await mkdir(publicDir, { recursive: true });

await cp(path.join(pdfjsRoot, 'build/pdf.worker.min.mjs'), path.join(publicDir, 'pdf.worker.min.mjs'));
// Also served standalone so tests can re-open an exported PDF in the browser.
await cp(path.join(pdfjsRoot, 'build/pdf.min.mjs'), path.join(publicDir, 'pdf.min.mjs'));
await cp(path.join(pdfjsRoot, 'cmaps'), path.join(publicDir, 'cmaps'), { recursive: true });
await cp(path.join(pdfjsRoot, 'standard_fonts'), path.join(publicDir, 'standard_fonts'), { recursive: true });
await cp(path.join(pdfjsRoot, 'wasm'), path.join(publicDir, 'wasm'), { recursive: true });

// PDF.js 6 relies on Map.prototype.getOrInsertComputed, which shipping
// browsers still lack. The worker is a separate script, so it needs the
// polyfill installed inside it before the real worker module is evaluated.
await cp(
  new URL('../src/lib/map-polyfill.mjs', import.meta.url),
  path.join(publicDir, 'map-polyfill.mjs'),
);
await writeFile(
  path.join(publicDir, 'pdf.worker.entry.mjs'),
  [
    "import { installMapPolyfill } from './map-polyfill.mjs';",
    'installMapPolyfill();',
    "// Dynamic, so the polyfill is in place before the worker is evaluated;",
    '// a static import would be hoisted above the call above.',
    "await import('./pdf.worker.min.mjs');",
    '',
  ].join('\n'),
);

console.log(`Copied PDF.js assets to ${publicDir}`);
