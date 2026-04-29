// components/funds/DepositModal.tsx
// ── Three-step deposit wizard — Binance/Bybit standard ──
// Mobile  → bottom sheet (rounded-t-2xl, slides up from bottom)
// Desktop → centered dialog (fixed inset-0 flex items-center justify-center)

import { useEffect, useReducer, useState } from 'react';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';
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
  { id: 'address', label: 'Address'        },
  { id: 'proof',   label: 'Upload proof'   },
];

const EMPTY_PROOF: DepositStepProofValues = { amount: '', note: '', proof: null };

interface DepositState {
  activeIndex: number;
  coin: Coin | null;
  network: DepositNetwork | null;
  proofValues: DepositStepProofValues;
  serverError: string | null;
  success: boolean;
}

type DepositAction =
  | { type: 'SET_ACTIVE_INDEX'; payload: number }
  | { type: 'SET_COIN'; payload: Coin | null }
  | { type: 'SET_NETWORK'; payload: DepositNetwork | null }
  | { type: 'SET_PROOF_VALUES'; payload: DepositStepProofValues }
  | { type: 'SET_SERVER_ERROR'; payload: string | null }
  | { type: 'SET_SUCCESS'; payload: boolean }
  | { type: 'RESET'; payload: Coin | null };

function depositReducer(state: DepositState, action: DepositAction): DepositState {
  switch (action.type) {
    case 'SET_ACTIVE_INDEX':
      return { ...state, activeIndex: action.payload };
    case 'SET_COIN':
      return { ...state, coin: action.payload };
    case 'SET_NETWORK':
      return { ...state, network: action.payload };
    case 'SET_PROOF_VALUES':
      return { ...state, proofValues: action.payload };
    case 'SET_SERVER_ERROR':
      return { ...state, serverError: action.payload };
    case 'SET_SUCCESS':
      return { ...state, success: action.payload };
    case 'RESET':
      return {
        activeIndex: 0,
        coin: action.payload,
        network: null,
        proofValues: EMPTY_PROOF,
        serverError: null,
        success: false,
      };
    default:
      return state;
  }
}

