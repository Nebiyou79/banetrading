// components/ui/Skeleton.tsx
// ── SKELETON LOADER — For async data placeholders ──

interface SkeletonProps {
  className?: string;
  count?: number;
}

export function Skeleton({ className = '', count = 1 }: SkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`animate-pulse rounded-lg bg-[var(--bg-muted)] ${className}`}
        />
      ))}
    </>
  );
}

export function TableSkeleton({ rows = 10, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border)]">
      <div className="divide-y divide-[var(--border)]">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3.5">
            {Array.from({ length: cols }).map((_, j) => (
              <div
                key={j}
                className="h-4 bg-[var(--bg-muted)] rounded animate-pulse"
                style={{ width: `${Math.random() * 40 + 60}px`, flex: j === 0 ? 2 : 1 }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--bg-muted)] rounded-full" />
              <div>
                <div className="w-20 h-4 bg-[var(--bg-muted)] rounded mb-1.5" />
                <div className="w-14 h-3 bg-[var(--bg-muted)] rounded" />
              </div>
            </div>
            <div className="w-16 h-6 bg-[var(--bg-muted)] rounded-full" />
          </div>
          <div className="flex items-center justify-between mt-3">
            <div className="w-28 h-6 bg-[var(--bg-muted)] rounded" />
            <div className="w-24 h-6 bg-[var(--bg-muted)] rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}