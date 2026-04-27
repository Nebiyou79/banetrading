// components/layout/Footer.tsx
// ── Minimal footer for the authenticated shell ──

import Link from 'next/link';

const BRAND = process.env.NEXT_PUBLIC_BRAND_NAME || 'PrimeBitTrade Clone';

const LINKS = [
  { label: 'Terms',    href: '/terms'   },
  { label: 'Privacy',  href: '/privacy' },
  { label: 'Support',  href: '/support' },
  { label: 'Status',   href: '/status'  },
];

export function Footer(): JSX.Element {
  return (
    <footer className="border-t border-border bg-base mt-auto">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 sm:flex-row sm:px-6">
        <div className="text-xs text-text-muted">
          © {new Date().getFullYear()} {BRAND}. Demo project.
        </div>
        <nav className="flex items-center gap-4">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-xs text-text-muted hover:text-text-primary transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}