// components/funds/Stepper.tsx
// ── Numeric step indicator — Binance/Bybit standard ──

import { Check } from 'lucide-react';
import { cn }    from '@/lib/cn';

export interface StepperStep {
  id:    string;
  label: string;
}

export interface StepperProps {
  steps:       StepperStep[];
  activeIndex: number;
}

export function Stepper({ steps, activeIndex }: StepperProps): JSX.Element {
  return (
    <ol
      className="flex items-center gap-0"
      aria-label="Progress steps"
    >
      {steps.map((step, i) => {
        const isActive = i === activeIndex;
        const isDone   = i < activeIndex;
        const isLast   = i === steps.length - 1;

        return (
          <li key={step.id} className="flex flex-1 items-center">

            {/* Step bubble + label */}
            <div className="flex flex-col items-center gap-1.5 flex-1">
              {/* Bubble */}
              <span
                className={cn(
                  'relative inline-flex h-7 w-7 items-center justify-center rounded-full',
                  'text-[11px] font-bold tabular transition-all duration-200',
                  isDone && [
                    'border border-[var(--success)]',
                    'bg-[var(--success-muted)] text-[var(--success)]',
                  ],
                  isActive && [
                    'border border-[var(--accent)]',
                    'bg-[var(--accent)] text-[var(--text-inverse)]',
                    'shadow-[0_0_12px_var(--accent-muted)]',
                  ],
                  !isDone && !isActive && [
                    'border border-[var(--border)]',
                    'bg-[var(--bg-muted)] text-[var(--text-muted)]',
                  ],
                )}
              >
                {isDone ? <Check className="h-3.5 w-3.5" /> : i + 1}

                {/* Active pulse ring */}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 rounded-full animate-ping opacity-25"
                    style={{ background: 'var(--accent)' }}
                  />
                )}
              </span>

              {/* Label */}
              <span
                className={cn(
                  'hidden sm:block text-[10px] font-medium uppercase tracking-widest whitespace-nowrap transition-colors duration-200',
                  isActive  && 'text-[var(--text-primary)]',
                  isDone    && 'text-[var(--success)]',
                  !isDone && !isActive && 'text-[var(--text-muted)]',
                )}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line — skip after last step */}
            {!isLast && (
              <div
                aria-hidden="true"
                className="mx-1 flex-1 h-px transition-all duration-300"
                style={{
                  background: isDone
                    ? 'var(--success)'
                    : 'var(--border)',
                  opacity: isDone ? 0.5 : 1,
                }}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
