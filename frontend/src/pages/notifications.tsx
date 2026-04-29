// pages/notifications.tsx
// ── BaneTrading — Notifications page (Binance/Bybit standard) ──

import Head from 'next/head';
import { useState } from 'react';
import {
  Bell, ShieldCheck, ArrowDownToLine, ArrowUpFromLine,
  Megaphone, BadgeCheck, CheckCheck, Trash2, Filter,
  X, Info,
} from 'lucide-react';
import { AuthenticatedShell } from '@/components/layout/AuthenticatedShell';
import { withAuth }           from '@/components/layout/withAuth';
import { formatRelativeTime } from '@/lib/format';
import { useResponsive }      from '@/hooks/useResponsive';

const BRAND = 'BaneTrading';

// ── Notification type ──
type NotifCategory = 'all' | 'security' | 'transactions' | 'system';

interface Notification {
  id:        string;
  icon:      JSX.Element;
  tone:      'success' | 'info' | 'accent' | 'warning' | 'danger' | 'neutral';
  category:  Exclude<NotifCategory, 'all'>;
  title:     string;
  body:      string;
  timestamp: string;
  read:      boolean;
}

function makeIso(daysAgo: number, hoursAgo = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(d.getHours() - hoursAgo);
  return d.toISOString();
}

const TONE_STYLES: Record<string, { bg: string; color: string }> = {
  success: { bg: 'var(--success-muted)', color: 'var(--success)' },
  info:    { bg: 'var(--info-muted)',    color: 'var(--info)'    },
  accent:  { bg: 'var(--accent-muted)',  color: 'var(--accent)'  },
  warning: { bg: 'var(--warning-muted)', color: 'var(--warning)' },
  danger:  { bg: 'var(--danger-muted)',  color: 'var(--danger)'  },
  neutral: { bg: 'var(--bg-elevated)',   color: 'var(--text-muted)' },
};

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    icon: <BadgeCheck className="h-4 w-4" />,
    tone: 'success',
    category: 'security',
    title: 'Identity verified',
    body: 'Your Level 2 verification has been approved. You now have access to higher deposit and withdrawal limits.',
    timestamp: makeIso(0, 2),
    read: false,
  },
  {
    id: 'n2',
    icon: <ArrowDownToLine className="h-4 w-4" />,
    tone: 'info',
    category: 'transactions',
    title: 'Deposit received',
    body: 'Your deposit of 250.00 USDT has been credited to your account and is available for trading.',
    timestamp: makeIso(1, 4),
    read: false,
  },
  {
    id: 'n3',
    icon: <ShieldCheck className="h-4 w-4" />,
    tone: 'accent',
    category: 'security',
    title: 'New login from Chrome · Amsterdam',
    body: "A new sign-in to your account was detected. If this wasn't you, change your password immediately.",
    timestamp: makeIso(2, 0),
    read: true,
  },
  {
    id: 'n4',
    icon: <ArrowUpFromLine className="h-4 w-4" />,
    tone: 'warning',
    category: 'transactions',
    title: 'Withdrawal pending review',
    body: 'Your withdrawal of 120.00 USDT to a TRC20 address is under review. Expected within 1–3 business hours.',
    timestamp: makeIso(3, 0),
    read: true,
  },
  {
    id: 'n5',
    icon: <Megaphone className="h-4 w-4" />,
    tone: 'neutral',
    category: 'system',
    title: `Welcome to ${BRAND}`,
    body: 'Thanks for joining. Complete KYC verification to unlock the full platform and higher limits.',
    timestamp: makeIso(7, 0),
    read: true,
  },
];

const CATEGORIES: { id: NotifCategory; label: string }[] = [
  { id: 'all',          label: 'All' },
  { id: 'security',     label: 'Security' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'system',       label: 'Platform' },
];

