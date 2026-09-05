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

/** Format a start/end ISO pair as a 24h time range, e.g. "14:00 - 15:00" or "23:00 - 02:00 (+1)". */
export function formatTimeRange(startIso: string, endIso: string): string {
  const s = new Date(startIso);
  const e = new Date(endIso);
  const isDiffDay = s.getFullYear() !== e.getFullYear() || s.getMonth() !== e.getMonth() || s.getDate() !== e.getDate();
  return `${formatTime(startIso)} - ${formatTime(endIso)}${isDiffDay ? ' (+1)' : ''}`;
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
  const s = Math.max(0, Math.floor(ms / 1000));
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

/**
 * Format a second duration as a countdown string, e.g. 3661 -> "01:01:01".
 */
export function formatCountdown(secOrMs: number): string {
  const s = secOrMs > 100000 ? Math.floor(secOrMs / 1000) : secOrMs;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

/** Format ISO string to human relative time string e.g. "5 phút trước", "2 giờ trước", "1 ngày trước". */
export function formatRelativeTime(iso: string, t?: any): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return 'Vừa xong';
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} ngày trước`;
}

/**
 * Formats equipment names (ChargePoint, Connector) dynamically based on current locale.
 * Converts Vietnamese prefixes like "Trụ A" -> "Post A", "Trụ sạc A" -> "Charge Point A",
 * "Cổng 1" -> "Port 1", "Súng 1" -> "Connector 1".
 */
export function formatEquipmentName(name?: string | null, lang: string = 'vi'): string {
  if (!name) return '';
  const isEn = typeof lang === 'string' && lang.toLowerCase().startsWith('en');
  if (!isEn) return name;

  return name
    .replace(/(^|[\s·\-\/])Trụ sạc\s+/gi, '$1Charge Point ')
    .replace(/(^|[\s·\-\/])Trụ\s+/gi, '$1Charge Point ')
    .replace(/(^|[\s·\-\/])Cổng sạc\s+/gi, '$1Port ')
    .replace(/(^|[\s·\-\/])Cổng\s+/gi, '$1Port ')
    .replace(/(^|[\s·\-\/])Súng sạc\s+/gi, '$1Connector ')
    .replace(/(^|[\s·\-\/])Súng\s+/gi, '$1Connector ');
}

