// components/auth/OtpInput.tsx
// ── 6-box OTP input ──

import {
  ClipboardEvent,
  KeyboardEvent,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { cn } from '../../lib/cn';

export interface OtpInputHandle {
  focus: () => void;
  clear: () => void;
  shake: () => void;
}

export interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  autoFocus?: boolean;
}

export const OtpInput = forwardRef<OtpInputHandle, OtpInputProps>(function OtpInput(
  { length = 6, value, onChange, onComplete, disabled, invalid, autoFocus = true },
  ref,
) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const [shaking, setShaking] = useState(false);

  const chars: string[] = Array.from({ length }, (_, i) => value[i] ?? '');

  useImperativeHandle(ref, () => ({
    focus: () => refs.current[0]?.focus(),
    clear: () => {
      onChange('');
      refs.current[0]?.focus();
    },
    shake: () => {
      setShaking(true);
      window.setTimeout(() => setShaking(false), 400);
    },
  }));

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  useEffect(() => {
    if (invalid) {
      setShaking(true);
      const t = window.setTimeout(() => setShaking(false), 400);
      return () => window.clearTimeout(t);
    }
    return;
  }, [invalid]);

  const setAt = (index: number, char: string): string => {
    const arr = chars.slice();
    arr[index] = char;
    return arr.join('').slice(0, length);
  };

  const handleChange = (index: number, raw: string): void => {
    const digits = raw.replace(/\D/g, '');
    if (!digits) {
      onChange(setAt(index, ''));
      return;
    }
    if (digits.length > 1) {
      const merged = (value.slice(0, index) + digits).slice(0, length);
      onChange(merged);
      const target = Math.min(index + digits.length, length - 1);
      refs.current[target]?.focus();
      if (merged.length === length) onComplete?.(merged);
      return;
    }
    const ch = digits.slice(-1);
    const next = setAt(index, ch);
    onChange(next);
    if (index < length - 1) refs.current[index + 1]?.focus();
    if (next.replace(/\s/g, '').length === length) onComplete?.(next);
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Backspace') {
      if (chars[index]) {
        e.preventDefault();
        onChange(setAt(index, ''));
      } else if (index > 0) {
        e.preventDefault();
        onChange(setAt(index - 1, ''));
        refs.current[index - 1]?.focus();
      }
      return;
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      refs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault();
      refs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>): void => {
    const text = e.clipboardData.getData('text') || '';
    const digits = text.replace(/\D/g, '').slice(0, length);
    if (!digits) return;
    e.preventDefault();
    onChange(digits);
    const target = Math.min(digits.length, length - 1);
    refs.current[target]?.focus();
    if (digits.length === length) onComplete?.(digits);
  };

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-2 sm:gap-3',
        shaking && 'animate-otp-shake',
      )}
      role="group"
      aria-label="Enter one-time code"
    >
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          disabled={disabled}
          value={chars[i]}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          aria-invalid={invalid || undefined}
          aria-label={`Digit ${i + 1}`}
          className={cn(
            /*
             * Base box:
             *   bg-[var(--surface)]     → card/elevated surface
             *   border-[var(--border)]  → neutral rim
             *   text-[var(--text-primary)]
             *
             * Focus:
             *   border-[var(--primary)] → gold accent ring (Binance-style)
             *   ring-2 ring-[var(--primary-muted)] → soft glow halo
             *
             * Invalid:
             *   border-[var(--error)]   → red
             *   text-[var(--error)]
             *
             * Disabled:
             *   bg-[var(--disabled)]
             *   text-[var(--disabled-text)]
             */
            `h-12 w-10 sm:h-14 sm:w-12 rounded-input border
             bg-[var(--surface)]
             text-center text-lg sm:text-xl font-semibold tabular-nums
             transition-all duration-150
             focus:outline-none
             focus:border-[var(--primary)]
             focus:ring-2 focus:ring-[var(--primary-muted)]`,
            invalid
              ? 'border-[var(--error)] text-[var(--error)]'
              : 'border-[var(--border)] text-[var(--text-primary)]',
            disabled && 'opacity-60 cursor-not-allowed bg-[var(--disabled)]',
          )}
        />
      ))}
    </div>
  );
});
