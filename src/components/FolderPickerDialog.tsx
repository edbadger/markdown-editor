import { useEffect, useRef, useState } from 'react';
import { Folder, FolderOpen } from 'lucide-react';
import { getRecentFolders } from '../hooks/useFolderState';

type Props = {
  open: boolean;
  initialPath?: string;
  onPick: (path: string) => void | Promise<void>;
  onClose?: () => void;
  error?: string | null;
};

export function FolderPickerDialog({
  open,
  initialPath = '',
  onPick,
  onClose,
  error,
}: Props) {
  const [value, setValue] = useState(initialPath);
  const [busy, setBusy] = useState(false);
  const [recent] = useState(() => getRecentFolders());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setValue(initialPath);
      setBusy(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open, initialPath]);

  if (!open) return null;

  const submit = async (p: string) => {
    if (!p.trim()) return;
    setBusy(true);
    try {
      await onPick(p.trim());
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-line bg-canvas p-6 shadow-2xl dark:border-line-dark dark:bg-sidebar-dark">
        <div className="mb-4 flex items-center gap-2">
          <FolderOpen size={20} className="text-accent dark:text-accent-dark" />
          <h2 className="font-serif text-xl font-semibold">Open folder</h2>
        </div>
        <p className="mb-4 text-sm text-muted dark:text-muted-dark">
          Paste an absolute path. The editor will show all markdown files in this folder.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(value);
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="/Users/you/Documents/notes"
            className="w-full rounded-lg border border-line bg-canvas px-3 py-2 font-mono text-sm outline-none focus:border-accent dark:border-line-dark dark:bg-canvas-dark dark:focus:border-accent-dark"
          />
          {error && (
            <p className="mt-2 text-sm text-red-500">{error}</p>
          )}
          <div className="mt-4 flex justify-end gap-2">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-3 py-1.5 text-sm text-muted hover:bg-line/60 dark:text-muted-dark dark:hover:bg-line-dark/60"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={busy || !value.trim()}
              className="rounded-lg bg-accent px-4 py-1.5 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-50 dark:bg-accent-dark dark:hover:bg-accent-dark/90"
            >
              {busy ? 'Opening...' : 'Open'}
            </button>
          </div>
        </form>

        {recent.length > 0 && (
          <div className="mt-6 border-t border-line pt-4 dark:border-line-dark">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted dark:text-muted-dark">
              Recent
            </p>
            <ul className="space-y-1">
              {recent.map((p) => (
                <li key={p}>
                  <button
                    type="button"
                    onClick={() => submit(p)}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-line/60 dark:hover:bg-line-dark/60"
                  >
                    <Folder size={14} className="text-muted dark:text-muted-dark" />
                    <span className="truncate font-mono text-xs">{p}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
