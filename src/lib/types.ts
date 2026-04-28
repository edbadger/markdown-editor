export type TreeFile = {
  type: 'file';
  name: string;
  path: string;
  mtime: number;
};

export type TreeDir = {
  type: 'dir';
  name: string;
  path: string;
  children: TreeNode[];
};

export type TreeNode = TreeFile | TreeDir;

export type FolderInfo = {
  root: string;
  name: string;
  tree: TreeNode[];
};

export type FileContent = {
  content: string;
  mtime: number;
};

export type WatchEvent = {
  type: 'add' | 'change' | 'unlink' | 'addDir' | 'unlinkDir';
  path: string;
  mtime?: number;
};

export type EditorMode = 'formatted' | 'source';

export type SaveState =
  | { kind: 'idle'; lastSaved: number | null }
  | { kind: 'saving' }
  | { kind: 'error'; message: string };
