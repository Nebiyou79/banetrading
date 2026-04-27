// components/dashboard/GreetingHeader.tsx
// ── Time-aware greeting + market one-liner ──

import { Sunrise, Sun, Moon, CalendarDays } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getGreeting } from '@/lib/format';

export function GreetingHeader(): JSX.Element {
  const { user } = useAuth();
  const greeting = getGreeting();
  const label = (user?.displayName || user?.name || 'trader').split(' ')[0];

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });

  const Icon = greeting === 'morning' ? Sunrise : greeting === 'afternoon' ? Sun : Moon;

  return (
    <section className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2 text-xs text-text-muted">
        <CalendarDays className="h-3.5 w-3.5" />
        <span>{dateStr}</span>
      </div>
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-accent" aria-hidden="true" />
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-text-primary">
          Good {greeting}, <span className="text-accent">{label}</span>
        </h1>
      </div>
      <p className="text-sm text-text-secondary">
        Crypto markets are mixed today. Here&apos;s a quick look at your account.
      </p>
    </section>
  );
}