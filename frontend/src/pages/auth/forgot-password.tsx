// pages/auth/forgot-password.tsx
// ── BaneTrading · Forgot Password — Amber / Grid theme ──

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, ArrowRight, ShieldAlert } from 'lucide-react';

import { AuthLayout } from '../../components/auth/AuthLayout';
import { FormField } from '../../components/auth/FormField';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { toast } from '../../components/ui/Toast';
import { authService } from '../../services/authService';
import { normalizeError, NormalizedApiError } from '../../services/apiClient';
import { forgotPasswordFormSchema, ForgotPasswordFormValues } from '../../lib/validators';

const BRAND = 'BaneTrading';

export default function ForgotPasswordPage(): JSX.Element {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMounted(true); }, []);

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
      setSentEmail(values.email);
      setSent(true);
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

  if (!mounted) return <div className="min-h-screen bg-[var(--background)]" />;

  return (
    <>
      <Head>
        <title>Forgot password · {BRAND}</title>
        <meta name="description" content="Reset your BaneTrading account password" />
      </Head>

      <AuthLayout
        title="Forgot your password?"
        subtitle="Enter the email linked to your account and we'll send a 6-digit verification code."
        pageTheme="amber"
        backgroundVariant="grid"
        pillLabel="Account Recovery"
        footer={
          <>
            Remembered it?{' '}
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
        {sent ? (
          /* Success state */
          <div className="flex flex-col items-center gap-5 py-2 text-center">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{
                background: 'var(--page-accent-muted)',
                border: '1px solid var(--page-accent-muted)',
                animation: 'successBounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both',
              }}
            >
              <Mail className="h-7 w-7" style={{ color: 'var(--page-accent)' }} />
            </div>
            <div>
              <p className="font-semibold text-[var(--text-primary)]">Code sent!</p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                We sent a reset code to{' '}
                <span className="font-medium text-[var(--text-primary)]">{sentEmail}</span>.
                Check your inbox and spam folder.
              </p>
            </div>
            <Link href={{ pathname: '/auth/verify-otp', query: { email: sentEmail, purpose: 'password_reset' } }}
              className="w-full">
              <Button variant="primary" size="lg" fullWidth
                className="transition-transform hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: 'var(--page-accent)', boxShadow: '0 0 20px var(--page-accent-muted)' }}>
                <span>Enter verification code</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
            {/* Info banner */}
            <div
              className="flex items-start gap-3 rounded-xl border px-4 py-3"
              style={{
                borderColor: 'var(--page-accent-muted)',
                background: 'var(--page-accent-muted)',
                animation: 'authFadeUp 0.4s 0.2s both',
              }}
            >
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--page-accent)' }} />
              <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                For security, we verify ownership before allowing a password reset.
                The code expires in <span className="font-semibold text-[var(--text-primary)]">10 minutes</span>.
              </p>
            </div>

            {/* Email */}
            <div style={{ animation: 'authFadeUp 0.4s 0.3s both' }}>
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

            {/* Server error */}
            {serverError && (
              <div
                role="alert"
                className="rounded-lg border border-[var(--danger-muted)] bg-[var(--danger-muted)] px-4 py-3 text-xs text-[var(--danger-fg)] flex items-center gap-2"
                style={{ animation: 'authFadeUp 0.4s 0.34s both' }}
              >
                <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm.75 4a.75.75 0 0 0-1.5 0v3.5a.75.75 0 0 0 1.5 0V5zm-.75 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
                </svg>
                {serverError}
              </div>
            )}

            {/* CTA */}
            <div style={{ animation: 'authFadeUp 0.4s 0.44s both' }}>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={isSubmitting}
                className="transition-transform hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: 'var(--page-accent)', boxShadow: '0 0 20px var(--page-accent-muted)' }}
              >
                Send reset code
              </Button>
            </div>

            {/* Step indicator */}
            <div className="flex items-center justify-center gap-2 pt-1" style={{ animation: 'authFadeUp 0.4s 0.38s both' }}>
              {['Enter email', 'Verify code', 'New password'].map((step, i) => (
                <div key={step} className="flex items-center gap-1.5">
                  <div
                    className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold"
                    style={{
                      background: i === 0 ? 'var(--page-accent)' : 'var(--bg-muted)',
                      color: i === 0 ? 'var(--text-inverse)' : 'var(--text-muted)',
                      animation: i === 0 ? 'ctaPulse 2s ease-in-out infinite' : undefined,
                      boxShadow: i === 0 ? '0 0 8px var(--page-accent-muted)' : undefined,
                    }}
                  >
                    {i + 1}
                  </div>
                  <span className="hidden sm:block text-[10px] uppercase tracking-wide"
                    style={{ color: i === 0 ? 'var(--page-accent)' : 'var(--text-muted)' }}>
                    {step}
                  </span>
                  {i < 2 && <div className="h-px w-4 bg-[var(--border)]" />}
                </div>
              ))}
            </div>
          </form>
        )}
      </AuthLayout>
    </>
  );
}