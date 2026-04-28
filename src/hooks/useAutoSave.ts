import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import type { SaveState } from '../lib/types';

const DEBOUNCE_MS = 500;

export function useAutoSave(
  filePath: string | null,
  content: string,
  baseline: string,
  onSaved?: (savedContent: string, mtime: number) => void
): { saveState: SaveState; flush: () => Promise<void> } {
  const [saveState, setSaveState] = useState<SaveState>({
    kind: 'idle',
    lastSaved: null,
  });
  const timer = useRef<number | null>(null);
  const pendingRef = useRef<string | null>(null);
  const inFlightRef = useRef(false);
  const filePathRef = useRef(filePath);
  filePathRef.current = filePath;
  const onSavedRef = useRef(onSaved);
  onSavedRef.current = onSaved;

  const doSave = useCallback(async () => {
    if (inFlightRef.current) return;
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
    const path = filePathRef.current;
    const next = pendingRef.current;
    if (!path || next === null) return;
    pendingRef.current = null;
    inFlightRef.current = true;
    setSaveState({ kind: 'saving' });
    try {
      const result = await api.putFile(path, next);
      onSavedRef.current?.(next, result.mtime);
      setSaveState({ kind: 'idle', lastSaved: Date.now() });
    } catch (err) {
      // Put back the unsaved content so the next attempt picks it up.
      if (pendingRef.current === null) pendingRef.current = next;
      setSaveState({
        kind: 'error',
        message: err instanceof Error ? err.message : String(err),
      });
    } finally {
      inFlightRef.current = false;
      if (pendingRef.current !== null) {
        doSave();
      }
    }
  }, []);

  const flush = useCallback(async () => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
    if (pendingRef.current === null && !inFlightRef.current) return;
    await doSave();
  }, [doSave]);

  useEffect(() => {
    if (!filePath) return;
    if (content === baseline) return;
    pendingRef.current = content;
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      timer.current = null;
      doSave();
    }, DEBOUNCE_MS);
    return () => {
      if (timer.current !== null) {
        window.clearTimeout(timer.current);
        timer.current = null;
      }
    };
  }, [content, baseline, filePath, doSave]);

  // Best-effort flush on tab hide / window close.
  useEffect(() => {
    const flushBeacon = () => {
      if (pendingRef.current !== null && filePathRef.current) {
        const path = filePathRef.current;
        const body = pendingRef.current;
        pendingRef.current = null;
        navigator.sendBeacon?.(
          `/api/files?path=${encodeURIComponent(path)}`,
          new Blob([body], { type: 'text/markdown' })
        );
      }
    };
    const onVis = () => {
      if (document.visibilityState === 'hidden') flushBeacon();
    };
    window.addEventListener('beforeunload', flushBeacon);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.removeEventListener('beforeunload', flushBeacon);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  // Reset state when switching files.
  useEffect(() => {
    setSaveState({ kind: 'idle', lastSaved: null });
    pendingRef.current = null;
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  }, [filePath]);

  return { saveState, flush };
}
