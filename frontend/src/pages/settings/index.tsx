// pages/settings/index.tsx
// ── Redirect /settings → /settings/security ──

import type { GetServerSideProps } from 'next';

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: '/settings/security',
      permanent: false,
    },
  };
};

export default function SettingsIndex(): null {
  return null;
}