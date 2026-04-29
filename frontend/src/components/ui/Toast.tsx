// components/ui/Toast.tsx
'use client';

import { Toaster, toast as hotToast, ToastOptions } from 'react-hot-toast';

export function ToastProvider(): JSX.Element {
  return (
    <Toaster
      position="top-right"
      gutter={8}
      containerStyle={{
        top: 16,
        right: 16,
      }}
      toastOptions={{
        duration: 4000,
        style: {
          background: 'var(--card)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          fontSize: '13px',
          padding: '10px 14px',
          boxShadow: 'var(--shadow-card)',
        },

        success: {
          iconTheme: {
            primary: 'var(--success)',
            secondary: 'var(--card)',
          },
        },

        error: {
          iconTheme: {
            primary: 'var(--danger)',
            secondary: 'var(--card)',
          },
        },
      }}
    />
  );
}

/* 🔥 Unified toast API */
export const toast = {
  success: (message: string, opts?: ToastOptions) =>
    hotToast.success(message, opts),

  error: (message: string, opts?: ToastOptions) =>
    hotToast.error(message, opts),

  info: (message: string, opts?: ToastOptions) =>
    hotToast(message, opts),

  dismiss: (id?: string) => hotToast.dismiss(id),
};