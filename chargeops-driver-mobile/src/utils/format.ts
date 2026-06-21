/**
 * Display formatting helpers (Vietnamese đồng).
 * Currency uses '.' as the thousands separator — e.g. 3850 -> "3.850đ".
 * Implemented without Intl so it works under Hermes without locale data.
 */

/** Group a non-negative integer with '.' thousands separators. */
function groupThousands(value: number): string {
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** Format a VND amount, e.g. 45000 -> "45.000đ". */
export function formatVnd(value: number): string {
  return `${groupThousands(value)}đ`;
}

/** Format an informational đ/kWh rate label, e.g. 3850 -> "3.850đ/kWh". */
export function formatRate(value: number): string {
  return `${groupThousands(value)}đ/kWh`;
}

/** Format an ISO datetime as a short Vietnamese date, e.g. "15/06/2026". */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

/** Format an ISO datetime as a 24h time label, e.g. "08:00". */
export function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
