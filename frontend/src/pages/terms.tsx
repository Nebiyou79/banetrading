// pages/terms.tsx
import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { FileText, ChevronRight } from 'lucide-react';
import { AuthenticatedShell } from '@/components/layout/AuthenticatedShell';

const BRAND = 'Capital Coin Trade';
const LAST_UPDATED = 'June 1, 2026';

const SECTIONS = [
  {
    id: 'acceptance',
    title: '1. Acceptance of Terms',
    content: `By accessing or using Capital Coin Trade ("the Platform"), you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing the Platform. These terms apply to all visitors, users, and others who access or use the Platform.`,
  },
  {
    id: 'eligibility',
    title: '2. Eligibility',
    content: `You must be at least 18 years of age to use this Platform. By using the Platform, you represent and warrant that you are of legal age to form a binding contract and are not a person barred from receiving services under the laws of any applicable jurisdiction. You are solely responsible for ensuring that your use of the Platform complies with all laws, rules, and regulations applicable to you.`,
  },
  {
    id: 'account',
    title: '3. Account Registration & Security',
    content: `To access certain features, you must create an account. You agree to provide accurate, current, and complete information during registration and to update such information as necessary. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account. We reserve the right to suspend or terminate accounts at our discretion.`,
  },
  {
    id: 'kyc',
    title: '4. KYC & Identity Verification',
    content: `To comply with applicable anti-money laundering (AML) and know-your-customer (KYC) regulations, we may require you to provide identity verification documents before accessing certain features, including withdrawals and higher trading limits. Failure to complete verification may result in restrictions on your account. All submitted documents are handled in accordance with our Privacy Policy.`,
  },
  {
    id: 'trading',
    title: '5. Trading & Financial Risk',
    content: `Trading cryptocurrencies, forex, and other financial instruments involves substantial risk of loss and is not suitable for all investors. The value of digital assets can be highly volatile. Past performance is not indicative of future results. Nothing on the Platform constitutes financial, investment, legal, or tax advice. You should seek independent professional advice before making any trading decisions. You accept full responsibility for all trading decisions made through your account.`,
  },
  {
    id: 'fees',
    title: '6. Fees & Charges',
    content: `We charge fees for certain transactions and services on the Platform. A complete fee schedule is available on the Platform and may be updated from time to time. By using the Platform, you agree to pay all applicable fees. We reserve the right to change our fee structure with reasonable notice to users. Fees are generally non-refundable unless otherwise stated.`,
  },
  {
    id: 'prohibited',
    title: '7. Prohibited Activities',
    content: `You agree not to: (a) use the Platform for any unlawful purpose; (b) engage in market manipulation, wash trading, or any form of fraudulent trading; (c) attempt to gain unauthorized access to any part of the Platform; (d) introduce malicious software or code; (e) impersonate any person or entity; (f) use automated bots or scripts without prior written consent; (g) violate any applicable laws or regulations. Violations may result in immediate account termination and reporting to relevant authorities.`,
  },
  {
    id: 'ip',
    title: '8. Intellectual Property',
    content: `All content on the Platform, including but not limited to text, graphics, logos, software, and data compilations, is the property of Capital Coin Trade or its content suppliers and is protected by applicable intellectual property laws. You may not reproduce, distribute, or create derivative works from any content without our express written permission.`,
  },
  {
    id: 'liability',
    title: '9. Limitation of Liability',
    content: `To the maximum extent permitted by applicable law, Capital Coin Trade shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, goodwill, or other intangible losses, resulting from your access to or use of (or inability to access or use) the Platform. Our total liability to you for any claims arising from your use of the Platform shall not exceed the fees you paid to us in the three months preceding the claim.`,
  },
  {
    id: 'termination',
    title: '10. Termination',
    content: `We reserve the right to suspend or terminate your access to the Platform at any time, for any reason, including breach of these Terms. Upon termination, your right to use the Platform will immediately cease. We will make reasonable efforts to allow withdrawal of remaining funds subject to our AML and legal obligations. Provisions of these Terms that by their nature should survive termination shall survive.`,
  },
  {
    id: 'governing',
    title: '11. Governing Law & Disputes',
    content: `These Terms shall be governed by and construed in accordance with applicable international commercial laws. Any disputes arising from these Terms or your use of the Platform shall first be attempted to be resolved through good-faith negotiation. If unresolved, disputes shall be submitted to binding arbitration. You waive any right to participate in class action lawsuits or class-wide arbitration.`,
  },
  {
    id: 'changes',
    title: '12. Changes to Terms',
    content: `We reserve the right to modify these Terms at any time. We will provide notice of significant changes via email or a prominent notice on the Platform. Your continued use of the Platform after changes become effective constitutes acceptance of the new Terms. If you do not agree to the revised Terms, you must stop using the Platform.`,
  },
];

export default function TermsPage() {
  const [activeSection, setActiveSection] = useState('acceptance');
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => { setMounted(true); }, []);

  return (
    <>
      <Head>
        <title>Terms of Service — {BRAND}</title>
        <meta name="description" content="Read the Terms of Service for Capital Coin Trade." />
      </Head>

      <AuthenticatedShell>
        <div className="flex flex-col gap-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
            <Link href="/dashboard" className="hover:text-[var(--text-secondary)] transition-colors">Dashboard</Link>
            <ChevronRight className="h-3 w-3" />
            <span style={{ color: 'var(--accent)' }}>Terms of Service</span>
          </div>

          {/* Header */}
          <div className="rounded-2xl border border-[var(--border)] p-8" style={{ background: 'var(--card)' }}>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl" style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}>
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-[var(--text-primary)]">Terms of Service</h1>
                <p className="mt-1 text-sm text-[var(--text-muted)]">Last updated: {LAST_UPDATED}</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-[var(--text-secondary)]">
              Please read these Terms carefully before using Capital Coin Trade. By using our platform, you agree to be bound by these Terms.
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
                    <a
                      key={s.id}
                      href={`#${s.id}`}
                      onClick={() => setActiveSection(s.id)}
                      className="rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150"
                      style={{
                        background: activeSection === s.id ? 'var(--accent-muted)' : 'transparent',
                        color: activeSection === s.id ? 'var(--accent)' : 'var(--text-muted)',
                      }}
                    >
                      {s.title}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 min-w-0 flex flex-col gap-4">
              {SECTIONS.map((s) => (
                <section
                  key={s.id}
                  id={s.id}
                  className="rounded-2xl border border-[var(--border)] p-6 scroll-mt-24"
                  style={{ background: 'var(--card)' }}
                >
                  <h2 className="text-sm font-bold text-[var(--text-primary)] mb-3">{s.title}</h2>
                  <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{s.content}</p>
                </section>
              ))}

              {/* Contact */}
              <div className="rounded-2xl border border-[var(--border)] p-6" style={{ background: 'var(--accent-muted)' }}>
                <h2 className="text-sm font-bold mb-2" style={{ color: 'var(--accent)' }}>Contact Us</h2>
                <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                  If you have questions about these Terms, please contact us at{' '}
                  <a href="mailto:support@capitalcointrade.com" className="font-medium underline" style={{ color: 'var(--accent)' }}>
                    support@capitalcointrade.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </AuthenticatedShell>
    </>
  );
}