'use client';
// components/ui/Badge.tsx

import React from 'react';
import colors from '@/styles/colors';

type BadgeVariant =
  | 'default'
  | 'success'
  | 'danger'
  | 'warning'
  | 'info'
  | 'primary'
  | 'win'
  | 'lose'
  | 'pending'
  | 'approved'
  | 'rejected';

type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
}

const variantMap: Record<BadgeVariant, { bg: string; text: string; dot: string }> = {
  default:  { bg: colors.dark.surface2,  text: colors.dark.textSec,  dot: colors.dark.textMuted },
  primary:  { bg: colors.infoBg,         text: colors.primary[500],  dot: colors.primary[500] },
  info:     { bg: colors.infoBg,         text: colors.info,          dot: colors.info },
  success:  { bg: colors.successBg,      text: colors.success,       dot: colors.success },
  danger:   { bg: colors.dangerBg,       text: colors.danger,        dot: colors.danger },
  warning:  { bg: colors.warningBg,      text: colors.warning,       dot: colors.warning },
  win:      { bg: colors.trade.upBg,     text: colors.trade.up,      dot: colors.trade.up },
  lose:     { bg: colors.trade.downBg,   text: colors.trade.down,    dot: colors.trade.down },
  pending:  { bg: colors.warningBg,      text: colors.warning,       dot: colors.warning },
  approved: { bg: colors.successBg,      text: colors.success,       dot: colors.success },
  rejected: { bg: colors.dangerBg,       text: colors.danger,        dot: colors.danger },
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-1.5 py-0.5 text-xs',
  md: 'px-2 py-1 text-xs',
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'sm',
  dot = false,
  children,
  className = '',
}) => {
  const { bg, text, dot: dotColor } = variantMap[variant];
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full ${sizeStyles[size]} ${className}`}
      style={{ backgroundColor: bg, color: text }}
    >
      {dot && (
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ backgroundColor: dotColor }}
        />
      )}
      {children}
    </span>
  );
};

// Status badge — maps common status strings to variants
export const StatusBadge: React.FC<{ status: string; className?: string }> = ({
  status,
  className,
}) => {
  const map: Record<string, BadgeVariant> = {
    pending:  'pending',
    approved: 'approved',
    rejected: 'rejected',
    win:      'win',
    lose:     'lose',
    active:   'success',
    inactive: 'default',
    verified: 'success',
    accepted: 'success',
  };
  const variant = map[status?.toLowerCase()] ?? 'default';
  return (
    <Badge variant={variant} dot className={className}>
      {status?.charAt(0).toUpperCase() + status?.slice(1)}
    </Badge>
  );
};

export default Badge;
