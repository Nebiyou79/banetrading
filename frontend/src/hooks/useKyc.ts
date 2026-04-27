'use client';
// hooks/useKyc.ts

import { useState, useEffect, useCallback } from 'react';
import kycService from '@/services/kycService';
import type { KycStatus } from '@/types';

export const useKyc = () => {
  const [status, setStatus] = useState<KycStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await kycService.getKycStatus();
      setStatus(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load KYC status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const submitKyc = useCallback(async (formData: FormData) => {
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);
    try {
      await kycService.submitKyc(formData);
      setSubmitSuccess(true);
      await fetchStatus(); // Refresh status after submission
    } catch (err: any) {
      setSubmitError(err.message || 'KYC submission failed');
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, [fetchStatus]);

  return {
    status,
    loading,
    error,
    submitting,
    submitError,
    submitSuccess,
    fetchStatus,
    submitKyc,
  };
};
