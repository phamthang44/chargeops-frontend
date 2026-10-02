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

/**
 * Safely parse any date input (ISO string, epoch number, timestamp array from Jackson, etc.)
 * into a valid Date object. Returns null if invalid or missing, never throws.
 */
export function parseSafeDate(val: any): Date | null {
  if (val === null || val === undefined || val === '') return null;
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? null : val;
  }
  // Array from Java Jackson Instant/LocalDateTime e.g. [2026, 10, 2, 15, 30, 0]
  if (Array.isArray(val) && val.length >= 3) {
    const [y, m, d, h = 0, min = 0, s = 0, nano = 0] = val;
    const ms = Math.floor(nano / 1_000_000);
    const date = new Date(Date.UTC(y, m - 1, d, h, min, s, ms));
    return isNaN(date.getTime()) ? null : date;
  }
  // Number (epoch timestamp in seconds or ms)
  if (typeof val === 'number') {
    const ms = val < 1e11 ? val * 1000 : val;
    const date = new Date(ms);
    return isNaN(date.getTime()) ? null : date;
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed || trimmed.toLowerCase().includes('invalid date')) return null;
    const normalized = trimmed.includes(' ') && !trimmed.includes('T') ? trimmed.replace(' ', 'T') : trimmed;
    const date = new Date(normalized);
    if (!isNaN(date.getTime())) return date;
    const num = Number(trimmed);
    if (!isNaN(num) && num > 0) {
      const ms = num < 1e11 ? num * 1000 : num;
      const dNum = new Date(ms);
      if (!isNaN(dNum.getTime())) return dNum;
    }
  }
  return null;
}

/** Format an ISO datetime as a short Vietnamese date, e.g. "15/06/2026". */
export function formatDate(iso: any): string {
  const d = parseSafeDate(iso);
  if (!d) return '--/--/----';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

/** Format an ISO datetime as a 24h time label, e.g. "08:00". */
export function formatTime(iso: any): string {
  const d = parseSafeDate(iso);
  if (!d) return '--:--';
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Format an ISO datetime as full date-time, e.g. "15:30 15/06/2026". Never returns "Invalid Date". */
export function formatDateTime(iso: any, fallback = '--:-- --/--/----'): string {
  const d = parseSafeDate(iso);
  if (!d) return fallback;
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${hours}:${minutes} ${dd}/${mm}/${d.getFullYear()}`;
}

/** Format a start/end ISO pair as a 24h time range, e.g. "14:00 - 15:00" or "23:00 - 02:00 (+1)". */
export function formatTimeRange(startIso: any, endIso: any): string {
  const s = parseSafeDate(startIso);
  const e = parseSafeDate(endIso);
  if (!s || !e) return '--:-- - --:--';
  const isDiffDay = s.getFullYear() !== e.getFullYear() || s.getMonth() !== e.getMonth() || s.getDate() !== e.getDate();
  return `${formatTime(s)} - ${formatTime(e)}${isDiffDay ? ' (+1)' : ''}`;
}

/** Format an ISO datetime as a short day/month, e.g. "20/06". */
export function formatDayMonth(iso: any): string {
  const d = parseSafeDate(iso);
  if (!d) return '--/--';
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
 * Format a duration in milliseconds as a countdown string:
 * - "hh:mm:ss" if 1 hour or more (e.g. 3661000 -> "01:01:01")
 * - "mm:ss" if under 1 hour (e.g. 56000 -> "00:56")
 */
export function formatCountdown(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const sec = totalSec % 60;
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

