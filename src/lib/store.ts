'use client';

import { useCallback, useMemo, useReducer } from 'react';
import type {
  DocumentState,
  EditorElement,
  PageState,
} from './types';

/**
 * Editor state with undo/redo.
 *
 * Only `DocumentState` — the pages and their elements — is snapshotted. Image
 * bytes live in a separate asset registry keyed by id, so a history entry stays
 * small no matter how many photos have been placed.
 */

export interface EditorState {
  present: DocumentState;
  past: DocumentState[];
  future: DocumentState[];
  selectedIds: string[];
  /** Element currently open for inline text editing, if any. */
  editingId: string | null;
  activePageId: string | null;
}

const HISTORY_LIMIT = 60;

export type Action =
  | { type: 'init'; pages: PageState[] }
  | { type: 'addElement'; pageId: string; element: EditorElement; select?: boolean }
  | { type: 'updateElements'; changes: { id: string; patch: Partial<EditorElement> }[]; coalesce?: string }
  | { type: 'deleteElements'; ids: string[] }
  | { type: 'reorderElement'; id: string; direction: 'front' | 'back' | 'forward' | 'backward' }
  | { type: 'setPageRotation'; pageId: string; delta: number }
  | { type: 'movePage'; from: number; to: number }
  | { type: 'duplicatePage'; pageId: string }
  | { type: 'deletePage'; pageId: string }
  | { type: 'select'; ids: string[] }
  | { type: 'setEditing'; id: string | null }
  | { type: 'setActivePage'; pageId: string | null }
  | { type: 'undo' }
  | { type: 'redo' };

export const initialEditorState: EditorState = {
  present: { pages: [] },
  past: [],
  future: [],
  selectedIds: [],
  editingId: null,
  activePageId: null,
};

/** Actions that mutate the document and therefore push a history entry. */
const MUTATING = new Set<Action['type']>([
  'addElement',
  'updateElements',
  'deleteElements',
  'reorderElement',
  'setPageRotation',
  'movePage',
  'duplicatePage',
  'deletePage',
]);

/**
 * Groups rapid successive edits of the same kind into one undo step, so that
 * dragging an element or typing a sentence does not fill the history with
 * dozens of intermediate states.
 */
interface CoalesceInfo {
  key: string;
  at: number;
}
let lastCoalesce: CoalesceInfo | null = null;
const COALESCE_WINDOW_MS = 700;

function shouldCoalesce(action: Action): boolean {
  if (action.type !== 'updateElements' || !action.coalesce) {
    lastCoalesce = null;
    return false;
  }
  const now = Date.now();
  const same =
    lastCoalesce?.key === action.coalesce && now - lastCoalesce.at < COALESCE_WINDOW_MS;
  lastCoalesce = { key: action.coalesce, at: now };
  return same;
}

/** Marks the next mutating action as the start of a fresh undo step. */
export function breakCoalescing(): void {
  lastCoalesce = null;
}

function mapPage(
  state: DocumentState,
  pageId: string,
  fn: (page: PageState) => PageState,
): DocumentState {
  return { pages: state.pages.map((p) => (p.id === pageId ? fn(p) : p)) };
}

function documentReducer(state: DocumentState, action: Action): DocumentState {
  switch (action.type) {
    case 'addElement':
      return mapPage(state, action.pageId, (page) => ({
        ...page,
        elements: [...page.elements, action.element],
      }));

    case 'updateElements': {
      const patches = new Map(action.changes.map((c) => [c.id, c.patch]));
      return {
        pages: state.pages.map((page) => {
          if (!page.elements.some((el) => patches.has(el.id))) return page;
          return {
            ...page,
            elements: page.elements.map((el) => {
              const patch = patches.get(el.id);
              return patch ? ({ ...el, ...patch } as EditorElement) : el;
            }),
          };
        }),
      };
    }

    case 'deleteElements': {
      const ids = new Set(action.ids);
      return {
        pages: state.pages.map((page) =>
          page.elements.some((el) => ids.has(el.id))
            ? { ...page, elements: page.elements.filter((el) => !ids.has(el.id)) }
            : page,
        ),
      };
    }

    case 'reorderElement':
      return {
        pages: state.pages.map((page) => {
          const index = page.elements.findIndex((el) => el.id === action.id);
          if (index === -1) return page;
          const elements = [...page.elements];
          const [element] = elements.splice(index, 1);
          const target =
            action.direction === 'front'
              ? elements.length
              : action.direction === 'back'
                ? 0
                : action.direction === 'forward'
                  ? Math.min(elements.length, index + 1)
                  : Math.max(0, index - 1);
          elements.splice(target, 0, element);
          return { ...page, elements };
        }),
      };

    case 'setPageRotation':
      return mapPage(state, action.pageId, (page) => ({
        ...page,
        rotation: (((page.rotation + action.delta) % 360) + 360) % 360,
      }));

    case 'movePage': {
      const pages = [...state.pages];
      if (action.from < 0 || action.from >= pages.length) return state;
      const [page] = pages.splice(action.from, 1);
      pages.splice(Math.max(0, Math.min(pages.length, action.to)), 0, page);
      return { pages };
    }

    case 'duplicatePage': {
      const index = state.pages.findIndex((p) => p.id === action.pageId);
      if (index === -1) return state;
      const source = state.pages[index];
      const copy: PageState = {
        ...source,
        id: `page-${crypto.randomUUID()}`,
        // Elements need fresh ids so selection and edits stay independent.
        elements: source.elements.map((el) => ({
          ...el,
          id: `el-${crypto.randomUUID()}`,
        })),
      };
      const pages = [...state.pages];
      pages.splice(index + 1, 0, copy);
      return { pages };
    }

    case 'deletePage':
      // Refuse to empty the document entirely; a PDF needs at least one page.
      return state.pages.length <= 1
        ? state
        : { pages: state.pages.filter((p) => p.id !== action.pageId) };

    default:
      return state;
  }
}

