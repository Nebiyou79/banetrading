// components/dashboard/QuickActions.tsx
// ── Deposit / Withdraw / Trade quick action buttons ──

import { useRouter } from 'next/router';
import { ArrowDownToLine, ArrowUpFromLine, LineChart } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function QuickActions(): JSX.Element {
  const router = useRouter();

  // TODO: /balance → Document 3 (deposit/withdraw module)
  // TODO: /trade   → trading module (separate future document)

  return (
    <div className="rounded-card border border-border bg-elevated p-5 shadow-card flex flex-col gap-3 h-full transition-colors hover:border-accent/40">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-text-muted">Quick actions</div>
          <h3 className="mt-1 text-base font-semibold text-text-primary">Move your funds</h3>
        </div>
      </div>
      <div className="mt-1 flex flex-col gap-2">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          leadingIcon={<ArrowDownToLine className="h-4 w-4" />}
          onClick={() => router.push('/balance?action=deposit')}
        >
          Deposit
        </Button>
        <Button
          variant="secondary"
          size="lg"
          fullWidth
          leadingIcon={<ArrowUpFromLine className="h-4 w-4" />}
          onClick={() => router.push('/balance?action=withdraw')}
        >
          Withdraw
        </Button>
        <Button
          variant="ghost"
          size="lg"
          fullWidth
          leadingIcon={<LineChart className="h-4 w-4 text-accent" />}
          onClick={() => router.push('/trade')}
        >
          Trade
        </Button>
      </div>
    </div>
  );
}