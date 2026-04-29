'use client';

// components/ui/Modal.tsx

import { ReactNode, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../lib/cn';
import { useResponsive } from '@/hooks/useResponsive';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  closeOnBackdrop?: boolean;
}

const SIZE = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
};

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnBackdrop = true,
}: ModalProps) {
  const { isMobile } = useResponsive();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    lastFocusedRef.current = document.activeElement as HTMLElement;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
      lastFocusedRef.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[var(--backdrop)] animate-backdrop-in"
        onClick={closeOnBackdrop ? onClose : undefined}
      />

      {/* Modal */}
      <div
        className={cn(
          'absolute w-full',

          isMobile
            ? 'bottom-0 animate-slide-up'
            : 'flex items-center justify-center h-full p-4'
        )}
      >
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          className={cn(
            'bg-[var(--card)] border border-[var(--border)] shadow-card',

            isMobile
              ? 'w-full rounded-t-2xl p-4'
              : `w-full rounded-modal animate-modal-in ${SIZE[size]}`
          )}
        >
          {/* Header */}
          {title && (
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                {title}
              </h3>

              <button
                onClick={onClose}
                className="h-8 w-8 flex items-center justify-center rounded-button text-[var(--text-muted)] hover:bg-[var(--card-elevated)] transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Body */}
          <div className="text-sm">{children}</div>

          {/* Footer */}
          {footer && (
            <div className="mt-4 pt-3 border-t border-[var(--border)]">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}