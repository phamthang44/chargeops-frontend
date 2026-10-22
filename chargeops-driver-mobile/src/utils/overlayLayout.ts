/** Geometry only; keyboard avoidance and form state stay with their owners. */
export function getOverlayLayout(width: number, height: number) {
  const isDialog = width >= 600 && height >= 360;
  const gutter = isDialog ? 16 : 0;
  return {
    isDialog,
    gutter,
    maxHeight: Math.max(0, height - (isDialog ? 32 : 8)),
    maxWidth: 640,
  };
}

export function getAvatarPreviewSize(width: number, height: number) {
  return Math.max(0, Math.min(340, width - 48, height - 240));
}

export function getPortraitGuideSize(width: number, height: number) {
  const guideHeight = Math.max(0, Math.min(300, height - 220, (width - 48) * 1.25));
  return { width: guideHeight * 0.8, height: guideHeight };
}
