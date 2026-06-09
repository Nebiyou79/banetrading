// pages/cookies.tsx
import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Cookie, ChevronRight } from 'lucide-react';
import { AuthenticatedShell } from '@/components/layout/AuthenticatedShell';

const BRAND = 'Capital Coin Trade';
const LAST_UPDATED = 'June 1, 2026';

const COOKIE_TYPES = [
  {
    name: 'Strictly Necessary',
    required: true,
    tone: 'success',
    description: 'These cookies are essential for the Platform to function. They enable core features such as session management, authentication, security tokens, and load balancing. The Platform cannot operate without these cookies.',
    examples: ['session_id', 'csrf_token', 'auth_token', 'lb_route'],
  },
  {
    name: 'Functional',
    required: false,
    tone: 'info',
    description: 'These cookies remember your preferences to enhance your experience — such as your theme choice (dark/light mode), selected language, chart layout preferences, and trading pair favorites.',
    examples: ['theme_pref', 'chart_layout', 'favorite_pairs', 'lang'],
  },
  {
    name: 'Analytics',
    required: false,
    tone: 'warning',
    description: 'These cookies help us understand how visitors interact with the Platform. We use anonymized analytics data to improve features, identify issues, and optimize performance. No personally identifiable information is included.',
    examples: ['_ga', '_gid', 'analytics_session', 'page_view'],
  },
  {
    name: 'Security',
    required: true,
    tone: 'accent',
    description: 'These cookies support our security infrastructure, including fraud detection, rate limiting, bot protection, and suspicious activity monitoring. They are essential to keeping your account safe.',
    examples: ['fp_token', 'rate_limit_id', 'device_trust', 'risk_score'],
  },
];

const SECTIONS = [
  { id: 'what', title: '1. What Are Cookies?', content: 'Cookies are small text files placed on your device when you visit a website. They are widely used to make websites work efficiently and to provide information to the website owners. Cookies may be session-based (deleted when you close your browser) or persistent (remaining on your device for a set period).' },
  { id: 'use', title: '2. How We Use Cookies', content: 'We use cookies to keep you logged in securely, remember your preferences such as dark/light mode and chart layout, protect your account from fraud and unauthorized access, analyze how the Platform is used so we can improve it, and ensure the Platform loads efficiently and reliably.' },
  { id: 'third', title: '3. Third-Party Cookies', content: 'Some cookies are placed by third-party services we use, such as analytics providers and security services. These third parties have their own privacy policies. We select third-party partners carefully and require them to handle data in accordance with applicable privacy laws.' },
  { id: 'control', title: '4. Managing Cookies', content: 'You can control and delete cookies through your browser settings. Most browsers allow you to refuse cookies, delete existing cookies, or be notified when a cookie is set. Please note that disabling certain cookies — especially strictly necessary ones — may affect the functionality of the Platform, including the ability to stay logged in or trade securely.' },
  { id: 'updates', title: '5. Updates to This Policy', content: 'We may update this Cookies Policy from time to time to reflect changes in technology or regulation. The updated date at the top of this page indicates when the policy was last revised. Continued use of the Platform after changes constitutes acceptance of the revised policy.' },
];

const TONE_STYLES: Record<string, { bg: string; color: string }> = {
  success: { bg: 'var(--success-muted)', color: 'var(--success)' },
  info:    { bg: 'var(--info-muted)',    color: 'var(--info)'    },
  warning: { bg: 'var(--warning-muted)', color: 'var(--warning)' },
  accent:  { bg: 'var(--accent-muted)',  color: 'var(--accent)'  },
};

export default function CookiesPage() {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => { setMounted(true); }, []);

  return (
    <>
      <Head>
        <title>Cookies Policy — {BRAND}</title>
        <meta name="description" content="Learn how Capital Coin Trade uses cookies." />
      </Head>

      <AuthenticatedShell>
        <div className="flex flex-col gap-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
            <Link href="/dashboard" className="hover:text-[var(--text-secondary)] transition-colors">Dashboard</Link>
            <ChevronRight className="h-3 w-3" />
            <span style={{ color: 'var(--accent)' }}>Cookies Policy</span>
          </div>

          {/* Header */}
          <div className="rounded-2xl border border-[var(--border)] p-8" style={{ background: 'var(--card)' }}>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl" style={{ background: 'var(--warning-muted)', color: 'var(--warning)' }}>
                <Cookie className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-[var(--text-primary)]">Cookies Policy</h1>
                <p className="mt-1 text-sm text-[var(--text-muted)]">Last updated: {LAST_UPDATED}</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-[var(--text-secondary)]">
              We use cookies to keep the Platform secure, remember your preferences, and improve your trading experience.
            </p>
          </div>

          {/* Cookie types */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-4">Cookie Types We Use</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {COOKIE_TYPES.map((c) => {
                const ts = TONE_STYLES[c.tone];
                return (
                  <div key={c.name} className="rounded-2xl border border-[var(--border)] p-5" style={{ background: 'var(--card)' }}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full" style={{ background: ts.color }} />
                        <span className="text-sm font-bold text-[var(--text-primary)]">{c.name}</span>
                      </div>
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide" style={{ background: ts.bg, color: ts.color }}>
                        {c.required ? 'Required' : 'Optional'}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-[var(--text-secondary)] mb-3">{c.description}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {c.examples.map((ex) => (
                        <code key={ex} className="rounded px-1.5 py-0.5 text-[10px] font-mono" style={{ background: ts.bg, color: ts.color }}>{ex}</code>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sections */}
          <div className="flex flex-col gap-4">
            {SECTIONS.map((s) => (
              <section key={s.id} id={s.id} className="rounded-2xl border border-[var(--border)] p-6 scroll-mt-24" style={{ background: 'var(--card)' }}>
                <h2 className="text-sm font-bold text-[var(--text-primary)] mb-3">{s.title}</h2>
                <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{s.content}</p>
              </section>
            ))}
          </div>

          {/* Browser guides */}
          <div className="rounded-2xl border border-[var(--border)] p-6" style={{ background: 'var(--card)' }}>
            <h2 className="text-sm font-bold text-[var(--text-primary)] mb-3">Browser Cookie Settings</h2>
            <p className="text-xs leading-relaxed text-[var(--text-secondary)] mb-3">Manage cookies in your browser:</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[['Chrome', 'https://support.google.com/chrome/answer/95647'], ['Firefox', 'https://support.mozilla.org/kb/enable-and-disable-cookies'], ['Safari', 'https://support.apple.com/guide/safari/manage-cookies'], ['Edge', 'https://support.microsoft.com/microsoft-edge/delete-cookies']].map(([browser, url]) => (
                <a key={browser} href={url} target="_blank" rel="noopener noreferrer"
                  className="rounded-lg border border-[var(--border)] px-3 py-2 text-center text-xs font-medium text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] transition-all">
                  {browser}
                </a>
              ))}
            </div>
          </div>
        </div>
      </AuthenticatedShell>
    </>
  );
}