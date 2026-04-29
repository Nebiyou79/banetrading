// pages/convert/index.tsx
// ── ASSET CONVERSION PAGE ──

import React from 'react';
import ConvertForm from '@/components/convert/ConvertForm';
import ConversionHistoryTable from '@/components/convert/ConversionHistoryTable';
import type { NextPage } from 'next';

const ConvertPage: NextPage = () => {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* ── Title ── */}
      <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">Convert</h1>

      {/* ── Form ── */}
      <ConvertForm />

      {/* ── History ── */}
      <ConversionHistoryTable />
    </div>
  );
};

export default ConvertPage;