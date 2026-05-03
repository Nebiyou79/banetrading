// components/chart/ChartContainer.tsx
// ── CHART CONTAINER — Professional wrapper with proper sizing ──

import { ReactNode } from 'react';
import { useResponsive } from '@/hooks/useResponsive';

interface ChartContainerProps {
  children: ReactNode;
  isLoading?: boolean;
  isEmpty?: boolean;
  error?: string | null;
  onRetry?: () => void;
  toolbar?: ReactNode;
}

export function ChartContainer({
  children,
  isLoading,
  isEmpty,
  error,
  onRetry,
  toolbar,
}: ChartContainerProps) {
  const { isMobile } = useResponsive();

  return (
    <div className="flex flex-col rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] overflow-hidden">
      {/* Toolbar */}
      {toolbar && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          {toolbar}
        </div>
      )}

      {/* Chart Area */}
      <div className="relative" style={{ height: isMobile ? 340 : 480 }}>
        {children}

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-elevated)]/90 z-10">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-[var(--text-secondary)]">Loading chart data...</span>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-3">
              <svg className="w-12 h-12 text-[var(--text-muted)]/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
              <span className="text-sm text-[var(--text-muted)]">No chart data available</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-3">
              <svg className="w-10 h-10 text-[var(--text-muted)]/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-[var(--text-muted)]">{error}</span>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--accent)] text-white hover:opacity-90 transition-opacity"
                >
                  Retry
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}