// pages/_app.tsx
// ── Global wrapper: Theme + Query + Toast ──

import type { AppProps } from 'next/app';
import Head from 'next/head';
import { Inter } from 'next/font/google';

import '../styles/globals.css';
import { ThemeProvider } from '../components/theme/ThemeProvider';
import { QueryProvider } from '../providers/QueryProvider';
import { ToastProvider } from '../components/ui/Toast';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const BRAND = process.env.NEXT_PUBLIC_BRAND_NAME || 'PrimeBitTrade Clone';

export default function App({ Component, pageProps }: AppProps): JSX.Element {
  return (
    <>
      <Head>
        <title>{BRAND}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#0B0E11" />
      </Head>
      <QueryProvider>
        <ThemeProvider defaultTheme="dark">
          <div className={inter.className}>
            <Component {...pageProps} />
            <ToastProvider />
          </div>
        </ThemeProvider>
      </QueryProvider>
    </>
  );
}