import {
  BOOKING_STATUS,
  formatTimeVn,
  formatVnd,
  type Booking,
} from '@chargeops/api';
import { Card, EmptyState, StatusPill } from '@chargeops/ui';

/** Mobile bookings list (replaces the table below md). */
export function BookingCards({ rows, onOpen }: { rows: Booking[]; onOpen: (b: Booking) => void }) {
  if (rows.length === 0) return <EmptyState>Không có lượt đặt nào khớp bộ lọc.</EmptyState>;
  return (
    <div className="flex flex-col gap-2.5">
      {rows.map((b) => {
        const meta = BOOKING_STATUS[b.status];
        return (
          <Card key={b.id} className="cursor-pointer p-[13px]" onClick={() => onOpen(b)}>
            <div className="mb-[7px] flex items-center justify-between">
              <span className="font-mono text-[11.5px] font-semibold text-brand">{b.id}</span>
              <StatusPill tone={meta.tone} label={meta.label} />
            </div>
            <div className="mb-1 text-[14px] font-semibold">{b.driverName}</div>
            <div className="flex items-center justify-between text-[12px] font-medium text-muted">
              <span>
                {b.chargerId} · {formatTimeVn(b.startAt)}–{formatTimeVn(b.endAt)}
              </span>
              <span className="font-semibold text-ink">{formatVnd(b.amountVnd)}</span>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
