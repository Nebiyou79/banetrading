// pages/auth/verify-otp.tsx
// ── BaneTrading · OTP Verification — Violet / Waves theme ──

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { MailCheck } from 'lucide-react';

import { AuthLayout } from '../../components/auth/AuthLayout';
import { OtpInput, OtpInputHandle } from '../../components/auth/OtpInput';
import { Button } from '../../components/ui/Button';
import { toast } from '../../components/ui/Toast';
import { authService } from '../../services/authService';
import { normalizeError, NormalizedApiError } from '../../services/apiClient';
import { useCountdown } from '../../hooks/useCountdown';
import type { OtpPurpose } from '../../types/auth';

const BRAND = 'BaneTrading';
const OTP_TTL_SECONDS = 10 * 60;
const RESEND_COOLDOWN = 60;

function isPurpose(p: unknown): p is OtpPurpose {
  return p === 'email_verification' || p === 'password_reset';
}

function formatMMSS(s: number): string {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

export default function VerifyOtpPage(): JSX.Element {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [otp, setOtp] = useState('');
  const [invalid, setInvalid] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const inputRef = useRef<OtpInputHandle | null>(null);

  const expiry = useCountdown(OTP_TTL_SECONDS);
  const resend = useCountdown(0);

  useEffect(() => { setMounted(true); }, []);

  const email = typeof router.query.email === 'string' ? router.query.email : '';
  const purposeRaw = router.query.purpose;
  const purpose: OtpPurpose = isPurpose(purposeRaw) ? purposeRaw : 'email_verification';

  useEffect(() => {
    if (!router.isReady) return;
    if (!email) {
      router.replace(purpose === 'password_reset' ? '/auth/forgot-password' : '/auth/register');
    }
  }, [router, email, purpose]);

  const handleVerify = async (code: string): Promise<void> => {
    if (code.length !== 6) return;
    setServerError(null);
    setSubmitting(true);
    try {
      const resp = await authService.verifyOtp({ email, otp: code, purpose });
      if (purpose === 'email_verification') {
        toast.success('Email verified — please log in.');
        router.push('/auth/login');
      } else {
        if (!resp.resetToken) {
          setServerError('Unexpected response. Please try again.');
          return;
        }
        router.push({ pathname: '/auth/reset-password', query: { token: resp.resetToken } });
      }
    } catch (err) {
      const normalized = normalizeError(err) as NormalizedApiError;
      setServerError(normalized.message || 'Invalid code — please try again.');
      setInvalid(true);
      inputRef.current?.shake();
      setOtp('');
      setTimeout(() => {
        setInvalid(false);
        inputRef.current?.focus();
      }, 420);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async (): Promise<void> => {
    if (!resend.isDone || resending || !email) return;
    setServerError(null);
    setResending(true);
    try {
      await authService.resendOtp({ email, purpose });
      toast.success('A new code has been sent.');
      expiry.restart(OTP_TTL_SECONDS);
      resend.restart(RESEND_COOLDOWN);
      setOtp('');
      inputRef.current?.focus();
    } catch (err) {
      const normalized = normalizeError(err) as NormalizedApiError;
      setServerError(normalized.message || 'Could not resend code');
    } finally {
      setResending(false);
    }
  };

  const isPasswordReset = purpose === 'password_reset';
  const title = isPasswordReset ? 'Verify your identity' : 'Verify your email';
  const subtitle = email
    ? `We sent a 6-digit code to ${email}. Enter it below to continue.`
    : "We sent a 6-digit code to your email. Enter it below to continue.";

  const stepInfo = isPasswordReset
    ? { current: 2, total: 3, label: 'Step 2 of 3 — Verify code' }
    : null;

  const timerColor = expiry.secondsLeft < 30 ? 'var(--danger)' :
                     expiry.secondsLeft < 60 ? 'var(--warning)' : 'var(--text-primary)';

  if (!mounted) return <div className="min-h-screen bg-[var(--background)]" />;

  return (
    <>
      <Head>
        <title>{title} · {BRAND}</title>
        <meta name="description" content="Verify your BaneTrading account" />
      </Head>

      <AuthLayout
        title={title}
        subtitle={subtitle}
        pageTheme="violet"
        backgroundVariant="waves"
        pillLabel={isPasswordReset ? 'Password Reset · Step 2' : 'Email Verification'}
        footer={
          <>
            Wrong email?{' '}
            <Link
              href={isPasswordReset ? '/auth/forgot-password' : '/auth/register'}
              className="font-semibold transition-colors duration-150 hover:underline"
              style={{ color: 'var(--page-accent)' }}
            >
              Go back
            </Link>
          </>
        }
      >
        <div className="flex flex-col gap-5">
          {/* Email hint banner */}
          <div
            className="flex items-center gap-3 rounded-xl border px-4 py-3"
            style={{
              borderColor: 'var(--page-accent-muted)',
              background: 'var(--page-accent-muted)',
              animation: 'authFadeUp 0.4s 0.2s both',
            }}
          >
            <MailCheck className="h-4 w-4 shrink-0 animate-pulse" style={{ color: 'var(--page-accent)' }} />
            <div className="flex-1 min-w-0">
              <p className="truncate text-xs font-medium text-[var(--text-primary)]">{email}</p>
              <p className="text-[11px] text-[var(--text-secondary)]">Can&apos;t find it? Check your spam folder.</p>
            </div>
          </div>

          {/* OTP boxes */}
          <div className="py-2" style={{ animation: 'authFadeUp 0.4s 0.28s both' }}>
            <OtpInput
              ref={inputRef}
              value={otp}
              onChange={setOtp}
              onComplete={handleVerify}
              invalid={invalid}
              disabled={submitting}
            />
          </div>

          {/* Timer + resend row */}
          <div className="flex items-center justify-between text-xs" style={{ animation: 'authFadeUp 0.4s 0.34s both' }}>
            <span className="text-[var(--text-secondary)]">
              {expiry.isDone ? (
                <span className="font-medium text-[var(--danger)]">Code expired — please resend</span>
              ) : (
                <>
                  Expires in{' '}
                  <span className="tabular font-semibold" style={{ color: timerColor }}>
                    {formatMMSS(expiry.secondsLeft)}
                  </span>
                </>
              )}
            </span>
            <button
              type="button"
              onClick={handleResend}
              disabled={!resend.isDone || resending}
              className="font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--page-accent)] rounded-sm"
              style={{ color: resend.isDone && !resending ? 'var(--page-accent)' : undefined }}
            >
              {resending
                ? 'Sending…'
                : resend.isDone
                  ? 'Resend code'
                  : `Resend in ${resend.secondsLeft}s`}
            </button>
          </div>

          {/* Segmented progress (password reset) */}
          {stepInfo && (
            <div className="flex items-center gap-1.5" style={{ animation: 'authFadeUp 0.4s 0.40s both' }}>
              {Array.from({ length: stepInfo.total }).map((_, i) => (
                <div
                  key={i}
                  className="h-1 flex-1 rounded-full transition-all duration-500"
                  style={{
                    background: i < stepInfo.current
                      ? 'var(--page-accent)'
                      : 'var(--border)',
                  }}
                />
              ))}
              <span className="ml-2 text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
                {stepInfo.label}
              </span>
            </div>
          )}

          {/* Server error */}
          {serverError && (
            <div
              role="alert"
              className="rounded-lg border border-[var(--danger-muted)] bg-[var(--danger-muted)] px-4 py-3 text-xs text-[var(--danger-fg)] flex items-center gap-2 animate-otp-shake"
              style={{ animation: 'authFadeUp 0.4s 0.44s both' }}
            >
              <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm.75 4a.75.75 0 0 0-1.5 0v3.5a.75.75 0 0 0 1.5 0V5zm-.75 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
              </svg>
              {serverError}
            </div>
          )}

          {/* CTA */}
          <div style={{ animation: 'authFadeUp 0.4s 0.50s both' }}>
            <Button
              type="button"
              variant="primary"
              size="lg"
              fullWidth
              loading={submitting}
              disabled={otp.length !== 6 || expiry.isDone}
              onClick={() => handleVerify(otp)}
              className="transition-transform hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: otp.length === 6 && !expiry.isDone ? 'var(--page-accent)' : undefined,
                boxShadow: otp.length === 6 && !expiry.isDone ? '0 0 20px var(--page-accent-muted)' : undefined,
              }}
            >
              {isPasswordReset ? 'Verify & continue' : 'Verify email'}
            </Button>
          </div>

          {/* Helper tip */}
          <p className="text-center text-[11px] text-[var(--text-muted)]" style={{ animation: 'authFadeUp 0.4s 0.56s both' }}>
            The code is valid for 10 minutes. Codes are single-use and expire immediately after verification.
          </p>
        </div>
      </AuthLayout>
    </>
  );
}