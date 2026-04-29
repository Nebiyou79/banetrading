// components/funds/DepositStepProof.tsx
// ── Step 3: amount + payment proof upload — Binance/Bybit standard ──

import {
  ChangeEvent,
  DragEvent,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Upload,
  FileText,
  X,
  Image as ImageIcon,
  AlertCircle,
} from 'lucide-react';
import { Button }   from '@/components/ui/Button';
import { CoinIcon } from './CoinIcon';
import { cn }       from '@/lib/cn';
import { CoinNetworkMap } from '@/types/funds';
import type { Coin, DepositNetwork } from '@/types/funds';

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ACCEPTED  = 'image/jpeg,image/jpg,image/png,image/webp,application/pdf';
const ACCEPTED_TYPES = ACCEPTED.split(',');

export interface DepositStepProofValues {
  amount: string;
  note:   string;
  proof:  File | null;
}

export interface DepositStepProofProps {
  coin:         Coin;
  network:      DepositNetwork;
  values:       DepositStepProofValues;
  onChange:     (next: DepositStepProofValues) => void;
  onBack:       () => void;
  onSubmit:     () => void;
  isSubmitting: boolean;
  serverError?: string | null;
}

function decimalsForCoin(coin: Coin): number {
  return coin === 'USDT' ? 2 : 8;
}

function isAmountValid(raw: string): boolean {
  if (!raw) return false;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0;
}

