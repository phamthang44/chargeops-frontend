import type { TouDays, TouRule } from '@chargeops/api';

export const TOU_DAYS_LABEL: Record<TouDays, string> = {
  daily: 'Mỗi ngày',
  weekdays: 'T2–T6',
  weekends: 'T7–CN',
};

/** Percentage difference of a TOU rate vs the base price, for the card badge. */
export function pricePctVsBase(rateVnd: number, baseVnd: number): number {
  if (!baseVnd) return 0;
  return Math.round(((rateVnd - baseVnd) / baseVnd) * 100);
}

type Interval = { start: number; end: number };

function applicableDays(days: TouDays): number[] {
  if (days === 'daily') return [0, 1, 2, 3, 4, 5, 6];
  if (days === 'weekdays') return [0, 1, 2, 3, 4];
  return [5, 6];
}

function minuteOfDay(value: string): number {
  const [hour = 0, minute = 0] = value.split(':').map(Number);
  return hour * 60 + minute;
}

function expandRule(rule: Pick<TouRule, 'days' | 'from' | 'to'>): Interval[] {
  const startMinute = minuteOfDay(rule.from);
  const endMinute = minuteOfDay(rule.to);
  const overnight = endMinute < startMinute;
  const week = 7 * 24 * 60;
  return applicableDays(rule.days).flatMap((day) => {
    const start = day * 24 * 60 + startMinute;
    const end = day * 24 * 60 + endMinute + (overnight ? 24 * 60 : 0);
    return end <= week
      ? [{ start, end }]
      : [{ start, end: week }, { start: 0, end: end - week }];
  });
}

/** True when the candidate creates an ambiguous rate on any real weekday. */
export function hasTouOverlap(
  existingRules: TouRule[],
  candidate: Omit<TouRule, 'id'>,
  editId?: string,
): boolean {
  const candidateIntervals = expandRule(candidate);
  return existingRules
    .filter((rule) => rule.id !== editId)
    .some((rule) =>
      expandRule(rule).some((existing) =>
        candidateIntervals.some(
          (candidateInterval) =>
            existing.start < candidateInterval.end &&
            candidateInterval.start < existing.end,
        ),
      ),
    );
}
