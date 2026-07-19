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

/** "2026-06-28T14:00:00" → "28/06/2026" */
export function formatDateVn(iso: string): string {
  const d = new Date(iso);
  const pad = (x: number) => String(x).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** "2026-06-28T14:00:00" → "14:00" */
export function formatTimeVn(iso: string): string {
  const d = new Date(iso);
  const pad = (x: number) => String(x).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 90 → "1h30", 60 → "1h00" */
export function formatDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}h${String(m).padStart(2, '0')}`;
}
