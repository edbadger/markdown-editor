import { useEffect, useRef } from 'react';
import { FilePlus2, FolderOpen, Moon, Sun, PanelLeftClose } from 'lucide-react';
import clsx from 'clsx';
import type { FolderInfo } from '../lib/types';
import { FileTree } from './FileTree';

type Props = {
  folder: FolderInfo;
  activePath: string | null;
  onOpen: (path: string) => void;
  onChangeFolder: () => void;
  onNewFile: () => void;
  onMove: (fromPath: string, toDir: string) => void;
  onDelete: (path: string) => void;
  onCollapse: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  collapsed: boolean;
  width: number;
  onResize: (width: number) => void;
};

const MIN_WIDTH = 180;
const MAX_WIDTH = 800;

export function Sidebar({
  folder,
  activePath,
  onOpen,
  onChangeFolder,
  onNewFile,
  onMove,
  onDelete,
  onCollapse,
  theme,
  onToggleTheme,
  collapsed,
  width,
  onResize,
}: Props) {
  return (
    <aside
      style={{ width: collapsed ? 0 : width }}
      className={clsx(
        'relative flex h-full shrink-0 flex-col border-r border-line bg-sidebar dark:border-line-dark dark:bg-sidebar-dark',
        collapsed && 'overflow-hidden'
      )}
    >
      <div className="flex items-center justify-between gap-2 px-3 pt-3">
        <button
          type="button"
          onClick={onChangeFolder}
          className="group flex min-w-0 flex-1 items-center gap-1.5 rounded-md px-1.5 py-1 text-left hover:bg-line/60 dark:hover:bg-line-dark/60"
          title="Change folder"
        >
          <FolderOpen
            size={14}
            className="shrink-0 text-muted group-hover:text-ink dark:text-muted-dark dark:group-hover:text-ink-dark"
          />
          <span className="truncate text-sm font-medium">{folder.name}</span>
        </button>
        <button
          type="button"
          onClick={onCollapse}
          className="rounded-md p-1.5 text-muted hover:bg-line/60 hover:text-ink dark:text-muted-dark dark:hover:bg-line-dark/60 dark:hover:text-ink-dark"
          title="Hide sidebar"
        >
          <PanelLeftClose size={14} />
        </button>
      </div>

      <div
        className="mt-3 flex-1 overflow-y-auto px-1.5 pb-2 scrollbar-thin"
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes('application/x-mdeditor-file')) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
          }
        }}
        onDrop={(e) => {
          const path = e.dataTransfer.getData('application/x-mdeditor-file');
          if (!path) return;
          e.preventDefault();
          // Drop on empty area = move to root of the current folder.
          onMove(path, '');
        }}
      >
        {folder.tree.length === 0 ? (
          <p className="px-3 py-4 text-sm text-muted dark:text-muted-dark">
            No markdown files in this folder.
          </p>
        ) : (
          <FileTree
            nodes={folder.tree}
            activePath={activePath}
            onOpen={onOpen}
            onMove={onMove}
            onDelete={onDelete}
          />
        )}
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-line px-3 py-2 dark:border-line-dark">
        <button
          type="button"
          onClick={onNewFile}
          className="flex items-center gap-1.5 rounded-md px-1.5 py-1 text-sm text-muted hover:bg-line/60 hover:text-ink dark:text-muted-dark dark:hover:bg-line-dark/60 dark:hover:text-ink-dark"
        >
          <FilePlus2 size={14} />
          New file
        </button>
        <button
          type="button"
          onClick={onToggleTheme}
          className="rounded-md p-1.5 text-muted hover:bg-line/60 hover:text-ink dark:text-muted-dark dark:hover:bg-line-dark/60 dark:hover:text-ink-dark"
          title="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
        </button>
      </div>

      {!collapsed && (
        <ResizeHandle currentWidth={width} onResize={onResize} />
      )}
    </aside>
  );
}

function ResizeHandle({
  currentWidth,
  onResize,
}: {
  currentWidth: number;
  onResize: (w: number) => void;
}) {
  const widthRef = useRef(currentWidth);
  widthRef.current = currentWidth;

  const startDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = widthRef.current;

    const onMove = (ev: MouseEvent) => {
      const next = startWidth + (ev.clientX - startX);
      onResize(Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, next)));
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  // Cleanup on unmount in case of weird state.
  useEffect(() => {
    return () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, []);

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      onMouseDown={startDrag}
      className="absolute right-0 top-0 z-10 h-full w-1 cursor-col-resize bg-transparent transition-colors hover:bg-accent/30 active:bg-accent/50 dark:hover:bg-accent-dark/30 dark:active:bg-accent-dark/50"
    />
  );
}
