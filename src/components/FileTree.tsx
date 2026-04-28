import { useEffect, useState } from 'react';
import { ChevronRight, FileText, Folder, FolderOpen, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import type { TreeNode } from '../lib/types';

const DRAG_TYPE = 'application/x-mdeditor-file';

type Props = {
  nodes: TreeNode[];
  activePath: string | null;
  onOpen: (path: string) => void;
  onMove: (fromPath: string, toDir: string) => void;
  onDelete: (path: string) => void;
  depth?: number;
};

type ContextMenuState = {
  x: number;
  y: number;
  path: string;
} | null;

export function FileTree({
  nodes,
  activePath,
  onOpen,
  onMove,
  onDelete,
  depth = 0,
}: Props) {
  const [menu, setMenu] = useState<ContextMenuState>(null);

  // Close menu on any click outside, escape, or scroll.
  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('mousedown', close);
    window.addEventListener('keydown', onKey);
    window.addEventListener('scroll', close, true);
    return () => {
      window.removeEventListener('mousedown', close);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', close, true);
    };
  }, [menu]);

  return (
    <>
      <ul className="select-none">
        {nodes.map((node) =>
          node.type === 'dir' ? (
            <DirNode
              key={node.path}
              node={node}
              activePath={activePath}
              onOpen={onOpen}
              onMove={onMove}
              onDelete={onDelete}
              onContextMenu={setMenu}
              depth={depth}
            />
          ) : (
            <FileNode
              key={node.path}
              path={node.path}
              name={node.name}
              active={activePath === node.path}
              onOpen={onOpen}
              onContextMenu={setMenu}
              depth={depth}
            />
          )
        )}
      </ul>
      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          onDelete={() => {
            const p = menu.path;
            setMenu(null);
            onDelete(p);
          }}
        />
      )}
    </>
  );
}

function DirNode({
  node,
  activePath,
  onOpen,
  onMove,
  onDelete,
  onContextMenu,
  depth,
}: {
  node: Extract<TreeNode, { type: 'dir' }>;
  activePath: string | null;
  onOpen: (path: string) => void;
  onMove: (fromPath: string, toDir: string) => void;
  onDelete: (path: string) => void;
  onContextMenu: (state: ContextMenuState) => void;
  depth: number;
}) {
  const containsActive = activePath ? activePath.startsWith(node.path + '/') : false;
  const [open, setOpen] = useState(containsActive);
  const [dragOver, setDragOver] = useState(false);
  const indent = 8 + depth * 14;

  return (
    <li
      onDragOver={(e) => {
        if (!e.dataTransfer.types.includes(DRAG_TYPE)) return;
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
        setDragOver(true);
        if (!open) setOpen(true);
      }}
      onDragLeave={(e) => {
        e.stopPropagation();
        setDragOver(false);
      }}
      onDrop={(e) => {
        const path = e.dataTransfer.getData(DRAG_TYPE);
        setDragOver(false);
        if (!path) return;
        e.preventDefault();
        e.stopPropagation();
        onMove(path, node.path);
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={clsx(
          'group flex w-full items-center gap-1 rounded-md py-1 pr-2 text-left text-sm transition-colors',
          dragOver
            ? 'bg-accent/15 text-accent dark:bg-accent-dark/20 dark:text-accent-dark'
            : 'text-muted hover:text-ink dark:text-muted-dark dark:hover:text-ink-dark'
        )}
        style={{ paddingLeft: indent }}
      >
        <ChevronRight
          size={12}
          className={clsx(
            'shrink-0 transition-transform',
            open && 'rotate-90'
          )}
        />
        {open ? (
          <FolderOpen size={14} className="shrink-0" />
        ) : (
          <Folder size={14} className="shrink-0" />
        )}
        <span className="truncate">{node.name}</span>
      </button>
      {open && (
        <FileTree
          nodes={node.children}
          activePath={activePath}
          onOpen={onOpen}
          onMove={onMove}
          onDelete={onDelete}
          depth={depth + 1}
        />
      )}
    </li>
  );
}

function FileNode({
  path,
  name,
  active,
  onOpen,
  onContextMenu,
  depth,
}: {
  path: string;
  name: string;
  active: boolean;
  onOpen: (p: string) => void;
  onContextMenu: (state: ContextMenuState) => void;
  depth: number;
}) {
  const [dragging, setDragging] = useState(false);
  const indent = 8 + depth * 14 + 12;
  return (
    <li>
      <button
        type="button"
        draggable
        onClick={() => onOpen(path)}
        onContextMenu={(e) => {
          e.preventDefault();
          onContextMenu({ x: e.clientX, y: e.clientY, path });
        }}
        onDragStart={(e) => {
          e.dataTransfer.setData(DRAG_TYPE, path);
          e.dataTransfer.effectAllowed = 'move';
          setDragging(true);
        }}
        onDragEnd={() => setDragging(false)}
        className={clsx(
          'group flex w-full items-center gap-1.5 rounded-md py-1 pr-2 text-left text-sm transition-colors',
          dragging && 'opacity-40',
          active
            ? 'bg-accent/10 text-accent dark:bg-accent-dark/15 dark:text-accent-dark'
            : 'text-ink/85 hover:bg-line/60 dark:text-ink-dark/85 dark:hover:bg-line-dark/60'
        )}
        style={{ paddingLeft: indent }}
      >
        <FileText size={13} className="shrink-0 opacity-70" />
        <span className="truncate">{stripExt(name)}</span>
      </button>
    </li>
  );
}

function ContextMenu({
  x,
  y,
  onDelete,
}: {
  x: number;
  y: number;
  onDelete: () => void;
}) {
  return (
    <div
      className="fixed z-50 min-w-[160px] overflow-hidden rounded-lg border border-line bg-canvas py-1 shadow-xl dark:border-line-dark dark:bg-sidebar-dark"
      style={{ top: y, left: x }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={onDelete}
        className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-red-500 hover:bg-red-500/10"
      >
        <Trash2 size={13} />
        Delete
      </button>
    </div>
  );
}

function stripExt(name: string): string {
  return name.replace(/\.(md|markdown|mdx)$/i, '');
}
