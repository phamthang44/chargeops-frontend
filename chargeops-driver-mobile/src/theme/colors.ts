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

export type PalettePreset = 'balanced' | 'classic';

export const classicLightColors: Colors = {
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

export const classicDarkColors: Colors = {
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

/**
 * Balanced Emerald-Zen Palette (V2) - Refined contrast, subtle surfaces, balanced greens.
 */
export const balancedDarkColors: Colors = {
  primary: '#10C98A',
  primaryDark: '#1F8F6A',
  primaryLight: '#4AE2AC',
  primarySoft: '#0E2A22',

  background: '#0B0F0E',
  surface: '#121917',
  surfaceAlt: '#17201D',
  border: '#27312E',

  success: '#10C98A',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  textStrong: '#F4F7F6',
  textBody: '#C4CECA',
  textMuted: '#8E9A96',
  textInverse: '#0B0F0E',

  overlay: 'rgba(0, 0, 0, 0.75)',
  transparent: 'transparent',
};

export const balancedLightColors: Colors = {
  primary: '#0E9F6E',
  primaryDark: '#087A54',
  primaryLight: '#31C48D',
  primarySoft: '#E6F7F0',

  background: '#F7F9F8',
  surface: '#FFFFFF',
  surfaceAlt: '#EDF2F0',
  border: '#DFE5E2',

  success: '#0E9F6E',
  warning: '#D97706',
  error: '#DC2626',
  info: '#2563EB',

  textStrong: '#111816',
  textBody: '#34403B',
  textMuted: '#5E6D68',
  textInverse: '#FFFFFF',

  overlay: 'rgba(17, 24, 22, 0.5)',
  transparent: 'transparent',
};

/** Default active palettes (defaults to balanced palette) */
export const lightColors: Colors = balancedLightColors;
export const darkColors: Colors = balancedDarkColors;

/** Default fallback color tokens for static imports. */
export const colors: Colors = balancedLightColors;

export function getThemeColors(
  mode: 'light' | 'dark' | 'system',
  systemScheme?: 'light' | 'dark' | null,
  preset: PalettePreset = 'balanced',
): Colors {
  const isDark = mode === 'dark' || (mode === 'system' && systemScheme === 'dark');
  if (preset === 'classic') {
    return isDark ? classicDarkColors : classicLightColors;
  }
  return isDark ? balancedDarkColors : balancedLightColors;
}
