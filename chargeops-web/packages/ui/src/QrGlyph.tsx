/** Static QR-style glyph (check-in QR placeholder). Not a real code — display only. */
export function QrGlyph({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" shapeRendering="crispEdges">
      <rect width="64" height="64" fill="#fff" />
      <g fill="#16171a">
        <rect x="4" y="4" width="16" height="16" />
        <rect x="8" y="8" width="8" height="8" fill="#fff" />
        <rect x="44" y="4" width="16" height="16" />
        <rect x="48" y="8" width="8" height="8" fill="#fff" />
        <rect x="4" y="44" width="16" height="16" />
        <rect x="8" y="48" width="8" height="8" fill="#fff" />
        <rect x="26" y="6" width="4" height="4" />
        <rect x="32" y="10" width="4" height="4" />
        <rect x="26" y="16" width="4" height="4" />
        <rect x="38" y="26" width="4" height="4" />
        <rect x="44" y="30" width="6" height="4" />
        <rect x="52" y="38" width="4" height="6" />
        <rect x="26" y="28" width="4" height="4" />
        <rect x="30" y="34" width="4" height="4" />
        <rect x="26" y="40" width="4" height="4" />
        <rect x="38" y="44" width="4" height="4" />
        <rect x="44" y="48" width="4" height="8" />
        <rect x="52" y="52" width="4" height="4" />
        <rect x="34" y="52" width="4" height="4" />
      </g>
    </svg>
  );
}
