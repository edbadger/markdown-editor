import type { FileContent, FolderInfo } from './types';

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `${res.status} ${res.statusText}`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // ignore
    }
    throw new Error(message);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  async getRoot(): Promise<{ path: string | null }> {
    return handle(await fetch('/api/root'));
  },
  async setRoot(p: string): Promise<{ path: string }> {
    return handle(
      await fetch('/api/root', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: p }),
      })
    );
  },
  async getFolders(): Promise<FolderInfo> {
    return handle(await fetch('/api/folders'));
  },
  async getFile(relPath: string): Promise<FileContent> {
    return handle(
      await fetch(`/api/files?path=${encodeURIComponent(relPath)}`)
    );
  },
  async putFile(relPath: string, content: string): Promise<{ mtime: number }> {
    return handle(
      await fetch(`/api/files?path=${encodeURIComponent(relPath)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'text/markdown' },
        body: content,
      })
    );
  },
  async createFile(relPath: string, content = ''): Promise<{ mtime: number }> {
    return handle(
      await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: relPath, content }),
      })
    );
  },
  async deleteFile(relPath: string): Promise<void> {
    return handle(
      await fetch(`/api/files?path=${encodeURIComponent(relPath)}`, {
        method: 'DELETE',
      })
    );
  },
  async renameFile(from: string, to: string): Promise<{ mtime: number }> {
    return handle(
      await fetch('/api/files', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to }),
      })
    );
  },
};
