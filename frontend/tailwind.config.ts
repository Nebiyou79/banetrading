/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
        './src/hooks/**/*.{ts,tsx}',
    './src/lib/**/*.{ts,tsx}',
    './src/providers/**/*.{ts,tsx}',
  ],
 darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // ── 3-layer background system ──
        base:             'var(--bg-base)',
        elevated:         'var(--bg-elevated)',
        muted:            'var(--bg-muted)',
        'card-hover':     'var(--bg-card-hover)',
 
        // ── Borders ──
        border:           'var(--border)',
        'border-subtle':  'var(--border-subtle)',
        'border-strong':  'var(--border-strong)',
 
        // ── Text ──
        'text-primary':   'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted':     'var(--text-muted)',
        'text-inverse':   'var(--text-inverse)',
 
        // ── Accent (brand) ──
        accent: {
          DEFAULT:  'var(--accent)',
          hover:    'var(--accent-hover)',
          active:   'var(--accent-active)',
          muted:    'var(--accent-muted)',
        },
 
        // ── Semantic states ──
        success: {
          DEFAULT:  'var(--success)',
          muted:    'var(--success-muted)',
          fg:       'var(--success-fg)',
        },
        danger: {
          DEFAULT:  'var(--danger)',
          muted:    'var(--danger-muted)',
          fg:       'var(--danger-fg)',
        },
        warning: {
          DEFAULT:  'var(--warning)',
          muted:    'var(--warning-muted)',
          fg:       'var(--warning-fg)',
        },
        info: {
          DEFAULT:  'var(--info)',
          muted:    'var(--info-muted)',
          fg:       'var(--info-fg)',
        },
 
        // ── Interactive ──
        'hover-bg':       'var(--hover-bg)',
        'active-bg':      'var(--active-bg)',
        'focus-ring':     'var(--focus-ring)',
        disabled: {
          DEFAULT:  'var(--disabled)',
          text:     'var(--disabled-text)',
        },
 
        // ── Sidebar ──
        sidebar: {
          DEFAULT:        'var(--sidebar-bg)',
          'active-bg':    'var(--sidebar-active-bg)',
          'active-border':'var(--sidebar-active-border)',
        },
 
        // ── Chart ──
        chart: {
          up:        'var(--chart-up)',
          'up-muted':'var(--chart-up-muted)',
          down:      'var(--chart-down)',
          'down-muted':'var(--chart-down-muted)',
          neutral:   'var(--chart-neutral)',
          grid:      'var(--chart-grid)',
          crosshair: 'var(--chart-crosshair)',
          volume:    'var(--chart-volume)',
          ma1:       'var(--chart-ma1)',
          ma2:       'var(--chart-ma2)',
          's0':      'var(--chart-series-0)',
          's1':      'var(--chart-series-1)',
          's2':      'var(--chart-series-2)',
          's3':      'var(--chart-series-3)',
          's4':      'var(--chart-series-4)',
          's5':      'var(--chart-series-5)',
          's6':      'var(--chart-series-6)',
        },
      },
      borderRadius: {
        input:  '8px',
        button: '8px',
        card:   '12px',
        modal:  '16px',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"Roboto Mono"', '"JetBrains Mono"', '"Geist Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)',
      },
      ringColor: {
        DEFAULT: 'var(--focus-ring)',
      },
    },
  },
  plugins: [],
};