import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { colors } from '@/theme';

/**
 * Empty-state illustration family. Each subject sits on a soft emerald stage in
 * a shared two-tone line style. Pair with a title/subtitle in the screen.
 */
export type EmptyVariant = 'bookings' | 'search' | 'notifications';

// Illustration-only neutrals (line art); emerald comes from the brand tokens.
const LINE = '#9CA3AF';
const LINE_SOFT = '#D1D5DB';
const FAINT = '#E5E7EB';
const BOLT = 'M58 8 L30 55 L49 55 L44 92 L73 43 L54 43 Z';
const SPARK =
  'M10 0 C11 6 14 9 20 10 C14 11 11 14 10 20 C9 14 6 11 0 10 C6 9 9 6 10 0 Z';

interface EmptyStateProps {
  variant: EmptyVariant;
  size?: number;
}

export function EmptyState({ variant, size = 148 }: EmptyStateProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 148 148">
      <Circle cx={74} cy={74} r={56} fill={colors.primarySoft} opacity={0.5} />
      {variant === 'bookings' && <Bookings />}
      {variant === 'search' && <Search />}
      {variant === 'notifications' && <Notifications />}
    </Svg>
  );
}

function spark(x: number, y: number, s: number, opacity = 0.7) {
  return (
    <Path
      d={SPARK}
      transform={`translate(${x},${y}) scale(${s / 20})`}
      fill={colors.primaryLight}
      opacity={opacity}
    />
  );
}

function Bookings() {
  return (
    <>
      {spark(28, 34, 12, 0.75)}
      {spark(108, 34, 12, 0.75)}
      {/* Calendar Top Rings / Hangers - symmetric at x=53 and x=85 */}
      <Rect x={53} y={38} width={6} height={12} rx={3} fill="#6B7280" />
      <Rect x={85} y={38} width={6} height={12} rx={3} fill="#6B7280" />
      {/* Calendar Card Body: x=39, y=44, width=66, height=56 (Balanced with badge) */}
      <Rect
        x={39}
        y={44}
        width={66}
        height={56}
        rx={12}
        fill={colors.surface}
        stroke={LINE}
        strokeWidth={3.5}
      />
      {/* Calendar Header Band */}
      <Path
        d="M39 62 V56 a12 12 0 0 1 12 -12 H93 a12 12 0 0 1 12 12 V62 Z"
        fill={colors.primarySoft}
      />
      <Path d="M39 62 H105" stroke={LINE} strokeWidth={3.5} />
      {/* Calendar Internal Notes Rows */}
      <Rect x={50} y={72} width={44} height={5} rx={2.5} fill={FAINT} />
      <Rect x={50} y={83} width={28} height={5} rx={2.5} fill={FAINT} />
      {/* Corner Status Badge (Power Bolt): cx=96, cy=94, r=14.5 */}
      <Circle
        cx={96}
        cy={94}
        r={14.5}
        fill={colors.primary}
        stroke={colors.surface}
        strokeWidth={3}
      />
      <Path
        d={BOLT}
        transform="translate(84.7, 83) scale(0.22)"
        fill={colors.textInverse}
      />
    </>
  );
}

function Search() {
  return (
    <>
      {spark(100, 46, 12, 0.75)}
      {spark(34, 92, 9, 0.6)}
      <Circle cx={68} cy={66} r={30} fill={colors.surface} stroke={LINE} strokeWidth={5} />
      <Rect x={52} y={58} width={32} height={5} rx={2.5} fill={LINE_SOFT} />
      <Rect x={52} y={68} width={24} height={5} rx={2.5} fill={FAINT} />
      <Rect x={52} y={78} width={28} height={5} rx={2.5} fill={FAINT} />
      <Path d="M90 88 L106 104" stroke={colors.primary} strokeWidth={9} strokeLinecap="round" />
    </>
  );
}

function Notifications() {
  return (
    <>
      {spark(36, 44, 12, 0.7)}
      <Path
        d="M74 48 C63 48 55 56 55 67 V82 L48 92 H100 L93 82 V67 C93 56 85 48 74 48 Z"
        fill={colors.surface}
        stroke={LINE}
        strokeWidth={4.5}
        strokeLinejoin="round"
      />
      <Path d="M66 92 a8 8 0 0 0 16 0" fill={colors.surface} stroke={LINE} strokeWidth={4.5} />
      <Path d="M74 41 V48" stroke={LINE} strokeWidth={4.5} strokeLinecap="round" />
      <Path d="M101 50 a11 11 0 1 0 6 18 a8.5 8.5 0 1 1 -6 -18 Z" fill={colors.primary} />
    </>
  );
}
