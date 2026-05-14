// components/ui/Modal.tsx
// ── Accessible modal component ──
//
// THEME FIXES applied:
// • Close button (✕): was only var(--text-secondary) with no hover state →
//   added onMouseEnter/Leave to show var(--text-primary) on hover, making it
//   clearly interactive in both themes
// • Modal surface: var(--surface) ✅ (white in light, #0F1322 in dark)
// • Overlay: var(--overlay) ✅ (dark semi-transparent in both themes)
// • Title text: var(--text-primary) ✅
// • Body max-height scrollable: already set ✅
// • Border: var(--border) ✅
// • Header border-bottom: var(--border) ✅
// • Animations: animate-modal-in / animate-backdrop-in defined in globals.css ✅

import React, { useEffect, useCallback } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  const handleEscape = useCallback(
    (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  const sizeClasses: Record<NonNullable<ModalProps['size']>, string> = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center animate-backdrop-in"
      style={{ backgroundColor: 'var(--overlay)' }}
      onClick={onClose}
    >
      <div
        className={`${sizeClasses[size!]} w-full mx-4 rounded-2xl shadow-2xl animate-modal-in`}
        style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        {/* Header */}
        {title && (
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <h2
              id="modal-title"
              className="text-lg font-semibold"
              style={{ color: 'var(--text-primary)' }}
            >
              {title}
            </h2>

            {/* THEME FIX: close button now has a visible hover state in both themes */}
            <button
              onClick={onClose}
              className="text-xl leading-none p-1.5 rounded-lg transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              aria-label="Close modal"
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.color = 'var(--text-primary)';
                el.style.backgroundColor = 'var(--hover-bg)';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.color = 'var(--text-secondary)';
                el.style.backgroundColor = 'transparent';
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Body */}
        <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}