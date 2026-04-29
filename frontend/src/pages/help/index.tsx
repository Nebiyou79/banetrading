// pages/help/index.tsx
// ── Help center — FAQ accordion + Contact Support card ──

import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { ChevronDown, MessageCircle, ArrowRight } from 'lucide-react';
import { AuthenticatedShell } from '@/components/layout/AuthenticatedShell';
import { withAuth } from '@/components/layout/withAuth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

const BRAND = process.env.NEXT_PUBLIC_BRAND_NAME || 'PrimeBitTrade';

interface Faq { id: string; question: string; answer: string; }

const FAQS: Faq[] = [
  {
    id: 'q1',
    question: 'How do I deposit funds?',
    answer:
      'Open the Wallet page and click Deposit. Choose the coin and network, scan the QR or copy the deposit address, then send your transaction from your external wallet. Once confirmed on-chain, an admin will review and credit your balance.',
  },
  {
    id: 'q2',
    question: 'Why is my withdrawal still pending?',
    answer:
      'Withdrawals are reviewed manually for security. The held amount is deducted from your balance the moment you submit; if the request is rejected, the full amount is refunded automatically. Most reviews complete within a few hours.',
  },
  {
    id: 'q3',
    question: 'What are the verification levels?',
    answer:
      'Level 1 is automatic when you verify your email. Level 2 requires a government-issued ID. Level 3 requires proof of address. Higher levels unlock larger limits and more features.',
  },
  {
    id: 'q4',
    question: 'Can I change my registered email?',
    answer:
      'Email changes are not yet self-serve. Contact support and we\u2019ll guide you through the verification steps required to migrate your account safely.',
  },
  {
    id: 'q5',
    question: 'I forgot my password. What now?',
    answer:
      'On the login screen, click "Forgot password" to receive a 6-digit code by email. Enter the code and pick a new password. Note: this signs you out of all sessions.',
  },
];

function HelpPage(): JSX.Element {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <>
      <Head><title>Help · {BRAND}</title></Head>
      <AuthenticatedShell>
        <div className="flex flex-col gap-6">
          <header className="flex flex-col gap-1.5">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-text-primary">
              Help Center
            </h1>
            <p className="text-sm text-text-secondary">Answers to the most common questions about your account.</p>
          </header>

          <Card padded={false}>
            <ul className="divide-y divide-border">
              {FAQS.map((faq) => {
                const isOpen = open === faq.id;
                return (
                  <li key={faq.id}>
                    <button
                      type="button"
                      onClick={() => setOpen(isOpen ? null : faq.id)}
                      aria-expanded={isOpen}
                      aria-controls={`faq-${faq.id}`}
                      className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-hover-bg focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                    >
                      <span className="text-sm font-semibold text-text-primary">{faq.question}</span>
                      <ChevronDown className={cn('h-4 w-4 text-text-muted transition-transform shrink-0', isOpen && 'rotate-180')} />
                    </button>
                    {isOpen && (
                      <div id={`faq-${faq.id}`} className="px-5 pb-5">
                        <p className="text-sm text-text-secondary leading-relaxed">{faq.answer}</p>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </Card>

          {/* ── Contact Support ── */}
          <Card>
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-accent-muted text-accent">
                  <MessageCircle className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-base font-semibold text-text-primary">Still need help?</h3>
                  <p className="mt-0.5 text-sm text-text-secondary">
                    Get in touch with our support team — we typically reply within a few hours.
                  </p>
                </div>
              </div>
              <Link href="/support">
                <Button variant="primary" trailingIcon={<ArrowRight className="h-4 w-4" />}>
                  Contact Support
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </AuthenticatedShell>
    </>
  );
}

export default withAuth(HelpPage);