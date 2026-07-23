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

/** Format a start/end ISO pair as a 24h time range, e.g. "14:00 - 15:00". */
export function formatTimeRange(startIso: string, endIso: string): string {
  return `${formatTime(startIso)} - ${formatTime(endIso)}`;
}

/** Format an ISO datetime as a short day/month, e.g. "20/06". */
export function formatDayMonth(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Split a minute count into hours + minutes so screens can compose a localized
 * duration label via i18n rather than hardcoding "giờ"/"phút" here.
 */
export function splitDuration(totalMin: number): { hours: number; minutes: number } {
  return { hours: Math.floor(totalMin / 60), minutes: totalMin % 60 };
}

/**
 * Format a millisecond duration as a MM:SS countdown, e.g. "04:52".
 * Used for the short grace-period / payment-hold timers.
 */
export function formatMmSs(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Format a millisecond duration as a HH:MM:SS countdown, e.g. "00:14:28".
 * Negative values clamp to "00:00:00".
 */
export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}
