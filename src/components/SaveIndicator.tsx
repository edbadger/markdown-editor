import { useEffect, useState } from 'react';
import { CircleAlert } from 'lucide-react';
import clsx from 'clsx';
import type { SaveState } from '../lib/types';

type Props = {
  state: SaveState;
};

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export function SaveIndicator({ state }: Props) {
  // Tick every minute so "Saved · 12:34" stays accurate-ish without re-render storm.
  const [, force] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => force((n) => n + 1), 60_000);
    return () => window.clearInterval(id);
  }, []);

  if (state.kind === 'saving') {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted dark:text-muted-dark">
        <span className="relative inline-flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75 dark:bg-accent-dark" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent dark:bg-accent-dark" />
        </span>
        Saving
      </div>
    );
  }

  if (state.kind === 'error') {
    return (
      <div
        className={clsx(
          'flex items-center gap-1.5 text-xs text-red-500'
        )}
        title={state.message}
      >
        <CircleAlert size={12} />
        Save failed
      </div>
    );
  }

  if (state.lastSaved) {
    return (
      <div className="text-xs text-muted dark:text-muted-dark">
        Saved · {formatTime(state.lastSaved)}
      </div>
    );
  }

  return null;
}
