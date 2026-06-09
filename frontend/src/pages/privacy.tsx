// pages/privacy.tsx
import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Lock, ChevronRight } from 'lucide-react';
import { AuthenticatedShell } from '@/components/layout/AuthenticatedShell';

const BRAND = 'Capital Coin Trade';
const LAST_UPDATED = 'June 1, 2026';

const SECTIONS = [
  {
    id: 'overview',
    title: '1. Overview',
    content: `Capital Coin Trade ("we", "us", or "our") is committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our trading platform. Please read this policy carefully. If you disagree with its terms, please discontinue use of the Platform immediately.`,
  },
  {
    id: 'collect',
    title: '2. Information We Collect',
    content: `We collect information you provide directly: full name, email address, phone number, date of birth, government-issued ID documents for KYC, proof of address, financial information, and trading history. We also collect information automatically when you use the Platform, including IP address, browser type, device identifiers, usage data, and cookies. We may also receive information from third-party identity verification providers.`,
  },
  {
    id: 'use',
    title: '3. How We Use Your Information',
    content: `We use your information to: provide and operate the Platform; process your transactions; verify your identity (KYC/AML compliance); communicate with you about your account; send transaction confirmations and security alerts; improve and personalize the Platform; detect and prevent fraud; comply with legal obligations; and respond to support requests. We do not sell your personal data to third parties.`,
  },
  {
    id: 'sharing',
    title: '4. Information Sharing & Disclosure',
    content: `We may share your information with: identity verification and KYC/AML service providers; payment processors; cloud infrastructure providers; legal and compliance authorities when required by law; fraud prevention services; and business partners with your consent. All third-party processors are contractually obligated to protect your data and may only use it to perform services on our behalf.`,
  },
  {
    id: 'security',
    title: '5. Data Security',
    content: `We implement industry-standard security measures including AES-256 encryption for data at rest, TLS 1.3 for data in transit, two-factor authentication, regular security audits, and 95% cold storage for digital assets. However, no method of transmission over the internet is 100% secure. We encourage you to use a strong password and enable all available security features on your account.`,
  },
  {
    id: 'retention',
    title: '6. Data Retention',
    content: `We retain your personal data for as long as your account is active and for a period thereafter as required by applicable law — typically 5–7 years for financial records due to AML regulations. You may request deletion of your personal data, subject to our legal obligations. Account closure does not immediately result in deletion of all data.`,
  },
  {
    id: 'rights',
    title: '7. Your Rights',
    content: `Depending on your jurisdiction, you may have rights including: the right to access your personal data; the right to correct inaccurate data; the right to request deletion of your data; the right to restrict processing; the right to data portability; and the right to object to certain processing. To exercise any of these rights, contact us at privacy@capitalcointrade.com. We will respond within 30 days.`,
  },
  {
    id: 'cookies',
    title: '8. Cookies',
    content: `We use cookies and similar tracking technologies to enhance your experience. For detailed information about the cookies we use, please see our Cookies Policy. You can control cookie settings through your browser, though disabling certain cookies may affect Platform functionality.`,
  },
  {
    id: 'international',
    title: '9. International Transfers',
    content: `Your data may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place for any international transfers, including standard contractual clauses approved by relevant data protection authorities.`,
  },
  {
    id: 'children',
    title: '10. Children\'s Privacy',
    content: `The Platform is not directed to individuals under the age of 18. We do not knowingly collect personal information from children. If you believe we have inadvertently collected information from a minor, please contact us immediately and we will take steps to delete such information.`,
  },
  {
    id: 'changes',
    title: '11. Changes to This Policy',
    content: `We may update this Privacy Policy periodically. We will notify you of significant changes via email or a prominent notice on the Platform. The date at the top of this policy indicates when it was last updated. Your continued use of the Platform after changes are posted constitutes acceptance of the revised policy.`,
  },
];

export default function PrivacyPage() {
  const [activeSection, setActiveSection] = useState('overview');
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => { setMounted(true); }, []);

  return (
    <>
      <Head>
        <title>Privacy Policy — {BRAND}</title>
        <meta name="description" content="Read the Privacy Policy for Capital Coin Trade." />
      </Head>

      <AuthenticatedShell>
        <div className="flex flex-col gap-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
            <Link href="/dashboard" className="hover:text-[var(--text-secondary)] transition-colors">Dashboard</Link>
            <ChevronRight className="h-3 w-3" />
            <span style={{ color: 'var(--accent)' }}>Privacy Policy</span>
          </div>

          {/* Header */}
          <div className="rounded-2xl border border-[var(--border)] p-8" style={{ background: 'var(--card)' }}>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl" style={{ background: 'var(--success-muted)', color: 'var(--success)' }}>
                <Lock className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-[var(--text-primary)]">Privacy Policy</h1>
                <p className="mt-1 text-sm text-[var(--text-muted)]">Last updated: {LAST_UPDATED}</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-[var(--text-secondary)]">
              Your privacy matters to us. This policy explains what data we collect, why we collect it, and how we protect it.
            </p>
          </div>

          {/* Content with sidebar */}
          <div className="flex gap-8">
            {/* Sidebar TOC — desktop */}
            <aside className="hidden lg:block w-48 shrink-0">
              <div className="sticky top-24">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-3">Contents</p>
                <nav className="flex flex-col gap-1">
                  {SECTIONS.map((s) => (
                    <a key={s.id} href={`#${s.id}`} onClick={() => setActiveSection(s.id)}
                      className="rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150"
                      style={{ background: activeSection === s.id ? 'var(--success-muted)' : 'transparent', color: activeSection === s.id ? 'var(--success)' : 'var(--text-muted)' }}>
                      {s.title}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 min-w-0 flex flex-col gap-4">
              {SECTIONS.map((s) => (
                <section key={s.id} id={s.id} className="rounded-2xl border border-[var(--border)] p-6 scroll-mt-24" style={{ background: 'var(--card)' }}>
                  <h2 className="text-sm font-bold text-[var(--text-primary)] mb-3">{s.title}</h2>
                  <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{s.content}</p>
                </section>
              ))}
              <div className="rounded-2xl border border-[var(--border)] p-6" style={{ background: 'var(--success-muted)' }}>
                <h2 className="text-sm font-bold mb-2" style={{ color: 'var(--success)' }}>Privacy Questions</h2>
                <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                  For privacy-related questions or to exercise your rights, contact our Data Protection Officer at{' '}
                  <a href="mailto:privacy@capitalcointrade.com" className="font-medium underline" style={{ color: 'var(--success)' }}>privacy@capitalcointrade.com</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </AuthenticatedShell>
    </>
  );
}