// pages/auth/login.tsx
// ── BaneTrading · Login — Indigo / Candlestick theme ──

import { useEffect, useState } from 'react';
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

const BRAND = 'BaneTrading';

export default function LoginPage(): JSX.Element {
  const router = useRouter();
  const { login } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [notVerified, setNotVerified] = useState<{ email: string } | null>(null);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMounted(true); }, []);

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

  if (!mounted) return <div className="min-h-screen bg-[var(--background)]" />;

  return (
    <>
      <Head>
        <title>Log in · {BRAND}</title>
        <meta name="description" content="Log in to your BaneTrading account" />
      </Head>

      <AuthLayout
        title="Welcome back"
        subtitle="Log in to access your account, balances, and open positions."
        pageTheme="indigo"
        backgroundVariant="candlestick"
        pillLabel="Secure Login"
        footer={
          <>
            Don&apos;t have an account?{' '}
            <Link
              href="/auth/register"
              className="font-semibold transition-colors duration-150"
              style={{ color: 'var(--page-accent)' }}
            >
              Create account
            </Link>
          </>
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          {/* Email */}
          <div style={{ animation: 'authFadeUp 0.4s 0.2s both' }}>
            <FormField label="Email address" htmlFor="email" error={errors.email?.message}>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                leading={<Mail className="h-4 w-4" style={{ color: 'var(--page-accent)' }} />}
                error={errors.email?.message}
                {...register('email')}
              />
            </FormField>
          </div>

          {/* Password */}
          <div style={{ animation: 'authFadeUp 0.4s 0.28s both' }}>
            <FormField label="Password" htmlFor="password" error={errors.password?.message}>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                showPasswordToggle
                leading={<Lock className="h-4 w-4" style={{ color: 'var(--page-accent)' }} />}
                error={errors.password?.message}
                {...register('password')}
              />
            </FormField>
          </div>

          {/* Remember + Forgot */}
          <div className="flex items-center justify-between" style={{ animation: 'authFadeUp 0.4s 0.34s both' }}>
            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                {...register('remember')}
                className="h-4 w-4 rounded border-[var(--border)] bg-[var(--card)]"
                style={{ accentColor: 'var(--page-accent)' }}
              />
              <span className="text-xs text-[var(--text-secondary)]">Remember me</span>
            </label>
            <Link
              href="/auth/forgot-password"
              className="text-xs font-medium transition-colors duration-150 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--page-accent)] rounded-sm"
              style={{ color: 'var(--page-accent)' }}
            >
              Forgot password?
            </Link>
          </div>

          {/* Server error */}
          {serverError && (
            <div
              role="alert"
              className="rounded-lg border border-[var(--danger-muted)] bg-[var(--danger-muted)] px-4 py-3 text-xs text-[var(--danger-fg)] flex items-start gap-2"
              style={{ animation: 'authFadeUp 0.4s 0.38s both' }}
            >
              <svg className="mt-0.5 h-3.5 w-3.5 shrink-0" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm.75 4a.75.75 0 0 0-1.5 0v3.5a.75.75 0 0 0 1.5 0V5zm-.75 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
              </svg>
              <span>
                {serverError}
                {notVerified && (
                  <>
                    {' '}
                    <Link
                      href={{ pathname: '/auth/verify-otp', query: { email: notVerified.email, purpose: 'email_verification' } }}
                      className="font-semibold underline"
                    >
                      Verify now
                    </Link>
                    .
                  </>
                )}
              </span>
            </div>
          )}

          {/* CTA */}
          <div style={{ animation: 'authFadeUp 0.4s 0.42s both' }}>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={isSubmitting}
              className="mt-1 transition-transform hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: 'var(--page-accent)',
                boxShadow: '0 0 20px var(--page-accent-muted)',
              }}
            >
              Log in to BaneTrading
            </Button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]" style={{ animation: 'authFadeUp 0.4s 0.48s both' }}>
            <div className="flex-1 h-px bg-[var(--border)]" />
            <span>or continue with</span>
            <div className="flex-1 h-px bg-[var(--border)]" />
          </div>

          {/* Social placeholder */}
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-muted)] px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition-all duration-150 hover:border-[var(--border-strong)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] hover:shadow-[0_0_16px_var(--page-accent-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--page-accent)]"
            style={{ animation: 'authFadeUp 0.4s 0.52s both' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/>
              <path fill="#34A853" d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09C3.515 21.3 7.565 24 12.255 24z"/>
              <path fill="#FBBC05" d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62h-3.98a11.86 11.86 0 0 0 0 10.76l3.98-3.09z"/>
              <path fill="#EA4335" d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0c-4.69 0-8.74 2.7-10.71 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/>
            </svg>
            Continue with Google
          </button>
          {/* Admin login link */}
<div className="mt-4 text-center" style={{ animation: 'authFadeUp 0.4s 0.56s both' }}>
  <Link
    href="/admin/login"
    className="text-xs transition-colors hover:underline"
    style={{ color: 'var(--text-muted)' }}
  >
    🛡️ Admin Login
  </Link>
</div>
        </form>
      </AuthLayout>
    </>
  );
}