export function DepositStepProof({
  coin,
  network,
  values,
  onChange,
  onBack,
  onSubmit,
  isSubmitting,
  serverError,
}: DepositStepProofProps): JSX.Element {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragOver, setDragOver]     = useState(false);
  const [fileError, setFileError]   = useState<string | null>(null);
  const inputRef                    = useRef<HTMLInputElement | null>(null);

  /* Preview URL lifecycle */
  useEffect(() => {
    if (values.proof?.type.startsWith('image/')) {
      const url = URL.createObjectURL(values.proof);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl(null);
    return undefined;
  }, [values.proof]);

  /* Sanitise + bound numeric input */
  const setAmount = (raw: string): void => {
    const cleaned = raw.replace(/[^0-9.]/g, '');
    const dotIdx  = cleaned.indexOf('.');
    let normalised = cleaned;
    if (dotIdx >= 0) {
      const left  = cleaned.slice(0, dotIdx);
      const right = cleaned.slice(dotIdx + 1).replace(/\./g, '').slice(0, decimalsForCoin(coin));
      normalised  = right ? `${left}.${right}` : `${left}.`;
    }
    onChange({ ...values, amount: normalised });
  };

  const handleFile = (file: File | null): void => {
    setFileError(null);
    if (!file) { onChange({ ...values, proof: null }); return; }
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setFileError('Please upload a JPG, PNG, WEBP, or PDF.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setFileError('File must be 5 MB or smaller.');
      return;
    }
    onChange({ ...values, proof: file });
  };

  const onDrop = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files?.[0] ?? null);
  };

  const onSelect = (e: ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0] ?? null;
    if (e.target) e.target.value = '';
    handleFile(file);
  };

  const amountValid = isAmountValid(values.amount);
  const noteLength  = values.note.length;
  const canSubmit   = amountValid && !!values.proof && !isSubmitting;

  return (
    <div className="flex flex-col gap-5">

      {/* Coin + step chip */}
      <div
        className="flex items-center justify-between gap-3 rounded-xl
                   border border-[var(--border)] bg-[var(--bg-muted)] px-4 py-3"
      >
        <div className="flex items-center gap-3 min-w-0">
          <CoinIcon coin={coin} size="sm" />
          <div className="min-w-0">
            <div className="text-sm font-semibold text-[var(--text-primary)]">{coin}</div>
            <div className="text-[11px] text-[var(--text-muted)]">
              {CoinNetworkMap.label(network)} network
            </div>
          </div>
        </div>
        <span
          className="inline-flex items-center rounded-full border
                     border-[var(--info)] bg-[var(--info-muted)]
                     px-2.5 py-0.5 text-[10px] font-semibold uppercase
                     tracking-wider text-[var(--info)]"
        >
          Step 3 of 3
        </span>
      </div>

      {/* ── Amount ── */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="deposit-amount"
          className="text-xs font-medium text-[var(--text-secondary)]"
        >
          Deposit amount
        </label>

        <div
          className={cn(
            'relative flex items-center rounded-xl border bg-[var(--bg-muted)]',
            'transition-colors duration-150',
            amountValid || !values.amount
              ? 'border-[var(--border)] focus-within:border-[var(--accent)] focus-within:ring-1 focus-within:ring-[var(--focus-ring)]'
              : 'border-[var(--danger)]',
          )}
        >
          <input
            id="deposit-amount"
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={values.amount}
            onChange={(e) => setAmount(e.target.value)}
            className="h-11 w-full bg-transparent px-4 tabular text-sm
                       text-[var(--text-primary)] placeholder:text-[var(--text-muted)]
                       focus:outline-none"
          />
          <span className="shrink-0 px-4 text-xs font-semibold text-[var(--text-muted)]">
            {coin}
          </span>
        </div>

        {!amountValid && values.amount && (
          <span className="flex items-center gap-1 text-[11px] text-[var(--danger)]">
            <AlertCircle className="h-3 w-3" />
            Enter a valid amount greater than 0
          </span>
        )}
      </div>

      {/* ── Proof upload dropzone ── */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-[var(--text-secondary)]">
          Payment proof
        </label>

        {!values.proof ? (
          /* Dropzone */
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                inputRef.current?.click();
              }
            }}
            className={cn(
              'flex cursor-pointer flex-col items-center justify-center gap-3',
              'rounded-2xl border-2 border-dashed bg-[var(--bg-muted)]',
              'px-4 py-8 transition-all duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]',
              dragOver
                ? 'border-[var(--accent)] bg-[var(--accent-muted)]'
                : 'border-[var(--border)] hover:border-[var(--border-strong)] hover:bg-[var(--hover-bg)]',
            )}
          >
            <div
              className={cn(
                'inline-flex h-12 w-12 items-center justify-center rounded-full',
                'border border-[var(--border)] bg-[var(--bg-elevated)]',
                'transition-colors duration-150',
                dragOver && 'border-[var(--accent)] bg-[var(--accent-muted)]',
              )}
            >
              <Upload
                className={cn(
                  'h-5 w-5 transition-colors',
                  dragOver ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]',
                )}
              />
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-[var(--text-primary)]">
                Click to upload, or drag &amp; drop
              </div>
              <div className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                JPG, PNG, WEBP, or PDF · max 5 MB
              </div>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED}
              className="hidden"
              onChange={onSelect}
            />
          </div>
        ) : (
          /* File preview card */
          <div
            className="flex items-center gap-3 rounded-xl border border-[var(--border)]
                       bg-[var(--bg-muted)] px-3 py-3"
          >
            {/* Thumbnail */}
            <div
              className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border
                         border-[var(--border)] bg-[var(--bg-elevated)]
                         flex items-center justify-center"
            >
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt="proof preview"
                  className="h-full w-full object-cover"
                />
              ) : values.proof.type === 'application/pdf' ? (
                <FileText className="h-5 w-5 text-[var(--text-muted)]" />
              ) : (
                <ImageIcon className="h-5 w-5 text-[var(--text-muted)]" />
              )}
            </div>

            {/* File info */}
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-[var(--text-primary)]">
                {values.proof.name}
              </div>
              <div className="text-[11px] text-[var(--text-muted)]">
                {(values.proof.size / 1024).toFixed(1)} KB
              </div>
            </div>

            {/* Remove */}
            <button
              type="button"
              onClick={() => onChange({ ...values, proof: null })}
              aria-label="Remove file"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg
                         text-[var(--text-muted)] transition-colors duration-150
                         hover:text-[var(--danger)] hover:bg-[var(--danger-muted)]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {fileError && (
          <span className="flex items-center gap-1 text-[11px] text-[var(--danger)]">
            <AlertCircle className="h-3 w-3" />
            {fileError}
          </span>
        )}
      </div>

      {/* ── Note ── */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="deposit-note"
          className="flex items-center justify-between text-xs font-medium text-[var(--text-secondary)]"
        >
          <span>
            Note{' '}
            <span className="font-normal text-[var(--text-muted)]">(optional)</span>
          </span>
          <span className="tabular text-[10px] text-[var(--text-muted)]">
            {noteLength} / 500
          </span>
        </label>
        <textarea
          id="deposit-note"
          rows={3}
          maxLength={500}
          placeholder="Add a reference, transaction ID, or note for the reviewer."
          value={values.note}
          onChange={(e) => onChange({ ...values, note: e.target.value })}
          className="w-full resize-y rounded-xl border border-[var(--border)]
                     bg-[var(--bg-muted)] px-4 py-2.5
                     text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]
                     transition-colors duration-150
                     focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--focus-ring)]"
        />
      </div>

      {/* Server error */}
      {serverError && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-xl border
                     border-[var(--danger)] bg-[var(--danger-muted)]
                     px-4 py-2.5 text-xs text-[var(--danger)]"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          {serverError}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between gap-2 pt-2">
        <Button variant="ghost" size="lg" onClick={onBack} disabled={isSubmitting}>
          Back
        </Button>
        <Button
          variant="primary"
          size="lg"
          onClick={onSubmit}
          loading={isSubmitting}
          disabled={!canSubmit}
        >
          Submit deposit
        </Button>
      </div>
    </div>
  );
}
