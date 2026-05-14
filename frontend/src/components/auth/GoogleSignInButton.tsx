// components/auth/GoogleSignInButton.tsx
// ── Google Sign-In button matching your existing UI patterns ──

import { useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { Spinner } from '@/components/ui/Spinner';
import { toast } from '@/components/ui/Toast';
import type { NormalizedApiError } from '@/services/apiClient';

interface GoogleSignInButtonProps {
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
}

// Extend Window interface for Google Identity Services
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: (callback?: any) => void;
          renderButton: (element: HTMLElement, config: any) => void;
        };
        oauth2: {
          initCodeClient: (config: any) => { requestCode: () => void };
          initTokenClient: (config: any) => { requestAccessToken: () => void };
        };
      };
    };
  }
}

export function GoogleSignInButton({ 
  className = '', 
  style,
  disabled = false 
}: GoogleSignInButtonProps): JSX.Element {
  const router = useRouter();
  const { loginWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = useCallback(async () => {
    if (!window.google?.accounts?.oauth2) {
      toast.error('Google Sign-In is not available right now. Please try again later.');
      return;
    }

    setIsLoading(true);

    try {
      const client = window.google.accounts.oauth2.initCodeClient({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
        scope: 'email profile openid',
        ux_mode: 'popup',
        callback: async (response: any) => {
          if (response.error) {
            console.error('[GoogleSignIn] OAuth error:', response.error);
            toast.error('Google sign-in was cancelled or failed.');
            setIsLoading(false);
            return;
          }

          try {
            // Exchange the authorization code for tokens
            // Note: You'll need to update your backend to handle authorization codes
            // or continue using ID tokens. See note below.
            await loginWithGoogle(response.code);
            toast.success('Welcome! You\'ve signed in with Google.');
            
            const redirect = typeof router.query.redirect === 'string' 
              ? router.query.redirect 
              : '/dashboard';
            router.push(redirect);
          } catch (err) {
            const error = err as NormalizedApiError;
            toast.error(error.message || 'Google sign-in failed');
            console.error('[GoogleSignIn] Backend auth error:', error);
          } finally {
            setIsLoading(false);
          }
        },
      });

      client.requestCode();
    } catch (error) {
      console.error('[GoogleSignIn] Initialization error:', error);
      toast.error('Failed to initialize Google Sign-In');
      setIsLoading(false);
    }
  }, [router, loginWithGoogle]);

  return (
    <button
      type="button"
      onClick={handleGoogleSignIn}
      disabled={isLoading || disabled}
      className={`flex w-full items-center justify-center gap-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-muted)] px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition-all duration-150 hover:border-[var(--border-strong)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] hover:shadow-[0_0_16px_var(--page-accent-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--page-accent)] disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      style={style}
    >
      {isLoading ? (
        <Spinner size="sm" />
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#4285F4" d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/>
          <path fill="#34A853" d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09C3.515 21.3 7.565 24 12.255 24z"/>
          <path fill="#FBBC05" d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62h-3.98a11.86 11.86 0 0 0 0 10.76l3.98-3.09z"/>
          <path fill="#EA4335" d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0c-4.69 0-8.74 2.7-10.71 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/>
        </svg>
      )}
      {isLoading ? 'Connecting to Google...' : 'Continue with Google'}
    </button>
  );
}