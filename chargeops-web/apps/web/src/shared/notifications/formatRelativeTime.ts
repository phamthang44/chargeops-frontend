/**
 * Formats an ISO createdAt date or timestamp into a localized relative time string.
 * Uses the common:relativeTime namespace keys.
 */
export function formatRelativeTime(
  createdAt: string | Date | undefined | null,
  t: (key: string, options?: any) => string,
): string | undefined {
  if (!createdAt) return undefined;
  try {
    const diffMs = Date.now() - new Date(createdAt).getTime();
    const diffMins = Math.floor(diffMs / 60_000);
    if (diffMins < 1) {
      return t('relativeTime.justNow', { ns: 'common', defaultValue: 'Vừa xong' });
    }
    if (diffMins < 60) {
      return t('relativeTime.minutesAgo', { ns: 'common', count: diffMins, defaultValue: `${diffMins} phút trước` });
    }
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) {
      return t('relativeTime.hoursAgo', { ns: 'common', count: diffHours, defaultValue: `${diffHours} giờ trước` });
    }
    const diffDays = Math.floor(diffHours / 24);
    return t('relativeTime.daysAgo', { ns: 'common', count: diffDays, defaultValue: `${diffDays} ngày trước` });
  } catch {
    return undefined;
  }
}
