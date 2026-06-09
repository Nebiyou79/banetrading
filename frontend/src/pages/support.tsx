// pages/support.tsx
import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import {
  HelpCircle, ChevronRight, Mail, MessageCircle,
  ChevronDown, Search, ShieldCheck, CreditCard, BarChart3, User,
} from 'lucide-react';
import { AuthenticatedShell } from '@/components/layout/AuthenticatedShell';

const BRAND = 'Capital Coin Trade';

const CATEGORIES = [
  { icon: <User className="h-5 w-5" />,       tone: 'accent',   label: 'Account & KYC',     desc: 'Registration, verification, account settings' },
  { icon: <CreditCard className="h-5 w-5" />,  tone: 'success',  label: 'Deposits & Withdrawals', desc: 'Funding, limits, processing times' },
  { icon: <BarChart3 className="h-5 w-5" />,   tone: 'info',     label: 'Trading',           desc: 'Orders, positions, leverage, fees' },
  { icon: <ShieldCheck className="h-5 w-5" />, tone: 'warning',  label: 'Security',          desc: '2FA, passwords, suspicious activity' },
];

const FAQS = [
  {
    q: 'How do I verify my account (KYC)?',
    a: 'Go to Account Settings → Verification. You will need to upload a government-issued photo ID (passport or national ID) and a selfie. Processing typically takes 1–3 business days. Higher withdrawal limits require additional documents.',
  },
  {
    q: 'How long do deposits take?',
    a: 'Cryptocurrency deposits are credited after the required network confirmations (typically 1–6 confirmations depending on the coin). Bank transfers may take 1–3 business days. You will receive an email notification when your deposit is credited.',
  },
  {
    q: 'What are the withdrawal limits?',
    a: 'Unverified accounts have a daily withdrawal limit of $500. Basic KYC verification increases this to $10,000/day. Full verification (including proof of address) allows up to $100,000/day. Contact support for higher limits.',
  },
  {
    q: 'I forgot my password. How do I reset it?',
    a: 'Click "Forgot password" on the login page and enter your registered email address. You will receive a reset link valid for 15 minutes. If you do not receive the email, check your spam folder or contact support.',
  },
  {
    q: 'How do I enable two-factor authentication (2FA)?',
    a: 'Go to Account Settings → Security → Two-Factor Authentication. We support authenticator apps (Google Authenticator, Authy). Scan the QR code with your app and enter the 6-digit code to confirm. We strongly recommend enabling 2FA for all accounts.',
  },
  {
    q: 'Why was my withdrawal rejected?',
    a: 'Withdrawals can be rejected for several reasons: insufficient balance, incomplete KYC verification, withdrawal address not whitelisted, account security hold, or flagged activity. Check your email for a specific reason, or contact support with your transaction ID.',
  },
  {
    q: 'What trading fees does Capital Coin Trade charge?',
    a: 'We charge a flat 0.1% maker/taker fee on spot trades. Fees decrease based on your 30-day trading volume. Deposit fees depend on the blockchain network. Withdrawals have a small network fee that varies by asset. Full fee schedule is available in your account settings.',
  },
  {
    q: 'My account is locked. What do I do?',
    a: 'Accounts may be locked after multiple failed login attempts or if suspicious activity is detected. Wait 30 minutes and try again, or use the password reset flow. If your account remains locked, contact support with your registered email address and government ID for manual review.',
  },
];

const TONE_STYLES: Record<string, { bg: string; color: string }> = {
  accent:  { bg: 'var(--accent-muted)',  color: 'var(--accent)'  },
  success: { bg: 'var(--success-muted)', color: 'var(--success)' },
  info:    { bg: 'var(--info-muted)',    color: 'var(--info)'    },
  warning: { bg: 'var(--warning-muted)', color: 'var(--warning)' },
};

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-[var(--border)] rounded-xl overflow-hidden" style={{ background: 'var(--card)' }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-[var(--hover-bg)]"
      >
        <span className="text-sm font-semibold text-[var(--text-primary)]">{q}</span>
        <ChevronDown
          className="h-4 w-4 shrink-0 transition-transform duration-200"
          style={{ color: 'var(--text-muted)', transform: open ? 'rotate(180deg)' : 'none' }}
        />
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-[var(--border)]">
          <p className="mt-4 text-sm leading-relaxed text-[var(--text-secondary)]">{a}</p>
        </div>
      )}
    </div>
  );
}

