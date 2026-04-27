// components/theme/ThemeProvider.tsx
// ── Theme context: dark / light / system ──
// Applies data-theme="dark" | "light" to <html>, which activates
// CSS custom properties defined in theme.css (color.ts token map).

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export type Theme = 'dark' | 'light' | 'system';
export type ResolvedTheme = 'dark' | 'light';

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (t: Theme) => void;
  cycleTheme: () => void;
}

const STORAGE_KEY = 'pbt_theme';

const ThemeContext = createContext<ThemeContextValue | null>(null);

function resolve(theme: Theme): ResolvedTheme {
  if (theme === 'system') {
    if (typeof window === 'undefined') return 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
}

/**
 * Sets data-theme on <html> — this is the hook that activates
 * the correct CSS var block in theme.css:
 *   :root / [data-theme="dark"]  → dark token set
 *   [data-theme="light"]         → light token set
 */
function applyToDocument(resolved: ResolvedTheme): void {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', resolved);
}

export interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
}

export function ThemeProvider({
  children,
  defaultTheme = 'dark',
}: ThemeProviderProps): JSX.Element {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(resolve(defaultTheme));

  // ── Hydrate from localStorage ──
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(STORAGE_KEY) as Theme | null;
    const initial: Theme =
      stored === 'dark' || stored === 'light' || stored === 'system'
        ? stored
        : defaultTheme;
    setThemeState(initial);
    const r = resolve(initial);
    setResolvedTheme(r);
    applyToDocument(r);
  }, [defaultTheme]);

  // ── React to OS-level preference changes when theme = "system" ──
  useEffect(() => {
    if (typeof window === 'undefined' || theme !== 'system') return;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handle = (): void => {
      const r: ResolvedTheme = mql.matches ? 'dark' : 'light';
      setResolvedTheme(r);
      applyToDocument(r);
    };
    mql.addEventListener('change', handle);
    return () => mql.removeEventListener('change', handle);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, next);
    }
    const r = resolve(next);
    setResolvedTheme(r);
    applyToDocument(r);
  }, []);

  const cycleTheme = useCallback(() => {
    setTheme(
      theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark',
    );
  }, [theme, setTheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, resolvedTheme, setTheme, cycleTheme }),
    [theme, resolvedTheme, setTheme, cycleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
