// components/layout/sidebarItems.ts
// ── Sidebar group + item definitions ──

import type { ReactNode } from 'react';
import {
  Home,
  CandlestickChart,
  Wallet,
  BarChart3,
  Clock,
  Bell,
  Settings,
  HelpCircle,
} from 'lucide-react';
import { createElement } from 'react';

export interface SidebarItemDef {
  href: string;
  label: string;
  icon: ReactNode;
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
      { href: '/dashboard',       label: 'Home',        icon: createElement(Home, ICON_PROPS) },
      { href: '/trade',           label: 'Trade',       icon: createElement(CandlestickChart, ICON_PROPS) },
      { href: '/wallet',          label: 'Wallet',      icon: createElement(Wallet, ICON_PROPS) },
      { href: '/markets',         label: 'Markets',     icon: createElement(BarChart3, ICON_PROPS) },
    ],
  },
  {
    id: 'general',
    title: 'General',
    items: [
      { href: '/history',         label: 'History',       icon: createElement(Clock, ICON_PROPS) },
      { href: '/notifications',   label: 'Notifications', icon: createElement(Bell, ICON_PROPS) },
      { href: '/settings',        label: 'Settings',      icon: createElement(Settings, ICON_PROPS) },
      { href: '/help',            label: 'Help Center',   icon: createElement(HelpCircle, ICON_PROPS) },
    ],
  },
];