import {
  BOOKING_STATUS,
  formatDuration,
  formatTimeVn,
  formatVnd,
  type Booking,
} from '@chargeops/api';
import { EmptyState, StatusPill } from '@chargeops/ui';

const GRID = '0.9fr 1.2fr 0.8fr 1.1fr 0.7fr 0.8fr 0.9fr 0.7fr';
const HEADERS = ['MÃ', 'TÀI XẾ', 'TRỤ', 'KHUNG GIỜ', 'THỜI LƯỢNG', 'P.THỨC', 'SỐ TIỀN', 'TRẠNG THÁI'];

/** Desktop bookings table. Click a row to open the detail drawer. */
export function BookingTable({
  rows,
  onOpen,
}: {
  rows: Booking[];
  onOpen: (b: Booking) => void;
}) {
  return (
    <div className="min-w-[820px]">
      <div
        className="grid bg-surface-2 px-4 py-[11px] font-mono text-[10px] font-semibold tracking-[0.05em] text-faint"
        style={{ gridTemplateColumns: GRID }}
      >
        {HEADERS.map((h, i) => (
          <span key={h} className={i === 6 ? 'text-right' : i === 7 ? 'text-center' : ''}>
            {h}
          </span>
        ))}
      </div>

      {rows.length === 0 ? (
        <EmptyState>Không có lượt đặt nào khớp bộ lọc.</EmptyState>
      ) : (
        rows.map((b) => {
          const meta = BOOKING_STATUS[b.status];
          return (
            <div
              key={b.id}
              onClick={() => onOpen(b)}
              className="grid cursor-pointer items-center border-b border-hairline px-4 py-3 text-[12.5px] font-medium hover:bg-[#fafaff]"
              style={{ gridTemplateColumns: GRID }}
            >
              <span className="font-mono text-[11.5px] font-semibold text-brand">{b.id}</span>
              <span className="font-semibold">{b.driverName}</span>
              <span className="text-muted">{b.chargerId}</span>
              <span className="text-muted">
                {formatTimeVn(b.startAt)}–{formatTimeVn(b.endAt)}
              </span>
              <span className="font-mono text-[11.5px] text-muted">{formatDuration(b.durationMin)}</span>
              <span className="text-muted">{b.method}</span>
              <span className="text-right font-semibold">{formatVnd(b.amountVnd)}</span>
              <span className="text-center">
                <StatusPill tone={meta.tone} label={meta.label} />
              </span>
            </div>
          );
        })
      )}
    </div>
  );
}
