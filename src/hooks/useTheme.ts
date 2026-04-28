import { useEffect, useState } from 'react';

const LS_KEY = 'mdeditor.theme';

export type Theme = 'light' | 'dark';

function readSaved(): Theme | null {
  try {
    const v = localStorage.getItem(LS_KEY);
    if (v === 'light' || v === 'dark') return v;
  } catch {
    // ignore
  }
  return null;
}

function detect(): Theme {
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

export function useTheme(): { theme: Theme; toggle: () => void } {
  const [theme, setTheme] = useState<Theme>(() => readSaved() ?? detect());

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    try {
      localStorage.setItem(LS_KEY, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  return {
    theme,
    toggle: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')),
  };
}