export function editorReducer(state: EditorState, action: Action): EditorState {
  switch (action.type) {
    case 'init':
      return {
        ...initialEditorState,
        present: { pages: action.pages },
        activePageId: action.pages[0]?.id ?? null,
      };

    case 'select':
      return { ...state, selectedIds: action.ids, editingId: null };

    case 'setEditing':
      return {
        ...state,
        editingId: action.id,
        selectedIds: action.id ? [action.id] : state.selectedIds,
      };

    case 'setActivePage':
      return { ...state, activePageId: action.pageId };

    case 'undo': {
      const previous = state.past[state.past.length - 1];
      if (!previous) return state;
      breakCoalescing();
      return {
        ...state,
        past: state.past.slice(0, -1),
        present: previous,
        future: [state.present, ...state.future],
        editingId: null,
        selectedIds: keepExisting(state.selectedIds, previous),
      };
    }

    case 'redo': {
      const next = state.future[0];
      if (!next) return state;
      breakCoalescing();
      return {
        ...state,
        past: [...state.past, state.present],
        present: next,
        future: state.future.slice(1),
        editingId: null,
        selectedIds: keepExisting(state.selectedIds, next),
      };
    }

    default: {
      if (!MUTATING.has(action.type)) return state;

      const present = documentReducer(state.present, action);
      if (present === state.present) return state;

      const coalesced = shouldCoalesce(action);
      const past = coalesced
        ? state.past
        : [...state.past, state.present].slice(-HISTORY_LIMIT);

      let selectedIds = state.selectedIds;
      if (action.type === 'addElement' && action.select !== false) {
        selectedIds = [action.element.id];
      } else if (action.type === 'deleteElements') {
        const removed = new Set(action.ids);
        selectedIds = selectedIds.filter((id) => !removed.has(id));
      }

      return {
        ...state,
        present,
        past,
        future: [],
        selectedIds,
        editingId:
          action.type === 'deleteElements' && action.ids.includes(state.editingId ?? '')
            ? null
            : state.editingId,
      };
    }
  }
}

function keepExisting(ids: string[], doc: DocumentState): string[] {
  const available = new Set(doc.pages.flatMap((p) => p.elements.map((el) => el.id)));
  return ids.filter((id) => available.has(id));
}

export interface EditorStore {
  state: EditorState;
  dispatch: React.Dispatch<Action>;
  pages: PageState[];
  canUndo: boolean;
  canRedo: boolean;
  /** Finds an element and the page it belongs to. */
  findElement: (id: string) =>
    | { element: EditorElement; page: PageState; index: number }
    | undefined;
  selectedElements: EditorElement[];
}

export function useEditorStore(): EditorStore {
  const [state, dispatch] = useReducer(editorReducer, initialEditorState);

  const findElement = useCallback(
    (id: string) => {
      for (const page of state.present.pages) {
        const index = page.elements.findIndex((el) => el.id === id);
        if (index !== -1) return { element: page.elements[index], page, index };
      }
      return undefined;
    },
    [state.present.pages],
  );

  const selectedElements = useMemo(() => {
    const wanted = new Set(state.selectedIds);
    const found: EditorElement[] = [];
    for (const page of state.present.pages) {
      for (const el of page.elements) if (wanted.has(el.id)) found.push(el);
    }
    return found;
  }, [state.present.pages, state.selectedIds]);

  return {
    state,
    dispatch,
    pages: state.present.pages,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    findElement,
    selectedElements,
  };
}
