import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';

export type FileContentState = {
  content: string;
  setContent: (next: string) => void;
  baseline: string;
  setBaseline: (next: string) => void;
  knownMtime: number;
  setKnownMtime: (next: number) => void;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  dirty: boolean;
};

export function useFileContent(filePath: string | null): FileContentState {
  const [content, setContent] = useState('');
  const [baseline, setBaseline] = useState('');
  const [knownMtime, setKnownMtime] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (path: string) => {
    setLoading(true);
    setError(null);
    try {
      const { content: c, mtime } = await api.getFile(path);
      setContent(c);
      setBaseline(c);
      setKnownMtime(mtime);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!filePath) {
      setContent('');
      setBaseline('');
      setError(null);
      return;
    }
    load(filePath);
  }, [filePath, load]);

  const reload = useCallback(async () => {
    if (filePath) await load(filePath);
  }, [filePath, load]);

  return {
    content,
    setContent,
    baseline,
    setBaseline,
    knownMtime,
    setKnownMtime,
    loading,
    error,
    reload,
    dirty: content !== baseline,
  };
}
