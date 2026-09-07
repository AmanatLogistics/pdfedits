'use client';

import type {
  PDFDocumentProxy,
  PDFPageProxy,
} from 'pdfjs-dist/types/src/display/api';

export type { PDFDocumentProxy, PDFPageProxy };

type PdfJsModule = typeof import('pdfjs-dist');

import { installMapPolyfill } from './map-polyfill.mjs';

let modulePromise: Promise<PdfJsModule> | null = null;

/**
 * Loads PDF.js lazily and points it at the worker and data files copied into
 * `public/pdfjs` by `scripts/copy-pdfjs-assets.mjs`. The cmap and standard-font
 * data are what let documents that do not embed their fonts render correctly.
 */
export function loadPdfJs(): Promise<PdfJsModule> {
  if (!modulePromise) {
    // Must run before PDF.js is evaluated: it calls these Map methods eagerly.
    installMapPolyfill();
    modulePromise = import('pdfjs-dist').then((pdfjs) => {
      // A thin entry module that installs the same polyfill inside the worker
      // before handing over to the real PDF.js worker.
      pdfjs.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.entry.mjs';
      return pdfjs;
    });
  }
  return modulePromise;
}

export const PDFJS_DATA_OPTIONS = {
  cMapUrl: '/pdfjs/cmaps/',
  cMapPacked: true,
  standardFontDataUrl: '/pdfjs/standard_fonts/',
  wasmUrl: '/pdfjs/wasm/',
} as const;

export class PdfPasswordRequired extends Error {
  constructor(public readonly wrongPassword: boolean) {
    super(wrongPassword ? 'Incorrect password' : 'This PDF is password protected');
    this.name = 'PdfPasswordRequired';
  }
}

export class PdfLoadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PdfLoadError';
  }
}

/**
 * Opens a PDF from raw bytes, translating PDF.js's exception types into
 * messages the UI can show directly.
 */
export async function openPdf(
  data: Uint8Array,
  password?: string,
): Promise<PDFDocumentProxy> {
  const pdfjs = await loadPdfJs();
  try {
    // PDF.js takes ownership of (and detaches) the buffer it is handed, so the
    // caller's copy stays intact only because we clone here.
    return await pdfjs.getDocument({
      data: data.slice(),
      password,
      ...PDFJS_DATA_OPTIONS,
    }).promise;
  } catch (error) {
    const name = (error as { name?: string })?.name;
    if (name === 'PasswordException') {
      // code 1 = password needed, 2 = supplied password was wrong.
      const code = (error as { code?: number }).code;
      throw new PdfPasswordRequired(code === 2);
    }
    if (name === 'InvalidPDFException') {
      throw new PdfLoadError(
        'That file is not a valid PDF, or it is too damaged to open.',
      );
    }
    throw new PdfLoadError(
      (error as Error)?.message || 'The PDF could not be opened.',
    );
  }
}
