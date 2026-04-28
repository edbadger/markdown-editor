import { useEffect } from 'react';
import { PanelLeftOpen } from 'lucide-react';
import type { EditorMode, SaveState } from '../lib/types';
import { SourceEditor } from './SourceEditor';
import { FormattedEditor } from './FormattedEditor';
import { ModeToggle } from './ModeToggle';
import { SaveIndicator } from './SaveIndicator';
import { FilenameHeader } from './FilenameHeader';

type Props = {
  filePath: string | null;
  content: string;
  onChange: (next: string) => void;
  mode: EditorMode;
  onModeChange: (mode: EditorMode) => void;
  saveState: SaveState;
  error: string | null;
  sidebarCollapsed: boolean;
  onShowSidebar: () => void;
  onRename: (newPath: string) => void | Promise<void>;
};

export function EditorPane({
  filePath,
  content,
  onChange,
  mode,
  onModeChange,
  saveState,
  error,
  sidebarCollapsed,
  onShowSidebar,
  onRename,
}: Props) {
  // Cmd+/ toggles mode.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        onModeChange(mode === 'formatted' ? 'source' : 'formatted');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [mode, onModeChange]);

  return (
    <div className="relative flex h-full flex-1 flex-col overflow-hidden">
      {sidebarCollapsed && (
        <button
          type="button"
          onClick={onShowSidebar}
          className="absolute left-3 top-3 z-20 rounded-md border border-line bg-canvas/80 p-1.5 text-muted shadow-sm backdrop-blur hover:text-ink dark:border-line-dark dark:bg-canvas-dark/80 dark:text-muted-dark dark:hover:text-ink-dark"
          title="Show sidebar"
        >
          <PanelLeftOpen size={14} />
        </button>
      )}

      <div className="absolute right-4 top-4 z-20">
        <ModeToggle mode={mode} onChange={onModeChange} />
      </div>

      <div className="absolute bottom-4 right-6 z-10">
        <SaveIndicator state={saveState} />
      </div>

      {filePath && (
        <div className="z-10 shrink-0 pt-4">
          <div className="mx-auto w-full max-w-[720px] px-8">
            <FilenameHeader filePath={filePath} onRename={onRename} />
          </div>
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        {!filePath ? (
          <EmptyState />
        ) : error ? (
          <div className="flex h-full items-center justify-center text-sm text-red-500">
            {error}
          </div>
        ) : mode === 'formatted' ? (
          <FormattedEditor
            key={filePath}
            value={content}
            onChange={onChange}
          />
        ) : (
          <div className="mx-auto h-full w-full max-w-[1440px] px-8 py-4">
            <SourceEditor value={content} onChange={onChange} />
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-muted dark:text-muted-dark">
      <p className="font-serif text-2xl">Pick a file to start writing.</p>
      <p className="text-sm">
        Use the sidebar, or press{' '}
        <kbd className="rounded border border-line bg-sidebar px-1.5 py-0.5 font-mono text-xs dark:border-line-dark dark:bg-sidebar-dark">
          ⌘K
        </kbd>{' '}
        to search.
      </p>
    </div>
  );
}
