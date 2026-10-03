'use client';

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'cp-theme';

// Shared so every route honours the same black/white choice. layout.jsx renders
// data-theme="dark", and the first effect below corrects it once we can read
// storage - doing it in an effect rather than during render keeps the static
// export's markup stable, so hydration cannot mismatch.
export function useTheme() {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    let stored = null;
    try {
      stored = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      // Private mode or blocked storage: keep the default.
    }
    if (stored === 'light' || stored === 'dark') {
      setTheme(stored);
    } else if (window.matchMedia?.('(prefers-color-scheme: light)').matches) {
      setTheme('light');
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Non-fatal: the theme still applies for this visit.
    }
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  }, []);

  return { theme, toggle };
}

export function ThemeToggle({ theme, onToggle }) {
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={onToggle}
      aria-pressed={theme === 'light'}
      title={theme === 'dark' ? 'Switch to a white background' : 'Switch to a black background'}
    >
      <span className="theme-dot" aria-hidden="true" />
      {theme === 'dark' ? 'Light' : 'Dark'}
    </button>
  );
}
