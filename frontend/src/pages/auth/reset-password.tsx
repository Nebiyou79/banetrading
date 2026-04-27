// pages/auth/reset-password.tsx
// ── Reset password (step 3 of 3) ──

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, AlertTriangle } from 'lucide-react';

import { AuthLayout } from '../../components/auth/AuthLayout';
import { FormField } from '../../components/auth/FormField';
import { PasswordStrengthMeter } from '../../components/auth/PasswordStrengthMeter';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { toast } from '../../components/ui/Toast';
import { authService } from '../../services/authService';
import { normalizeError, NormalizedApiError } from '../../services/apiClient';
import { resetPasswordFormSchema, ResetPasswordFormValues } from '../../lib/validators';

const BRAND = process.env.NEXT_PUBLIC_BRAND_NAME || 'PrimeBitTrade Clone';

export default function ResetPasswordPage(): JSX.Element {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

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
      toast.success('Password reset. Please log in with your new password.');
      router.push('/auth/login');
    } catch (err) {
      const normalized = normalizeError(err) as NormalizedApiError;
      setServerError(normalized.message || 'Could not reset password');
    }
  };

  // ── Missing / empty token — error state ──
  if (router.isReady && !token) {
    return (
      <>
        <Head><title>Reset password · {BRAND}</title></Head>
        <AuthLayout
          title="Link invalid or expired"
          subtitle="We couldn't verify this reset request. Please request a new code to continue."
        >
          <div className="flex flex-col items-start gap-4">
            {/* border-[var(--error)] bg-[var(--error-muted)] text-[var(--error)] → semantic error state */}
            <div className="flex items-center gap-2 rounded-input border border-[var(--error)]/40 bg-[var(--error-muted)] px-3 py-2 text-xs text-[var(--error)] w-full">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>This reset link is invalid or missing a token.</span>
            </div>
            <Link href="/auth/forgot-password" className="w-full">
              <Button variant="primary" size="lg" fullWidth>
                Request a new link
              </Button>
            </Link>
          </div>
        </AuthLayout>
      </>
    );
  }

  return (
    <>
      <Head><title>Reset password · {BRAND}</title></Head>
      <AuthLayout
        title="Set a new password"
        subtitle="Choose a strong password you don't use elsewhere. All other sessions will be signed out."
        footer={(
          <>
            Changed your mind?{' '}
            {/* text-[var(--primary)] → gold accent link from color.ts */}
            <Link href="/auth/login" className="text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors duration-150">
              Back to login
            </Link>
          </>
        )}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <FormField label="New password" htmlFor="newPassword" error={errors.newPassword?.message}>
            <Input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              showPasswordToggle
              leading={<Lock className="h-4 w-4" />}
              error={errors.newPassword?.message}
              {...register('newPassword')}
            />
            <PasswordStrengthMeter password={newPassword} className="mt-2" />
          </FormField>

          <FormField label="Confirm password" htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="Re-enter the same password"
              showPasswordToggle
              leading={<Lock className="h-4 w-4" />}
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />
          </FormField>

          {serverError && (
            <div
              role="alert"
              // {/* border-[var(--error)] bg-[var(--error-muted)] text-[var(--error)] → semantic error state */}
              className="rounded-input border border-[var(--error)]/40 bg-[var(--error-muted)] px-3 py-2 text-xs text-[var(--error)] flex items-start justify-between gap-3"
            >
              <span>{serverError}</span>
              {/* Inline link on error surface — inherits text-[var(--error)] for cohesion */}
              <Link
                href="/auth/forgot-password"
                className="font-medium underline whitespace-nowrap"
              >
                Request new link
              </Link>
            </div>
          )}

          <Button type="submit" variant="primary" size="lg" fullWidth loading={isSubmitting}>
            Reset password
          </Button>
        </form>
      </AuthLayout>
    </>
  );
}
