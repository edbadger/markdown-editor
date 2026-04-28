import { useEffect, useMemo } from 'react';
import { Command } from 'cmdk';
import { FileText } from 'lucide-react';
import type { TreeNode } from '../lib/types';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nodes: TreeNode[];
  onPick: (path: string) => void;
};

type FlatFile = { path: string; name: string };

function flatten(nodes: TreeNode[]): FlatFile[] {
  const out: FlatFile[] = [];
  const walk = (ns: TreeNode[]) => {
    for (const n of ns) {
      if (n.type === 'file') out.push({ path: n.path, name: n.name });
      else walk(n.children);
    }
  };
  walk(nodes);
  return out;
}

export function CommandPalette({ open, onOpenChange, nodes, onPick }: Props) {
  const files = useMemo(() => flatten(nodes), [nodes]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpenChange(!open);
      }
      if (e.key === 'Escape' && open) {
        onOpenChange(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 pt-[20vh] backdrop-blur-sm"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="w-full max-w-lg rounded-xl border border-line bg-canvas shadow-2xl dark:border-line-dark dark:bg-sidebar-dark"
        onClick={(e) => e.stopPropagation()}
      >
        <Command shouldFilter className="flex flex-col">
          <Command.Input
            placeholder="Search files..."
            className="w-full border-b border-line bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted dark:border-line-dark dark:placeholder:text-muted-dark"
            autoFocus
          />
          <Command.List className="max-h-[50vh] overflow-y-auto p-2 scrollbar-thin">
            <Command.Empty className="px-3 py-6 text-center text-sm text-muted dark:text-muted-dark">
              No matching files.
            </Command.Empty>
            {files.map((f) => (
              <Command.Item
                key={f.path}
                value={f.path}
                onSelect={() => {
                  onPick(f.path);
                  onOpenChange(false);
                }}
                className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm aria-selected:bg-accent/10 aria-selected:text-accent dark:aria-selected:bg-accent-dark/15 dark:aria-selected:text-accent-dark"
              >
                <FileText size={13} className="shrink-0 opacity-70" />
                <span className="truncate">{f.path}</span>
              </Command.Item>
            ))}
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
