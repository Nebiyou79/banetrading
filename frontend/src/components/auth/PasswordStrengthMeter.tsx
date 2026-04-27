// components/auth/PasswordStrengthMeter.tsx
// ── 4-segment meter + checklist ──

import { Check, Minus } from 'lucide-react';
import { cn } from '../../lib/cn';
import { scorePassword } from '../../lib/validators';

export interface PasswordStrengthMeterProps {
  password: string;
  className?: string;
}

/*
 * Segment fill colors keyed by score index (0–4).
 * All sourced from color.ts tokens via CSS vars:
 *
 *   0 → empty    : var(--surface) / muted background
 *   1 → weak     : var(--error)   → red
 *   2 → fair     : var(--warning) → yellow
 *   3 → good     : var(--info)    → blue
 *   4 → strong   : var(--success) → green
 *
 * Using Tailwind arbitrary values so colors stay in sync with the CSS var system.
 */
const SEGMENT_COLORS: Record<number, string> = {
  0: 'bg-[var(--surface)]',
  1: 'bg-[var(--error)]',
  2: 'bg-[var(--warning)]',
  3: 'bg-[var(--info)]',
  4: 'bg-[var(--success)]',
};

const LABEL_COLORS: Record<string, string> = {
  empty:  'text-[var(--text-muted)]',
  weak:   'text-[var(--error)]',
  fair:   'text-[var(--warning)]',
  good:   'text-[var(--info)]',
  strong: 'text-[var(--success)]',
};

export function PasswordStrengthMeter({
  password,
  className,
}: PasswordStrengthMeterProps): JSX.Element {
  const strength = scorePassword(password);
  const { score, label, checks } = strength;

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {/* Segmented bar */}
      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-all duration-300',
              i <= score
                ? SEGMENT_COLORS[score]
                : 'bg-[var(--border)]', // unfilled → subtle border tone
            )}
          />
        ))}
      </div>

      {/* Label row */}
      <div className="flex items-center justify-between">
        <span
          className={cn(
            'text-[11px] font-medium uppercase tracking-wider transition-colors duration-200',
            LABEL_COLORS[label],
          )}
        >
          {label === 'empty' ? 'Password strength' : label}
        </span>
      </div>

      {/* Checklist */}
      <ul className="grid grid-cols-2 gap-x-4 gap-y-1 pt-1">
        <ChecklistItem passed={checks.length}  label="At least 8 characters" />
        <ChecklistItem passed={checks.upper}   label="One uppercase letter"  />
        <ChecklistItem passed={checks.number}  label="One number"            />
        <ChecklistItem passed={checks.special} label="One special character" />
      </ul>
    </div>
  );
}

function ChecklistItem({
  passed,
  label,
}: {
  passed: boolean;
  label: string;
}): JSX.Element {
  return (
    <li className="flex items-center gap-1.5">
      {passed ? (
        /*
         * Passed icon:
         *   text-[var(--success)] → green[400] dark | green[500] light
         */
        <Check className="h-3.5 w-3.5 text-[var(--success)]" />
      ) : (
        /*
         * Not-yet icon:
         *   text-[var(--text-muted)] → neutral[400]
         */
        <Minus className="h-3.5 w-3.5 text-[var(--text-muted)]" />
      )}
      <span
        className={cn(
          'text-[11px] transition-colors duration-200',
          passed ? 'text-[var(--text-secondary)]' : 'text-[var(--text-muted)]',
        )}
      >
        {label}
      </span>
    </li>
  );
}
