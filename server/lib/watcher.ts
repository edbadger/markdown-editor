import chokidar, { type FSWatcher } from 'chokidar';
import fs from 'node:fs';
import path from 'node:path';
import { isMarkdownFile, isRecentSelfWrite } from './state.js';

export type WatchEvent = {
  type: 'add' | 'change' | 'unlink' | 'addDir' | 'unlinkDir';
  path: string; // relative to root, posix-style
  mtime?: number;
};

type Listener = (e: WatchEvent) => void;

let watcher: FSWatcher | null = null;
let watchedRoot: string | null = null;
const listeners = new Set<Listener>();

export function getWatchedRoot(): string | null {
  return watchedRoot;
}

export function resetWatcher(root: string) {
  if (watcher) {
    watcher.close().catch(() => {});
    watcher = null;
  }
  watchedRoot = root;

  watcher = chokidar.watch(root, {
    ignored: (p) => {
      const base = path.basename(p);
      if (base.startsWith('.')) return true;
      if (
        base === 'node_modules' ||
        base === 'dist' ||
        base === 'build' ||
        base === '.next'
      ) {
        return true;
      }
      return false;
    },
    ignoreInitial: true,
    persistent: true,
    awaitWriteFinish: {
      stabilityThreshold: 80,
      pollInterval: 30,
    },
  });

  const emit = (
    type: WatchEvent['type'],
    abs: string
  ) => {
    if (
      (type === 'change' || type === 'add' || type === 'unlink') &&
      isRecentSelfWrite(abs)
    ) {
      return;
    }
    if (
      (type === 'add' || type === 'change' || type === 'unlink') &&
      !isMarkdownFile(abs)
    ) {
      return;
    }
    let mtime: number | undefined;
    if (type === 'change' || type === 'add') {
      try {
        mtime = fs.statSync(abs).mtimeMs;
      } catch {
        // file may have been deleted between event and stat
      }
    }
    const rel = path
      .relative(watchedRoot ?? '', abs)
      .split(path.sep)
      .join('/');
    const event: WatchEvent = { type, path: rel, mtime };
    for (const l of listeners) {
      try {
        l(event);
      } catch {
        // ignore listener errors
      }
    }
  };

  watcher.on('add', (p) => emit('add', p));
  watcher.on('change', (p) => emit('change', p));
  watcher.on('unlink', (p) => emit('unlink', p));
  watcher.on('addDir', (p) => emit('addDir', p));
  watcher.on('unlinkDir', (p) => emit('unlinkDir', p));
  watcher.on('error', (err) => {
    console.error('chokidar error:', err);
  });
}

export function subscribe(l: Listener): () => void {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}
