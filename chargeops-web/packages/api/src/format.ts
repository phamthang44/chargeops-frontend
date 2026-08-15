/** Display helpers for the Vietnamese locale — keep formatting out of components. */

/** 4200000 → "₫4.200.000" */
export function formatVnd(n: number): string {
  return '₫' + n.toLocaleString('vi-VN');
}

/** 4200000 → "₫4,2tr"; 850000 → "₫850k" */
export function formatVndCompact(n: number): string {
  if (Math.abs(n) >= 1_000_000) {
    const m = n / 1_000_000;
    return '₫' + m.toLocaleString('vi-VN', { maximumFractionDigits: 1 }) + 'tr';
  }
  if (Math.abs(n) >= 1_000) {
    return '₫' + Math.round(n / 1_000).toLocaleString('vi-VN') + 'k';
  }
  return formatVnd(n);
}

/**
 * Helper to ensure an ISO timestamp string from backend (Instant / UTC)
 * is parsed correctly with fallback 'Z' if missing.
 */
function parseUtcDate(iso: string | Date): Date {
  if (iso instanceof Date) return iso;
  if (!iso) return new Date();
  const str = String(iso).trim();
  // If ISO string doesn't specify timezone offset or 'Z', append 'Z' to treat as UTC Instant
  const normalized = str.includes('Z') || str.includes('+') || (str.includes('-') && str.length > 19)
    ? str
    : `${str}Z`;
  const d = new Date(normalized);
  return isNaN(d.getTime()) ? new Date(str) : d;
}

/** "2026-06-28T01:15:00Z" → "28/06/2026" (in Asia/Ho_Chi_Minh, UTC+7) */
export function formatDateVn(iso: string | Date): string {
  const d = parseUtcDate(iso);
  return d.toLocaleDateString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/** "2026-06-28T01:15:00Z" → "08:15" (in Asia/Ho_Chi_Minh, UTC+7) */
export function formatTimeVn(iso: string | Date): string {
  const d = parseUtcDate(iso);
  return d.toLocaleTimeString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/** "2026-06-28T01:15:00Z" → "08:15 · 28/06/2026" (in Asia/Ho_Chi_Minh, UTC+7) */
export function formatDateTimeVn(iso: string | Date): string {
  const d = parseUtcDate(iso);
  const time = formatTimeVn(d);
  const date = formatDateVn(d);
  return `${time} · ${date}`;
}

/** 90 → "1h30", 60 → "1h00" */
export function formatDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}h${String(m).padStart(2, '0')}`;
}
