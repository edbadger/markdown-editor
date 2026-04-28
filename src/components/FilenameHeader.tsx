import { useEffect, useRef, useState } from 'react';

type Props = {
  filePath: string;
  onRename: (newPath: string) => void | Promise<void>;
};

const EXT_RE = /\.(md|markdown|mdx)$/i;

export function FilenameHeader({ filePath, onRename }: Props) {
  const parts = filePath.split('/');
  const fileName = parts[parts.length - 1] ?? '';
  const dir = parts.slice(0, -1).join('/');
  const baseName = fileName.replace(EXT_RE, '');
  const ext = fileName.match(EXT_RE)?.[0] ?? '.md';

  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    setEditing(false);
    cancelledRef.current = false;
  }, [filePath]);

  const start = () => {
    cancelledRef.current = false;
    setEditing(true);
    setTimeout(() => {
      const el = inputRef.current;
      if (el) {
        el.focus();
        el.select();
      }
    }, 0);
  };

  const commit = async () => {
    if (cancelledRef.current) {
      cancelledRef.current = false;
      setEditing(false);
      return;
    }
    setEditing(false);
    const raw = inputRef.current?.value ?? '';
    const trimmed = raw.trim().replace(/\//g, '-');
    if (!trimmed || trimmed === baseName) return;
    const newPath = (dir ? dir + '/' : '') + trimmed + ext;
    try {
      await onRename(newPath);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : String(err));
    }
  };

  const cancel = () => {
    cancelledRef.current = true;
    inputRef.current?.blur();
  };

  if (editing) {
    return (
      <input
        key={filePath}
        ref={inputRef}
        defaultValue={baseName}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            inputRef.current?.blur();
          }
          if (e.key === 'Escape') {
            e.preventDefault();
            cancel();
          }
        }}
        spellCheck={false}
        className="w-full max-w-full truncate rounded-md border border-line bg-canvas px-2 py-1 text-sm font-medium text-ink outline-none focus:border-accent dark:border-line-dark dark:bg-canvas-dark dark:text-ink-dark dark:focus:border-accent-dark"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={start}
      className="group flex max-w-full items-center gap-1 rounded-md px-2 py-1 text-left text-sm font-medium text-muted transition-colors hover:bg-line/60 hover:text-ink dark:text-muted-dark dark:hover:bg-line-dark/60 dark:hover:text-ink-dark"
      title="Click to rename"
    >
      {dir && (
        <span className="truncate opacity-60">
          {dir}
          <span className="mx-0.5">/</span>
        </span>
      )}
      <span className="truncate">{baseName}</span>
    </button>
  );
}
