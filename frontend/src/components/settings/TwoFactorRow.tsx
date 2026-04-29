// components/settings/TwoFactorRow.tsx
// ── Reusable "coming soon" row for 2FA methods ──

import { ReactNode } from 'react';
import { Card } from '@/components/ui/Card';

export interface TwoFactorRowProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
}

export function TwoFactorRow({ icon, title, subtitle }: TwoFactorRowProps): JSX.Element {
  return (
    <Card padded={false}>
      <div className="flex items-center justify-between gap-3 px-5 py-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-muted text-text-secondary shrink-0">
            {icon}
          </span>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-text-primary">{title}</div>
            <div className="text-xs text-text-muted truncate">{subtitle}</div>
          </div>
        </div>
        {/* Coming Soon pill — exact spec: bg=warning-muted, color=warning, border=warning, rounded-full px-3 py-1 text-xs semibold */}
        <span className="inline-flex items-center rounded-full border border-warning bg-warning-muted px-3 py-1 text-xs font-semibold text-warning whitespace-nowrap">
          Coming Soon
        </span>
      </div>
    </Card>
  );
}