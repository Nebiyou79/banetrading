// components/profile/SecurityCard.tsx
// ── Security tab — change password, email row, 2FA placeholder ──

import { useState } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, Mail, ShieldCheck, KeyRound } from 'lucide-react';

import { FormField } from '@/components/auth/FormField';
import { PasswordStrengthMeter } from '@/components/auth/PasswordStrengthMeter';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Pill } from '@/components/ui/Pill';
import { Divider } from '@/components/ui/Divider';
import { toast } from '@/components/ui/Toast';
import { useProfile } from '@/hooks/useProfile';
import { changePasswordFormSchema, ChangePasswordFormValues } from '@/lib/validators';
import type { NormalizedApiError } from '@/services/apiClient';

export function SecurityCard(): JSX.Element | null {
  const router = useRouter();
  const { profile, changePassword, isChangingPassword } = useProfile();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordFormSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const newPassword = watch('newPassword') || '';

  if (!profile) return null;

  const onSubmit = async (values: ChangePasswordFormValues): Promise<void> => {
    setServerError(null);
    try {
      await changePassword(values.currentPassword, values.newPassword);
      reset();
      toast.success('Password changed. Please log in again.');
      router.push('/auth/login');
    } catch (err) {
      const e2 = err as NormalizedApiError;
      setServerError(e2.message || 'Could not change password');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* ── Email row ── */}
      <div className="flex items-start justify-between gap-3 rounded-input border border-border bg-muted px-4 py-3">
        <div className="flex items-start gap-3 min-w-0">
          <Mail className="mt-0.5 h-4 w-4 shrink-0 text-text-muted" />
          <div className="min-w-0">
            <div className="text-xs font-medium text-text-secondary">Email</div>
            <div className="text-sm text-text-primary truncate">{profile.email}</div>
          </div>
        </div>
        <Pill tone={profile.isEmailVerified ? 'success' : 'warning'} size="xs">
          {profile.isEmailVerified ? 'Verified' : 'Unverified'}
        </Pill>
      </div>

      {/* ── 2FA placeholder ── */}
      <div className="flex items-start justify-between gap-3 rounded-input border border-border bg-muted px-4 py-3">
        <div className="flex items-start gap-3 min-w-0">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-text-muted" />
          <div className="min-w-0">
            <div className="text-xs font-medium text-text-secondary">Two-factor authentication</div>
            <div className="text-sm text-text-primary">Add an extra layer of security to your account.</div>
          </div>
        </div>
        <Pill tone="neutral" size="xs">Coming soon</Pill>
      </div>

      <Divider label="Change password" />

      {/* ── Change password form ── */}
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <FormField label="Current password" htmlFor="currentPassword" error={errors.currentPassword?.message}>
          <Input
            id="currentPassword"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your current password"
            leading={<KeyRound className="h-4 w-4" />}
            showPasswordToggle
            error={errors.currentPassword?.message}
            {...register('currentPassword')}
          />
        </FormField>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="New password" htmlFor="newPassword" error={errors.newPassword?.message}>
            <Input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              leading={<Lock className="h-4 w-4" />}
              showPasswordToggle
              error={errors.newPassword?.message}
              {...register('newPassword')}
            />
          </FormField>

          <FormField label="Confirm new password" htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="Re-enter the new password"
              leading={<Lock className="h-4 w-4" />}
              showPasswordToggle
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />
          </FormField>
        </div>

        <PasswordStrengthMeter password={newPassword} />

        <p className="rounded-input border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
          Changing your password will sign you out of all sessions, including this one.
        </p>

        {serverError && (
          <div
            role="alert"
            className="rounded-input border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger"
          >
            {serverError}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => reset()}
            disabled={isSubmitting || isChangingPassword}
          >
            Clear
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting || isChangingPassword}
          >
            Change password
          </Button>
        </div>
      </form>
    </div>
  );
}