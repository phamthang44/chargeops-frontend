import { useTranslation } from 'react-i18next';
import {
  BOOKING_STATUS,
  formatTimeVn,
  formatVnd,
  type OwnerBookingListItem,
} from '@chargeops/api';
import { Card, EmptyState, StatusPill } from '@chargeops/ui';

/** Mobile bookings list (replaces the table below md, BKG-047 / FE-15). */
export function BookingCards({ rows, onOpen }: { rows: OwnerBookingListItem[]; onOpen: (b: OwnerBookingListItem) => void }) {
  const { t } = useTranslation('owner');
  if (rows.length === 0) return <EmptyState>{t('bookings.emptyState')}</EmptyState>;
  return (
    <div className="flex flex-col gap-2.5">
      {rows.map((b) => {
        const meta = BOOKING_STATUS[b.status] ?? { label: b.status, tone: 'neutral' };
        return (
          <Card key={b.bookingId} className="cursor-pointer p-[13px]" onClick={() => onOpen(b)}>
            <div className="mb-[7px] flex items-center justify-between">
              <span className="font-mono text-[11.5px] font-semibold text-brand">{b.bookingCode || b.bookingId}</span>
              <StatusPill tone={meta.tone} label={meta.label} />
            </div>
            <div className="mb-1 text-[14px] font-semibold">{b.driverDisplayName}</div>
            <div className="flex items-center justify-between text-[12px] font-medium text-muted">
              <span className="truncate pr-2">
                {b.stationName} · {b.connectorCode || b.connectorId} · {formatTimeVn(b.startAt)}–{formatTimeVn(b.endAt)}
              </span>
              <span className="shrink-0 font-semibold text-ink">{formatVnd(b.totalAmount)}</span>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
