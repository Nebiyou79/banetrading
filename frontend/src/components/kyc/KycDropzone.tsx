// components/kyc/KycDropzone.tsx
// ── Shared dropzone for KYC document uploads ──

import { ChangeEvent, DragEvent, useEffect, useRef, useState } from 'react';
import { Upload, FileText, Image as ImageIcon, X } from 'lucide-react';
import { cn } from '@/lib/cn';

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
const ACCEPT_ATTR = ACCEPTED_TYPES.join(',');

export interface KycDropzoneProps {
  label: string;
  required?: boolean;
  helper?: string;
  helperTone?: 'muted' | 'warning';
  file: File | null;
  onChange: (file: File | null) => void;
  error?: string;
  id?: string;
}

export function KycDropzone({
  label,
  required = false,
  helper,
  helperTone = 'muted',
  file,
  onChange,
  error,
  id,
}: KycDropzoneProps): JSX.Element {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Manage preview URL lifecycle for image files only
  useEffect(() => {
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl(null);
    return undefined;
  }, [file]);

  const handle = (next: File | null): void => {
    setLocalError(null);
    if (!next) { onChange(null); return; }
    if (!ACCEPTED_TYPES.includes(next.type)) {
      setLocalError('Please upload a JPG, PNG, WEBP, or PDF.');
      return;
    }
    if (next.size > MAX_BYTES) {
      setLocalError('File must be 5 MB or smaller.');
      return;
    }
    onChange(next);
  };

  const onSelect = (e: ChangeEvent<HTMLInputElement>): void => {
    const next = e.target.files?.[0] ?? null;
    if (e.target) e.target.value = '';
    handle(next);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setDragOver(false);
    const next = e.dataTransfer.files?.[0] ?? null;
    handle(next);
  };

  const remove = (): void => {
    onChange(null);
    setLocalError(null);
  };

  const shownError = error || localError;
  const dzId = id || label.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={dzId} className="text-xs font-medium text-text-secondary">
          {label}
          {required && <span className="ml-1 text-danger" aria-hidden="true">*</span>}
        </label>
        {helper && (
          <span className={cn('text-[11px]', helperTone === 'warning' ? 'text-warning' : 'text-text-muted')}>
            {helper}
          </span>
        )}
      </div>

      {!file ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          aria-describedby={shownError ? `${dzId}-error` : undefined}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inputRef.current?.click(); } }}
          className={cn(
            'flex flex-col items-center justify-center gap-1.5 rounded-card border-2 border-dashed bg-muted px-4 py-6 cursor-pointer transition-colors',
            dragOver ? 'border-accent bg-accent-muted' : shownError ? 'border-danger' : 'border-border hover:border-border-strong',
          )}
        >
          <Upload className="h-5 w-5 text-text-muted" />
          <div className="text-sm text-text-primary">Click to upload, or drag and drop</div>
          <div className="text-[11px] text-text-muted">JPG, PNG, WEBP, or PDF · up to 5 MB</div>
          <input
            ref={inputRef}
            id={dzId}
            type="file"
            accept={ACCEPT_ATTR}
            className="hidden"
            onChange={onSelect}
          />
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-card border border-border bg-muted px-3 py-3">
          <div className="h-[120px] w-[120px] shrink-0 overflow-hidden rounded-input border border-border bg-base flex items-center justify-center">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt={`${label} preview`} className="h-full w-full object-cover" />
            ) : file.type === 'application/pdf' ? (
              <FileText className="h-8 w-8 text-text-muted" />
            ) : (
              <ImageIcon className="h-8 w-8 text-text-muted" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-text-primary truncate">{file.name}</div>
            <div className="text-[11px] text-text-muted">
              {(file.size / 1024).toFixed(1)} KB · {file.type || 'unknown'}
            </div>
            <button
              type="button"
              onClick={remove}
              className="mt-2 inline-flex items-center gap-1 text-[11px] text-danger hover:underline"
            >
              <X className="h-3.5 w-3.5" />
              Remove
            </button>
          </div>
        </div>
      )}

      {shownError && (
        <p id={`${dzId}-error`} className="text-[11px] text-danger">{shownError}</p>
      )}
    </div>
  );
}