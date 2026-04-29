// components/ui/Skeleton.tsx

import { HTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export function Skeleton({
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-[var(--card-elevated)]',
        className
      )}
      {...rest}
    />
  );
}