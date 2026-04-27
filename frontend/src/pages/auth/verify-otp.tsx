// pages/auth/verify-otp.tsx
// ── OTP verification page (email_verification OR password_reset) ──

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

const BRAND = process.env.NEXT_PUBLIC_BRAND_NAME || 'PrimeBitTrade Clone';

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
  const [otp, setOtp] = useState('');
  const [invalid, setInvalid] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const inputRef = useRef<OtpInputHandle | null>(null);

  const expiry = useCountdown(OTP_TTL_SECONDS);
  const resend = useCountdown(0);

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
      setServerError(normalized.message || 'Invalid code');
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

  const title = purpose === 'password_reset' ? 'Verify password reset' : 'Verify your email';
  const subtitle = email
    ? `We've sent a 6-digit code to ${email}. Enter it below to continue.`
    : 'We\'ve sent a 6-digit code to your email. Enter it below to continue.';

  return (
    <>
      <Head><title>{title} · {BRAND}</title></Head>
      <AuthLayout
        title={title}
        subtitle={subtitle}
        footer={(
          <>
            Wrong email?{' '}
            {/* text-[var(--primary)] → gold accent link from color.ts */}
            <Link
              href={purpose === 'password_reset' ? '/auth/forgot-password' : '/auth/register'}
              className="text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors duration-150"
            >
              Go back
            </Link>
          </>
        )}
      >
        <div className="flex flex-col gap-6">
          {/* bg-[var(--surface)] border-[var(--border)] → elevated panel surface from color.ts */}
          <div className="flex items-center gap-3 rounded-input border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-xs text-[var(--text-secondary)]">
            {/* text-[var(--primary)] → gold accent icon from color.ts */}
            <MailCheck className="h-4 w-4 text-[var(--primary)]" />
            <span>Can&apos;t find the email? Check your spam folder.</span>
          </div>

          <OtpInput
            ref={inputRef}
            value={otp}
            onChange={setOtp}
            onComplete={handleVerify}
            invalid={invalid}
            disabled={submitting}
          />

          <div className="flex items-center justify-between text-xs">
            {/* text-[var(--text-secondary)] → body label; text-[var(--error)] → expired state danger */}
            <span className="text-[var(--text-secondary)]">
              {expiry.isDone ? (
                <span className="text-[var(--error)]">Code expired. Please resend.</span>
              ) : (
                <>
                  Code expires in{' '}
                  {/* text-[var(--text-primary)] → high-contrast countdown timer */}
                  <span className="font-medium text-[var(--text-primary)] tabular-nums">
                    {formatMMSS(expiry.secondsLeft)}
                  </span>
                </>
              )}
            </span>
            {/* text-[var(--primary)] → gold accent; disabled:text-[var(--text-muted)] → muted disabled state */}
            <button
              type="button"
              onClick={handleResend}
              disabled={!resend.isDone || resending}
              className="text-[var(--primary)] hover:text-[var(--primary-hover)] hover:underline disabled:cursor-not-allowed disabled:text-[var(--text-muted)] disabled:no-underline transition-colors duration-150"
            >
              {resending
                ? 'Sending…'
                : resend.isDone
                  ? 'Resend code'
                  : `Resend in ${resend.secondsLeft}s`}
            </button>
          </div>

          {serverError && (
            <div
              role="alert"
              // {/* border-[var(--error)] bg-[var(--error-muted)] text-[var(--error)] → semantic error state */}
              className="rounded-input border border-[var(--error)]/40 bg-[var(--error-muted)] px-3 py-2 text-xs text-[var(--error)]"
            >
              {serverError}
            </div>
          )}

          <Button
            type="button"
            variant="primary"
            size="lg"
            fullWidth
            loading={submitting}
            disabled={otp.length !== 6 || expiry.isDone}
            onClick={() => handleVerify(otp)}
          >
            Verify
          </Button>
        </div>
      </AuthLayout>
    </>
  );
}
