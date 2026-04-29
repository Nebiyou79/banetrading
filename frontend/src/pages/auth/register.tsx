// pages/auth/register.tsx
// ── BaneTrading · Register — Teal / Network theme ──

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, User as UserIcon, Check, X, Tag } from 'lucide-react';

import { AuthLayout } from '../../components/auth/AuthLayout';
import { FormField } from '../../components/auth/FormField';
import { PasswordStrengthMeter } from '../../components/auth/PasswordStrengthMeter';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Spinner } from '../../components/ui/Spinner';
import { toast } from '../../components/ui/Toast';
import { useAuth } from '../../hooks/useAuth';
import { promoService } from '../../services/promoService';
import { registerFormSchema, RegisterFormValues } from '../../lib/validators';
import { COUNTRIES } from '../../lib/countries';
import type { NormalizedApiError } from '../../services/apiClient';

const BRAND = 'BaneTrading';

type PromoState =
  | { status: 'idle' }
  | { status: 'checking' }
  | { status: 'valid'; code: string }
  | { status: 'invalid'; reason: 'format' | 'not_found' | 'inactive' };

export default function RegisterPage(): JSX.Element {
  const router = useRouter();
  const { register: doRegister } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [promoState, setPromoState] = useState<PromoState>({ status: 'idle' });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setMounted(true); }, []);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    mode: 'onBlur',
    defaultValues: { name: '', email: '', password: '', country: '', promoCode: undefined },
  });

  const password = watch('password') || '';
  const promoValue = watch('promoCode') || '';

  // Live promo validation
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const raw = (promoValue || '').trim();
    if (!raw) { setPromoState({ status: 'idle' }); return; }
    if (!/^[A-Za-z0-9]{6,12}$/.test(raw)) {
      setPromoState({ status: 'invalid', reason: 'format' });
      return;
    }
    setPromoState({ status: 'checking' });
    debounceRef.current = setTimeout(async () => {
      try {
        const resp = await promoService.validatePromo(raw);
        if (resp.valid && resp.code) {
          setPromoState({ status: 'valid', code: resp.code });
        } else {
          setPromoState({ status: 'invalid', reason: (resp.reason as 'not_found' | 'inactive' | 'format') || 'not_found' });
        }
      } catch {
        setPromoState({ status: 'invalid', reason: 'not_found' });
      }
    }, 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [promoValue]);

  const onSubmit = async (values: RegisterFormValues): Promise<void> => {
    setServerError(null);
    if (values.promoCode && promoState.status === 'invalid') {
      setServerError('The promo code you entered is not valid. Remove it or enter a different code.');
      return;
    }
    try {
      await doRegister({
        name: values.name.trim(),
        email: values.email,
        password: values.password,
        country: values.country,
        promoCode: values.promoCode || undefined,
      });
      toast.success('Account created. Verification code sent.');
      router.push({ pathname: '/auth/verify-otp', query: { email: values.email, purpose: 'email_verification' } });
    } catch (err) {
      const normalized = err as NormalizedApiError;
      setServerError(normalized.message || 'Registration failed');
    }
  };

  const countryOptions = COUNTRIES.map((c) => ({ value: c.code, label: c.name }));

  if (!mounted) return <div className="min-h-screen bg-[var(--background)]" />;

  return (
    <>
      <Head>
        <title>Create account · {BRAND}</title>
        <meta name="description" content="Create your BaneTrading account" />
      </Head>

      <AuthLayout
        title="Create your account"
        subtitle="Start trading in under a minute. No paperwork, no clutter — just markets."
        pageTheme="teal"
        backgroundVariant="network"
        pillLabel="Free Account"
        footer={
          <>
            Already have an account?{' '}
            <Link
              href="/auth/login"
              className="font-semibold transition-colors duration-150 hover:underline"
              style={{ color: 'var(--page-accent)' }}
            >
              Log in
            </Link>
          </>
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          {/* Full name */}
          <div style={{ animation: 'authFadeUp 0.4s 0.2s both' }}>
            <FormField label="Full name" htmlFor="name" error={errors.name?.message}>
              <Input
                id="name"
                type="text"
                autoComplete="name"
                placeholder="Jane Trader"
                leading={<UserIcon className="h-4 w-4" style={{ color: 'var(--page-accent)' }} />}
                error={errors.name?.message}
                {...register('name')}
              />
            </FormField>
          </div>

          {/* Email */}
          <div style={{ animation: 'authFadeUp 0.4s 0.28s both' }}>
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

          {/* Password + strength */}
          <div style={{ animation: 'authFadeUp 0.4s 0.34s both' }}>
            <FormField label="Password" htmlFor="password" error={errors.password?.message}>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                showPasswordToggle
                leading={<Lock className="h-4 w-4" style={{ color: 'var(--page-accent)' }} />}
                error={errors.password?.message}
                {...register('password')}
              />
              <PasswordStrengthMeter password={password} className="mt-2" />
            </FormField>
          </div>

          {/* Country */}
          <div style={{ animation: 'authFadeUp 0.4s 0.40s both' }}>
            <FormField label="Country of residence" htmlFor="country" error={errors.country?.message}>
              <Controller
                control={control}
                name="country"
                render={({ field }) => (
                  <Select
                    id="country"
                    value={field.value}
                    onChange={field.onChange}
                    options={countryOptions}
                    placeholder="Select your country"
                    error={errors.country?.message}
                    searchable
                  />
                )}
              />
            </FormField>
          </div>

          {/* Promo code */}
          <div style={{ animation: 'authFadeUp 0.4s 0.46s both' }}>
            <FormField
              label="Promo / referral code (optional)"
              htmlFor="promoCode"
              error={errors.promoCode?.message}
              helper={<PromoHelper state={promoState} />}
            >
              <Input
                id="promoCode"
                type="text"
                autoCapitalize="characters"
                placeholder="Enter code (6–12 characters)"
                leading={<Tag className="h-4 w-4" style={{ color: 'var(--page-accent)' }} />}
                trailing={<PromoTrailing state={promoState} />}
                error={errors.promoCode?.message}
                style={{
                  boxShadow: promoState.status === 'valid' ? '0 0 12px var(--success-muted)' : undefined,
                  transition: 'box-shadow 0.3s ease',
                }}
                {...register('promoCode')}
              />
            </FormField>
          </div>

          {/* Server error */}
          {serverError && (
            <div
              role="alert"
              className="rounded-lg border border-[var(--danger-muted)] bg-[var(--danger-muted)] px-4 py-3 text-xs text-[var(--danger-fg)] flex items-start gap-2"
              style={{ animation: 'authFadeUp 0.4s 0.5s both' }}
            >
              <svg className="mt-0.5 h-3.5 w-3.5 shrink-0" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm.75 4a.75.75 0 0 0-1.5 0v3.5a.75.75 0 0 0 1.5 0V5zm-.75 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
              </svg>
              <span>{serverError}</span>
            </div>
          )}

          {/* CTA */}
          <div style={{ animation: 'authFadeUp 0.4s 0.54s both' }}>
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
              Create free account
            </Button>
          </div>

          {/* Terms */}
          <p className="text-[11px] text-[var(--text-muted)] text-center leading-relaxed" style={{ animation: 'authFadeUp 0.4s 0.6s both' }}>
            By creating an account you agree to our{' '}
            <Link href="/terms" className="underline hover:text-[var(--text-secondary)]">Terms of Service</Link>
            {' '}and{' '}
            <Link href="/privacy" className="underline hover:text-[var(--text-secondary)]">Privacy Policy</Link>.
          </p>
        </form>
      </AuthLayout>
    </>
  );
}

function PromoTrailing({ state }: { state: PromoState }): JSX.Element | null {
  if (state.status === 'checking') return <Spinner size="sm" />;
  if (state.status === 'valid')    return <Check className="h-4 w-4" style={{ color: 'var(--success)' }} />;
  if (state.status === 'invalid')  return <X className="h-4 w-4" style={{ color: 'var(--danger)' }} />;
  return null;
}

function PromoHelper({ state }: { state: PromoState }): JSX.Element | null {
  if (state.status === 'idle')     return <span className="text-[var(--text-secondary)]">Optional — letters and numbers only.</span>;
  if (state.status === 'checking') return <span className="text-[var(--text-muted)]">Checking code…</span>;
  if (state.status === 'valid')    return <span style={{ color: 'var(--success)' }}>✓ Valid — bonus applied</span>;
  if (state.status === 'invalid') {
    const msgs: Record<string, string> = {
      format: '✗ Invalid format (6–12 alphanumeric)',
      inactive: '✗ Code is no longer active',
      not_found: '✗ Code not found',
    };
    return <span style={{ color: 'var(--danger)' }}>{msgs[state.reason] ?? '✗ Invalid code'}</span>;
  }
  return null;
}