// ── Notification row ──
function NotifRow({
  notif,
  onRead,
  onDelete,
}: {
  notif:    Notification;
  onRead:   (id: string) => void;
  onDelete: (id: string) => void;
}): JSX.Element {
  const ts = TONE_STYLES[notif.tone];

  return (
    <li
      className="group relative flex items-start gap-4 px-5 py-4 transition-colors duration-150 hover:bg-[var(--hover-bg)]"
      style={{ background: notif.read ? 'transparent' : 'var(--accent-muted)' }}
    >
      {/* Unread dot */}
      {!notif.read && (
        <span
          className="absolute left-2 top-5 h-1.5 w-1.5 rounded-full"
          style={{ background: 'var(--accent)' }}
        />
      )}

      {/* Icon badge */}
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        style={{ background: ts.bg, color: ts.color }}
      >
        {notif.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <p className={`text-sm leading-snug ${notif.read ? 'font-medium text-[var(--text-primary)]' : 'font-bold text-[var(--text-primary)]'}`}>
            {notif.title}
          </p>
          <span
            className="shrink-0 text-[11px] text-[var(--text-muted)]"
            title={notif.timestamp}
          >
            {formatRelativeTime(notif.timestamp)}
          </span>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">{notif.body}</p>

        {/* Category tag */}
        <span
          className="mt-2 inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider capitalize"
          style={{ background: ts.bg, color: ts.color }}
        >
          {notif.category}
        </span>
      </div>

      {/* Action buttons — show on hover */}
      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
        {!notif.read && (
          <button
            type="button"
            onClick={() => onRead(notif.id)}
            className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors duration-150 hover:bg-[var(--bg-card-hover)]"
            style={{ color: 'var(--text-muted)' }}
            title="Mark as read"
          >
            <CheckCheck className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          type="button"
          onClick={() => onDelete(notif.id)}
          className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors duration-150 hover:bg-[var(--danger-muted)]"
          style={{ color: 'var(--text-muted)' }}
          title="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </li>
  );
}

// ── Empty state ──
function EmptyState({ filtered }: { filtered: boolean }): JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <div
        className="flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{ background: 'var(--bg-elevated)' }}
      >
        <Bell className="h-7 w-7" style={{ color: 'var(--text-muted)' }} />
      </div>
      <div>
        <p className="text-sm font-semibold text-[var(--text-primary)]">
          {filtered ? 'No notifications in this category' : 'No notifications yet'}
        </p>
        <p className="mt-1 max-w-xs text-xs text-[var(--text-secondary)]">
          {filtered
            ? 'Try switching to a different filter or check back later.'
            : 'Account events, transactions, and platform updates will appear here.'}
        </p>
      </div>
    </div>
  );
}

function NotificationsPage(): JSX.Element {
  const { isMobile } = useResponsive();
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);
  const [activeCategory, setActiveCategory] = useState<NotifCategory>('all');

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filtered = activeCategory === 'all'
    ? notifications
    : notifications.filter((n) => n.category === activeCategory);

  const handleRead = (id: string): void => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  };

  const handleDelete = (id: string): void => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleMarkAllRead = (): void => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleClearAll = (): void => {
    setNotifications([]);
  };

  return (
    <>
      <Head>
        <title>Notifications · {BRAND}</title>
        <meta name="description" content="Your BaneTrading account notifications — security, transactions, and platform updates." />
      </Head>

      <AuthenticatedShell>
        <div className="flex flex-col gap-5">

          {/* ── Page header ── */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                Account
              </p>
              <h1 className="mt-0.5 text-2xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-3xl">
                Notifications
                {unreadCount > 0 && (
                  <span
                    className="ml-2.5 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold"
                    style={{ background: 'var(--accent)', color: 'var(--text-inverse)' }}
                  >
                    {unreadCount}
                  </span>
                )}
              </h1>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Account events, security alerts, and platform updates.
              </p>
            </div>

            {/* Bulk actions */}
            {notifications.length > 0 && (
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-muted)] px-3 py-2 text-xs font-medium text-[var(--text-secondary)] transition-all duration-150 hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    Mark all read
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all duration-150 hover:opacity-80"
                  style={{ borderColor: 'var(--danger)', background: 'var(--danger-muted)', color: 'var(--danger)' }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* ── Main content card ── */}
          <div
            className="overflow-hidden rounded-2xl border border-[var(--border)]"
            style={{ background: 'var(--bg-muted)' }}
          >
            {/* Category filter tab bar */}
            <div
              className="flex items-center gap-0 overflow-x-auto border-b border-[var(--border)] scrollbar-none"
              style={{ background: 'var(--bg-elevated)' }}
            >
              {CATEGORIES.map((cat) => {
                const isActive = activeCategory === cat.id;
                const catCount = cat.id === 'all'
                  ? notifications.length
                  : notifications.filter((n) => n.category === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    className="relative inline-flex shrink-0 items-center gap-2 px-4 py-3.5 text-sm font-semibold transition-all duration-150"
                    style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                  >
                    {/* Active bar */}
                    {isActive && (
                      <span
                        className="absolute bottom-0 left-3 right-3 h-0.5 rounded-t-full"
                        style={{ background: 'var(--accent)' }}
                      />
                    )}
                    {cat.label}
                    {catCount > 0 && (
                      <span
                        className="rounded-full px-1.5 py-0.5 text-[9px] font-bold leading-none"
                        style={{
                          background: isActive ? 'var(--accent)' : 'var(--bg-card-hover)',
                          color:      isActive ? 'var(--text-inverse)' : 'var(--text-muted)',
                        }}
                      >
                        {catCount}
                      </span>
                    )}
                  </button>
                );
              })}

              {/* Spacer + filter icon */}
              <div className="flex-1" />
              <div className="flex items-center px-4">
                <Filter className="h-3.5 w-3.5" style={{ color: 'var(--text-muted)' }} />
              </div>
            </div>

            {/* Notification list or empty state */}
            {filtered.length === 0 ? (
              <EmptyState filtered={activeCategory !== 'all'} />
            ) : (
              <ul className="divide-y divide-[var(--border-subtle)]">
                {filtered.map((n) => (
                  <NotifRow
                    key={n.id}
                    notif={n}
                    onRead={handleRead}
                    onDelete={handleDelete}
                  />
                ))}
              </ul>
            )}

            {/* Footer info strip */}
            {filtered.length > 0 && (
              <div
                className="flex items-center gap-2 border-t border-[var(--border)] px-5 py-3 text-[11px]"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
              >
                <Info className="h-3 w-3 shrink-0" />
                <span>
                  Showing {filtered.length} notification{filtered.length !== 1 ? 's' : ''}.
                  Notifications are automatically cleared after 30 days.
                </span>
              </div>
            )}
          </div>
        </div>
      </AuthenticatedShell>
    </>
  );
}

export default withAuth(NotificationsPage);
