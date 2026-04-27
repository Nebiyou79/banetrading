// pages/auth/login.tsx
// ── Login page ──

import { useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock } from 'lucide-react';

import { AuthLayout } from '@/components/auth/AuthLayout';
import { FormField } from '@/components/auth/FormField';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';
import { useAuth } from '@/hooks/useAuth';
import { loginFormSchema, LoginFormValues } from '@/lib/validators';
import type { NormalizedApiError } from '@/services/apiClient';

const BRAND = process.env.NEXT_PUBLIC_BRAND_NAME || 'PrimeBitTrade Clone';

export default function LoginPage(): JSX.Element {
  const router = useRouter();
  const { login } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [notVerified, setNotVerified] = useState<{ email: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: '', password: '', remember: false },
  });

  const onSubmit = async (values: LoginFormValues): Promise<void> => {
    setServerError(null);
    setNotVerified(null);
    try {
      await login({ email: values.email, password: values.password });
      toast.success('Welcome back');
      const redirect = typeof router.query.redirect === 'string' ? router.query.redirect : '/welcome';
      router.push(redirect);
    } catch (err) {
      const normalized = err as NormalizedApiError;
      if (normalized.code === 'EMAIL_NOT_VERIFIED') {
        setNotVerified({ email: values.email });
      }
      setServerError(normalized.message || 'Login failed');
    }
  };

  return (
    <>
      <Head><title>Log in · {BRAND}</title></Head>
      <AuthLayout
        title="Welcome back"
        subtitle="Log in to access your account, balances, and open orders."
        footer={(
          <>
            Don&apos;t have an account?{' '}
            {/* text-[var(--primary)] → gold accent link from color.ts */}
            <Link href="/auth/register" className="text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors duration-150">
              Sign up
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

          <FormField label="Password" htmlFor="password" error={errors.password?.message}>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              showPasswordToggle
              leading={<Lock className="h-4 w-4" />}
              error={errors.password?.message}
              {...register('password')}
            />
          </FormField>

          <div className="flex items-center justify-between">
            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                {...register('remember')}
                // {/* border-[var(--border)] bg-[var(--card)] → card surface; accent-[var(--primary)] → gold checkbox */}
                className="h-4 w-4 rounded border-[var(--border)] bg-[var(--card)] accent-[var(--primary)]"
              />
              {/* text-[var(--text-secondary)] → body label color */}
              <span className="text-xs text-[var(--text-secondary)]">Remember me</span>
            </label>
            {/* text-[var(--primary)] → gold accent for forgot password link */}
            <Link href="/auth/forgot-password" className="text-xs text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors duration-150">
              Forgot password?
            </Link>
          </div>

          {serverError && (
            <div
              role="alert"
              // {/* border-[var(--error)] bg-[var(--error-muted)] text-[var(--error)] → semantic error state */}
              className="rounded-input border border-[var(--error)]/40 bg-[var(--error-muted)] px-3 py-2 text-xs text-[var(--error)]"
            >
              {serverError}
              {notVerified && (
                <>
                  {' '}
                  {/* underline link on error bg → keeps text-[var(--error)] for contrast */}
                  <Link
                    href={{ pathname: '/auth/verify-otp', query: { email: notVerified.email, purpose: 'email_verification' } }}
                    className="font-medium underline"
                  >
                    Verify now
                  </Link>.
                </>
              )}
            </div>
          )}

          <Button type="submit" variant="primary" size="lg" fullWidth loading={isSubmitting}>
            Log in
          </Button>
        </form>
      </AuthLayout>
    </>
  );
}
