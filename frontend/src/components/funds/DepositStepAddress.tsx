// components/funds/DepositStepAddress.tsx
// ── Step 2: show deposit address + QR — Binance/Bybit standard ──

import { Button }             from '@/components/ui/Button';
import { CoinIcon }           from './CoinIcon';
import { QrCodeBox }          from './QrCodeBox';
import { CopyAddressButton }  from './CopyAddressButton';
import { NetworkWarning }     from './NetworkWarning';
import { CoinNetworkMap }     from '@/types/funds';
import type { Coin, DepositNetwork } from '@/types/funds';
import { useDepositAddresses } from '@/hooks/useDepositAddresses';

export interface DepositStepAddressProps {
  coin:    Coin;
  network: DepositNetwork;
  onBack:  () => void;
  onNext:  () => void;
}

export function DepositStepAddress({
  coin,
  network,
  onBack,
  onNext,
}: DepositStepAddressProps): JSX.Element {
  const { addresses, isLoading } = useDepositAddresses();
  const addressKey = CoinNetworkMap.toAddressKey(coin, network);
  const address    = addresses[addressKey] ?? '';

  return (
    <div className="flex flex-col gap-5">

      {/* Coin + network summary chip */}
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
          Deposit
        </span>
      </div>

      {/* QR code */}
      <div className="flex justify-center py-2">
        <QrCodeBox value={isLoading ? null : address} size={180} />
      </div>

      {/* Address field + copy */}
      <div className="flex flex-col gap-2">
        <label className="text-[11px] font-medium uppercase tracking-widest text-[var(--text-muted)]">
          Deposit address
        </label>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
          {/* Address box */}
          <div
            className="flex-1 break-all rounded-xl border border-[var(--border)]
                       bg-[var(--bg-muted)] px-3 py-2.5 min-h-[44px]
                       font-mono text-xs text-[var(--text-primary)] leading-relaxed"
          >
            {isLoading ? (
              <span className="text-[var(--text-muted)]">Loading address…</span>
            ) : address ? (
              address
            ) : (
              <span className="text-[var(--text-muted)]">
                Not configured — contact support.
              </span>
            )}
          </div>

          <CopyAddressButton value={address} size="md" label="Copy address" />
        </div>
      </div>

      {/* Network risk warning */}
      <NetworkWarning coin={coin} network={network} />

      {/* Navigation */}
      <div className="flex items-center justify-between gap-2 pt-2">
        <Button variant="ghost" size="lg" onClick={onBack}>
          Back
        </Button>
        <Button
          variant="primary"
          size="lg"
          onClick={onNext}
          disabled={!address || isLoading}
        >
          I`ve sent the funds
        </Button>
      </div>
    </div>
  );
}
