/** Full-stack task routes have no tab rail. Use safe logical dimensions. */
export function getTaskLayout(width: number, height: number, fontScale = 1) {
  const split = width >= 960 && height >= 360 && width / Math.max(1, fontScale) >= 840;
  return { split, contentMaxWidth: split ? 1120 : 720, footerMaxWidth: 720 };
}
