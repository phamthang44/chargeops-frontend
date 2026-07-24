/**
 * Color design tokens interface & palettes.
 * Clean, minimal, eco-green, fintech-like palette.
 * Aligned with DESIGN_SYSTEM.md and packages/tokens/tokens.css.
 */

export interface Colors {
  // Brand / primary (emerald)
  primary: string;
  primaryDark: string;
  primaryLight: string;
  primarySoft: string;

  // Backgrounds
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;

  // Status
  success: string;
  warning: string;
  error: string;
  info: string;

  // Text
  textStrong: string;
  textBody: string;
  textMuted: string;
  textInverse: string;

  // Misc
  overlay: string;
  transparent: string;
}

export const lightColors: Colors = {
  primary: '#10B981',
  primaryDark: '#059669',
  primaryLight: '#34D399',
  primarySoft: '#D1FAE5',

  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceAlt: '#F9FAFB',
  border: '#E5E7EB',

  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  textStrong: '#111827',
  textBody: '#374151',
  textMuted: '#6B7280',
  textInverse: '#FFFFFF',

  overlay: 'rgba(17, 24, 39, 0.5)',
  transparent: 'transparent',
};

export const darkColors: Colors = {
  primary: '#10B981',
  primaryDark: '#34D399',
  primaryLight: '#6EE6A0',
  primarySoft: '#113322',

  background: '#0B0F0E',
  surface: '#161B1A',
  surfaceAlt: '#1F2625',
  border: '#2A312F',

  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  textStrong: '#F9FAFB',
  textBody: '#E5E7EB',
  textMuted: '#9CA3AF',
  textInverse: '#111827',

  overlay: 'rgba(0, 0, 0, 0.75)',
  transparent: 'transparent',
};

/** Default fallback color tokens for static imports. */
export const colors: Colors = lightColors;

export function getThemeColors(mode: 'light' | 'dark' | 'system', systemScheme?: 'light' | 'dark' | null): Colors {
  if (mode === 'dark') return darkColors;
  if (mode === 'light') return lightColors;
  return systemScheme === 'dark' ? darkColors : lightColors;
}
