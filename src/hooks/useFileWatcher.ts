import { useEffect, useRef } from 'react';
import type { WatchEvent } from '../lib/types';

export function useFileWatcher(
  enabled: boolean,
  onEvent: (e: WatchEvent) => void
) {
  const handlerRef = useRef(onEvent);
  handlerRef.current = onEvent;

  useEffect(() => {
    if (!enabled) return;

    let source: EventSource | null = null;
    let cancelled = false;
    let retry = 0;

    const connect = () => {
      if (cancelled) return;
      source = new EventSource('/api/watch');
      source.onmessage = (msg) => {
        try {
          const data = JSON.parse(msg.data) as WatchEvent;
          handlerRef.current(data);
        } catch {
          // ignore
        }
      };
      source.onerror = () => {
        source?.close();
        source = null;
        retry = Math.min(retry + 1, 5);
        const delay = Math.min(500 * 2 ** (retry - 1), 5000);
        if (!cancelled) {
          window.setTimeout(connect, delay);
        }
      };
      source.onopen = () => {
        retry = 0;
      };
    };

    connect();

    return () => {
      cancelled = true;
      source?.close();
    };
  }, [enabled]);
}
