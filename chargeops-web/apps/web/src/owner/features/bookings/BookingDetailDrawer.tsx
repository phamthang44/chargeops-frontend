import { useTranslation } from 'react-i18next';
import { type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BOOKING_STATUS,
  CANCELLATION_REASON,
  formatDateVn,
  formatDuration,
  formatTimeVn,
  formatVnd,
  useApi,
} from '@chargeops/api';
import { Button, Drawer, Skeleton, StatusPill } from '@chargeops/ui';

export function BookingDetailDrawer({
  bookingId,
  onClose,
}: {
  bookingId: string | null;
  onClose: () => void;
}) {
  const { t } = useTranslation('owner');
  const api = useApi();

  const detailQuery = useQuery({
    queryKey: ['ownerBookings', 'detail', bookingId],
    queryFn: () => api.ownerBookings.get(bookingId!),
    enabled: Boolean(bookingId),
  });

  if (!bookingId) return null;

  const booking = detailQuery.data;
  const isLoading = detailQuery.isLoading || !booking;
  const meta = booking ? BOOKING_STATUS[booking.status] ?? { label: booking.status, tone: 'neutral' } : null;

  return (
    <Drawer
      open={Boolean(bookingId)}
      onClose={onClose}
      title={
        isLoading || !booking || !meta ? (
          <span className="font-mono text-[16px] font-bold">Đang tải...</span>
        ) : (
          <>
            <span className="font-mono text-[16px] font-bold">{booking.bookingCode || booking.bookingId}</span>
            <StatusPill tone={meta.tone} label={meta.label} />
          </>
        )
      }
      footer={
        <>
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            {t('bookings.contactBtn')}
          </Button>
          <Button
            variant="danger-soft"
            className="flex-1"
            disabled
            title={t('bookings.ownerCancelDisabled')}
          >
            {t('bookings.ownerCancelDisabledBtn')}
          </Button>
        </>
      }
    >
      {isLoading || !booking ? (
        <div className="flex flex-col gap-4 p-2">
          <Skeleton className="h-24 w-full" />
          <div className="grid grid-cols-2 gap-3.5">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Reconciliation pending warning */}
          {booking.stateReconciliationPending && (
            <div className="rounded-card border border-warn bg-warn-soft px-3.5 py-2.5 text-[12px] font-medium text-warn">
              Trạng thái đơn đặt chỗ đang được hệ thống đối soát đồng bộ.
            </div>
          )}

          {/* Cancellation reason if cancelled */}
          {booking.cancellationReason && (
            <div className="rounded-card border border-line-3 bg-surface-2 px-3.5 py-2 text-[12px] font-medium text-body">
              <span className="font-semibold text-bad">Lý do hủy: </span>
              {CANCELLATION_REASON[booking.cancellationReason]?.label ?? booking.cancellationReason}
            </div>
          )}

          {/* time window */}
          <div className="rounded-card border border-line-3 bg-surface-2 p-4">
            <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.05em] text-faint">
              {t('bookings.rangeLabel')}
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
            <Field label={t('bookings.chargerLabel')}>
              <div className="text-[13px] font-semibold">
                {booking.station?.stationName || 'Trạm sạc'}
              </div>
              <div className="text-[12px] font-medium text-muted">
                {booking.station?.connectorCode || 'Cổng sạc'}
              </div>
              {booking.station?.stationAddress && (
                <div className="mt-0.5 truncate text-[11px] text-faint">
                  {booking.station.stationAddress}
                </div>
              )}
            </Field>
            <Field label={t('bookings.driverLabel')}>
              <div className="text-[13px] font-semibold">{booking.driverDisplayName}</div>
              <div className="text-[11.5px] text-muted">Tài xế đã xác thực</div>
            </Field>
          </div>

          {/* price snapshot */}
          <div className="rounded-card border border-line-3 p-4">
            <div className="mb-[11px] flex items-center justify-between">
              <div className="text-[10px] font-semibold uppercase tracking-[0.05em] text-faint">{t('bookings.snapshotLabel')}</div>
              <span className="rounded-full bg-warn-pill px-2 py-0.5 text-[10px] font-medium text-warn">
                {t('bookings.rateKind.locked')}
              </span>
            </div>
            <div className="flex flex-col gap-[7px] text-[12.5px] font-medium text-body">
              {booking.priceLines && booking.priceLines.length > 0 ? (
                booking.priceLines.map((line) => (
                  <div key={line.sequence} className="flex justify-between">
                    <span>
                      {formatTimeVn(line.startAt)}–{formatTimeVn(line.endAt)} ·{' '}
                      <span className="text-muted">{line.label}</span>
                    </span>
                    <span className="font-mono">
                      {formatVnd(line.rateVndPerKwh)}/kWh · {formatVnd(line.amount)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="flex justify-between">
                  <span>Giá gói cố định</span>
                  <span className="font-mono">{formatVnd(booking.totalAmount)}</span>
                </div>
              )}
              <div className="mt-0.5 flex justify-between border-t border-line-3 pt-2 text-[14px] font-bold text-ink">
                <span>{t('bookings.total')}</span>
                <span className="font-mono">{formatVnd(booking.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Payment & Checkout Details */}
          {booking.payment && (
            <div className="rounded-card border border-line-3 bg-surface-2 p-4">
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.05em] text-faint">
                THANH TOÁN · {booking.payment.method}
              </div>
              <div className="flex justify-between text-[12.5px] font-medium">
                <span className="text-muted">Trạng thái thanh toán:</span>
                <span className="font-semibold">{booking.payment.status}</span>
              </div>
              <div className="mt-1 flex justify-between text-[12.5px] font-medium">
                <span className="text-muted">Đã thu:</span>
                <span className="font-mono font-semibold">{formatVnd(booking.payment.collectedAmount)}</span>
              </div>
            </div>
          )}

          {/* Refunds details if any */}
          {booking.refunds && booking.refunds.length > 0 && (
            <div className="rounded-card border border-bad-border bg-bad-soft px-4 py-3.5">
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.05em] text-bad-deep">
                NGHĨA VỤ HOÀN TIỀN
              </div>
              {booking.refunds.map((ref) => (
                <div key={ref.refundId} className="flex items-center justify-between text-[12px] font-medium">
                  <span className="text-bad-deep">Lý do: {ref.reason} ({ref.status})</span>
                  <span className="font-mono text-[14px] font-bold text-bad">{formatVnd(ref.amount)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Refund policy guidelines */}
          <div className="rounded-card border border-line-3 p-4">
            <div className="mb-[9px] text-[10px] font-semibold uppercase tracking-[0.05em] text-faint">
              {t('bookings.refundPolicy')}
            </div>
            <div className="flex flex-col gap-1.5 text-[12px] font-medium text-body">
              <Policy left={t('bookings.policyGrace')} right={t('bookings.refundGrace')} cls="text-good" />
              <Policy left={t('bookings.policyAfterGrace')} right={t('bookings.refundAfterGrace')} cls="text-bad" />
              <Policy left={t('bookings.policyStationFailure')} right={t('bookings.refundStationFailure')} cls="text-good" />
            </div>
          </div>
        </div>
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
