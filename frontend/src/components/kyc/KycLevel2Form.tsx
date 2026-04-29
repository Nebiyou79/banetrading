// components/kyc/KycLevel2Form.tsx
// ── Level 2 — ID Verification modal ──

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, User as UserIcon, Calendar, Hash } from 'lucide-react';

import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { toast } from '@/components/ui/Toast';
import { FormField } from '@/components/auth/FormField';
import { KycDropzone } from './KycDropzone';
import { COUNTRIES } from '@/lib/countries';
import { kycLevel2FormSchema, KycLevel2FormValues } from '@/lib/validators';
import { useKyc } from '@/hooks/useKyc';
import type { NormalizedApiError } from '@/services/apiClient';
import type { IdType } from '@/types/kyc';

const ID_TYPE_OPTIONS = [
  { value: 'passport',         label: 'Passport' },
  { value: 'national_id',      label: 'National ID' },
  { value: 'drivers_license',  label: "Driver's License" },
];

export interface KycLevel2FormProps {
  open: boolean;
  onClose: () => void;
}

export function KycLevel2Form({ open, onClose }: KycLevel2FormProps): JSX.Element {
  const { submitLevel2, isSubmittingLevel2 } = useKyc();
  const [idFront, setIdFront] = useState<File | null>(null);
  const [idBack,  setIdBack]  = useState<File | null>(null);
  // Selfie field is currently commented out in the spec — kept here for easy re-enable.
  // const [selfie, setSelfie] = useState<File | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [filesError, setFilesError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<KycLevel2FormValues>({
    resolver: zodResolver(kycLevel2FormSchema),
    defaultValues: {
      fullName: '', dateOfBirth: '', country: '',
      idType: 'passport' as IdType, idNumber: '', expiryDate: '',
    },
  });

  const handleClose = (): void => {
    if (isSubmittingLevel2 || isSubmitting) return;
    reset();
    setIdFront(null);
    setIdBack(null);
    setServerError(null);
    setFilesError(null);
    setSuccess(false);
    onClose();
  };

  const onSubmit = async (values: KycLevel2FormValues): Promise<void> => {
    setServerError(null);
    setFilesError(null);
    if (!idFront) {
      setFilesError('Front of ID document is required.');
      return;
    }
    try {
      await submitLevel2({
        ...values,
        expiryDate: values.expiryDate || undefined,
        idFront,
        idBack: idBack ?? undefined,
      });
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
      title={success ? undefined : 'Level 2 — ID Verification'}
      size="lg"
      closeOnBackdrop={!isSubmittingLevel2 && !isSubmitting}
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
              placeholder="As shown on your ID"
              leading={<UserIcon className="h-4 w-4" />}
              error={errors.fullName?.message}
              {...register('fullName')}
            />
          </FormField>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Date of birth" htmlFor="dateOfBirth" error={errors.dateOfBirth?.message}>
              <Input
                id="dateOfBirth"
                type="date"
                leading={<Calendar className="h-4 w-4" />}
                error={errors.dateOfBirth?.message}
                {...register('dateOfBirth')}
              />
            </FormField>

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
                    placeholder="Select country"
                    error={errors.country?.message}
                    searchable
                  />
                )}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="ID type" htmlFor="idType" error={errors.idType?.message}>
              <Controller
                control={control}
                name="idType"
                render={({ field }) => (
                  <Select
                    id="idType"
                    value={field.value}
                    onChange={(v) => field.onChange(v as IdType)}
                    options={ID_TYPE_OPTIONS}
                    error={errors.idType?.message}
                    searchable={false}
                  />
                )}
              />
            </FormField>

            <FormField label="ID number" htmlFor="idNumber" error={errors.idNumber?.message}>
              <Input
                id="idNumber"
                type="text"
                placeholder="Document number"
                leading={<Hash className="h-4 w-4" />}
                error={errors.idNumber?.message}
                {...register('idNumber')}
              />
            </FormField>
          </div>

          <FormField label="Expiry date (optional)" htmlFor="expiryDate" error={errors.expiryDate?.message}>
            <Input
              id="expiryDate"
              type="date"
              leading={<Calendar className="h-4 w-4" />}
              error={errors.expiryDate?.message}
              {...register('expiryDate')}
            />
          </FormField>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <KycDropzone
              label="ID — front"
              required
              file={idFront}
              onChange={setIdFront}
              error={filesError && !idFront ? filesError : undefined}
            />
            <KycDropzone
              label="ID — back (optional)"
              file={idBack}
              onChange={setIdBack}
            />
          </div>

          {/* Selfie upload commented out per spec — uncomment when re-enabled.
          <KycDropzone
            label="Selfie holding ID (optional)"
            file={selfie}
            onChange={setSelfie}
          />
          */}

          {serverError && (
            <div role="alert" className="rounded-input border border-danger/40 bg-danger-muted px-3 py-2 text-xs text-danger">
              {serverError}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={handleClose} disabled={isSubmittingLevel2 || isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={isSubmitting || isSubmittingLevel2}>
              Submit for review
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}