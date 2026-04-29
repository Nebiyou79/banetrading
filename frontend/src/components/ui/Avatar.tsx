import { useState } from 'react';
import { cn } from '@/lib/cn';
import { getInitials, resolveMediaUrl } from '@/lib/media';

export interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  alt?: string;
}

const SIZE = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-base',
  xl: 'h-24 w-24 text-2xl',
};

export function Avatar({
  src,
  name,
  size = 'md',
  className,
  alt,
}: AvatarProps): JSX.Element {
  const [broken, setBroken] = useState(false);

  const resolved = resolveMediaUrl(src ?? null);
  const showImage = !!resolved && !broken;
  const initials = getInitials(name || '?');

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center overflow-hidden rounded-full border',
        'bg-[var(--card)] text-[var(--text-secondary)] border-[var(--border)]',
        'font-semibold select-none',
        SIZE[size],
        className
      )}
      aria-label={alt || name || 'User avatar'}
    >
      {showImage ? (
        <img
          src={resolved}
          alt={alt || name || 'User avatar'}
          onError={() => setBroken(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <span>{initials}</span>
      )}
    </span>
  );
}