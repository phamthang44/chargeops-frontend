import type { TouDays } from '@chargeops/api';

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
