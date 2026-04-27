// lib/cn.ts
// ── Tiny classnames helper ──

export type ClassValue = string | number | bigint | false | null | undefined | ClassValue[];

export function cn(...inputs: ClassValue[]): string {
  const out: string[] = [];
  for (const item of inputs) {
    if (!item && item !== 0) continue;
    if (Array.isArray(item)) {
      const nested = cn(...item);
      if (nested) out.push(nested);
    } else {
      out.push(String(item));
    }
  }
  return out.join(' ');
}