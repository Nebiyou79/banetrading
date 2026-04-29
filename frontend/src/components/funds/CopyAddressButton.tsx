// components/funds/CopyAddressButton.tsx
// ── Click-to-copy with animated copied-state feedback — Binance/Bybit standard ──

import { useEffect, useRef, useState } from 'react';
import { Copy, Check }                 from 'lucide-react';
import { cn }                          from '@/lib/cn';
import { toast }                       from '@/components/ui/Toast';

export interface CopyAddressButtonProps {
  value?:     string | null;
  label?:     string;
  size?:      'sm' | 'md';
  fullWidth?: boolean;
  className?: string;
}

export function CopyAddressButton({
  value,
  label     = 'Copy',
  size      = 'sm',
  fullWidth = false,
  className,
}: CopyAddressButtonProps): JSX.Element {
  const [copied, setCopied]   = useState(false);
  const timeoutRef            = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  const handle = async (): Promise<void> => {
    const v = (value ?? '').trim();
    if (!v) {
      toast.error('Nothing to copy');
      return;
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(v);
      } else {
        // Fallback (older browsers / non-HTTPS)
        const ta = document.createElement('textarea');
        ta.value = v;
        Object.assign(ta.style, {
          position: 'fixed',
          left:     '-9999px',
          top:      '0',
          opacity:  '0',
        });
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }

      setCopied(true);
      toast.success('Address copied');
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), 2200);
    } catch (err) {
      console.error('[CopyAddressButton]', err);
      toast.error('Could not copy — please copy manually.');
    }
  };

  const sizeCls = size === 'md'
    ? 'h-10 px-4 text-sm gap-2'
    : 'h-8  px-3 text-xs gap-1.5';

  return (
    <button
      type="button"
      onClick={handle}
      disabled={!value}
      aria-live="polite"
      aria-label={copied ? 'Copied!' : label}
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium',
        'border border-[var(--border)] bg-[var(--bg-muted)]',
        'text-[var(--text-secondary)]',
        'transition-all duration-150',
        'hover:border-[var(--border-strong)] hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]',
        'disabled:cursor-not-allowed disabled:opacity-40',
        copied && [
          'border-[var(--success)] bg-[var(--success-muted)]',
          'text-[var(--success)] hover:border-[var(--success)] hover:text-[var(--success)]',
        ],
        fullWidth && 'w-full',
        sizeCls,
        className,
      )}
    >
      {copied
        ? <Check className="h-3.5 w-3.5 shrink-0" />
        : <Copy  className="h-3.5 w-3.5 shrink-0" />}
      <span>{copied ? 'Copied!' : label}</span>
    </button>
  );
}
