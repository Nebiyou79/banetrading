// components/ui/Input.tsx
// ── Input (Binance-grade field system) ──

import {
  forwardRef,
  InputHTMLAttributes,
  ReactNode,
  useId,
  useState,
} from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '../../lib/cn';

type BaseProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>;

export interface InputProps extends BaseProps {
  label?: string;
  helper?: string;
  error?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  showPasswordToggle?: boolean;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input(
    {
      label,
      helper,
      error,
      leading,
      trailing,
      showPasswordToggle = false,
      type = 'text',
      id,
      className,
      containerClassName,
      disabled,
      ...rest
    },
    ref
  ) {
    const autoId = useId();
    const inputId = id || autoId;
    const helperId = `${inputId}-helper`;
    const errorId = `${inputId}-error`;

    const [revealed, setRevealed] = useState(false);

    const isPassword = type === 'password';
    const effectiveType =
      isPassword && showPasswordToggle && revealed ? 'text' : type;

    const hasError = !!error;

    return (
      <div className={cn('flex flex-col gap-1.5', containerClassName)}>
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className="text-[11px] font-medium uppercase tracking-wide text-[var(--text-secondary)]"
          >
            {label}
          </label>
        )}

        {/* Input Wrapper */}
        <div
          className={cn(
            'group relative flex items-center rounded-input border',
            'bg-[var(--card)] transition-all duration-150',

            hasError
              ? 'border-[var(--danger)]'
              : 'border-[var(--border)]',

            !hasError &&
              'focus-within:border-[var(--accent)] focus-within:ring-2 focus-within:ring-[var(--accent-soft)]',

            disabled && 'opacity-60 cursor-not-allowed'
          )}
        >
          {/* Leading */}
          {leading && (
            <span className="pl-3 pr-1 text-[var(--text-muted)] inline-flex items-center">
              {leading}
            </span>
          )}

          {/* Input */}
          <input
            ref={ref}
            id={inputId}
            type={effectiveType}
            disabled={disabled}
            aria-invalid={hasError || undefined}
            aria-describedby={
              hasError ? errorId : helper ? helperId : undefined
            }
            className={cn(
              'h-11 w-full bg-transparent px-3 text-sm',
              'text-[var(--text-primary)] placeholder:text-[var(--text-muted)]',
              'focus:outline-none',

              leading && 'pl-2',
              (trailing || (isPassword && showPasswordToggle)) && 'pr-2',

              className
            )}
            {...rest}
          />

          {/* Password toggle */}
          {isPassword && showPasswordToggle && (
            <button
              type="button"
              onClick={() => setRevealed((v) => !v)}
              aria-label={revealed ? 'Hide password' : 'Show password'}
              tabIndex={-1}
              className="pr-3 pl-1 inline-flex items-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              {revealed ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          )}

          {/* Trailing */}
          {!isPassword && trailing && (
            <span className="pr-3 pl-1 inline-flex items-center text-[var(--text-muted)]">
              {trailing}
            </span>
          )}
        </div>

        {/* Error / Helper */}
        {hasError ? (
          <p id={errorId} className="text-xs text-[var(--danger)]">
            {error}
          </p>
        ) : helper ? (
          <p id={helperId} className="text-xs text-[var(--text-muted)]">
            {helper}
          </p>
        ) : null}
      </div>
    );
  }
);