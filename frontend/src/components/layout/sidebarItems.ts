// components/layout/sidebarItems.ts
// ── Sidebar group + item definitions ──

import type { ReactNode } from 'react';
import {
  Home,
  CandlestickChart,
  Wallet,
  BarChart3,
  Globe,
  Coins,
  ArrowLeftRight,
  Clock,
  Bell,
  Settings,
  HelpCircle,
  User,
  FileText,
} from 'lucide-react';
import { createElement } from 'react';

export interface SidebarItemDef {
  href: string;
  label: string;
  icon: ReactNode;
  badge?: string;
}

export interface SidebarGroupDef {
  id: string;
  title: string;
  items: SidebarItemDef[];
}

const ICON_PROPS = { className: 'h-[18px] w-[18px]' } as const;

export const SIDEBAR_GROUPS: SidebarGroupDef[] = [
  {
    id: 'main',
    title: 'Main Menu',
    items: [
      { href: '/dashboard',       label: 'Dashboard',    icon: createElement(Home, ICON_PROPS) },
      { href: '/markets/crypto',  label: 'Markets',      icon: createElement(BarChart3, ICON_PROPS) },
      { href: '/trade',           label: 'Trade',         icon: createElement(CandlestickChart, ICON_PROPS) },
      { href: '/convert',         label: 'Convert',       icon: createElement(ArrowLeftRight, ICON_PROPS) },
    ],
  },
  {
    id: 'markets',
    title: 'Markets',
    items: [
      { href: '/markets/crypto',   label: 'Crypto',       icon: createElement(Coins, ICON_PROPS) },
      { href: '/markets/forex',    label: 'Forex & Metals',icon: createElement(Globe, ICON_PROPS) },
    ],
  },
  {
    id: 'finance',
    title: 'Finance',
    items: [
      { href: '/balance',          label: 'Balance',       icon: createElement(Wallet, ICON_PROPS) },
      { href: '/history',          label: 'History',       icon: createElement(Clock, ICON_PROPS) },
    ],
  },
  {
    id: 'account',
    title: 'Account',
    items: [
      { href: '/profile',          label: 'Profile',       icon: createElement(User, ICON_PROPS) },
      { href: '/notifications',    label: 'Notifications',  icon: createElement(Bell, ICON_PROPS) },
      { href: '/settings',         label: 'Settings',      icon: createElement(Settings, ICON_PROPS) },
      { href: '/help',             label: 'Help Center',   icon: createElement(HelpCircle, ICON_PROPS) },
    ],
  },
];