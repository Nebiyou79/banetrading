// components/settings/SettingsTabs.tsx
// ── Tab pills for /settings/* ──

import Link from 'next/link';
import { useRouter } from 'next/router';
import { ShieldCheck, BadgeCheck } from 'lucide-react';
import { cn } from '@/lib/cn';

interface Tab {
  href: string;
  label: string;
  icon: JSX.Element;
}

const TABS: Tab[] = [
  { href: '/settings/security', label: 'Security',          icon: <ShieldCheck className="h-4 w-4" /> },
  { href: '/settings/kyc',      label: 'KYC Verification',   icon: <BadgeCheck className="h-4 w-4" /> },
];

export function SettingsTabs(): JSX.Element {
  const router = useRouter();
  return (
    <nav aria-label="Settings sections" className="flex flex-col gap-2 sm:flex-row">
      {TABS.map((t) => {
        const active = router.pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'inline-flex items-center justify-center sm:justify-start gap-2 rounded-button h-10 px-4 text-sm font-medium transition-colors',
              'w-full sm:w-auto',
              active
                ? 'bg-accent text-text-inverse'
                : 'bg-muted text-text-secondary hover:text-text-primary',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring',
            )}
          >
            {t.icon}
            <span>{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}