// pages/notifications.tsx
// ── Notifications — 5 hardcoded example items ──

import Head from 'next/head';
import { Bell, ShieldCheck, ArrowDownToLine, ArrowUpFromLine, Megaphone, BadgeCheck } from 'lucide-react';
import { AuthenticatedShell } from '@/components/layout/AuthenticatedShell';
import { withAuth } from '@/components/layout/withAuth';
import { Card } from '@/components/ui/Card';
import { formatRelativeTime } from '@/lib/format';

const BRAND = process.env.NEXT_PUBLIC_BRAND_NAME || 'PrimeBitTrade';

interface Notification {
  id: string;
  icon: JSX.Element;
  iconBg: string;
  title: string;
  body: string;
  timestamp: string;
}

function makeIso(daysAgo: number, hoursAgo = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(d.getHours() - hoursAgo);
  return d.toISOString();
}

const NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    icon: <BadgeCheck className="h-4 w-4" />,
    iconBg: 'bg-success-muted text-success',
    title: 'Identity verified',
    body: 'Your Level 2 verification has been approved. You now have higher deposit and withdrawal limits.',
    timestamp: makeIso(0, 2),
  },
  {
    id: 'n2',
    icon: <ArrowDownToLine className="h-4 w-4" />,
    iconBg: 'bg-info-muted text-info',
    title: 'Deposit received',
    body: 'Your deposit of 250.00 USDT has been credited to your account.',
    timestamp: makeIso(1, 4),
  },
  {
    id: 'n3',
    icon: <ShieldCheck className="h-4 w-4" />,
    iconBg: 'bg-accent-muted text-accent',
    title: 'New login from Chrome',
    body: 'A new sign-in to your account was detected. If this wasn\u2019t you, change your password immediately.',
    timestamp: makeIso(2, 0),
  },
  {
    id: 'n4',
    icon: <ArrowUpFromLine className="h-4 w-4" />,
    iconBg: 'bg-warning-muted text-warning',
    title: 'Withdrawal pending review',
    body: 'Your withdrawal of 120.00 USDT to TRC20 is in review. Expected within 1\u20133 business hours.',
    timestamp: makeIso(3, 0),
  },
  {
    id: 'n5',
    icon: <Megaphone className="h-4 w-4" />,
    iconBg: 'bg-muted text-text-secondary',
    title: 'Welcome to ' + BRAND,
    body: 'Thanks for joining. Take a moment to verify your identity to unlock the full platform.',
    timestamp: makeIso(7, 0),
  },
];

function NotificationsPage(): JSX.Element {
  const empty = NOTIFICATIONS.length === 0;

  return (
    <>
      <Head><title>Notifications · {BRAND}</title></Head>
      <AuthenticatedShell>
        <div className="flex flex-col gap-6">
          <header className="flex flex-col gap-1.5">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-text-primary">
              Notifications
            </h1>
            <p className="text-sm text-text-secondary">Account events and platform updates.</p>
          </header>

          {empty ? (
            <Card>
              <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                <span className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-dashed border-border bg-muted/60 text-text-muted">
                  <Bell className="h-5 w-5" />
                </span>
                <h2 className="text-base font-semibold text-text-primary">No notifications yet</h2>
                <p className="max-w-sm text-xs text-text-muted">
                  Account events and platform updates will appear here.
                </p>
              </div>
            </Card>
          ) : (
            <Card padded={false}>
              <ul className="divide-y divide-border">
                {NOTIFICATIONS.map((n) => (
                  <li key={n.id} className="flex items-start gap-3 px-5 py-4">
                    <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${n.iconBg}`}>
                      {n.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="text-sm font-semibold text-text-primary">{n.title}</div>
                        <span className="text-[11px] text-text-muted whitespace-nowrap" title={n.timestamp}>
                          {formatRelativeTime(n.timestamp)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-text-secondary leading-relaxed">{n.body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </AuthenticatedShell>
    </>
  );
}

export default withAuth(NotificationsPage);