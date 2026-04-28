import path from 'node:path';
import fs from 'node:fs';

let rootDir: string | null = null;

export function getRoot(): string | null {
  return rootDir;
}

export function setRoot(p: string): string {
  const abs = path.resolve(p);
  const stat = fs.statSync(abs);
  if (!stat.isDirectory()) {
    throw new Error(`Not a directory: ${abs}`);
  }
  rootDir = abs;
  return rootDir;
}

export function requireRoot(): string {
  if (!rootDir) {
    const err: Error & { status?: number } = new Error('No folder selected');
    err.status = 409;
    throw err;
  }
  return rootDir;
}

/**
 * Resolve a relative path inside the active root, rejecting anything that
 * escapes the root via `..` or absolute paths. Returns the absolute resolved
 * path, which is guaranteed to start with rootDir + sep.
 */
export function resolveInsideRoot(rel: string): string {
  const root = requireRoot();
  const abs = path.resolve(root, rel);
  const rootWithSep = root.endsWith(path.sep) ? root : root + path.sep;
  if (abs !== root && !abs.startsWith(rootWithSep)) {
    const err: Error & { status?: number } = new Error('Path outside root');
    err.status = 403;
    throw err;
  }
  return abs;
}

export function isMarkdownFile(p: string): boolean {
  const ext = path.extname(p).toLowerCase();
  return ext === '.md' || ext === '.markdown' || ext === '.mdx';
}

/**
 * Track files we just wrote ourselves so the watcher can ignore the resulting
 * change event (avoids self-trigger loops).
 */
const recentSelfWrites = new Map<string, number>();
const SELF_WRITE_TTL_MS = 750;

export function markSelfWrite(absPath: string) {
  recentSelfWrites.set(absPath, Date.now() + SELF_WRITE_TTL_MS);
  setTimeout(() => recentSelfWrites.delete(absPath), SELF_WRITE_TTL_MS + 100);
}

export function isRecentSelfWrite(absPath: string): boolean {
  const exp = recentSelfWrites.get(absPath);
  if (!exp) return false;
  if (Date.now() > exp) {
    recentSelfWrites.delete(absPath);
    return false;
  }
  return true;
}
