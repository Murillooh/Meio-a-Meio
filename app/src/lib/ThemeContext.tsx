import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type ThemeName = 'escuro' | 'claro';
const KEY = 'casa:tema';

const ThemeCtx = createContext<{ theme: ThemeName; setTheme: (t: ThemeName) => void; toggle: () => void } | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeName>(() => {
    const saved = localStorage.getItem(KEY);
    if (saved === 'claro' || saved === 'escuro') return saved;
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'escuro' : 'claro';
    }
    return 'escuro';
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(KEY, theme);
    document.querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'claro' ? '#faf6ef' : '#1c1512');
  }, [theme]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      setTheme(e.matches ? 'escuro' : 'claro');
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return (
    <ThemeCtx.Provider value={{ theme, setTheme, toggle: () => setTheme(theme === 'claro' ? 'escuro' : 'claro') }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error('useTheme precisa de <ThemeProvider>');
  return ctx;
}
