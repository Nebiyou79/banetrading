// components/support/NewTicketModal.tsx
// ── NEW TICKET MODAL (FIXED POSITIONING) ──

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useResponsive } from '@/hooks/useResponsive';
import { supportService } from '@/services/supportService';
import clsx from 'clsx';

interface NewTicketModalProps {
  open: boolean;
  onClose: () => void;
}

const CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'deposit', label: 'Deposit' },
  { value: 'withdrawal', label: 'Withdrawal' },
  { value: 'kyc', label: 'KYC' },
  { value: 'trading', label: 'Trading' },
  { value: 'technical', label: 'Technical' },
  { value: 'other', label: 'Other' },
];

export default function NewTicketModal({ open, onClose }: NewTicketModalProps) {
  const router = useRouter();
  const { isMobile } = useResponsive();
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('general');
  const [message, setMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('subject', subject.trim());
      formData.append('category', category);
      formData.append('message', message.trim());
      if (file) formData.append('attachment', file);

      const result = await supportService.createTicket(formData);
      router.push(`/help/tickets/${result.ticket._id}`);
      onClose();
    } catch (err) {
      setError((err as Error).message || 'Failed to create ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <>
      {/* ── Backdrop ── */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" 
        onClick={handleBackdropClick}
      />

      {/* ── Modal Container - Centered ── */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className={clsx(
            'bg-[var(--bg-elevated)] border border-[var(--border)] shadow-xl',
            'animate-modal-in w-full',
            isMobile
              ? 'rounded-2xl p-5 max-h-[90vh] overflow-y-auto'
              : 'rounded-2xl p-6 max-w-lg',
          )}
        >
          <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">New Support Ticket</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* ── Subject ── */}
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value.slice(0, 200))}
                className="w-full px-4 py-2.5 rounded-lg text-sm border border-[var(--border)] bg-[var(--bg-muted)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                placeholder="Brief description of your issue"
                required
              />
              <span className="text-xs text-[var(--text-muted)] mt-1">{subject.length}/200</span>
            </div>

            {/* ── Category ── */}
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg text-sm border border-[var(--border)] bg-[var(--bg-muted)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
              >
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            {/* ── Message ── */}
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Message</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value.slice(0, 5000))}
                rows={4}
                className="w-full px-4 py-2.5 rounded-lg text-sm border border-[var(--border)] bg-[var(--bg-muted)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] resize-none"
                placeholder="Describe your issue in detail..."
                required
              />
              <span className="text-xs text-[var(--text-muted)] mt-1">{message.length}/5000</span>
            </div>

            {/* ── File attachment (optional) ── */}
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Attachment (optional)</label>
              <div
                className={clsx(
                  'border-2 border-dashed rounded-lg p-4 text-center transition-colors duration-150',
                  file ? 'border-[var(--accent)] bg-[var(--primary-muted)]' : 'border-[var(--border)] hover:border-[var(--accent)]',
                )}
              >
                {file ? (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[var(--text-primary)] truncate">{file.name}</span>
                    <button type="button" onClick={() => setFile(null)} className="text-xs text-red-500 hover:underline">
                      Remove
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      type="file"
                      onChange={e => setFile(e.target.files?.[0] || null)}
                      className="hidden"
                      id="ticket-attachment"
                      accept="image/*,application/pdf"
                    />
                    <label htmlFor="ticket-attachment" className="cursor-pointer text-sm text-[var(--text-muted)]">
                      Click to upload (max 5MB)
                    </label>
                  </>
                )}
              </div>
            </div>

            {/* ── Error ── */}
            {error && <p className="text-sm text-red-500">{error}</p>}

            {/* ── Actions ── */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] transition-colors duration-150"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !subject.trim() || !message.trim()}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-[var(--accent)] text-white hover:opacity-90 transition-opacity duration-150 disabled:opacity-50"
              >
                {submitting ? 'Creating...' : 'Submit'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Add animation styles if not already in your globals.css */}
      <style jsx>{`
        @keyframes modal-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-modal-in {
          animation: modal-in 0.2s ease-out;
        }
      `}</style>
    </>
  );
}