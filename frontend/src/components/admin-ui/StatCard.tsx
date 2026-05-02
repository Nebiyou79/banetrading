// components/ui/StatCard.tsx
// ── Dashboard stat card with count-up animation ──

'use client';

import React, { useState, useEffect, useRef } from 'react';

interface StatCardProps {
  icon: string;
  title: string;
  value: number;
  color?: string;
}

export default function StatCard({ icon, title, value, color }: StatCardProps) {
  const [displayValue, setDisplayValue] = useState(value); // Start with final value for SSR
  const [mounted, setMounted] = useState(false);
  const prevValue = useRef(value);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const duration = 1000;
    const steps = 30;
    const stepTime = duration / steps;
    const increment = (value - prevValue.current) / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        setDisplayValue(value);
        prevValue.current = value;
        clearInterval(timer);
      } else {
        setDisplayValue(Math.round(prevValue.current + increment * currentStep));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [value, mounted]);

  return (
    <div
      className="rounded-xl p-6 transition-all hover:scale-[1.02]"
      style={{
        backgroundColor: 'var(--card)',
        border: '1px solid var(--border)',
        borderTop: color ? `3px solid ${color}` : '3px solid var(--primary)',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-3xl">{icon}</span>
      </div>
      <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
        {title}
      </p>
      <p
        className="text-3xl font-bold tabular"
        style={{ color: color || 'var(--primary)' }}
        data-numeric
        suppressHydrationWarning
      >
        {displayValue.toLocaleString()}
      </p>
    </div>
  );
}