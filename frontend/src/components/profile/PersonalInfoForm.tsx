// components/profile/PersonalInfoForm.tsx
// ── Personal information form ──

import { useEffect, useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, User as UserIcon, Phone, AtSign } from 'lucide-react';

import { FormField } from '@/components/auth/FormField';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';
import { COUNTRIES } from '@/lib/countries';
import { personalInfoFormSchema, PersonalInfoFormValues } from '@/lib/validators';
import { useProfile } from '@/hooks/useProfile';
import type { NormalizedApiError } from '@/services/apiClient';

export function PersonalInfoForm(): JSX.Element | null {
  const { profile, updateProfile, isUpdating } = useProfile();
  const [serverError, setServerError] = useState<string | null>(null);

  const defaults: PersonalInfoFormValues = useMemo(() => ({
    name:        profile?.name ?? '',
    displayName: profile?.displayName ?? profile?.name ?? '',
    country:     profile?.country ?? '',
  }), [profile]);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<PersonalInfoFormValues>({
    resolver: zodResolver(personalInfoFormSchema),
    defaultValues: defaults,
  });

  useEffect(() => { reset(defaults); }, [defaults, reset]);

  if (!profile) return null;

  const onSubmit = async (values: PersonalInfoFormValues): Promise<void> => {
    setServerError(null);
    try {
      await updateProfile({
        name:        values.name.trim(),
        displayName: values.displayName.trim(),
        country:     values.country,
        phone:       values.phone || undefined,
      });
      toast.success('Profile updated');
      reset({
        name:        values.name,
        displayName: values.displayName,
        country:     values.country,
        phone:       values.phone || '',
      });
    } catch (err) {
      const e2 = err as NormalizedApiError;
      setServerError(e2.message || 'Could not update profile');
    }
  };

  const countryOptions = COUNTRIES.map((c) => ({ value: c.code, label: c.name }));

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Display name" htmlFor="displayName" error={errors.displayName?.message}>
          <Input
            id="displayName"
            type="text"
            placeholder="How others see you"
            leading={<AtSign className="h-4 w-4" />}
            error={errors.displayName?.message}
            {...register('displayName')}
          />
        </FormField>

        <FormField label="Full name" htmlFor="name" error={errors.name?.message}>
          <Input
            id="name"
            type="text"
            placeholder="Jane Trader"
            leading={<UserIcon className="h-4 w-4" />}
            error={errors.name?.message}
            {...register('name')}
          />
        </FormField>
      </div>

      <FormField label="Email" htmlFor="email" helper="Email cannot be changed from this page.">
        <Input
          id="email"
          type="email"
          value={profile.email}
          readOnly
          disabled
          leading={<Lock className="h-4 w-4" />}
        />
      </FormField>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

        <FormField label="Phone" htmlFor="phone" error={errors.phone?.message}>
          <Input
            id="phone"
            type="tel"
            placeholder="+1 (555) 123-4567"
            leading={<Phone className="h-4 w-4" />}
            error={errors.phone?.message}
            {...register('phone')}
          />
        </FormField>
      </div>

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
          onClick={() => reset(defaults)}
          disabled={!isDirty || isSubmitting || isUpdating}
        >
          Discard
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={!isDirty}
          loading={isSubmitting || isUpdating}
        >
          Save changes
        </Button>
      </div>
    </form>
  );
}