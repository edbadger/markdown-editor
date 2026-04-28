import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { FolderInfo } from '../lib/types';

const LS_FOLDER = 'mdeditor.folder';
const LS_RECENT = 'mdeditor.recentFolders';
const LS_OPEN = 'mdeditor.openFile';

function readLocal(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeLocal(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

export function getRecentFolders(): string[] {
  const raw = readLocal(LS_RECENT);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((s) => typeof s === 'string') : [];
  } catch {
    return [];
  }
}

function pushRecent(p: string) {
  const list = getRecentFolders().filter((x) => x !== p);
  list.unshift(p);
  writeLocal(LS_RECENT, JSON.stringify(list.slice(0, 8)));
}

export type FolderState = {
  folder: FolderInfo | null;
  loading: boolean;
  error: string | null;
  selectFolder: (path: string) => Promise<void>;
  refresh: () => Promise<void>;
  openFile: string | null;
  setOpenFile: (path: string | null) => void;
};

export function useFolderState(): FolderState {
  const [folder, setFolder] = useState<FolderInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openFile, setOpenFileInternal] = useState<string | null>(
    readLocal(LS_OPEN)
  );

  const setOpenFile = useCallback((p: string | null) => {
    setOpenFileInternal(p);
    writeLocal(LS_OPEN, p);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const info = await api.getFolders();
      setFolder(info);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  const selectFolder = useCallback(
    async (p: string) => {
      setLoading(true);
      setError(null);
      try {
        const { path: resolved } = await api.setRoot(p);
        writeLocal(LS_FOLDER, resolved);
        pushRecent(resolved);
        const info = await api.getFolders();
        setFolder(info);
        setOpenFileInternal(null);
        writeLocal(LS_OPEN, null);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setFolder(null);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const saved = readLocal(LS_FOLDER);
      if (!saved) {
        setLoading(false);
        return;
      }
      try {
        await api.setRoot(saved);
        const info = await api.getFolders();
        if (!cancelled) {
          setFolder(info);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    folder,
    loading,
    error,
    selectFolder,
    refresh,
    openFile,
    setOpenFile,
  };
}
