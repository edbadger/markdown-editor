import { Code2, Eye } from 'lucide-react';
import clsx from 'clsx';
import type { EditorMode } from '../lib/types';

type Props = {
  mode: EditorMode;
  onChange: (mode: EditorMode) => void;
};

export function ModeToggle({ mode, onChange }: Props) {
  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-line bg-canvas/80 p-0.5 shadow-sm backdrop-blur dark:border-line-dark dark:bg-canvas-dark/80">
      <button
        type="button"
        onClick={() => onChange('formatted')}
        className={clsx(
          'flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors',
          mode === 'formatted'
            ? 'bg-accent/10 text-accent dark:bg-accent-dark/15 dark:text-accent-dark'
            : 'text-muted hover:text-ink dark:text-muted-dark dark:hover:text-ink-dark'
        )}
        title="Formatted view (Cmd+/)"
      >
        <Eye size={12} />
        Formatted
      </button>
      <button
        type="button"
        onClick={() => onChange('source')}
        className={clsx(
          'flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors',
          mode === 'source'
            ? 'bg-accent/10 text-accent dark:bg-accent-dark/15 dark:text-accent-dark'
            : 'text-muted hover:text-ink dark:text-muted-dark dark:hover:text-ink-dark'
        )}
        title="Source view (Cmd+/)"
      >
        <Code2 size={12} />
        Source
      </button>
    </div>
  );
}
