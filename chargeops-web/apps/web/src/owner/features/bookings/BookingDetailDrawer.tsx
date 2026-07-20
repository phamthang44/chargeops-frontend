import type { ReactNode } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BOOKING_STATUS,
  formatDateVn,
  formatDuration,
  formatTimeVn,
  formatVnd,
  useApi,
  type Booking,
} from '@chargeops/api';
import { Button, Drawer, StatusPill, useToast } from '@chargeops/ui';

/** A booking may be cancelled only while pending or confirmed (POL-02). */
function canCancel(b: Booking): boolean {
  return b.status === 'pending' || b.status === 'confirmed';
}

export function BookingDetailDrawer({
  booking,
  onClose,
}: {
  booking: Booking | null;
  onClose: () => void;
}) {
  const api = useApi();
  const qc = useQueryClient();
  const toast = useToast();

  const cancel = useMutation({
    mutationFn: (id: string) => api.bookings.cancel(id),
    onSuccess: (b) => {
      qc.invalidateQueries({ queryKey: ['bookings'] });
      toast(`Đã hủy ${b.id} — hoàn ${formatVnd(b.refundVnd)}`, 'success');
      onClose();
    },
    onError: (e) => toast((e as Error).message, 'error'),
  });

  if (!booking) return null;
  const meta = BOOKING_STATUS[booking.status];

  return (
    <Drawer
      open={!!booking}
      onClose={onClose}
      title={
        <>
          <span className="font-mono text-[16px] font-bold">{booking.id}</span>
          <StatusPill tone={meta.tone} label={meta.label} />
        </>
      }
      footer={
        <>
          <Button variant="secondary" className="flex-1">
            Liên hệ khách
          </Button>
          {canCancel(booking) && (
            <Button
              variant="danger-soft"
              className="flex-1"
              onClick={() => cancel.mutate(booking.id)}
              disabled={cancel.isPending}
            >
              {cancel.isPending ? 'Đang hủy…' : 'Hủy thay khách'}
            </Button>
          )}
        </>
      }
    >
      {/* time window */}
      <div className="rounded-card border border-line-3 bg-surface-2 p-4">
        <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.05em] text-faint">
          KHOẢNG THỜI GIAN · LIÊN TỤC
        </div>
        <div className="flex items-center gap-3">
          <div>
            <div className="text-[22px] font-bold tracking-[-0.02em]">{formatTimeVn(booking.startAt)}</div>
            <div className="text-[11.5px] font-medium text-muted">{formatDateVn(booking.startAt)}</div>
          </div>
          <div className="relative h-0.5 flex-1 rounded-[2px] bg-brand">
            <span className="absolute -top-[9px] left-1/2 -translate-x-1/2 bg-surface-2 px-2 text-[11px] font-semibold text-brand">
              {formatDuration(booking.durationMin)}
            </span>
          </div>
          <div className="text-right">
            <div className="text-[22px] font-bold tracking-[-0.02em]">{formatTimeVn(booking.endAt)}</div>
            <div className="text-[11.5px] font-medium text-muted">{formatDateVn(booking.endAt)}</div>
          </div>
        </div>
      </div>

      {/* charger + driver */}
      <div className="grid grid-cols-2 gap-3.5">
        <Field label="TRỤ SẠC">
          <div className="text-[13px] font-semibold">
            {booking.stationName} · {booking.chargerId}
          </div>
          <div className="text-[12px] font-medium text-muted">
            {booking.connector} · {booking.powerKw} kW
          </div>
        </Field>
        <Field label="TÀI XẾ">
          <div className="text-[13px] font-semibold">{booking.driverName}</div>
          <div className="font-mono text-[12px] text-muted">{booking.driverPhone}</div>
        </Field>
      </div>

      {/* price snapshot */}
      <div className="rounded-card border border-line-3 p-4">
        <div className="mb-[11px] flex items-center justify-between">
          <div className="text-[10px] font-semibold uppercase tracking-[0.05em] text-faint">GIÁ CỐ ĐỊNH (SNAPSHOT)</div>
          <span className="rounded-full bg-warn-pill px-2 py-0.5 text-[10px] font-medium text-warn">
            đã khóa khi đặt
          </span>
        </div>
        <div className="flex flex-col gap-[7px] text-[12.5px] font-medium text-body">
          <div className="flex justify-between">
            <span>Giá {BOOKING_STATUS[booking.status].label === 'Đã hủy' ? '' : ''}({booking.rateKind === 'peak' ? 'Cao điểm' : booking.rateKind === 'offpeak' ? 'Thấp điểm' : 'Giờ thường'})</span>
            <span className="font-mono">{formatVnd(booking.rateVndPerKwh)}/kWh</span>
          </div>
          <div className="flex justify-between">
            <span>Năng lượng ước tính</span>
            <span className="font-mono">~{booking.energyKwh} kWh</span>
          </div>
          <div className="mt-0.5 flex justify-between border-t border-line-3 pt-2 text-[14px] font-bold text-ink">
            <span>Tổng</span>
            <span className="font-mono">{formatVnd(booking.amountVnd)}</span>
          </div>
        </div>
      </div>

      {/* refund state OR policy */}
      {booking.status === 'cancelled' ? (
        <div className="rounded-card border border-bad-border bg-bad-soft px-4 py-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-bad-deep">
              Đã hoàn tiền{booking.refundPct !== null ? ` (${booking.refundPct}%)` : ''}
            </span>
            <span className="font-mono text-[14px] font-bold text-bad">{formatVnd(booking.refundVnd)}</span>
          </div>
        </div>
      ) : (
        canCancel(booking) && (
          <div className="rounded-card border border-line-3 p-4">
            <div className="mb-[9px] text-[10px] font-semibold uppercase tracking-[0.05em] text-faint">
              CHÍNH SÁCH HOÀN TIỀN (BR-PAY-03)
            </div>
            <div className="flex flex-col gap-1.5 text-[12px] font-medium text-body">
              <Policy left="≥ 60 phút trước giờ bắt đầu" right="Hoàn 100%" cls="text-good" />
              <Policy left="15–60 phút trước" right="Hoàn 50%" cls="text-warn" />
              <Policy left="< 15 phút / no-show" right="Hoàn 0%" cls="text-bad" />
            </div>
          </div>
        )
      )}
    </Drawer>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-[5px] text-[10px] font-semibold uppercase tracking-[0.05em] text-faint">{label}</div>
      {children}
    </div>
  );
}

function Policy({ left, right, cls }: { left: string; right: string; cls: string }) {
  return (
    <div className="flex justify-between">
      <span>{left}</span>
      <span className={`font-semibold ${cls}`}>{right}</span>
    </div>
  );
}
