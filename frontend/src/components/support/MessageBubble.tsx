// components/support/MessageBubble.tsx
// ── CHAT MESSAGE BUBBLE ──

import React from 'react';
import clsx from 'clsx';
import type { TicketMessage } from '@/types/support';

interface MessageBubbleProps {
  message: TicketMessage;
  isPending?: boolean;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export default function MessageBubble({ message, isPending = false }: MessageBubbleProps) {
  const isUser = message.senderRole === 'user';

  return (
    <div className={clsx('flex mb-3', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={clsx(
          'max-w-[75%] rounded-2xl p-3',
          isUser
            ? 'bg-[var(--primary-muted)] rounded-br-sm ml-auto'
            : 'bg-[var(--card)] rounded-bl-sm mr-auto',
          isPending && 'opacity-60',
        )}
      >
        <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap break-words">
          {message.body}
        </p>

        {/* ── Attachments ── */}
        {message.attachments.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {message.attachments.map((att, i) => (
              <a
                key={i}
                href={att}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[var(--bg-muted)] text-xs text-[var(--accent)] hover:underline"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                File {i + 1}
              </a>
            ))}
          </div>
        )}

        {/* ── Timestamp + Sender ── */}
        <div className="flex items-center gap-1.5 mt-1.5">
          <span className="text-xs text-[var(--text-muted)]">
            {isUser ? 'You' : 'Support'}
          </span>
          <span className="text-xs text-[var(--text-muted)]">·</span>
          <span className="text-xs text-[var(--text-muted)] tabular">
            {formatTime(message.createdAt)}
          </span>
          {isPending && (
            <>
              <span className="text-xs text-[var(--text-muted)]">·</span>
              <svg className="animate-spin h-3 w-3 text-[var(--text-muted)]" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx={12} cy={12} r={10} stroke="currentColor" strokeWidth={4} />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </>
          )}
        </div>
      </div>
    </div>
  );
}