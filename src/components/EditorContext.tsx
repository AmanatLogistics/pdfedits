'use client';

import { createContext, useContext } from 'react';
import type { PDFDocumentProxy } from '@/lib/pdfjs';
import type { EditorStore } from '@/lib/store';
import type { ToolDefaults } from '@/lib/elements';
import type { ImageAsset, OriginalTextRun, SourcePage, ToolId } from '@/lib/types';

export interface EditorContextValue {
  store: EditorStore;
  pdf: PDFDocumentProxy;
  sourcePages: Map<number, SourcePage>;
  assets: Map<string, ImageAsset>;
  registerAsset: (asset: ImageAsset) => void;
  tool: ToolId;
  setTool: (tool: ToolId) => void;
  defaults: ToolDefaults;
  setDefaults: (patch: Partial<ToolDefaults>) => void;
  scale: number;
  /** Text runs found on a page, loaded on demand once the page has rendered. */
  getTextRuns: (sourceIndex: number) => OriginalTextRun[] | undefined;
  setTextRuns: (sourceIndex: number, runs: OriginalTextRun[]) => void;
  /** Set while a pointer gesture is in flight on a page. */
  setInteracting: (value: boolean) => void;
  requestImage: (pageId: string, at: { x: number; y: number }) => void;
  requestSignature: (pageId: string, at: { x: number; y: number }) => void;
}

const EditorContext = createContext<EditorContextValue | null>(null);

export const EditorProvider = EditorContext.Provider;

export function useEditor(): EditorContextValue {
  const value = useContext(EditorContext);
  if (!value) throw new Error('useEditor must be used inside the editor');
  return value;
}
