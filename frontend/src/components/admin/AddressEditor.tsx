// components/admin/AddressEditor.tsx
// ── Per-network deposit address editor card ──

import { useEffect, useState } from 'react';
import { Pencil, X, Save, Trash2 } from 'lucide-react';
import { Pill } from '@/components/ui/Pill';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { toast } from '@/components/ui/Toast';
import { cn } from '@/lib/cn';
import { CoinNetworkMap } from '@/types/funds';
import type { WithdrawNetwork } from '@/types/funds';
import { useDepositAddresses } from '@/hooks/useDepositAddresses';
import type { NormalizedApiError } from '@/services/apiClient';

export interface AddressEditorProps {
  network: WithdrawNetwork;
}

export function AddressEditor({ network }: AddressEditorProps): JSX.Element {
  const { addresses, update, isUpdating, isLoading } = useDepositAddresses();
  const stored = addresses[network] || '';
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(stored);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!editing) setDraft(stored);
  }, [editing, stored]);

  const startEdit = (): void => { setDraft(stored); setEditing(true); };
  const cancel = (): void => { setEditing(false); setDraft(stored); };

  const save = async (): Promise<void> => {
    const next = draft.trim();
    if (next === stored.trim()) { setEditing(false); return; }
    try {
      await update({ [network]: next } as Partial<typeof addresses>);
      toast.success(`${CoinNetworkMap.label(network)} address updated`);
      setEditing(false);
    } catch (err) {
      const e2 = err as NormalizedApiError;
      toast.error(e2.message || 'Could not save address');
    }
  };

  const clearAddress = async (): Promise<void> => {
    try {
      await update({ [network]: '' } as Partial<typeof addresses>);
      toast.success(`${CoinNetworkMap.label(network)} address cleared`);
      setEditing(false);
    } catch (err) {
      const e2 = err as NormalizedApiError;
      toast.error(e2.message || 'Could not clear address');
    }
  };

  return (
    <div className="rounded-card border border-border bg-elevated p-4 sm:p-5 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Pill tone="info" size="sm">{network}</Pill>
          {isLoading && <Spinner size="sm" />}
        </div>
        {!editing && (
          <Button variant="secondary" size="sm" leadingIcon={<Pencil className="h-3.5 w-3.5" />} onClick={startEdit} disabled={isUpdating}>
            Edit
          </Button>
        )}
      </div>

      <div className="mt-3">
        {editing ? (
          <div className="flex flex-col gap-2">
            <input
              type="text"
              spellCheck={false}
              autoComplete="off"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Paste deposit address"
              className={cn(
                'h-11 w-full rounded-input border border-border bg-muted px-3 font-mono text-xs text-text-primary',
                'placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors',
              )}
            />
            <div className="flex items-center justify-between gap-2">
              {stored ? (
                <Button variant="ghost" size="sm" leadingIcon={<Trash2 className="h-3.5 w-3.5" />} onClick={clearAddress} loading={isUpdating}>
                  Clear
                </Button>
              ) : <span />}
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" leadingIcon={<X className="h-3.5 w-3.5" />} onClick={cancel} disabled={isUpdating}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" leadingIcon={<Save className="h-3.5 w-3.5" />} onClick={save} loading={isUpdating}>
                  Save
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="break-all rounded-input border border-border bg-muted px-3 py-2.5 font-mono text-xs text-text-primary min-h-[44px]">
            {stored ? stored : <span className="text-text-muted">Not set</span>}
          </div>
        )}
      </div>
    </div>
  );
}