// color.ts
// ── Unified Design Token System for Trading Platform ──
// Dark  → Combo B "Midnight / Indigo / Steel"   (fintech / crypto premium)
// Light → Combo G "Aubergine / Plum / Violet"   (derivatives / hedge-fund bold)

// ─── Primitive Palette ───────────────────────────────────────────────────────

const primitives = {
  // ── Neutrals ──────────────────────────────────────────────────────────────
  neutral: {
    0:    '#FFFFFF',
    50:   '#F7F8FA',
    100:  '#EFF1F5',
    150:  '#E4E7EF',
    200:  '#D1D5E0',
    300:  '#9CA3B8',
    400:  '#6B7494',
    500:  '#4A5270',
    600:  '#2E3451',
    700:  '#1E2340',
    800:  '#13172E',
    850:  '#0E1120',
    900:  '#090C18',
    950:  '#050710',
  },

  // ── Midnight / Indigo / Steel — dark theme backgrounds ────────────────────
  midnight: {
    base:    '#090C14',   // deepest background
    panel:   '#0F1322',   // sidebar / top-bar
    card:    '#161D35',   // cards, widgets
    elevated:'#1E2645',   // hover / elevated cards
    border:  '#222B48',   // dividers
    sidebar: '#0C1020',   // sidebar bg
  },

  // ── Aubergine / Plum / Violet — light theme backgrounds ───────────────────
  plum: {
    base:    '#F3EEF9',   // page background
    panel:   '#FFFFFF',   // panels / top-bar
    card:    '#EAE0F5',   // cards / widgets
    elevated:'#E0D2F0',   // hover / elevated
    border:  '#C8B0E4',   // dividers
    sidebar: '#F9F5FD',   // sidebar bg
  },

  // ── Indigo accent — dark mode primary ─────────────────────────────────────
  indigo: {
    50:   '#EEF2FF',
    100:  '#E0E7FF',
    200:  '#C7D2FE',
    300:  '#A5B4FC',
    400:  '#818CF8',
    500:  '#6366F1',
    600:  '#4F46E5',
    700:  '#4338CA',
    800:  '#3730A3',
    900:  '#312E81',
  },

  // ── Violet accent — light mode primary ────────────────────────────────────
  violet: {
    50:   '#F5F3FF',
    100:  '#EDE9FE',
    200:  '#DDD6FE',
    300:  '#C4B5FD',
    400:  '#A78BFA',
    500:  '#8B5CF6',
    600:  '#7C3AED',
    700:  '#6D28D9',
    800:  '#5B21B6',
    900:  '#4C1D95',
  },

  // ── Success — teal-green (dark) / forest-green (light) ────────────────────
  green: {
    50:   '#F0FDF4',
    100:  '#DCFCE7',
    200:  '#BBF7D0',
    300:  '#86EFAC',
    400:  '#4ADE80',
    500:  '#22C55E',
    600:  '#16A34A',
    700:  '#15803D',
    800:  '#166534',
    900:  '#14532D',
    tealBright: '#10D98A', // Combo B dark gain
  },

  // ── Danger — rose (dark) / deep crimson (light) ───────────────────────────
  red: {
    50:   '#FFF1F2',
    100:  '#FFE4E6',
    200:  '#FECDD3',
    300:  '#FDA4AF',
    400:  '#FB7185',
    500:  '#F43F5E',
    600:  '#E11D48',
    700:  '#BE123C',
    800:  '#9F1239',
    900:  '#881337',
  },

  // ── Info — steel blue ────────────────────────────────────────────────────
  blue: {
    50:   '#EFF6FF',
    100:  '#DBEAFE',
    200:  '#BFDBFE',
    300:  '#93C5FD',
    400:  '#60A5FA',
    500:  '#3B82F6',
    600:  '#2563EB',
    700:  '#1D4ED8',
    800:  '#1E40AF',
    900:  '#1E3A8A',
  },

  // ── Warning ───────────────────────────────────────────────────────────────
  yellow: {
    50:   '#FEFCE8',
    100:  '#FEF9C3',
    200:  '#FEF08A',
    300:  '#FDE047',
    400:  '#FACC15',
    500:  '#EAB308',
    600:  '#CA8A04',
    700:  '#A16207',
    800:  '#854D0E',
    900:  '#713F12',
  },
} as const;

// ─── Token Interface ──────────────────────────────────────────────────────────

