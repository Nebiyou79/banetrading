// components/admin/NetworkFeeEditor.tsx
// ── Per-network fee editor card ──

import { useEffect, useState } from 'react';
import { Pencil, X, Save } from 'lucide-react';
import { Pill } from '@/components/ui/Pill';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { toast } from '@/components/ui/Toast';
import { cn } from '@/lib/cn';
import { useNetworkFees } from '@/hooks/useNetworkFees';
import type { WithdrawNetwork } from '@/types/funds';
import type { NormalizedApiError } from '@/services/apiClient';

export interface NetworkFeeEditorProps {
  network: WithdrawNetwork;
}

function coinUnitFor(network: WithdrawNetwork): string {
  if (network === 'BTC') return 'BTC';
  if (network === 'ETH') return 'ETH';
  return 'USDT';
}

export function NetworkFeeEditor({ network }: NetworkFeeEditorProps): JSX.Element {
  const { fees, update, isUpdating, isLoading } = useNetworkFees();
  const stored = fees[network];
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string>(stored !== null ? String(stored) : '');

  useEffect(() => {
    if (!editing) setDraft(stored !== null ? String(stored) : '');
  }, [editing, stored]);

  const setSafe = (raw: string): void => {
    const cleaned = raw.replace(/[^0-9.]/g, '');
    const dotIdx = cleaned.indexOf('.');
    const normalized = dotIdx >= 0
      ? cleaned.slice(0, dotIdx + 1) + cleaned.slice(dotIdx + 1).replace(/\./g, '')
      : cleaned;
    setDraft(normalized);
  };

  const save = async (): Promise<void> => {
    const num = Number(draft);
    if (!Number.isFinite(num) || num < 0) {
      toast.error('Fee must be a non-negative number');
      return;
    }
    try {
      await update(network, num);
      toast.success(`${network} fee updated`);
      setEditing(false);
    } catch (err) {
      const e2 = err as NormalizedApiError;
      toast.error(e2.message || 'Could not save fee');
    }
  };

  const cancel = (): void => {
    setDraft(stored !== null ? String(stored) : '');
    setEditing(false);
  };

  const unit = coinUnitFor(network);

  return (
    <div className="rounded-card border border-border bg-elevated p-4 sm:p-5 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Pill tone="info" size="sm">{network}</Pill>
          {isLoading && <Spinner size="sm" />}
        </div>
        {!editing && (
          <Button variant="secondary" size="sm" leadingIcon={<Pencil className="h-3.5 w-3.5" />} onClick={() => setEditing(true)} disabled={isUpdating}>
            Edit
          </Button>
        )}
      </div>

      <div className="mt-3">
        {editing ? (
          <div className="flex flex-col gap-2">
            <div className="relative flex items-center rounded-input border border-border bg-muted focus-within:border-accent transition-colors">
              <input
                type="text"
                inputMode="decimal"
                value={draft}
                onChange={(e) => setSafe(e.target.value)}
                placeholder="0.00"
                className={cn(
                  'h-11 w-full bg-transparent px-3 text-sm tabular-nums text-text-primary',
                  'placeholder:text-text-muted focus:outline-none',
                )}
              />
              <span className="px-3 text-xs font-medium text-text-muted">{unit}</span>
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost" size="sm" leadingIcon={<X className="h-3.5 w-3.5" />} onClick={cancel} disabled={isUpdating}>Cancel</Button>
              <Button variant="primary" size="sm" leadingIcon={<Save className="h-3.5 w-3.5" />} onClick={save} loading={isUpdating}>Save</Button>
            </div>
          </div>
        ) : (
          <div className="flex items-baseline justify-between rounded-input border border-border bg-muted px-3 py-2.5 min-h-[44px]">
            <span className="text-[11px] uppercase tracking-wider text-text-muted">Current fee</span>
            <span className="text-sm font-semibold tabular-nums text-text-primary">
              {stored === null ? <span className="text-text-muted font-normal">Not set</span> : `${stored} ${unit}`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}