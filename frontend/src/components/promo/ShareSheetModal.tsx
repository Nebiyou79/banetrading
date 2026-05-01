// components/promo/ShareSheetModal.tsx
// ── SHARE SHEET MODAL ──

import React, { useState } from 'react';
import { useResponsive } from '@/hooks/useResponsive';
import clsx from 'clsx';

interface ShareSheetModalProps {
  open: boolean;
  onClose: () => void;
  code: string;
}

const BASE_URL = typeof window !== 'undefined' ? window.location.origin : '';

export default function ShareSheetModal({ open, onClose, code }: ShareSheetModalProps) {
  const { isMobile } = useResponsive();
  const [copied, setCopied] = useState(false);

  if (!open || !code) return null;

  const shareUrl = `${BASE_URL}/register?code=${code}`;
  const message = `Sign up with my code ${code} on BaneTrading and we both earn bonuses! 🚀`;

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(message + ' ' + shareUrl)}`;
  const twitterHref = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(shareUrl)}`;
  const telegramHref = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(message)}`;

  return (
    <>
      {/* ── Backdrop ── */}
      <div className="fixed inset-0 bg-[var(--overlay)] z-40 animate-backdrop-in" onClick={onClose} />

      {/* ── Modal ── */}
      <div
        className={clsx(
          'fixed z-50 bg-[var(--bg-elevated)] border border-[var(--border)] animate-modal-in',
          isMobile
            ? 'bottom-0 left-0 right-0 rounded-t-2xl p-5'
            : 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-2xl p-6 w-full max-w-md',
        )}
      >
        <h2 className="text-lg font-bold text-[var(--text-primary)] mb-2">Share Your Promo Code</h2>

        {/* ── Code display ── */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 mb-4">
          <span className="text-xl font-mono font-bold text-[var(--text-primary)] tracking-wider">{code}</span>
        </div>

        {/* ── Shareable URL ── */}
        <div className="flex items-center gap-2 mb-5">
          <input
            type="text"
            readOnly
            value={shareUrl}
            className="flex-1 px-3 py-2 rounded-lg text-xs border border-[var(--border)] bg-[var(--bg-muted)] text-[var(--text-primary)]"
          />
          <button
            onClick={handleCopyLink}
            className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
              copied
                ? 'bg-[var(--success-muted)] text-[var(--success)]'
                : 'bg-[var(--accent)] text-[var(--text-inverse)] hover:opacity-90'
            }`}
          >
            {copied ? 'Copied ✓' : 'Copy'}
          </button>
        </div>

        {/* ── Share platforms ── */}
        <p className="text-xs text-[var(--text-muted)] mb-3">Share via:</p>
        <div className="flex gap-3">
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-[var(--border)] text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] transition-colors duration-150"
          >
            WhatsApp
          </a>
          <a
            href={twitterHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-[var(--border)] text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] transition-colors duration-150"
          >
            Twitter
          </a>
          <a
            href={telegramHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-[var(--border)] text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] transition-colors duration-150"
          >
            Telegram
          </a>
        </div>
      </div>
    </>
  );
}