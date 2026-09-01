/**
 * Spacing scale (in px). Use these tokens for padding, margin and gaps.
 * NEVER hardcode spacing values in components/screens.
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

/** Border radius tokens for rounded cards / buttons. */
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
} as const;

export type Spacing = typeof spacing;
export type Radius = typeof radius;
