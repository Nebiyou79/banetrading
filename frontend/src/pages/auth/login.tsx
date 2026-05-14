// pages/auth/login.tsx
// ── BigOneTrading · Login — Indigo / Candlestick theme with Google Sign-In ──

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock } from 'lucide-react';

import { AuthLayout } from '@/components/auth/AuthLayout';
import { FormField } from '@/components/auth/FormField';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';
import { useAuth } from '@/hooks/useAuth';
import { loginFormSchema, LoginFormValues } from '@/lib/validators';
import type { NormalizedApiError } from '@/services/apiClient';

const BRAND = 'BigOneTrading';

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
      // login() now returns LoginResponse, but we don't need it here since
      // the AuthContext already handles setting the user
      await login({ email: values.email, password: values.password });
      toast.success('Welcome back');
      const redirect = typeof router.query.redirect === 'string' ? router.query.redirect : '/dashboard';
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
        <meta name="description" content="Log in to your BigOneTrading account" />
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
              Log in to BigOneTrading
            </Button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]" style={{ animation: 'authFadeUp 0.4s 0.48s both' }}>
            <div className="flex-1 h-px bg-[var(--border)]" />
            <span>or continue with</span>
            <div className="flex-1 h-px bg-[var(--border)]" />
          </div>

          {/* Google Sign-In */}
          <div style={{ animation: 'authFadeUp 0.4s 0.52s both' }}>
            <GoogleSignInButton />
          </div>

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