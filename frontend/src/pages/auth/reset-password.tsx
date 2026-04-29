// pages/auth/reset-password.tsx
// ── BaneTrading · Reset Password — Rose / Hexagon theme ──

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, AlertTriangle, CheckCircle2 } from 'lucide-react';

import { AuthLayout } from '../../components/auth/AuthLayout';
import { FormField } from '../../components/auth/FormField';
import { PasswordStrengthMeter } from '../../components/auth/PasswordStrengthMeter';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { toast } from '../../components/ui/Toast';
import { authService } from '../../services/authService';
import { normalizeError, NormalizedApiError } from '../../services/apiClient';
import { resetPasswordFormSchema, ResetPasswordFormValues } from '../../lib/validators';

const BRAND = 'BaneTrading';

export default function ResetPasswordPage(): JSX.Element {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const token = useMemo(() => {
    const raw = router.query.token;
    return typeof raw === 'string' ? raw : '';
  }, [router.query.token]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  const newPassword = watch('newPassword') || '';

  const onSubmit = async (values: ResetPasswordFormValues): Promise<void> => {
    setServerError(null);
    if (!token) {
      setServerError('Reset link is invalid or missing. Please request a new one.');
      return;
    }
    try {
      await authService.resetPassword({ token, newPassword: values.newPassword });
      setSuccess(true);
      toast.success('Password reset successfully.');
      setTimeout(() => router.push('/auth/login'), 2500);
    } catch (err) {
      const normalized = normalizeError(err) as NormalizedApiError;
      setServerError(normalized.message || 'Could not reset password');
    }
  };

  if (!mounted) return <div className="min-h-screen bg-[var(--background)]" />;

  // ── Invalid / missing token state ──
  if (router.isReady && !token) {
    return (
      <>
        <Head><title>Reset password · {BRAND}</title></Head>
        <AuthLayout
          title="Link invalid or expired"
          subtitle="We couldn't verify this reset request. Please request a new code to continue."
          pageTheme="rose"
          backgroundVariant="hexagon"
          pillLabel="Link Expired"
        >
          <div className="flex flex-col items-center gap-5 py-2">
            {/* Icon */}
            <div
              className="flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{
                background: 'var(--danger-muted)',
                border: '1px solid var(--danger-muted)',
                animation: 'animate-otp-shake 0.4s 0.2s both',
              }}
            >
              <AlertTriangle className="h-7 w-7 text-[var(--danger-fg)]" />
            </div>

            <div className="text-center">
              <p className="font-semibold text-[var(--text-primary)]">This link has expired</p>
              <p className="mt-1.5 text-sm text-[var(--text-secondary)]">
                Password reset links are valid for 10 minutes and can only be used once.
                Request a new link to continue.
              </p>
            </div>

            {/* Error banner */}
            <div
              className="w-full flex items-start gap-3 rounded-xl border px-4 py-3"
              style={{ borderColor: 'var(--danger-muted)', background: 'var(--danger-muted)' }}
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--danger-fg)]" />
              <p className="text-xs text-[var(--danger-fg)]">
                This reset link is invalid or the token is missing from the URL.
              </p>
            </div>

            <Link href="/auth/forgot-password" className="w-full">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                className="transition-transform hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: 'var(--page-accent)', boxShadow: '0 0 20px var(--page-accent-muted)' }}
              >
                Request a new reset link
              </Button>
            </Link>
          </div>
        </AuthLayout>
      </>
    );
  }

  // ── Success state ──
  if (success) {
    return (
      <>
        <Head><title>Password updated · {BRAND}</title></Head>
        <AuthLayout
          title="Password updated"
          subtitle="Your password has been reset successfully. Redirecting you to login…"
          pageTheme="rose"
          backgroundVariant="hexagon"
          pillLabel="Success"
        >
          <div className="flex flex-col items-center gap-5 py-2 text-center">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{
                background: 'var(--success-muted)',
                border: '1px solid var(--success-muted)',
                animation: 'successBounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both',
              }}
            >
              <CheckCircle2 className="h-7 w-7 text-[var(--success)]" />
            </div>
            <div>
              <p className="font-semibold text-[var(--text-primary)]">All done!</p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                You can now log in with your new password. All other sessions have been signed out.
              </p>
            </div>
            <Link href="/auth/login" className="w-full">
              <Button variant="primary" size="lg" fullWidth
                className="transition-transform hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: 'var(--page-accent)', boxShadow: '0 0 20px var(--page-accent-muted)' }}>
                Go to login
              </Button>
            </Link>
          </div>
        </AuthLayout>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Reset password · {BRAND}</title>
        <meta name="description" content="Set a new password for your BaneTrading account" />
      </Head>

      <AuthLayout
        title="Set a new password"
        subtitle="Choose a strong password you don't use elsewhere. All other sessions will be signed out immediately."
        pageTheme="rose"
        backgroundVariant="hexagon"
        pillLabel="Password Reset · Step 3"
        footer={
          <>
            Changed your mind?{' '}
            <Link
              href="/auth/login"
              className="font-semibold transition-colors duration-150 hover:underline"
              style={{ color: 'var(--page-accent)' }}
            >
              Back to login
            </Link>
          </>
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
          {/* Step progress */}
          <div className="flex items-center gap-1.5" style={{ animation: 'authFadeUp 0.4s 0.2s both' }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-1 flex-1 rounded-full"
                style={{
                  background: 'var(--page-accent)',
                  animation: `barFill 0.6s ${i * 0.15}s ease-out both`,
                  transformOrigin: 'left',
                }}
              />
            ))}
            <span className="ml-2 text-[10px] uppercase tracking-wide text-[var(--text-muted)] whitespace-nowrap">
              Step 3 of 3
            </span>
          </div>

          {/* New password */}
          <div style={{ animation: 'authFadeUp 0.4s 0.28s both' }}>
            <FormField label="New password" htmlFor="newPassword" error={errors.newPassword?.message}>
              <Input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                showPasswordToggle
                leading={<Lock className="h-4 w-4" style={{ color: 'var(--page-accent)' }} />}
                error={errors.newPassword?.message}
                {...register('newPassword')}
              />
              <PasswordStrengthMeter password={newPassword} className="mt-2" />
            </FormField>
          </div>

          {/* Confirm password */}
          <div style={{ animation: 'authFadeUp 0.4s 0.34s both' }}>
            <FormField label="Confirm new password" htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="Re-enter the same password"
                showPasswordToggle
                leading={<Lock className="h-4 w-4" style={{ color: 'var(--page-accent)' }} />}
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
              />
            </FormField>
          </div>

          {/* Security note */}
          <div
            className="flex items-start gap-3 rounded-xl border-l-2 px-4 py-3"
            style={{
              borderColor: 'var(--page-accent-muted)',
              borderLeftColor: 'var(--page-accent)',
              background: 'var(--page-accent-muted)',
              animation: 'authFadeUp 0.4s 0.40s both',
            }}
          >
            <svg className="mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 16 16" fill="none" style={{ color: 'var(--page-accent)' }}>
              <path d="M8 1L14 4v4c0 3.3-2.6 6.4-6 7-3.4-.6-6-3.7-6-7V4l6-3z"
                stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M5.5 8l1.5 1.5L10 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="text-[11px] leading-relaxed text-[var(--text-secondary)]">
              After reset, all active sessions on other devices will be immediately signed out for your security.
            </p>
          </div>

          {/* Server error */}
          {serverError && (
            <div
              role="alert"
              className="rounded-lg border border-[var(--danger-muted)] bg-[var(--danger-muted)] px-4 py-3 text-xs text-[var(--danger-fg)] flex items-start justify-between gap-3"
              style={{ animation: 'authFadeUp 0.4s 0.44s both' }}
            >
              <div className="flex items-start gap-2">
                <svg className="mt-0.5 h-3.5 w-3.5 shrink-0" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm.75 4a.75.75 0 0 0-1.5 0v3.5a.75.75 0 0 0 1.5 0V5zm-.75 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
                </svg>
                <span>{serverError}</span>
              </div>
              <Link href="/auth/forgot-password" className="shrink-0 font-semibold underline whitespace-nowrap">
                New link
              </Link>
            </div>
          )}

          {/* CTA */}
          <div style={{ animation: 'authFadeUp 0.4s 0.50s both' }}>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={isSubmitting}
              className="transition-transform hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: 'var(--page-accent)', boxShadow: '0 0 20px var(--page-accent-muted)' }}
            >
              Reset password
            </Button>
          </div>
        </form>
      </AuthLayout>
    </>
  );
}