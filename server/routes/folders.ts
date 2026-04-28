import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { requireRoot, isMarkdownFile } from '../lib/state.js';

export const foldersRouter = Router();

type TreeFile = {
  type: 'file';
  name: string;
  path: string; // relative to root, posix-style
  mtime: number;
};

type TreeDir = {
  type: 'dir';
  name: string;
  path: string;
  children: TreeNode[];
};

type TreeNode = TreeFile | TreeDir;

const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  '.next',
  'dist',
  'build',
  '.cache',
  '.DS_Store',
]);

function readTree(absDir: string, root: string): TreeNode[] {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(absDir, { withFileTypes: true });
  } catch {
    return [];
  }

  const nodes: TreeNode[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    if (IGNORED_DIRS.has(entry.name)) continue;

    const absPath = path.join(absDir, entry.name);
    const relPath = path.relative(root, absPath).split(path.sep).join('/');

    if (entry.isDirectory()) {
      const children = readTree(absPath, root);
      if (children.length === 0) continue;
      nodes.push({
        type: 'dir',
        name: entry.name,
        path: relPath,
        children,
      });
    } else if (entry.isFile() && isMarkdownFile(entry.name)) {
      let mtime = 0;
      try {
        mtime = fs.statSync(absPath).mtimeMs;
      } catch {
        // ignore
      }
      nodes.push({
        type: 'file',
        name: entry.name,
        path: relPath,
        mtime,
      });
    }
  }

  nodes.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
  });

  return nodes;
}

foldersRouter.get('/', (_req, res, next) => {
  try {
    const root = requireRoot();
    const tree = readTree(root, root);
    res.json({
      root,
      name: path.basename(root),
      tree,
    });
  } catch (err) {
    next(err);
  }
});
