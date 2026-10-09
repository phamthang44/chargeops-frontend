/**
 * Typography tokens — compact sans-serif scale.
 * Use fontSizes / fontWeights for all text styling.
 */
export const fontSizes = {
  micro: 10, // eyebrow tags, uppercase tracking labels
  caption: 12,
  body: 14,
  heading: 18,
  title: 24,
  display: 28, // large screen headlines (splash, auth)
  kpi: 34, // oversized KPI numbers (countdowns, live metrics) — DESIGN_SYSTEM §5
} as const;

export const fontWeights = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export const lineHeights = {
  micro: 12,
  caption: 16,
  body: 20,
  heading: 24,
  title: 32,
  display: 36,
  kpi: 40,
} as const;

export const typography = {
  fontSizes,
  fontWeights,
  lineHeights,
} as const;

export type FontSizes = typeof fontSizes;
export type FontWeights = typeof fontWeights;
