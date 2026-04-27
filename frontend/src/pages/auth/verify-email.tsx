// pages/auth/verify-email.tsx
// ── Email verification landing (deep-link from email click) ──
// Handles token-based verification when user clicks the link in their email.
// Distinct from verify-otp.tsx which handles 6-digit code entry.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

import { AuthLayout } from '../../components/auth/AuthLayout';
import { Button } from '../../components/ui/Button';
import { authService } from '../../services/authService';
import { normalizeError, NormalizedApiError } from '../../services/apiClient';

const BRAND = process.env.NEXT_PUBLIC_BRAND_NAME || 'PrimeBitTrade Clone';

type VerifyState = 'pending' | 'success' | 'error';

export default function VerifyEmailPage(): JSX.Element {
  const router = useRouter();
  const [state, setState] = useState<VerifyState>('pending');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const token = typeof router.query.token === 'string' ? router.query.token : '';

  useEffect(() => {
    if (!router.isReady) return;

    if (!token) {
      setState('error');
      setErrorMessage('Verification link is missing a token. Please use the link from your email.');
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        await authService.verifyOtp();
        if (!cancelled) setState('success');
      } catch (err) {
        if (!cancelled) {
          const normalized = normalizeError(err) as NormalizedApiError;
          setErrorMessage(normalized.message || 'This link is invalid or has expired.');
          setState('error');
        }
      }
    })();

    return () => { cancelled = true; };
  }, [router.isReady, token]);

  // ── Pending — loading state ──
  if (state === 'pending') {
    return (
      <>
        <Head><title>Verifying email · {BRAND}</title></Head>
        <AuthLayout
          title="Verifying your email…"
          subtitle="Please wait while we confirm your address."
        >
          <div className="flex flex-col items-center gap-4 py-4">
            {/* text-[var(--primary)] → gold spinner accent from color.ts */}
            <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
            {/* text-[var(--text-muted)] → metadata / loading copy */}
            <p className="text-sm text-[var(--text-muted)]">Checking your verification token…</p>
          </div>
        </AuthLayout>
      </>
    );
  }

  // ── Success ──
  if (state === 'success') {
    return (
      <>
        <Head><title>Email verified · {BRAND}</title></Head>
        <AuthLayout
          title="Email verified"
          subtitle="Your address has been confirmed. You can now log in to your account."
          footer={(
            <>
              {/* text-[var(--primary)] → gold accent link from color.ts */}
              <Link href="/auth/login" className="text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors duration-150">
                Back to login
              </Link>
            </>
          )}
        >
          <div className="flex flex-col items-center gap-6 py-2">
            {/* text-[var(--success)] → green success / gain color from color.ts */}
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--success-muted)]">
              <CheckCircle className="h-8 w-8 text-[var(--success)]" />
            </div>
            {/* bg-[var(--success-muted)] border-[var(--success)] text-[var(--success-foreground)] → success banner */}
            <div className="w-full rounded-input border border-[var(--success)]/30 bg-[var(--success-muted)] px-4 py-3 text-center text-sm text-[var(--success-foreground)]">
              Your account is ready to use.
            </div>
            <Link href="/auth/login" className="w-full">
              <Button variant="primary" size="lg" fullWidth>
                Log in now
              </Button>
            </Link>
          </div>
        </AuthLayout>
      </>
    );
  }

  // ── Error ──
  return (
    <>
      <Head><title>Verification failed · {BRAND}</title></Head>
      <AuthLayout
        title="Verification failed"
        subtitle="We couldn't verify your email. The link may have expired or already been used."
        footer={(
          <>
            Need help?{' '}
            {/* text-[var(--primary)] → gold accent link from color.ts */}
            <Link href="/auth/login" className="text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors duration-150">
              Back to login
            </Link>
          </>
        )}
      >
        <div className="flex flex-col items-center gap-6 py-2">
          {/* text-[var(--error)] → red danger/loss color from color.ts */}
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--error-muted)]">
            <XCircle className="h-8 w-8 text-[var(--error)]" />
          </div>

          {errorMessage && (
            <div
              role="alert"
              {/* border-[var(--error)] bg-[var(--error-muted)] text-[var(--error)] → semantic error state */}
              className="w-full rounded-input border border-[var(--error)]/40 bg-[var(--error-muted)] px-3 py-2 text-xs text-[var(--error)]"
            >
              {errorMessage}
            </div>
          )}

          <div className="flex w-full flex-col gap-3">
            <Link href="/auth/register" className="w-full">
              <Button variant="primary" size="lg" fullWidth>
                Create a new account
              </Button>
            </Link>
            {/* hover:bg-[var(--hover-bg)] → generic hover overlay; border-[var(--border)] → default border */}
            <Link href="/auth/login" className="w-full">
              <Button variant="ghost" size="lg" fullWidth>
                Back to login
              </Button>
            </Link>
          </div>
        </div>
      </AuthLayout>
    </>
  );
}
