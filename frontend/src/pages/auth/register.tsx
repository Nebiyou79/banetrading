// pages/auth/register.tsx
// ── Registration page ──

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

const BRAND = process.env.NEXT_PUBLIC_BRAND_NAME || 'PrimeBitTrade Clone';

type PromoState =
  | { status: 'idle' }
  | { status: 'checking' }
  | { status: 'valid'; code: string }
  | { status: 'invalid'; reason: 'format' | 'not_found' | 'inactive' };

export default function RegisterPage(): JSX.Element {
  const router = useRouter();
  const { register: doRegister } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [promoState, setPromoState] = useState<PromoState>({ status: 'idle' });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // ── Live promo validation ──
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const raw = (promoValue || '').trim();
    if (!raw) {
      setPromoState({ status: 'idle' });
      return;
    }
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
          setPromoState({
            status: 'invalid',
            reason: (resp.reason as 'not_found' | 'inactive' | 'format') || 'not_found',
          });
        }
      } catch {
        setPromoState({ status: 'invalid', reason: 'not_found' });
      }
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [promoValue]);

  const onSubmit = async (values: RegisterFormValues): Promise<void> => {
    setServerError(null);
    // If user typed a promo and it's not valid, block submit.
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
      router.push({
        pathname: '/auth/verify-otp',
        query: { email: values.email, purpose: 'email_verification' },
      });
    } catch (err) {
      const normalized = err as NormalizedApiError;
      setServerError(normalized.message || 'Registration failed');
    }
  };

  const countryOptions = COUNTRIES.map((c) => ({ value: c.code, label: c.name }));

  return (
    <>
      <Head><title>Create account · {BRAND}</title></Head>
      <AuthLayout
        title="Create your account"
        subtitle="It takes less than a minute. No clutter, no paperwork — just markets."
        footer={(
          <>
            Already have an account?{' '}
            {/* text-[var(--primary)] → gold accent link from color.ts */}
            <Link href="/auth/login" className="text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors duration-150">
              Log in
            </Link>
          </>
        )}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <FormField label="Full name" htmlFor="name" error={errors.name?.message}>
            <Input
              id="name"
              type="text"
              autoComplete="name"
              placeholder="Jane Trader"
              leading={<UserIcon className="h-4 w-4" />}
              error={errors.name?.message}
              {...register('name')}
            />
          </FormField>

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
              autoComplete="new-password"
              placeholder="At least 8 characters"
              showPasswordToggle
              leading={<Lock className="h-4 w-4" />}
              error={errors.password?.message}
              {...register('password')}
            />
            <PasswordStrengthMeter password={password} className="mt-2" />
          </FormField>

          <FormField label="Country" htmlFor="country" error={errors.country?.message}>
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

          <FormField
            label="Promo code (optional)"
            htmlFor="promoCode"
            error={errors.promoCode?.message}
            helper={<PromoHelper state={promoState} />}
          >
            <Input
              id="promoCode"
              type="text"
              autoCapitalize="characters"
              placeholder="Enter a referral or promo code"
              leading={<Tag className="h-4 w-4" />}
              trailing={<PromoTrailing state={promoState} />}
              error={errors.promoCode?.message}
              {...register('promoCode')}
            />
          </FormField>

          {serverError && (
            <div
              role="alert"
              // {/* border-[var(--error)] bg-[var(--error-muted)] text-[var(--error)] → semantic error state */}
              className="rounded-input border border-[var(--error)]/40 bg-[var(--error-muted)] px-3 py-2 text-xs text-[var(--error)]"
            >
              {serverError}
            </div>
          )}

          <Button type="submit" variant="primary" size="lg" fullWidth loading={isSubmitting}>
            Create account
          </Button>

          {/* text-[var(--text-muted)] → placeholder / metadata color from color.ts */}
          <p className="text-[11px] text-[var(--text-muted)] text-center leading-relaxed">
            By creating an account you agree to our Terms of Service and Privacy Policy.
          </p>
        </form>
      </AuthLayout>
    </>
  );
}

function PromoTrailing({ state }: { state: PromoState }): JSX.Element | null {
  if (state.status === 'checking') return <Spinner size="sm" />;
  {/* text-[var(--success)] → green gain/pass color from color.ts */}
  if (state.status === 'valid')    return <Check className="h-4 w-4 text-[var(--success)]" />;
  {/* text-[var(--error)] → red danger/fail color from color.ts */}
  if (state.status === 'invalid')  return <X className="h-4 w-4 text-[var(--error)]" />;
  return null;
}

function PromoHelper({ state }: { state: PromoState }): JSX.Element | null {
  {/* text-[var(--text-secondary)] → body label, text-[var(--success)] / text-[var(--error)] → semantic state */}
  if (state.status === 'idle')     return <span className="text-[var(--text-secondary)]">Optional — 6–12 characters, letters and numbers.</span>;
  if (state.status === 'checking') return <span className="text-[var(--text-muted)]">Checking code…</span>;
  if (state.status === 'valid')    return <span className="text-[var(--success)]">✓ Valid code</span>;
  if (state.status === 'invalid') {
    if (state.reason === 'format')   return <span className="text-[var(--error)]">✗ Invalid format</span>;
    if (state.reason === 'inactive') return <span className="text-[var(--error)]">✗ Code is no longer active</span>;
    return <span className="text-[var(--error)]">✗ Invalid code</span>;
  }
  return null;
}