export default function SupportPage() {
  const [search, setSearch] = useState('');
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => { setMounted(true); }, []);

  const filteredFAQs = FAQS.filter(
    (f) => search === '' || f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Head>
        <title>Support — {BRAND}</title>
        <meta name="description" content="Get help with Capital Coin Trade. FAQ, contact support, and more." />
      </Head>

      <AuthenticatedShell>
        <div className="flex flex-col gap-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
            <Link href="/dashboard" className="hover:text-[var(--text-secondary)] transition-colors">Dashboard</Link>
            <ChevronRight className="h-3 w-3" />
            <span style={{ color: 'var(--accent)' }}>Support</span>
          </div>

          {/* Hero */}
          <div className="rounded-2xl border border-[var(--border)] p-8 text-center" style={{ background: 'var(--card)' }}>
            <div className="flex justify-center mb-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: 'var(--info-muted)', color: 'var(--info)' }}>
                <HelpCircle className="h-7 w-7" />
              </div>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-[var(--text-primary)]">How can we help?</h1>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">Search our help center or contact our support team</p>

            {/* Search */}
            <div className="mx-auto mt-6 max-w-lg relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Search FAQ..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] pl-10 pr-4 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--accent)] transition-colors"
              />
            </div>
          </div>

          {/* Categories */}
          {search === '' && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-4">Browse by Category</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {CATEGORIES.map((c) => {
                  const ts = TONE_STYLES[c.tone];
                  return (
                    <div key={c.label} className="rounded-2xl border border-[var(--border)] p-4 cursor-pointer transition-all hover:border-[var(--border-strong)] hover:bg-[var(--hover-bg)]" style={{ background: 'var(--card)' }}>
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl mb-3" style={{ background: ts.bg, color: ts.color }}>
                        {c.icon}
                      </div>
                      <p className="text-xs font-bold text-[var(--text-primary)]">{c.label}</p>
                      <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">{c.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* FAQ */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-4">
              {search ? `Results for "${search}"` : 'Frequently Asked Questions'}
            </p>
            {filteredFAQs.length > 0 ? (
              <div className="flex flex-col gap-2">
                {filteredFAQs.map((f) => <FAQItem key={f.q} q={f.q} a={f.a} />)}
              </div>
            ) : (
              <div className="rounded-2xl border border-[var(--border)] p-8 text-center" style={{ background: 'var(--card)' }}>
                <p className="text-sm text-[var(--text-muted)]">No results for &ldquo;{search}&rdquo; — try different keywords or contact us directly.</p>
              </div>
            )}
          </div>

          {/* Contact options */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-4">Still Need Help?</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <a
                href="mailto:support@capitalcointrade.com"
                className="flex items-start gap-4 rounded-2xl border border-[var(--border)] p-5 transition-all hover:border-[var(--border-strong)] hover:bg-[var(--hover-bg)]"
                style={{ background: 'var(--card)' }}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}>
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[var(--text-primary)]">Email Support</p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">support@capitalcointrade.com</p>
                  <p className="text-[11px] text-[var(--text-muted)] mt-1">Response within 24 hours</p>
                </div>
              </a>
              <div className="flex items-start gap-4 rounded-2xl border border-[var(--border)] p-5" style={{ background: 'var(--card)' }}>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: 'var(--success-muted)', color: 'var(--success)' }}>
                  <MessageCircle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[var(--text-primary)]">Live Chat</p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">Available in your account dashboard</p>
                  <p className="text-[11px] mt-1" style={{ color: 'var(--success)' }}>● Online · Mon–Fri 9am–6pm UTC</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AuthenticatedShell>
    </>
  );
}