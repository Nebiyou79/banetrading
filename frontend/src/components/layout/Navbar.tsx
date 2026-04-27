'use client';
// components/layout/Navbar.tsx

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuthContext } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useTicker } from '@/hooks/usePrices';
import colors from '@/styles/colors';

// ── Price Ticker Strip ────────────────────────────────────────────────────
const TickerStrip: React.FC = () => {
  const { ticker } = useTicker(30000);
  if (!ticker.length) return null;

  const items = [...ticker, ...ticker]; // duplicate for seamless loop

  return (
    <div
      className="w-full overflow-hidden border-b"
      style={{ backgroundColor: colors.dark.surface, borderColor: colors.dark.border }}
    >
      <div className="ticker-track flex items-center gap-6 py-1.5 px-4 whitespace-nowrap w-max">
        {items.map((coin, i) => (
          <span key={`${coin.id}-${i}`} className="flex items-center gap-2 text-xs">
            <span className="font-semibold" style={{ color: colors.dark.text }}>
              {coin.symbol}
            </span>
            <span style={{ color: colors.dark.textSec }}>
              ${coin.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span
              className="font-medium"
              style={{ color: coin.change24h >= 0 ? colors.trade.up : colors.trade.down }}
            >
              {coin.change24h >= 0 ? '+' : ''}
              {coin.change24h?.toFixed(2)}%
            </span>
          </span>
        ))}
      </div>
    </div>
  );
};

// ── Theme Toggle ──────────────────────────────────────────────────────────
const ThemeToggle: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
      style={{ color: colors.dark.textMuted }}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  );
};

// ── Avatar Dropdown ───────────────────────────────────────────────────────
const AvatarDropdown: React.FC = () => {
  const { user, logout } = useAuthContext();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!user) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors"
        style={{ color: colors.dark.textSec }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = colors.dark.hover)}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = 'transparent')}
      >
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
          style={{ background: colors.gradient.bluePrimary, color: '#fff' }}
        >
          {user.name.charAt(0).toUpperCase()}
        </div>
        <span className="text-sm font-medium hidden sm:block" style={{ color: colors.dark.text }}>
          {user.name.split(' ')[0]}
        </span>
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1 w-48 rounded-xl border shadow-xl py-1 z-50"
          style={{ backgroundColor: colors.dark.surface, borderColor: colors.dark.border }}
        >
          <div className="px-3 py-2 border-b" style={{ borderColor: colors.dark.border }}>
            <p className="text-xs font-medium truncate" style={{ color: colors.dark.text }}>{user.name}</p>
            <p className="text-[10px] truncate" style={{ color: colors.dark.textMuted }}>{user.email}</p>
          </div>
          {[
            { href: '/dashboard/profile', label: 'Profile' },
            { href: '/dashboard/kyc', label: 'Verification' },
            { href: '/dashboard/support', label: 'Support' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm transition-colors"
              style={{ color: colors.dark.textSec }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = colors.dark.hover)}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = 'transparent')}
            >
              {item.label}
            </Link>
          ))}
          <div className="border-t my-1" style={{ borderColor: colors.dark.border }} />
          <button
            onClick={() => { setOpen(false); logout(); }}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors text-left"
            style={{ color: colors.danger }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = colors.dark.hover)}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = 'transparent')}
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
};

// ── Main Navbar ───────────────────────────────────────────────────────────
interface NavbarProps {
  onMenuClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  const { user } = useAuthContext();

  return (
    <div
      className="sticky top-0 z-40 border-b"
      style={{ borderColor: colors.dark.border }}
    >
      {/* Ticker strip */}
      <TickerStrip />

      {/* Main bar */}
      <header
        className="h-14 flex items-center justify-between px-4 gap-4"
        style={{ backgroundColor: colors.dark.surface }}
      >
        {/* Left — mobile hamburger */}
        <div className="flex items-center gap-3">
          {onMenuClick && (
            <button
              onClick={onMenuClick}
              className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg"
              style={{ color: colors.dark.textSec }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
        </div>

        {/* Right */}
        <div className="flex items-center gap-1">
          {/* Balance pill */}
          {user && (
            <div
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg mr-1"
              style={{ backgroundColor: colors.dark.surface2 }}
            >
              <span className="text-xs" style={{ color: colors.dark.textMuted }}>Balance</span>
              <span className="text-sm font-semibold" style={{ color: colors.dark.text }}>
                ${user.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}

          <ThemeToggle />
          <AvatarDropdown />
        </div>
      </header>
    </div>
  );
};

export default Navbar;
