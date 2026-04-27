// components/landing/WelcomeStats.tsx
// ── Three small animated stat pills shown during the welcome intro ──

import { motion } from 'framer-motion';
import { TrendingUp, Star, Activity } from 'lucide-react';

interface StatItem {
  icon: JSX.Element;
  label: string;
  value: string;
  tone: 'success' | 'primary' | 'info';
}

const STATS: StatItem[] = [
  {
    icon:  <TrendingUp className="h-3.5 w-3.5" />,
    label: 'BTC 24h',
    value: '+2.4%',
    tone:  'success',
  },
  {
    icon:  <Star className="h-3.5 w-3.5" />,
    label: 'Top Gainer',
    value: 'SOL',
    tone:  'primary',
  },
  {
    icon:  <Activity className="h-3.5 w-3.5" />,
    label: 'Markets',
    value: 'Bullish',
    tone:  'info',
  },
];

/*
 * Pill color map — each key references two CSS vars:
 *   border + bg    → *-muted  (subtle fill from color.ts)
 *   icon + value   → * (full token)
 *
 * success → var(--success)        green[400/500]
 * primary → var(--primary)        gold[400/500]
 * info    → var(--info)           blue[400/500]
 */
const TONE_CLASSES: Record<StatItem['tone'], string> = {
  success: 'border-[var(--success-muted)] bg-[var(--success-muted)] text-[var(--success)]',
  primary: 'border-[var(--primary-muted)] bg-[var(--primary-muted)] text-[var(--primary)]',
  info:    'border-[var(--info-muted)]    bg-[var(--info-muted)]    text-[var(--info)]',
};

export function WelcomeStats(): JSX.Element {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2.5">
      {STATS.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.8 + i * 0.08, ease: 'easeOut' }}
          className={`
            inline-flex items-center gap-2 rounded-full
            border
            bg-[var(--surface)]
            px-3 py-1.5 text-xs font-medium
            ${TONE_CLASSES[stat.tone]}
          `}
        >
          {stat.icon}
          <span className="text-[var(--text-muted)] text-[11px] uppercase tracking-wider">
            {stat.label}
          </span>
          <span className="font-semibold tabular-nums">{stat.value}</span>
        </motion.div>
      ))}
    </div>
  );
}
