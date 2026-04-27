// pages/auth/forgot-password.tsx
// ── Forgot password (step 1 of 3) ──

import { useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail } from 'lucide-react';

import { AuthLayout } from '../../components/auth/AuthLayout';
import { FormField } from '../../components/auth/FormField';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { toast } from '../../components/ui/Toast';
import { authService } from '../../services/authService';
import { normalizeError, NormalizedApiError } from '../../services/apiClient';
import { forgotPasswordFormSchema, ForgotPasswordFormValues } from '../../lib/validators';

const BRAND = process.env.NEXT_PUBLIC_BRAND_NAME || 'PrimeBitTrade Clone';

export default function ForgotPasswordPage(): JSX.Element {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordFormSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: ForgotPasswordFormValues): Promise<void> => {
    setServerError(null);
    try {
      await authService.forgotPassword({ email: values.email });
      toast.success('If that email is registered, a code has been sent.');
      router.push({
        pathname: '/auth/verify-otp',
        query: { email: values.email, purpose: 'password_reset' },
      });
    } catch (err) {
      const normalized = normalizeError(err) as NormalizedApiError;
      setServerError(normalized.message || 'Something went wrong');
    }
  };

  return (
    <>
      <Head><title>Forgot password · {BRAND}</title></Head>
      <AuthLayout
        title="Forgot your password?"
        subtitle="Enter the email associated with your account and we'll send you a 6-digit code to reset it."
        footer={(
          <>
            Remembered it?{' '}
            {/* text-[var(--primary)] → gold accent link from color.ts */}
            <Link href="/auth/login" className="text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors duration-150">
              Back to login
            </Link>
          </>
        )}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <FormField label="Email" htmlFor="email" error={errors.email?.message}>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              leading={<Mail className="h-4 w-4" />}
              error={errors.email?.message}
              {...register('email')}
            />
          </FormField>

          {serverError && (
            <div
              role="alert"
              className="rounded-input border border-[var(--error)]/40 bg-[var(--error-muted)] px-3 py-2 text-xs text-[var(--error)]"
            >
              {serverError}
            </div>
          )}

          <Button type="submit" variant="primary" size="lg" fullWidth loading={isSubmitting}>
            Send reset code
          </Button>
        </form>
      </AuthLayout>
    </>
  );
}