export interface ColorTokens {
  background: string;
  surface: string;
  card: string;
  overlay: string;

  border: string;
  borderSubtle: string;
  borderStrong: string;

  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;

  primary: string;
  primaryHover: string;
  primaryActive: string;
  primaryMuted: string;

  secondary: string;
  secondaryHover: string;
  secondaryActive: string;
  secondaryMuted: string;

  accent: string;

  success: string;
  successMuted: string;
  successForeground: string;

  warning: string;
  warningMuted: string;
  warningForeground: string;

  error: string;
  errorMuted: string;
  errorForeground: string;

  danger: string;
  dangerMuted: string;

  info: string;
  infoMuted: string;
  infoForeground: string;

  hoverBg: string;
  activeBg: string;
  focusRing: string;
  disabled: string;
  disabledText: string;

  chart: {
    up: string;
    down: string;
    neutral: string;
    grid: string;
    crosshair: string;
    volume: string;
    ma1: string;
    ma2: string;
    series: string[];
  };
}

// ─── Dark Theme — Combo B "Midnight / Indigo / Steel" ────────────────────────

export const dark: ColorTokens = {
  // Backgrounds
  background:         primitives.midnight.base,    // #090C14
  surface:            primitives.midnight.panel,   // #0F1322
  card:               primitives.midnight.card,    // #161D35
  overlay:            'rgba(9, 12, 20, 0.82)',

  // Borders
  border:             primitives.midnight.border,  // #222B48
  borderSubtle:       primitives.midnight.card,    // #161D35
  borderStrong:       primitives.indigo[500],      // #6366F1

  // Text
  textPrimary:        '#E4E9F8',
  textSecondary:      '#6E7EA8',
  textMuted:          '#374060',
  textInverse:        primitives.midnight.base,

  // Primary — Indigo
  primary:            primitives.indigo[500],      // #6366F1
  primaryHover:       primitives.indigo[400],      // #818CF8
  primaryActive:      primitives.indigo[600],      // #4F46E5
  primaryMuted:       'rgba(99, 102, 241, 0.14)',

  // Secondary — steel violet shimmer
  secondary:          primitives.indigo[400],      // #818CF8
  secondaryHover:     primitives.indigo[300],      // #A5B4FC
  secondaryActive:    primitives.indigo[500],      // #6366F1
  secondaryMuted:     'rgba(129, 140, 248, 0.12)',

  accent:             primitives.indigo[500],

  // Success — teal-bright (Combo B signature)
  success:            primitives.green.tealBright, // #10D98A
  successMuted:       'rgba(16, 217, 138, 0.12)',
  successForeground:  '#34D399',

  // Warning
  warning:            primitives.yellow[400],
  warningMuted:       'rgba(250, 204, 21, 0.12)',
  warningForeground:  primitives.yellow[300],

  // Error — rose (Combo B signature)
  error:              primitives.red[500],          // #F43F5E
  errorMuted:         'rgba(244, 63, 94, 0.12)',
  errorForeground:    primitives.red[400],          // #FB7185
  danger:             primitives.red[500],
  dangerMuted:        'rgba(244, 63, 94, 0.12)',

  // Info — steel blue
  info:               primitives.blue[400],
  infoMuted:          'rgba(96, 165, 250, 0.12)',
  infoForeground:     primitives.blue[300],

  // Interactive
  hoverBg:            'rgba(255, 255, 255, 0.05)',
  activeBg:           'rgba(255, 255, 255, 0.09)',
  focusRing:          primitives.indigo[400],
  disabled:           primitives.midnight.card,
  disabledText:       '#374060',

  // Chart
  chart: {
    up:         primitives.green.tealBright, // #10D98A
    down:       primitives.red[500],         // #F43F5E
    neutral:    '#6E7EA8',
    grid:       'rgba(255, 255, 255, 0.04)',
    crosshair:  '#6E7EA8',
    volume:     'rgba(99, 102, 241, 0.22)',
    ma1:        primitives.indigo[400],
    ma2:        primitives.blue[400],
    series:     [
      primitives.indigo[400],  // #818CF8
      primitives.green.tealBright, // #10D98A
      primitives.blue[400],    // #60A5FA
      '#A78BFA',               // violet
      primitives.red[400],     // #FB7185
      '#22D3EE',               // cyan
      '#FBBF24',               // amber
    ],
  },
};

// ─── Light Theme — Combo G "Aubergine / Plum / Violet" ───────────────────────

