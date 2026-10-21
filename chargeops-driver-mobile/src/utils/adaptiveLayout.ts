export const adaptiveBreakpoints = {
  mediumWidth: 600,
  expandedWidth: 840,
  shortHeight: 480,
  minimumRailHeight: 360,
  maximumRailFontScale: 1.3,
  railWidth: 112,
} as const;

interface LayoutInput {
  width: number;
  height: number;
  fontScale?: number;
  insets?: { top: number; right: number; bottom: number; left: number };
}

/** Logical window dimensions, rather than physical device type or pixel density. */
export function getAdaptiveLayout({ width, height, fontScale = 1, insets }: LayoutInput) {
  const availableWidth = Math.max(0, width - (insets?.left ?? 0) - (insets?.right ?? 0));
  const availableHeight = Math.max(0, height - (insets?.top ?? 0) - (insets?.bottom ?? 0));
  const widthClass = availableWidth < adaptiveBreakpoints.mediumWidth
    ? 'compact'
    : availableWidth < adaptiveBreakpoints.expandedWidth ? 'medium' : 'expanded';
  const scale = Math.max(1, fontScale);
  const usesNavigationRail = widthClass === 'expanded'
    && availableHeight >= adaptiveBreakpoints.minimumRailHeight
    && scale <= adaptiveBreakpoints.maximumRailFontScale;
  const railContentWidth = Math.ceil(adaptiveBreakpoints.railWidth * scale);

  return {
    widthClass,
    availableWidth,
    availableHeight,
    isShortHeight: availableHeight <= adaptiveBreakpoints.shortHeight,
    usesNavigationRail,
    navigationRailWidth: usesNavigationRail ? railContentWidth + (insets?.left ?? 0) : 0,
    // For tab scenes only. Full-screen stack routes have no navigation rail.
    tabContentWidth: Math.max(0, availableWidth - (usesNavigationRail ? railContentWidth : 0)),
  };
}
