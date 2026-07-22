import { useTranslation } from 'react-i18next';
import { useEffect, useState, type ReactNode } from 'react';
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

const GRACE_MS = 5 * 60_000;

/** A booking may be cancelled only while pending or confirmed (POL-02). */
function canCancel(b: Booking): boolean {
  return b.status === 'pending' || b.status === 'confirmed';
}

function clock(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function mmss(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function BookingDetailDrawer({
  booking,
  onClose,
}: {
  booking: Booking | null;
  onClose: () => void;
}) {
  const { t } = useTranslation('owner');
  const api = useApi();
  const qc = useQueryClient();
  const toast = useToast();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!booking || !canCancel(booking)) return;
    const graceEndsAt = new Date(booking.createdAt).getTime() + GRACE_MS;
    if (Date.now() >= graceEndsAt) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [booking?.id, booking?.createdAt, booking?.status]);

  const cancel = useMutation({
    mutationFn: (id: string) => api.bookings.cancel(id),
    onSuccess: (b) => {
      qc.invalidateQueries({ queryKey: ['bookings'] });
      toast(t('bookings.cancelSuccess', { id: b.id, refund: formatVnd(b.refundVnd) }), 'success');
      onClose();
    },
    onError: (e) => toast((e as Error).message, 'error'),
  });

  if (!booking) return null;
  const meta = BOOKING_STATUS[booking.status];

  const graceEndsAt = new Date(booking.createdAt).getTime() + GRACE_MS;
  const inGrace = canCancel(booking) && now < graceEndsAt;
  const graceRemainingSec = Math.max(0, Math.round((graceEndsAt - now) / 1000));

  const kindLabel = booking.rateKind === 'peak'
    ? t('bookings.rateKind.peak')
    : booking.rateKind === 'offpeak'
      ? t('bookings.rateKind.offpeak')
      : t('bookings.rateKind.normal');

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
            {t('bookings.contactBtn')}
          </Button>
          {canCancel(booking) && (
            <Button
              variant="danger-soft"
              className="flex-1"
              onClick={() => cancel.mutate(booking.id)}
              disabled={cancel.isPending}
            >
              {cancel.isPending ? t('bookings.canceling') : t('bookings.cancelBtn')}
            </Button>
          )}
        </>
      }
    >
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
            {booking.stationName} · {booking.connectorId}
          </div>
          <div className="text-[12px] font-medium text-muted">
            {booking.connector} · {booking.powerKw} kW
          </div>
        </Field>
        <Field label={t('bookings.driverLabel')}>
          <div className="text-[13px] font-semibold">{booking.driverName}</div>
          <div className="font-mono text-[12px] text-muted">{booking.driverPhone}</div>
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
          <div className="flex justify-between">
            <span>{t('bookings.rateLabel', { kind: kindLabel })}</span>
            <span className="font-mono">{formatVnd(booking.rateVndPerKwh)}/kWh</span>
          </div>
          <div className="flex justify-between">
            <span>{t('bookings.estEnergy')}</span>
            <span className="font-mono">~{booking.energyKwh} kWh</span>
          </div>
          <div className="mt-0.5 flex justify-between border-t border-line-3 pt-2 text-[14px] font-bold text-ink">
            <span>{t('bookings.total')}</span>
            <span className="font-mono">{formatVnd(booking.amountVnd)}</span>
          </div>
        </div>
      </div>

      {/* live grace-period hint (FR05/FR08 — reconsideration window) */}
      {inGrace && (
        <div className="flex items-center justify-between rounded-card bg-good-soft px-4 py-3">
          <span className="text-[12px] font-semibold text-good-deep">
            {t('bookings.graceHint', { time: clock(new Date(graceEndsAt)) })}
          </span>
          <span className="font-mono text-[13px] font-bold text-good-deep">{mmss(graceRemainingSec)}</span>
        </div>
      )}

      {/* refund state OR policy */}
      {booking.status === 'cancelled' ? (
        <div className="rounded-card border border-bad-border bg-bad-soft px-4 py-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-bad-deep">
              {t('bookings.refundedLabel', { percent: booking.refundPct !== null ? ` (${booking.refundPct}%)` : '' })}
            </span>
            <span className="font-mono text-[14px] font-bold text-bad">{formatVnd(booking.refundVnd)}</span>
          </div>
        </div>
      ) : (
        canCancel(booking) && (
          <div className="rounded-card border border-line-3 p-4">
            <div className="mb-[9px] text-[10px] font-semibold uppercase tracking-[0.05em] text-faint">
              {t('bookings.refundPolicy')}
            </div>
            <div className="flex flex-col gap-1.5 text-[12px] font-medium text-body">
              <Policy left={t('bookings.policyGrace')} right={t('bookings.refundGrace')} cls="text-good" />
              <Policy left={t('bookings.policy60')} right={t('bookings.refund100')} cls="text-good" />
              <Policy left={t('bookings.policy15')} right={t('bookings.refund50')} cls="text-warn" />
              <Policy left={t('bookings.policy0')} right={t('bookings.refund0')} cls="text-bad" />
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
