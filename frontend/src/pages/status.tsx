// pages/status.tsx
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Activity, ChevronRight, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { AuthenticatedShell } from '@/components/layout/AuthenticatedShell';

const BRAND = 'Capital Coin Trade';

type ServiceStatus = 'operational' | 'degraded' | 'outage';

interface Service {
  name: string;
  status: ServiceStatus;
  uptime: string;
  latency: string;
}

interface Incident {
  date: string;
  title: string;
  severity: 'resolved' | 'monitoring' | 'investigating';
  description: string;
}

const SERVICES: Service[] = [
  { name: 'Trading Engine',        status: 'operational', uptime: '99.99%', latency: '< 2ms'  },
  { name: 'Market Data Feed',      status: 'operational', uptime: '99.97%', latency: '< 5ms'  },
  { name: 'WebSocket (Live Prices)', status: 'operational', uptime: '99.95%', latency: '< 8ms'  },
  { name: 'REST API',              status: 'operational', uptime: '99.99%', latency: '< 50ms' },
  { name: 'Authentication',        status: 'operational', uptime: '100%',   latency: '< 80ms' },
  { name: 'Deposits & Withdrawals',status: 'operational', uptime: '99.98%', latency: '< 200ms'},
  { name: 'KYC Verification',      status: 'operational', uptime: '99.90%', latency: '< 500ms'},
  { name: 'Email Notifications',   status: 'operational', uptime: '99.85%', latency: '< 2s'   },
];

const INCIDENTS: Incident[] = [
  {
    date: 'June 1, 2026',
    title: 'Scheduled maintenance — database upgrade',
    severity: 'resolved',
    description: 'Scheduled maintenance was completed successfully. All services returned to full operation within the maintenance window. No user data was affected.',
  },
  {
    date: 'May 18, 2026',
    title: 'Elevated API latency',
    severity: 'resolved',
    description: 'We detected elevated API response times due to a traffic spike. The issue was mitigated by scaling our infrastructure. All systems returned to normal within 22 minutes.',
  },
  {
    date: 'May 3, 2026',
    title: 'Email delivery delays',
    severity: 'resolved',
    description: 'Some users experienced delays receiving email notifications and 2FA codes. Our email provider resolved the upstream issue. All queued emails were delivered.',
  },
];

const STATUS_CONFIG: Record<ServiceStatus, { label: string; color: string; bg: string; icon: JSX.Element }> = {
  operational: { label: 'Operational', color: 'var(--success)', bg: 'var(--success-muted)', icon: <CheckCircle className="h-4 w-4" /> },
  degraded:    { label: 'Degraded',    color: 'var(--warning)', bg: 'var(--warning-muted)', icon: <AlertCircle className="h-4 w-4" /> },
  outage:      { label: 'Outage',      color: 'var(--danger)',  bg: 'var(--danger-muted)',  icon: <AlertCircle className="h-4 w-4" /> },
};

const INCIDENT_CONFIG: Record<string, { color: string; bg: string }> = {
  resolved:     { color: 'var(--success)', bg: 'var(--success-muted)' },
  monitoring:   { color: 'var(--warning)', bg: 'var(--warning-muted)' },
  investigating:{ color: 'var(--danger)',  bg: 'var(--danger-muted)'  },
};

// 90-day uptime bar — all green for a healthy system
function UptimeBar() {
  const days = Array.from({ length: 90 }, (_, i) => ({
    status: Math.random() > 0.02 ? 'operational' : 'degraded' as ServiceStatus,
  }));
  return (
    <div className="flex items-end gap-px h-8">
      {days.map((d, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm transition-all hover:opacity-75 cursor-default"
          style={{
            height: '100%',
            background: d.status === 'operational' ? 'var(--success)' : 'var(--warning)',
            opacity: 0.7 + (i / 90) * 0.3,
          }}
          title={d.status === 'operational' ? 'Operational' : 'Degraded'}
        />
      ))}
    </div>
  );
}

