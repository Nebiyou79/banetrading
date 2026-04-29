// components/kyc/KycLevel3Form.tsx
// ── Level 3 — Address Verification modal ──

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, MapPin, User as UserIcon, Hash } from 'lucide-react';

import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { toast } from '@/components/ui/Toast';
import { FormField } from '@/components/auth/FormField';
import { KycDropzone } from './KycDropzone';
import { COUNTRIES } from '@/lib/countries';
import { kycLevel3FormSchema, KycLevel3FormValues } from '@/lib/validators';
import { useKyc } from '@/hooks/useKyc';
import type { NormalizedApiError } from '@/services/apiClient';

export interface KycLevel3FormProps {
  open: boolean;
  onClose: () => void;
}

export function KycLevel3Form({ open, onClose }: KycLevel3FormProps): JSX.Element {
  const { submitLevel3, isSubmittingLevel3 } = useKyc();
  const [document, setDocument] = useState<File | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [filesError, setFilesError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<KycLevel3FormValues>({
    resolver: zodResolver(kycLevel3FormSchema),
    defaultValues: { fullName: '', addressLine: '', city: '', postalCode: '', country: '' },
  });

  const handleClose = (): void => {
    if (isSubmittingLevel3 || isSubmitting) return;
    reset();
    setDocument(null);
    setServerError(null);
    setFilesError(null);
    setSuccess(false);
    onClose();
  };

  const onSubmit = async (values: KycLevel3FormValues): Promise<void> => {
    setServerError(null);
    setFilesError(null);
    if (!document) {
      setFilesError('Proof of address document is required.');
      return;
    }
    try {
      await submitLevel3({ ...values, document });
      setSuccess(true);
      toast.success('Submitted for review');
      window.setTimeout(handleClose, 1800);
    } catch (err) {
      const e2 = err as NormalizedApiError;
      setServerError(e2.message || 'Could not submit verification');
    }
  };

  const countryOptions = COUNTRIES.map((c) => ({ value: c.code, label: c.name }));

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={success ? undefined : 'Level 3 — Address Verification'}
      size="lg"
      closeOnBackdrop={!isSubmittingLevel3 && !isSubmitting}
    >
      {success ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-success-muted text-success">
            <CheckCircle2 className="h-8 w-8" />
          </span>
          <h3 className="text-lg font-semibold text-text-primary">Submitted for review</h3>
          <p className="max-w-sm text-sm text-text-secondary">
            We typically review submissions within 1–3 business days. You&apos;ll be notified by email.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <FormField label="Full legal name" htmlFor="fullName" error={errors.fullName?.message}>
            <Input
              id="fullName"
              type="text"
              placeholder="As shown on your address document"
              leading={<UserIcon className="h-4 w-4" />}
              error={errors.fullName?.message}
              {...register('fullName')}
            />
          </FormField>

          <FormField label="Address line" htmlFor="addressLine" error={errors.addressLine?.message}>
            <Input
              id="addressLine"
              type="text"
              placeholder="Street address, apartment, suite, etc."
              leading={<MapPin className="h-4 w-4" />}
              error={errors.addressLine?.message}
              {...register('addressLine')}
            />
          </FormField>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="City" htmlFor="city" error={errors.city?.message}>
              <Input
                id="city"
                type="text"
                placeholder="City"
                error={errors.city?.message}
                {...register('city')}
              />
            </FormField>

            <FormField label="Postal code" htmlFor="postalCode" error={errors.postalCode?.message}>
              <Input
                id="postalCode"
                type="text"
                placeholder="ZIP / Postal code"
                leading={<Hash className="h-4 w-4" />}
                error={errors.postalCode?.message}
                {...register('postalCode')}
              />
            </FormField>
          </div>

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
                  placeholder="Select country"
                  error={errors.country?.message}
                  searchable
                />
              )}
            />
          </FormField>

          <KycDropzone
            label="Proof of address"
            required
            helper="Must be dated within the last 3 months"
            helperTone="warning"
            file={document}
            onChange={setDocument}
            error={filesError && !document ? filesError : undefined}
          />

          {serverError && (
            <div role="alert" className="rounded-input border border-danger/40 bg-danger-muted px-3 py-2 text-xs text-danger">
              {serverError}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={handleClose} disabled={isSubmittingLevel3 || isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={isSubmitting || isSubmittingLevel3}>
              Submit for review
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}