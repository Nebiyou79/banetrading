// lib/tokens.ts
// ── Design tokens (match CSS variables in styles/globals.css) ──

export const colorTokens = {
  bgBase:       'var(--bg-base)',
  bgElevated:   'var(--bg-elevated)',
  bgMuted:      'var(--bg-muted)',
  border:       'var(--border)',
  textPrimary:  'var(--text-primary)',
  textSecondary:'var(--text-secondary)',
  textMuted:    'var(--text-muted)',
  accent:       'var(--accent)',
  accentHover:  'var(--accent-hover)',
  success:      'var(--success)',
  danger:       'var(--danger)',
  info:         'var(--info)',
  warning:      'var(--warning)',
} as const;

export const radiusTokens = {
  input:  '8px',
  button: '8px',
  card:   '12px',
  modal:  '16px',
} as const;

export const spacingScale = [0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64] as const;

export const breakpoints = {
  mobile:  768,   // < 768 = mobile
  tablet:  1024,  // 768–1023 = tablet, ≥ 1024 = desktop
} as const;

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';