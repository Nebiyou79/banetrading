// components/funds/DepositModal.tsx
// ── Three-step deposit wizard — Binance/Bybit standard ──
// Mobile  → bottom sheet (rounded-t-2xl, slides up)
// Desktop → centered dialog (animate-modal-in)

import { useEffect, useState }       from 'react';
import { X, CheckCircle2 }           from 'lucide-react';
import { Stepper }                   from './Stepper';
import { DepositStepCoinNetwork }    from './DepositStepCoinNetwork';
import { DepositStepAddress }        from './DepositStepAddress';
import { DepositStepProof }          from './DepositStepProof';
import type { DepositStepProofValues } from './DepositStepProof';
import { useDeposit }                from '@/hooks/useDeposit';
import { useResponsive }             from '@/hooks/useResponsive';
import { cn }                        from '@/lib/cn';
import type { Coin, DepositNetwork } from '@/types/funds';
import type { NormalizedApiError }   from '@/services/apiClient';

export interface DepositModalProps {
  open:         boolean;
  onClose:      () => void;
  initialCoin?: Coin | null;
}

const STEPS = [
  { id: 'coin',    label: 'Coin & Network' },
  { id: 'address', label: 'Address' },
  { id: 'proof',   label: 'Upload' },
];

const EMPTY_PROOF: DepositStepProofValues = { amount: '', note: '', proof: null };

export function DepositModal({
  open,
  onClose,
  initialCoin = null,
}: DepositModalProps): JSX.Element | null {
  const { isMobile }   = useResponsive();
  const { submit, isSubmitting } = useDeposit();

  const [activeIndex, setActiveIndex] = useState(0);
  const [coin, setCoin]               = useState<Coin | null>(initialCoin);
  const [network, setNetwork]         = useState<DepositNetwork | null>(null);
  const [proofValues, setProofValues] = useState<DepositStepProofValues>(EMPTY_PROOF);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess]         = useState(false);

  /* Reset on (re)open */
  useEffect(() => {
    if (open) {
      setActiveIndex(0);
      setCoin(initialCoin);
      setNetwork(null);
      setProofValues(EMPTY_PROOF);
      setServerError(null);
      setSuccess(false);
    }
  }, [open, initialCoin]);

  /* Lock body scroll when open */
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
    return undefined;
  }, [open]);

  if (!open) return null;

  const handleClose = (): void => { if (!isSubmitting) onClose(); };

  const handleSubmit = async (): Promise<void> => {
    setServerError(null);
    if (!coin || !network) { setServerError('Please complete all steps.'); return; }
    const amount = Number(proofValues.amount);
    if (!Number.isFinite(amount) || amount <= 0) { setServerError('Enter a valid amount.'); return; }
    if (!proofValues.proof) { setServerError('Please attach payment proof.'); return; }
    try {
      await submit({
        amount,
        currency: coin,
        network,
        note:  proofValues.note?.trim() || undefined,
        proof: proofValues.proof,
      });
      setSuccess(true);
      window.setTimeout(() => onClose(), 2500);
    } catch (err) {
      setServerError((err as NormalizedApiError).message || 'Could not submit deposit');
    }
  };

  return (
    <>
      {/* ── Backdrop ── */}
      <div
        className="animate-backdrop-in fixed inset-0 z-40 bg-[var(--overlay)]"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* ── Panel ── */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Deposit Crypto"
        className={cn(
          'fixed z-50 flex flex-col',
          'bg-[var(--bg-elevated)] border border-[var(--border)]',
          isMobile
            /* bottom sheet */
            ? 'inset-x-0 bottom-0 rounded-t-2xl max-h-[92dvh] overflow-y-auto animate-[modal-slide-up_180ms_ease-out]'
            /* centered dialog */
            : 'animate-modal-in top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg rounded-2xl shadow-2xl max-h-[90dvh] overflow-y-auto',
        )}
      >
        {/* Drag handle (mobile only) */}
        {isMobile && (
          <div className="flex justify-center pt-3 pb-1">
            <div className="h-1 w-10 rounded-full bg-[var(--border)]" />
          </div>
        )}

        {/* Header */}
        {!success && (
          <div
            className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4"
          >
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              Deposit Crypto
            </h2>
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              aria-label="Close"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg
                         text-[var(--text-muted)] transition-colors duration-150
                         hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)]
                         disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 px-5 py-5">
          {success ? (
            <SuccessPanel
              headline="Deposit submitted"
              body="Your deposit is pending review. You'll see it credited once an admin approves it."
            />
          ) : (
            <div className="flex flex-col gap-5">
              <Stepper steps={STEPS} activeIndex={activeIndex} />

              {activeIndex === 0 && (
                <DepositStepCoinNetwork
                  coin={coin}
                  network={network}
                  onCoinChange={(c) => { setCoin(c); setNetwork(null); }}
                  onNetworkChange={setNetwork}
                  onNext={() => setActiveIndex(1)}
                />
              )}
              {activeIndex === 1 && coin && network && (
                <DepositStepAddress
                  coin={coin}
                  network={network}
                  onBack={() => setActiveIndex(0)}
                  onNext={() => setActiveIndex(2)}
                />
              )}
              {activeIndex === 2 && coin && network && (
                <DepositStepProof
                  coin={coin}
                  network={network}
                  values={proofValues}
                  onChange={setProofValues}
                  onBack={() => setActiveIndex(1)}
                  onSubmit={handleSubmit}
                  isSubmitting={isSubmitting}
                  serverError={serverError}
                />
              )}
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes modal-slide-up {
          from { transform: translateY(100%); opacity: 0.6; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </>
  );
}

function SuccessPanel({
  headline,
  body,
}: {
  headline: string;
  body:     string;
}): JSX.Element {
  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      <span
        className="inline-flex h-16 w-16 items-center justify-center rounded-full
                   bg-[var(--success-muted)] text-[var(--success)]"
      >
        <CheckCircle2 className="h-8 w-8" />
      </span>
      <div>
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">{headline}</h3>
        <p className="mt-1.5 max-w-sm text-sm text-[var(--text-secondary)]">{body}</p>
      </div>
    </div>
  );
}
