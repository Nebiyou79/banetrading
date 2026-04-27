// components/theme/ThemeToggle.tsx
// ── Cycles dark → light → system ──

import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from './ThemeProvider';

export function ThemeToggle(): JSX.Element {
  const { theme, cycleTheme } = useTheme();

  const label =
    theme === 'dark'  ? 'Switch to light theme'
    : theme === 'light' ? 'Switch to system theme'
    : 'Switch to dark theme';

  return (
    <button
      type="button"
      onClick={cycleTheme}
      aria-label={label}
      title={label}
      className="
        inline-flex h-9 w-9 items-center justify-center rounded-button
        border border-[var(--border)]
        bg-[var(--surface)]
        text-[var(--text-secondary)]
        transition-colors duration-150
        hover:text-[var(--text-primary)]
        hover:border-[var(--border-strong)]
        hover:bg-[var(--hover-bg)]
        focus:outline-none
        focus:ring-2 focus:ring-[var(--primary-muted)]
      "
    >
      {theme === 'dark'   && <Moon    className="h-4 w-4" />}
      {theme === 'light'  && <Sun     className="h-4 w-4" />}
      {theme === 'system' && <Monitor className="h-4 w-4" />}
    </button>
  );
}
