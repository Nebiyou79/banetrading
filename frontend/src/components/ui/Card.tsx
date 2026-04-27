// components/ui/Card.tsx
// ── Card primitive ──

import { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  header?: ReactNode;
  footer?: ReactNode;
  padded?: boolean;
}

export function Card({ header, footer, padded = true, className, children, ...rest }: CardProps): JSX.Element {
  return (
    <div
      className={cn(
        'bg-elevated border border-border rounded-card shadow-card',
        className,
      )}
      {...rest}
    >
      {header && (
        <div className="px-6 pt-6 pb-3 border-b border-border">{header}</div>
      )}
      <div className={cn(padded ? 'p-6' : '')}>{children}</div>
      {footer && (
        <div className="px-6 pb-6 pt-3 border-t border-border">{footer}</div>
      )}
    </div>
  );
}