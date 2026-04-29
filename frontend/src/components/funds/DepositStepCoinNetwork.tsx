// components/funds/DepositStepCoinNetwork.tsx
// ── Step 1: pick coin + network — Binance/Bybit standard ──

import { useEffect }   from 'react';
import { Check }       from 'lucide-react';
import { Button }      from '@/components/ui/Button';
import { CoinIcon }    from './CoinIcon';
import { cn }          from '@/lib/cn';
import {
  COINS,
  CoinNetworkMap,
  DEPOSIT_NETWORKS_FOR_COIN,
} from '@/types/funds';
import type { Coin, DepositNetwork } from '@/types/funds';

export interface DepositStepCoinNetworkProps {
  coin:            Coin | null;
  network:         DepositNetwork | null;
  onCoinChange:    (coin: Coin) => void;
  onNetworkChange: (network: DepositNetwork) => void;
  onNext:          () => void;
}

export function DepositStepCoinNetwork({
  coin,
  network,
  onCoinChange,
  onNetworkChange,
  onNext,
}: DepositStepCoinNetworkProps): JSX.Element {
  const allowedNetworks = coin ? DEPOSIT_NETWORKS_FOR_COIN[coin] : [];

  /* Auto-select the only network for BTC/ETH */
  useEffect(() => {
    if (!coin) return;
    if (allowedNetworks.length === 1 && allowedNetworks[0] !== network) {
      onNetworkChange(allowedNetworks[0]);
    }
    if (network && !allowedNetworks.includes(network)) {
      onNetworkChange(allowedNetworks[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coin]);

  const ready = !!coin && !!network;

  return (
    <div className="flex flex-col gap-6">

      {/* ── Coin selector ── */}
      <section>
        <h3 className="mb-3 text-[11px] font-medium uppercase tracking-widest text-[var(--text-muted)]">
          Select coin
        </h3>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {COINS.map((c) => {
            const selected = coin === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => onCoinChange(c)}
                aria-pressed={selected}
                className={cn(
                  'group relative flex flex-col items-center gap-2.5 rounded-xl border',
                  'px-3 py-4 text-center transition-all duration-150',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]',
                  selected
                    ? [
                        'border-[var(--accent)] bg-[var(--accent-muted)]',
                        'shadow-[0_0_0_1px_var(--accent)]',
                      ]
                    : [
                        'border-[var(--border)] bg-[var(--bg-muted)]',
                        'hover:border-[var(--border-strong)] hover:bg-[var(--hover-bg)]',
                      ],
                )}
              >
                <CoinIcon coin={c} size="lg" />
                <span
                  className={cn(
                    'text-sm font-semibold transition-colors',
                    selected ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]',
                  )}
                >
                  {c}
                </span>

                {/* Selected check */}
                {selected && (
                  <span
                    className="absolute right-2 top-2 inline-flex h-5 w-5 items-center justify-center
                               rounded-full bg-[var(--accent)] text-[var(--text-inverse)]"
                    aria-hidden="true"
                  >
                    <Check className="h-3 w-3" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Network selector (animates in when coin chosen) ── */}
      {coin && (
        <section
          style={{
            animation: 'deposit-step-fade 180ms ease-out',
          }}
        >
          <h3 className="mb-3 text-[11px] font-medium uppercase tracking-widest text-[var(--text-muted)]">
            Select network
          </h3>
          <div
            className="grid gap-2"
            style={{
              gridTemplateColumns: `repeat(${Math.max(allowedNetworks.length, 1)}, minmax(0, 1fr))`,
            }}
          >
            {allowedNetworks.map((n) => {
              const selected    = network === n;
              const networkLabel = CoinNetworkMap.label(n);

              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => onNetworkChange(n)}
                  aria-pressed={selected}
                  className={cn(
                    'flex flex-col items-center gap-0.5 rounded-xl border px-3 py-3',
                    'text-sm font-medium transition-all duration-150',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]',
                    selected
                      ? [
                          'border-[var(--accent)] bg-[var(--accent-muted)]',
                          'text-[var(--text-primary)]',
                          'shadow-[0_0_0_1px_var(--accent)]',
                        ]
                      : [
                          'border-[var(--border)] bg-[var(--bg-muted)]',
                          'text-[var(--text-secondary)]',
                          'hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]',
                        ],
                  )}
                >
                  <span>{networkLabel}</span>
                  {coin === 'USDT' && (
                    <span className="text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
                      {n} network
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* ── CTA ── */}
      <div className="flex items-center justify-end pt-2">
        <Button variant="primary" size="lg" onClick={onNext} disabled={!ready}>
          Continue
        </Button>
      </div>

      <style jsx>{`
        @keyframes deposit-step-fade {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
      `}</style>
    </div>
  );
}
