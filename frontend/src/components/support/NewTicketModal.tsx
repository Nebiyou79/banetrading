// components/support/NewTicketModal.tsx
// ── NEW TICKET MODAL ──

import React, { useState } from 'react';
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

  return (
    <>
      {/* ── Backdrop ── */}
      <div className="fixed inset-0 bg-[var(--overlay)] z-40 animate-backdrop-in" onClick={onClose} />

      {/* ── Modal ── */}
      <div
        className={clsx(
          'fixed z-50 bg-[var(--bg-elevated)] border border-[var(--border)] animate-modal-in',
          isMobile
            ? 'bottom-0 left-0 right-0 rounded-t-2xl p-5 max-h-[90vh] overflow-y-auto'
            : 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-2xl p-6 w-full max-w-lg',
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
                  <button type="button" onClick={() => setFile(null)} className="text-xs text-[var(--danger)] hover:underline">
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
          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

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
              className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-[var(--accent)] text-[var(--text-inverse)] hover:opacity-90 transition-opacity duration-150 disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}