// components/support/MessageComposer.tsx
// ── MESSAGE COMPOSER ──

import React, { useState, useRef, useCallback } from 'react';

interface MessageComposerProps {
  onSend: (body: string, file?: File | null) => void;
  isSending?: boolean;
  disabled?: boolean;
}

export default function MessageComposer({ onSend, isSending = false, disabled = false }: MessageComposerProps) {
  const [body, setBody] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Auto-grow textarea ──
  const autoGrow = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }, []);

  const handleSend = () => {
    const trimmed = body.trim();
    if (!trimmed || isSending || disabled) return;
    onSend(trimmed, file);
    setBody('');
    setFile(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="sticky bottom-0 bg-[var(--surface)] border-t border-[var(--border)] p-4">
      {/* ── File chip ── */}
      {file && (
        <div className="flex items-center gap-2 mb-2 px-1">
          <span className="text-xs text-[var(--text-primary)] bg-[var(--bg-muted)] px-2 py-1 rounded-lg flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            {file.name}
          </span>
          <button
            type="button"
            onClick={() => setFile(null)}
            className="text-xs text-[var(--danger)] hover:underline"
          >
            Remove
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* ── Attachment button ── */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] transition-colors duration-150"
          aria-label="Attach file"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          onChange={e => setFile(e.target.files?.[0] || null)}
          className="hidden"
          accept="image/*,application/pdf"
        />

        {/* ── Textarea ── */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={body}
            onChange={e => { setBody(e.target.value); autoGrow(); }}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Type a message..."
            disabled={disabled}
            className="w-full px-4 py-2.5 rounded-xl text-sm border border-[var(--border)] bg-[var(--bg-muted)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] resize-none"
            style={{ maxHeight: 120 }}
          />
        </div>

        {/* ── Send button ── */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!body.trim() || isSending || disabled}
          className="flex-shrink-0 px-4 py-2.5 rounded-lg text-sm font-semibold bg-[var(--accent)] text-[var(--text-inverse)] hover:opacity-90 transition-opacity duration-150 disabled:opacity-40"
        >
          {isSending ? '...' : 'Send'}
        </button>
      </div>

      {/* ── Helper text ── */}
      <p className="text-xs text-[var(--text-muted)] mt-2">
        Press Enter to send · Shift+Enter for new line
      </p>
    </div>
  );
}