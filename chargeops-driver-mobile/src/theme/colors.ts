/**
 * Color design tokens.
 * Clean, minimal, eco-green, fintech-like palette.
 * NEVER hardcode colors in components/screens — always import from here.
 */
export const colors = {
  // Brand / primary (emerald)
  primary: '#10B981',
  primaryDark: '#059669',
  primaryLight: '#34D399',
  primarySoft: '#D1FAE5', // tinted background for chips/badges

  // Backgrounds
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceAlt: '#F9FAFB', // light-gray section background
  border: '#E5E7EB',

  // Status
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Text
  textStrong: '#111827', // headings / primary text
  textBody: '#374151', // body text
  textMuted: '#6B7280', // secondary / captions
  textInverse: '#FFFFFF', // text on primary/dark surfaces

  // Misc
  overlay: 'rgba(17, 24, 39, 0.5)',
  transparent: 'transparent',
} as const;

export type Colors = typeof colors;
