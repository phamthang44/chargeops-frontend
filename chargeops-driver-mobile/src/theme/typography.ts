/**
 * Typography tokens — compact sans-serif scale.
 * Use fontSizes / fontWeights for all text styling.
 */
export const fontSizes = {
  caption: 12,
  body: 14,
  heading: 18,
  title: 24,
  display: 28, // large screen headlines (splash, auth)
} as const;

export const fontWeights = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export const lineHeights = {
  caption: 16,
  body: 20,
  heading: 24,
  title: 32,
  display: 36,
} as const;

export const typography = {
  fontSizes,
  fontWeights,
  lineHeights,
} as const;

export type FontSizes = typeof fontSizes;
export type FontWeights = typeof fontWeights;
