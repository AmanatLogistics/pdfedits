'use client';

import { useCallback, useRef, useState } from 'react';
import { FileIcon } from './icons';

interface Props {
  onFile: (file: File) => void;
  loading: boolean;
  error: string | null;
  /** Set when the PDF is encrypted and needs a password to open. */
  passwordPrompt: { wrongPassword: boolean } | null;
  onPassword: (password: string) => void;
  progress: number | null;
}

const MAX_BYTES = 500 * 1024 * 1024;

export function UploadScreen({
  onFile, loading, error, passwordPrompt, onPassword, progress,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [password, setPassword] = useState('');

  const accept = useCallback(
    (file: File | undefined) => {
      setLocalError(null);
      if (!file) return;
      // Some browsers report an empty type for files dragged from archives.
      const looksLikePdf =
        file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      if (!looksLikePdf) {
        setLocalError('That is not a PDF. Choose a file ending in .pdf.');
        return;
      }
      if (file.size === 0) {
        setLocalError('That file is empty.');
        return;
      }
      if (file.size > MAX_BYTES) {
        setLocalError('That PDF is larger than 500 MB, which is too big to edit in a browser.');
        return;
      }
      onFile(file);
    },
    [onFile],
  );

  const message = localError ?? error;

  if (passwordPrompt) {
    return (
      <Centered>
        <h1 className="text-lg font-semibold text-slate-800">This PDF is password protected</h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Enter the password to open it. It is used only in your browser.
        </p>
        <form
          className="mt-5 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            onPassword(password);
          }}
        >
          <input
            type="password"
            autoFocus
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-60"
          >
            {loading ? 'Opening…' : 'Open'}
          </button>
        </form>
        {passwordPrompt.wrongPassword && (
          <p className="mt-3 text-sm text-red-600">That password did not work. Try again.</p>
        )}
      </Centered>
    );
  }

  return (
    <Centered>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-800">PDF Editor</h1>
      <p className="mt-2 text-sm leading-relaxed text-slate-500">
        Edit text that is already in your PDF, add images, shapes, highlights and
        signatures, then download the result. Everything happens in this browser tab —
        your file is never uploaded anywhere.
      </p>

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          accept(event.dataTransfer.files[0]);
        }}
        className={`mt-6 rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors ${
          dragging ? 'border-sky-500 bg-sky-50' : 'border-slate-300 bg-white'
        }`}
      >
        <FileIcon className="mx-auto h-10 w-10 text-slate-300" />
        <p className="mt-3 text-sm text-slate-600">Drop a PDF here</p>
        <p className="mt-0.5 text-xs text-slate-400">or</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          className="mt-3 rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700 disabled:opacity-60"
        >
          {loading ? 'Opening…' : 'Choose a PDF'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          data-testid="file-input"
          className="hidden"
          onChange={(event) => {
            accept(event.target.files?.[0]);
            // Allow re-picking the same file after an error.
            event.target.value = '';
          }}
        />
      </div>

      {loading && progress !== null && (
        <div className="mt-4">
          <div className="h-1 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full bg-sky-500 transition-[width]"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
          <p className="mt-1.5 text-center text-xs text-slate-400">
            Reading page {Math.round(progress * 100)}%
          </p>
        </div>
      )}

      {message && (
        <p
          role="alert"
          data-testid="upload-error"
          className="mt-4 rounded-md bg-red-50 px-3 py-2.5 text-sm text-red-700"
        >
          {message}
        </p>
      )}
    </Centered>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
