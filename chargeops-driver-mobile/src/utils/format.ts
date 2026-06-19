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
