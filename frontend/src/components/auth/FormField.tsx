// components/auth/FormField.tsx
// ── Wrapper combining label + control + error message with consistent spacing ──

import { ReactNode } from 'react';
import { cn } from '../../lib/cn';

export interface FormFieldProps {
  label?: string;
  htmlFor?: string;
  error?: string;
  helper?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function FormField({
  label,
  htmlFor,
  error,
  helper,
  children,
  className,
}: FormFieldProps): JSX.Element {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        /*
         * Label:
         *   text-[var(--text-secondary)] → neutral[300] dark | neutral[500] light
         */
        <label
          htmlFor={htmlFor}
          className="text-xs font-medium text-[var(--text-secondary)]"
        >
          {label}
        </label>
      )}

      {children}

      {error ? (
        /*
         * Inline error:
         *   text-[var(--error)] → red[400] dark | red[500] light
         */
        <p className="text-xs text-[var(--error)]">{error}</p>
      ) : helper ? (
        /*
         * Helper text:
         *   text-[var(--text-muted)] → neutral[400] dark | neutral[400] light
         */
        <div className="text-xs text-[var(--text-muted)]">{helper}</div>
      ) : null}
    </div>
  );
}