export function DepositModal({
  open,
  onClose,
  initialCoin = null,
}: DepositModalProps): JSX.Element | null {
  const { isMobile }               = useResponsive();
  const { submit, isSubmitting }   = useDeposit();

  const [state, dispatch] = useReducer(depositReducer, {
    activeIndex: 0,
    coin: initialCoin,
    network: null,
    proofValues: EMPTY_PROOF,
    serverError: null,
    success: false,
  });

  /* Reset on (re)open */
  useEffect(() => {
    if (open) {
      dispatch({ type: 'RESET', payload: initialCoin });
    }
  }, [open, initialCoin]);

  /* Lock body scroll when open */
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open) return null;

  const handleClose = (): void => { if (!isSubmitting) onClose(); };

  const handleSubmit = async (): Promise<void> => {
    dispatch({ type: 'SET_SERVER_ERROR', payload: null });
    if (!state.coin || !state.network) { dispatch({ type: 'SET_SERVER_ERROR', payload: 'Please complete all steps.' }); return; }
    const amount = Number(state.proofValues.amount);
    if (!Number.isFinite(amount) || amount <= 0) { dispatch({ type: 'SET_SERVER_ERROR', payload: 'Enter a valid amount.' }); return; }
    if (!state.proofValues.proof) { dispatch({ type: 'SET_SERVER_ERROR', payload: 'Please attach payment proof.' }); return; }
    try {
      await submit({
        amount,
        currency: state.coin,
        network: state.network,
        note:  state.proofValues.note?.trim() || undefined,
        proof: state.proofValues.proof,
      });
      dispatch({ type: 'SET_SUCCESS', payload: true });
      window.setTimeout(() => onClose(), 2500);
    } catch (err) {
      dispatch({ type: 'SET_SERVER_ERROR', payload: (err as NormalizedApiError).message || 'Could not submit deposit' });
    }
  };

  return (
    <>
      {/* ── Keyframe ── */}
      <style>{`
        @keyframes deposit-slide-up {
          from { transform: translateY(100%); opacity: 0.7; }
          to   { transform: translateY(0);    opacity: 1;   }
        }
        @keyframes deposit-fade-scale {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);   }
        }
      `}</style>

      {/* ── Backdrop ── */}
      <div
        className="fixed inset-0 z-40"
        style={{
          background: 'var(--overlay)',
          animation: 'deposit-fade-scale 180ms ease-out',
          animationName: 'none',
          opacity: 1,
        }}
        onClick={handleClose}
        aria-hidden="true"
      />

      {isMobile ? (
        /* ── MOBILE: bottom sheet ── */
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Deposit Crypto"
          className="fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-2xl border-t border-[var(--border)] overflow-hidden"
          style={{
            background: 'var(--bg-elevated)',
            maxHeight: '92dvh',
            animation: 'deposit-slide-up 220ms cubic-bezier(0.32,0.72,0,1)',
            boxShadow: '0 -8px 40px rgba(0,0,0,0.3)',
          }}
        >
          {/* Drag handle */}
          <div className="flex shrink-0 justify-center pt-3 pb-1">
            <div className="h-1 w-10 rounded-full bg-[var(--border)]" />
          </div>
          <ModalContent
            success={state.success}
            activeIndex={state.activeIndex}
            coin={state.coin}
            network={state.network}
            proofValues={state.proofValues}
            serverError={state.serverError}
            isSubmitting={isSubmitting}
            onClose={handleClose}
            dispatch={dispatch}
            onSubmit={handleSubmit}
          />
        </div>
      ) : (
        /* ── DESKTOP: centered dialog ── */
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={handleClose}
          aria-hidden="true"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Deposit Crypto"
            className="relative flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[var(--border)]"
            style={{
              background: 'var(--bg-elevated)',
              maxHeight: '90dvh',
              animation: 'deposit-fade-scale 180ms ease-out',
              boxShadow: '0 24px 80px rgba(0,0,0,0.4), 0 0 0 1px var(--border)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <ModalContent
              success={state.success}
              activeIndex={state.activeIndex}
              coin={state.coin}
              network={state.network}
              proofValues={state.proofValues}
              serverError={state.serverError}
              isSubmitting={isSubmitting}
              onClose={handleClose}
              dispatch={dispatch}
              onSubmit={handleSubmit}
            />
          </div>
        </div>
      )}
    </>
  );
}

// ── Shared modal content ──
interface ModalContentProps {
  success:       boolean;
  activeIndex:   number;
  coin:          Coin | null;
  network:       DepositNetwork | null;
  proofValues:   DepositStepProofValues;
  serverError:   string | null;
  isSubmitting:  boolean;
  onClose:       () => void;
  dispatch:      React.Dispatch<DepositAction>;
  onSubmit:      () => Promise<void>;
}

function ModalContent({
  success, activeIndex, coin, network,
  proofValues, serverError, isSubmitting,
  onClose, dispatch, onSubmit,
}: ModalContentProps): JSX.Element {
  if (success) {
    return (
      <div className="flex flex-col items-center gap-5 px-6 py-12 text-center">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{ background: 'var(--success-muted)' }}
        >
          <CheckCircle2 className="h-8 w-8" style={{ color: 'var(--success)' }} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-[var(--text-primary)]">Deposit submitted</h3>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-[var(--text-secondary)]">
            Your deposit is pending admin review. You`ll see it credited to your balance once approved.
          </p>
        </div>
        <div
          className="flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs"
          style={{ borderColor: 'var(--success)', background: 'var(--success-muted)', color: 'var(--success)' }}
        >
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
          Closing automatically…
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div
        className="flex shrink-0 items-center justify-between border-b border-[var(--border)] px-5 py-4"
        style={{ background: 'var(--bg-elevated)' }}
      >
        <div>
          <h2 className="text-base font-bold text-[var(--text-primary)]">Deposit Crypto</h2>
          <p className="text-[11px] text-[var(--text-muted)]">
            Step {activeIndex + 1} of {3} — {['Coin & Network', 'Deposit Address', 'Upload Proof'][activeIndex]}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          aria-label="Close"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-150 hover:bg-[var(--hover-bg)] disabled:opacity-40"
          style={{ color: 'var(--text-muted)' }}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-5 py-5">
        <div className="flex flex-col gap-5">
          <Stepper steps={STEPS} activeIndex={activeIndex} />

          {activeIndex === 0 && (
            <DepositStepCoinNetwork
              coin={coin}
              network={network}
              onCoinChange={(c) => { dispatch({ type: 'SET_COIN', payload: c }); dispatch({ type: 'SET_NETWORK', payload: null }); }}
              onNetworkChange={(n) => dispatch({ type: 'SET_NETWORK', payload: n })}
              onNext={() => dispatch({ type: 'SET_ACTIVE_INDEX', payload: 1 })}
            />
          )}
          {activeIndex === 1 && coin && network && (
            <DepositStepAddress
              coin={coin}
              network={network}
              onBack={() => dispatch({ type: 'SET_ACTIVE_INDEX', payload: 0 })}
              onNext={() => dispatch({ type: 'SET_ACTIVE_INDEX', payload: 2 })}
            />
          )}
          {activeIndex === 2 && coin && network && (
            <DepositStepProof
              coin={coin}
              network={network}
              values={proofValues}
              onChange={(v) => dispatch({ type: 'SET_PROOF_VALUES', payload: v })}
              onBack={() => dispatch({ type: 'SET_ACTIVE_INDEX', payload: 1 })}
              onSubmit={onSubmit}
              isSubmitting={isSubmitting}
              serverError={serverError}
            />
          )}

          {/* Catch-all server error (steps 0/1 edge case) */}
          {serverError && activeIndex < 2 && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-xl border px-4 py-3 text-xs"
              style={{ borderColor: 'var(--danger)', background: 'var(--danger-muted)', color: 'var(--danger)' }}
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              {serverError}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