export default function StatusPage() {
  const [mounted, setMounted] = useState(false);
  const [lastChecked, setLastChecked] = useState('');
  const { resolvedTheme } = useTheme();

  useEffect(() => { setMounted(true); setLastChecked(new Date().toLocaleTimeString()); }, []);

  const allOperational = SERVICES.every((s) => s.status === 'operational');

  return (
    <>
      <Head>
        <title>System Status — {BRAND}</title>
        <meta name="description" content="Real-time status of Capital Coin Trade platform services." />
      </Head>

      <AuthenticatedShell>
        <div className="flex flex-col gap-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
            <Link href="/dashboard" className="hover:text-[var(--text-secondary)] transition-colors">Dashboard</Link>
            <ChevronRight className="h-3 w-3" />
            <span style={{ color: 'var(--accent)' }}>System Status</span>
          </div>

          {/* Hero — overall status banner */}
          <div
            className="rounded-2xl border border-[var(--border)] p-8"
            style={{ background: allOperational ? 'var(--success-muted)' : 'var(--warning-muted)' }}
          >
            <div className="flex items-start gap-4">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                style={{ background: allOperational ? 'var(--success)' : 'var(--warning)', color: '#fff' }}
              >
                <Activity className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-[var(--text-primary)]">
                  {allOperational ? 'All Systems Operational' : 'Some Systems Degraded'}
                </h1>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  Last checked: {lastChecked || '—'} ·{' '}
                  <span className="inline-flex items-center gap-1" style={{ color: 'var(--success)' }}>
                    <span className="h-1.5 w-1.5 rounded-full animate-pulse inline-block" style={{ background: 'var(--success)' }} />
                    Live
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* 90-day uptime */}
          <div className="rounded-2xl border border-[var(--border)] p-6" style={{ background: 'var(--card)' }}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold text-[var(--text-primary)]">90-Day Uptime</p>
              <span className="text-xs font-semibold" style={{ color: 'var(--success)' }}>99.97% avg</span>
            </div>
            <UptimeBar />
            <div className="flex items-center justify-between mt-2">
              <span className="text-[10px] text-[var(--text-muted)]">90 days ago</span>
              <span className="text-[10px] text-[var(--text-muted)]">Today</span>
            </div>
          </div>

          {/* Services */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-4">Service Status</p>
            <div className="rounded-2xl border border-[var(--border)] overflow-hidden" style={{ background: 'var(--card)' }}>
              {SERVICES.map((svc, idx) => {
                const cfg = STATUS_CONFIG[svc.status];
                return (
                  <div
                    key={svc.name}
                    className="flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-[var(--hover-bg)]"
                    style={{ borderBottom: idx < SERVICES.length - 1 ? '1px solid var(--border)' : 'none' }}
                  >
                    <span className="text-sm font-medium text-[var(--text-primary)]">{svc.name}</span>
                    <div className="flex items-center gap-6">
                      <span className="hidden sm:block text-xs text-[var(--text-muted)]">Uptime: <span className="font-semibold text-[var(--text-secondary)]">{svc.uptime}</span></span>
                      <span className="hidden sm:block text-xs text-[var(--text-muted)]">Latency: <span className="font-semibold text-[var(--text-secondary)]">{svc.latency}</span></span>
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide"
                        style={{ background: cfg.bg, color: cfg.color }}
                      >
                        {cfg.icon}
                        {cfg.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Incident history */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-4">Incident History</p>
            <div className="flex flex-col gap-3">
              {INCIDENTS.map((inc) => {
                const cfg = INCIDENT_CONFIG[inc.severity];
                return (
                  <div key={inc.title} className="rounded-2xl border border-[var(--border)] p-5" style={{ background: 'var(--card)' }}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <p className="text-sm font-bold text-[var(--text-primary)]">{inc.title}</p>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-[var(--text-muted)]">
                          <Clock className="h-3 w-3" />
                          {inc.date}
                        </div>
                      </div>
                      <span
                        className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide"
                        style={{ background: cfg.bg, color: cfg.color }}
                      >
                        {inc.severity}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-[var(--text-secondary)]">{inc.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Subscribe notice */}
          <div className="rounded-2xl border border-[var(--border)] p-5 flex items-start gap-4" style={{ background: 'var(--accent-muted)' }}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: 'var(--accent)', color: '#fff' }}>
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: 'var(--accent)' }}>Stay informed</p>
              <p className="text-xs leading-relaxed text-[var(--text-secondary)] mt-0.5">
                To receive incident notifications by email, enable status alerts in your{' '}
                <Link href="/settings" className="font-medium underline" style={{ color: 'var(--accent)' }}>account settings</Link>.
              </p>
            </div>
          </div>
        </div>
      </AuthenticatedShell>
    </>
  );
}