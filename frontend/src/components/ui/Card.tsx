// components/ui/Card.tsx
// ── Card primitive (Binance/Bybit standard) ──

import { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  header?: ReactNode;
  footer?: ReactNode;
  padded?: boolean;
}

export function Card({
  header,
  footer,
  padded = true,
  className,
  children,
  ...rest
}: CardProps): JSX.Element {
  return (
    <div
      className={cn(
        'bg-[var(--card)] border border-[var(--border)] rounded-card shadow-card',
        'transition-colors duration-200',
        className
      )}
      {...rest}
    >
      {header && (
        <div className="px-4 md:px-6 pt-4 md:pt-6 pb-3 border-b border-[var(--border)]">
          {header}
        </div>
      )}

      <div className={cn(padded ? 'p-4 md:p-6' : '')}>
        {children}
      </div>

      {footer && (
        <div className="px-4 md:px-6 pt-3 pb-4 md:pb-6 border-t border-[var(--border)]">
          {footer}
        </div>
      )}
    </div>
  );
}