import { useState } from 'react';
import { ChevronRight, FileText, Folder, FolderOpen } from 'lucide-react';
import clsx from 'clsx';
import type { TreeNode } from '../lib/types';

type Props = {
  nodes: TreeNode[];
  activePath: string | null;
  onOpen: (path: string) => void;
  depth?: number;
};

export function FileTree({ nodes, activePath, onOpen, depth = 0 }: Props) {
  return (
    <ul className="select-none">
      {nodes.map((node) =>
        node.type === 'dir' ? (
          <DirNode
            key={node.path}
            node={node}
            activePath={activePath}
            onOpen={onOpen}
            depth={depth}
          />
        ) : (
          <FileNode
            key={node.path}
            path={node.path}
            name={node.name}
            active={activePath === node.path}
            onOpen={onOpen}
            depth={depth}
          />
        )
      )}
    </ul>
  );
}

function DirNode({
  node,
  activePath,
  onOpen,
  depth,
}: {
  node: Extract<TreeNode, { type: 'dir' }>;
  activePath: string | null;
  onOpen: (path: string) => void;
  depth: number;
}) {
  const containsActive = activePath ? activePath.startsWith(node.path + '/') : false;
  const [open, setOpen] = useState(depth === 0 || containsActive);
  const indent = 8 + depth * 14;

  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="group flex w-full items-center gap-1 rounded-md py-1 pr-2 text-left text-sm text-muted hover:text-ink dark:text-muted-dark dark:hover:text-ink-dark"
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
  depth,
}: {
  path: string;
  name: string;
  active: boolean;
  onOpen: (p: string) => void;
  depth: number;
}) {
  const indent = 8 + depth * 14 + 12;
  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(path)}
        className={clsx(
          'group flex w-full items-center gap-1.5 rounded-md py-1 pr-2 text-left text-sm transition-colors',
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

function stripExt(name: string): string {
  return name.replace(/\.(md|markdown|mdx)$/i, '');
}
