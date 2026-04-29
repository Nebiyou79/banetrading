// components/funds/QrCodeBox.tsx
// ── Theme-aware QR code display — Binance/Bybit standard ──

import { QRCodeSVG }           from 'qrcode.react';
import { QrCode as QrIcon }    from 'lucide-react';
import { useTheme }             from '@/components/theme/ThemeProvider';
import { cn }                   from '@/lib/cn';

export interface QrCodeBoxProps {
  value?:    string | null;
  size?:     number;
  className?: string;
}

export function QrCodeBox({
  value,
  size = 180,
  className,
}: QrCodeBoxProps): JSX.Element {
  const { resolvedTheme } = useTheme();
  const isDark  = resolvedTheme === 'dark';
  const trimmed = (value ?? '').trim();

  /* Outer dimension: QR + 16 px padding each side */
  const boxSize = size + 32;

  /* ── Empty / not configured ── */
  if (!trimmed) {
    return (
      <div
        className={cn(
          'inline-flex flex-col items-center justify-center gap-2 rounded-2xl',
          'border-2 border-dashed border-[var(--border)] bg-[var(--bg-muted)]',
          'text-[var(--text-muted)]',
          className,
        )}
        style={{ width: boxSize, height: boxSize }}
        role="status"
        aria-label="QR code unavailable"
      >
        <QrIcon className="h-7 w-7 opacity-50" />
        <span className="px-4 text-center text-[11px] leading-snug">
          Address not configured.
          <br />
          Contact support.
        </span>
      </div>
    );
  }

  /* ── QR code ──
   *  Always white background for QR readability. In dark theme we wrap
   *  the white square in a styled container with a very subtle glow.
   */
  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-2xl p-4',
        'border border-[var(--border)] bg-white',
        isDark && 'shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_4px_32px_rgba(99,102,241,0.12)]',
        !isDark && 'shadow-md',
        className,
      )}
    >
      <QRCodeSVG
        value={trimmed}
        size={size}
        bgColor="#FFFFFF"
        fgColor="#111111"
        level="M"
        includeMargin={false}
      />
    </div>
  );
}
