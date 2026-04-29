// components/funds/NetworkWarning.tsx
// ── Network safety alerts — Binance/Bybit standard ──

import { AlertTriangle, ShieldAlert } from 'lucide-react';
import { CoinNetworkMap }             from '@/types/funds';
import { cn }                         from '@/lib/cn';
import type { Coin, DepositNetwork, WithdrawNetwork } from '@/types/funds';

// ── Wrong-network loss warning (deposit address step) ─────────────────────────

export interface NetworkWarningProps {
  coin:    Coin;
  network: DepositNetwork | WithdrawNetwork;
  className?: string;
}

export function NetworkWarning({
  coin,
  network,
  className,
}: NetworkWarningProps): JSX.Element {
  const networkLabel = CoinNetworkMap.label(network);

  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-3 rounded-xl',
        'border border-[var(--warning)] bg-[var(--warning-muted)]',
        'px-4 py-3',
        className,
      )}
    >
      <AlertTriangle
        className="mt-0.5 h-4 w-4 shrink-0 text-[var(--warning)]"
        aria-hidden="true"
      />
      <div className="text-xs leading-relaxed text-[var(--warning)]">
        <span className="font-semibold">
          Send only {coin} on the {networkLabel} network.
        </span>{' '}
        Sending other assets or using the wrong network will result in{' '}
        <span className="font-semibold">permanent loss of funds.</span>
      </div>
    </div>
  );
}

// ── Irreversible withdrawal warning ───────────────────────────────────────────

export interface IrreversibleWarningProps {
  className?: string;
}

export function IrreversibleWarning({
  className,
}: IrreversibleWarningProps): JSX.Element {
  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-3 rounded-xl',
        'border border-[var(--danger)] bg-[var(--danger-muted)]',
        'px-4 py-3',
        className,
      )}
    >
      <ShieldAlert
        className="mt-0.5 h-4 w-4 shrink-0 text-[var(--danger)]"
        aria-hidden="true"
      />
      <div className="text-xs leading-relaxed text-[var(--danger)]">
        <span className="font-semibold">Withdrawals are irreversible.</span>{' '}
        Verify the destination address carefully — sending to the wrong
        address means{' '}
        <span className="font-semibold">permanent loss of funds.</span>
      </div>
    </div>
  );
}
