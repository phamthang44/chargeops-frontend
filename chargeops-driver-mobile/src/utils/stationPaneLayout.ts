interface PaneInput { width: number; height: number; fontScale?: number }

export function getDiscoveryPaneLayout({ width, height, fontScale = 1 }: PaneInput) {
  const split = width >= 720 && height >= 360 && width / Math.max(1, fontScale) >= 620;
  const panelWidth = split ? Math.min(360, Math.max(320, Math.round(width * 0.4))) : width;
  return { split, panelWidth, mapWidth: Math.max(0, width - (split ? panelWidth : 0)) };
}

export function getStationDetailLayout({ width, height, fontScale = 1 }: PaneInput) {
  const split = width >= 840 && height >= 360 && width / Math.max(1, fontScale) >= 720;
  return {
    split,
    informationWidth: split ? Math.round(width * 0.5) : width,
    galleryHeight: height <= 480 ? 160 : split ? Math.min(260, Math.round(height * 0.32)) : 260,
  };
}
