// components/convert/ConversionSuccessCard.tsx
// ── CONVERSION SUCCESS CARD ──

'use client';

import React, { useEffect } from 'react';
import type { Currency } from '@/types/convert';

interface ConversionSuccessCardProps {
  from: Currency;
  to: Currency;
  fromAmount: number;
  toAmount: number;
  onClose?: () => void;
}

export default function ConversionSuccessCard({
  from,
  to,
  fromAmount,
  toAmount,
  onClose,
}: ConversionSuccessCardProps) {
  useEffect(() => {
    const timer = setTimeout(() => onClose?.(), 2000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="flex flex-col items-center text-center py-4">
      {/* ── ✓ icon with scale animation ── */}
      <div className="mb-4 animate-[scale-in_0.3s_ease-out_forwards]" style={{ animation: 'scaleIn 0.3s ease-out forwards' }}>
        <div className="w-16 h-16 rounded-full bg-[var(--success-muted)] flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-gain" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>

      <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">Converted Successfully</h3>
      <p className="text-sm text-[var(--text-secondary)] tabular">
        {fromAmount.toLocaleString()} {from} → {toAmount.toFixed(6)} {to}
      </p>
    </div>
  );
}

// Inject scale-in keyframe globally
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes scaleIn {
      from { opacity: 0; transform: scale(0.4); }
      to { opacity: 1; transform: scale(1); }
    }
  `;
  document.head.appendChild(style);
}