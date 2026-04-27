// components/ui/Toast.tsx
// ── Themed react-hot-toast wrapper ──

import { Toaster, toast as hotToast, ToastOptions } from 'react-hot-toast';

export function ToastProvider(): JSX.Element {
  return (
    <Toaster
      position="top-right"
      gutter={8}
      toastOptions={{
        duration: 4000,
        style: {
          background: 'var(--bg-elevated)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          fontSize: '13px',
          padding: '10px 14px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
        },
        success: {
          iconTheme: {
            primary: 'var(--success)',
            secondary: 'var(--bg-elevated)',
          },
        },
        error: {
          iconTheme: {
            primary: 'var(--danger)',
            secondary: 'var(--bg-elevated)',
          },
        },
      }}
    />
  );
}

export const toast = {
  success: (message: string, opts?: ToastOptions) => hotToast.success(message, opts),
  error:   (message: string, opts?: ToastOptions) => hotToast.error(message, opts),
  info:    (message: string, opts?: ToastOptions) => hotToast(message, opts),
  dismiss: (id?: string) => hotToast.dismiss(id),
};