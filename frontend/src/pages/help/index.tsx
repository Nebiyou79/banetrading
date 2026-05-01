// pages/help/index.tsx
// ── HELP CENTER HUB ──

import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

import { AuthenticatedShell } from '@/components/layout/AuthenticatedShell';
import { withAuth } from '@/components/layout/withAuth';
import { useSupportConfig } from '@/hooks/useSupportConfig';
import NewTicketModal from '@/components/support/NewTicketModal';
import WhatsAppButton from '@/components/support/WhatsAppButton';

const BRAND = process.env.NEXT_PUBLIC_BRAND_NAME || 'PrimeBitTrade Clone';

function HelpPage(): JSX.Element {
  const router = useRouter();
  const { config, isLoading } = useSupportConfig();
  const [showNewTicket, setShowNewTicket] = useState(false);

  return (
    <>
      <Head><title>Help Center · {BRAND}</title></Head>
      <AuthenticatedShell>
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">Help Center</h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">Get help via support tickets or WhatsApp</p>
          </div>

          {/* ── Two cards ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Support Tickets */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[var(--primary-muted)] flex items-center justify-center text-[var(--accent)]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--text-primary)]">Support Tickets</h3>
                  <p className="text-xs text-[var(--text-muted)]">Chat directly with our support team</p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => router.push('/help/tickets')}
                  className="w-full py-2.5 rounded-lg text-sm font-medium border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] transition-colors duration-150"
                >
                  View My Tickets
                </button>
                <button
                  onClick={() => setShowNewTicket(true)}
                  className="w-full py-2.5 rounded-lg text-sm font-medium bg-[var(--accent)] text-[var(--text-inverse)] hover:opacity-90 transition-opacity duration-150"
                >
                  + New Ticket
                </button>
              </div>
            </div>

            {/* WhatsApp */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[var(--success-muted)] flex items-center justify-center">
                  <svg className="w-5 h-5 text-[var(--success)]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--text-primary)]">WhatsApp Support</h3>
                  <p className="text-xs text-[var(--text-muted)]">Quick answers via WhatsApp</p>
                </div>
              </div>
              {config.whatsappEnabled ? (
                <WhatsAppButton number={config.whatsappNumber} message={config.whatsappMessage} className="w-full justify-center" />
              ) : (
                <button
                  disabled
                  className="w-full py-2.5 rounded-lg text-sm font-medium bg-[var(--disabled)] text-[var(--disabled-text)] cursor-not-allowed"
                  title="WhatsApp support is coming soon"
                >
                  Coming Soon
                </button>
              )}
            </div>
          </div>

          <NewTicketModal open={showNewTicket} onClose={() => setShowNewTicket(false)} />
        </div>
      </AuthenticatedShell>
    </>
  );
}

export default withAuth(HelpPage);