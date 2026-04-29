// components/ui/Tooltip.tsx
// ── Tiny tooltip primitive (CSS-driven, no extra deps) ──

import { cloneElement, ReactElement, ReactNode, useId } from 'react';
import { cn } from '@/lib/cn';

export interface TooltipProps {
  label: ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  children: ReactElement;
  className?: string;
  disabled?: boolean;
}

const SIDE_POSITION: Record<NonNullable<TooltipProps['side']>, string> = {
  top:    'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left:   'right-full top-1/2 -translate-y-1/2 mr-2',
  right:  'left-full top-1/2 -translate-y-1/2 ml-2',
};

const ARROW_POSITION: Record<NonNullable<TooltipProps['side']>, string> = {
  top:    'top-full left-1/2 -translate-x-1/2 -mt-1 border-t-card-hover',
  bottom: 'bottom-full left-1/2 -translate-x-1/2 -mb-1 border-b-card-hover',
  left:   'left-full top-1/2 -translate-y-1/2 -ml-1 border-l-card-hover',
  right:  'right-full top-1/2 -translate-y-1/2 -mr-1 border-r-card-hover',
};

/**
 * Wraps a single focusable child. The child must accept className + aria-describedby.
 * Tooltip shows on hover and focus, hides on leave/blur.
 */
export function Tooltip({ label, side = 'top', children, className, disabled }: TooltipProps): JSX.Element {
  const id = useId();
  if (disabled) return children;

  const trigger = cloneElement(children, {
    'aria-describedby': id,
    className: cn('group/tt relative inline-flex', children.props.className),
  });

  return (
    <span className="relative inline-flex group/tt">
      {trigger}
      <span
        id={id}
        role="tooltip"
        className={cn(
          'pointer-events-none absolute z-50 max-w-[220px] rounded-button border border-border bg-card-hover px-2.5 py-1.5 text-[11px] font-medium text-text-primary shadow-card whitespace-normal',
          'opacity-0 translate-y-0.5 transition-[opacity,transform] duration-150',
          'group-hover/tt:opacity-100 group-hover/tt:translate-y-0',
          'group-focus-within/tt:opacity-100 group-focus-within/tt:translate-y-0',
          SIDE_POSITION[side],
          className,
        )}
      >
        {label}
        <span
          aria-hidden="true"
          className={cn(
            'absolute h-0 w-0 border-4 border-transparent',
            ARROW_POSITION[side],
          )}
        />
      </span>
    </span>
  );
}