export const light: ColorTokens = {
  // Backgrounds
  background:         primitives.plum.base,        // #F3EEF9
  surface:            primitives.plum.panel,        // #FFFFFF
  card:               primitives.plum.card,         // #EAE0F5
  overlay:            'rgba(21, 8, 48, 0.60)',

  // Borders
  border:             primitives.plum.border,       // #C8B0E4
  borderSubtle:       '#DDD6FE',
  borderStrong:       primitives.violet[600],       // #7C3AED

  // Text
  textPrimary:        '#150830',
  textSecondary:      '#5B3A8C',
  textMuted:          '#9B7CC0',
  textInverse:        '#FFFFFF',

  // Primary — Violet
  primary:            primitives.violet[600],       // #7C3AED
  primaryHover:       primitives.violet[700],       // #6D28D9
  primaryActive:      primitives.violet[800],       // #5B21B6
  primaryMuted:       'rgba(124, 58, 237, 0.10)',

  // Secondary — softer plum
  secondary:          primitives.violet[500],       // #8B5CF6
  secondaryHover:     primitives.violet[600],       // #7C3AED
  secondaryActive:    primitives.violet[700],       // #6D28D9
  secondaryMuted:     'rgba(139, 92, 246, 0.10)',

  accent:             primitives.violet[600],

  // Success — deep forest green (Combo G signature)
  success:            primitives.green[600],        // #16A34A
  successMuted:       'rgba(22, 163, 74, 0.10)',
  successForeground:  primitives.green[700],        // #15803D

  // Warning
  warning:            primitives.yellow[500],
  warningMuted:       'rgba(234, 179, 8, 0.10)',
  warningForeground:  primitives.yellow[700],

  // Error — deep crimson (Combo G signature)
  error:              primitives.red[800],          // #9F1239
  errorMuted:         'rgba(159, 18, 57, 0.10)',
  errorForeground:    primitives.red[700],          // #BE123C
  danger:             primitives.red[800],
  dangerMuted:        'rgba(159, 18, 57, 0.10)',

  // Info
  info:               primitives.blue[600],
  infoMuted:          'rgba(37, 99, 235, 0.10)',
  infoForeground:     primitives.blue[700],

  // Interactive
  hoverBg:            'rgba(124, 58, 237, 0.06)',
  activeBg:           'rgba(124, 58, 237, 0.10)',
  focusRing:          primitives.violet[600],
  disabled:           '#EDE9FE',
  disabledText:       '#C4B5FD',

  // Chart
  chart: {
    up:         primitives.green[700],   // #15803D
    down:       primitives.red[800],     // #9F1239
    neutral:    '#9B7CC0',
    grid:       'rgba(124, 58, 237, 0.06)',
    crosshair:  '#9B7CC0',
    volume:     'rgba(124, 58, 237, 0.15)',
    ma1:        primitives.violet[600],
    ma2:        primitives.blue[600],
    series:     [
      primitives.violet[600],  // #7C3AED
      primitives.green[700],   // #15803D
      primitives.blue[600],    // #2563EB
      '#A78BFA',               // violet-light
      primitives.red[700],     // #BE123C
      '#0891B2',               // cyan-dark
      '#D97706',               // amber
    ],
  },
};

// ─── Exports ──────────────────────────────────────────────────────────────────

export const colors = { dark, light, primitives } as const;

export type Theme = 'dark' | 'light';

export function getTheme(theme: Theme): ColorTokens {
  return colors[theme];
}

/**
 * Generates CSS custom property declarations from a token set.
 * Usage: inject into :root or a [data-theme] selector.
 */
export function toCSSVars(tokens: ColorTokens, prefix = ''): Record<string, string> {
  const flat: Record<string, string> = {};

  const flatten = (obj: Record<string, unknown>, path: string[]): void => {
    for (const [key, value] of Object.entries(obj)) {
      const current = [...path, key];
      if (typeof value === 'string') {
        flat[`--${prefix}${current.join('-')}`] = value;
      } else if (Array.isArray(value)) {
        value.forEach((v, i) => {
          flat[`--${prefix}${current.join('-')}-${i}`] = String(v);
        });
      } else if (typeof value === 'object' && value !== null) {
        flatten(value as Record<string, unknown>, current);
      }
    }
  };

  flatten(tokens as unknown as Record<string, unknown>, []);
  return flat;
}

export default colors;