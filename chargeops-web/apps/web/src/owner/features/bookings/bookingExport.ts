export type BookingRange = 'today' | '7d' | '30d' | 'all';

/** Keep all three requests on the same window, independent of the browser timezone. */
export function getRangeWindow(range: BookingRange, now = new Date()): { from?: string; to?: string } {
  if (range === 'all') return {};
  if (range === 'today') {
    const vnDate = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(now);
    const start = new Date(`${vnDate}T00:00:00+07:00`);
    return { from: start.toISOString(), to: new Date(start.getTime() + 86_400_000).toISOString() };
  }
  return {
    from: new Date(now.getTime() - (range === '7d' ? 7 : 30) * 86_400_000).toISOString(),
    to: now.toISOString(),
  };
}

export function downloadBookingFile(file: { blob: Blob; filename: string }): void {
  const url = URL.createObjectURL(file.blob);
  const anchor = document.createElement('a');
  try {
    anchor.href = url;
    anchor.download = file.filename;
    document.body.appendChild(anchor);
    anchor.click();
  } finally {
    anchor.remove();
    // Give the browser time to consume the object URL before releasing it.
    setTimeout(() => URL.revokeObjectURL(url), 1_000);
  }
}
