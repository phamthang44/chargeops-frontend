import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  BOOKING_STATUS,
  CANCELLATION_REASON,
  formatDateVn,
  formatTimeVn,
  formatVnd,
  useApi,
  type AdminBookingDossier,
  type Ticket,
  type TicketEscalation,
} from '@chargeops/api';
import {
  Button,
  Card,
  IconAlertTriangle,
  IconCalendar,
  IconCard,
  IconCheckCircle,
  IconClock,
  IconInfoCircle,
  IconLock,
  IconShieldCheck,
  Skeleton,
  StatusPill,
} from '@chargeops/ui';

interface Props {
  ticket: Ticket;
  escalation?: TicketEscalation | null;
  admin: boolean;
  onOpenReviewModal: () => void;
}

type MilestoneKind = 'event' | 'deadline';

interface Milestone {
  key: string;
  labelKey: string;
  at: string | null;
  kind: MilestoneKind;
}

const PAYMENT_TONE: Record<string, 'good' | 'warn' | 'bad' | 'brand' | 'neutral' | 'ink'> = {
  PENDING: 'warn',
  PAID: 'good',
  FAILED: 'bad',
  PARTIALLY_REFUNDED: 'warn',
  REFUNDED: 'neutral',
};

function Section({ index, title, children }: { index: string; title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="rounded-md border border-brand-line bg-brand-soft px-1.5 py-[1px] font-mono text-[9.5px] font-bold text-brand">
          {index}
        </span>
        <h4 className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">{title}</h4>
        <span className="h-px flex-1 bg-hairline" />
      </div>
      {children}
    </section>
  );
}

function Row({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-[11.5px]">
      <span className="shrink-0 text-muted">{label}</span>
      <span className={`min-w-0 break-words text-right text-ink ${mono ? 'font-mono text-[11px]' : 'font-medium'}`}>
        {value}
      </span>
    </div>
  );
}

function MilestoneRow({
  item,
  reason,
  isLast,
  label,
}: {
  item: Milestone;
  reason?: string | null;
  isLast: boolean;
  label: string;
}) {
  const isDeadline = item.kind === 'deadline';
  return (
    <li className="relative flex gap-3 pb-3 last:pb-0">
      <span className="relative flex w-3 shrink-0 justify-center">
        {!isLast ? <span className="absolute bottom-0 top-3 w-px bg-hairline" /> : null}
        <span
          className={`relative mt-[3px] block h-2.5 w-2.5 rounded-full border-2 ${
            isDeadline ? 'border-dashed border-warn bg-surface' : 'border-brand bg-brand'
          }`}
        />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className={`truncate text-[11.5px] ${isDeadline ? 'text-muted' : 'font-semibold text-ink'}`}>
            {label}
          </span>
          <span className="shrink-0 font-mono text-[10.5px] text-muted">
            {formatDateVn(item.at)} {formatTimeVn(item.at)}
          </span>
        </div>
        {reason ? <p className="mt-0.5 text-[10.5px] text-muted">{reason}</p> : null}
      </div>
    </li>
  );
}

function buildMilestones(dossier: AdminBookingDossier): Milestone[] {
  const tl = dossier.timeline;
  const rows: Milestone[] = [
    { key: 'hold', labelKey: 'escalation.dossier.mHold', at: tl.expiresAt ?? null, kind: 'deadline' },
    { key: 'paid', labelKey: 'escalation.dossier.mPaid', at: tl.paymentConfirmedAt ?? null, kind: 'event' },
    { key: 'grace', labelKey: 'escalation.dossier.mGrace', at: tl.freeCancellationDeadline ?? null, kind: 'deadline' },
    { key: 'checkedIn', labelKey: 'escalation.dossier.mCheckedIn', at: tl.checkedInAt ?? null, kind: 'event' },
    { key: 'checkInEnd', labelKey: 'escalation.dossier.mCheckInDeadline', at: tl.checkInDeadline ?? null, kind: 'deadline' },
    { key: 'charging', labelKey: 'escalation.dossier.mCharging', at: tl.chargingStartedAt ?? null, kind: 'event' },
    { key: 'completed', labelKey: 'escalation.dossier.mCompleted', at: tl.completedAt ?? null, kind: 'event' },
    { key: 'cancelled', labelKey: 'escalation.dossier.mCancelled', at: tl.cancelledAt ?? null, kind: 'event' },
  ];
  return rows
    .filter((r) => Boolean(r.at))
    .sort((a, b) => Date.parse(String(a.at)) - Date.parse(String(b.at)));
}

export function AdminRefundPolicyReviewCard({ ticket, escalation, admin, onOpenReviewModal }: Props) {
  const { t } = useTranslation('tickets');
  const api = useApi();

  const escalationId = escalation?.escalationId;

  const contextQuery = useQuery({
    queryKey: ['ticketEscalations', 'refundPolicyContext', ticket.id, escalationId],
    queryFn: () => api.ticketEscalations.getRefundPolicyContext(ticket.id, escalationId as string),
    enabled: Boolean(admin && ticket.bookingId && escalationId),
    retry: false,
    refetchOnWindowFocus: false,
  });

  if (!admin || !ticket.bookingId || !escalation) return null;

  const context = contextQuery.data;
  const dossier = context?.dossier ?? null;
  const isLoading = contextQuery.isLoading;
  const isClosed = ticket.status === 'CLOSED';
  const caseActive = Boolean(context?.active) && !isClosed;
  const canReview = Boolean(!isClosed && contextQuery.isSuccess && context?.reviewEligibility?.allowed);
  const unavailable = !escalationId || contextQuery.isError;

  const payment = dossier?.payment ?? null;
  const receipt = dossier?.receipt ?? null;
  const priceLines = dossier?.priceLines ?? [];
  const latest = context?.latestDecision ?? null;
  const refundSummary = context?.refundSummary ?? null;
  const bookingMeta = context ? BOOKING_STATUS[context.bookingStatus] ?? null : null;
  const cancelMeta = dossier?.timeline.cancellationReason
    ? CANCELLATION_REASON[dossier.timeline.cancellationReason as keyof typeof CANCELLATION_REASON] ?? null
    : null;
  const milestones = dossier ? buildMilestones(dossier) : [];

  const obligation =
    refundSummary == null
      ? { label: t('escalation.dossier.obligationNone'), tone: 'neutral' as const }
      : refundSummary.status === 'SUCCEEDED'
        ? { label: t('escalation.dossier.obligationSucceeded'), tone: 'good' as const }
        : { label: t('escalation.dossier.obligationPending'), tone: 'warn' as const };

  return (
    <Card className="overflow-hidden">
      {/* Dossier header */}
      <div className="border-b border-hairline bg-gradient-to-br from-brand-soft/70 via-surface to-surface px-4 py-3.5">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-brand-line bg-surface text-brand shadow-[0_1px_2px_rgba(16,24,40,0.06)]">
            <IconShieldCheck className="h-4.5 w-4.5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-[13.5px] font-bold tracking-tight text-ink">
                {t('escalation.dossier.title')}
              </h3>
              <StatusPill tone="brand" label={t('escalation.refundPolicy.adminRole')} />
            </div>
            <p className="mt-0.5 text-[11px] leading-snug text-muted">
              {t('escalation.dossier.subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* Scope strip */}
      <div
        className={`flex items-start gap-2 border-b border-hairline px-4 py-2 text-[10.5px] leading-snug ${
          caseActive ? 'bg-brand-soft/40 text-brand' : 'bg-warn-pill text-warn'
        }`}
      >
        {caseActive ? <IconShieldCheck className="mt-[1px] h-3.5 w-3.5 shrink-0" /> : <IconLock className="mt-[1px] h-3.5 w-3.5 shrink-0" />}
        <span>{caseActive ? t('escalation.dossier.scopeActive') : t('escalation.dossier.scopeReadOnly')}</span>
      </div>

      <div className="space-y-4 px-4 py-4">
        {/* Case context */}
        <div className="space-y-1.5 rounded-xl border border-hairline bg-line-2/40 p-3">
          <Row
            label={t('escalation.dossier.stationLabel')}
            value={ticket.stationName ?? t('escalation.refundPolicy.unknownAmount')}
          />
          <Row
            label={t('escalation.dossier.reporterLabel')}
            value={ticket.reporterName || ticket.driverName || t('escalation.refundPolicy.unknownAmount')}
          />
          <Row label={t('escalation.refundPolicy.escalationReason')} value={escalation.reason} />
          <Row
            label={t('escalation.refundPolicy.bookingStatus')}
            value={
              <span className="inline-flex items-center gap-1.5">
                {bookingMeta ? (
                  <StatusPill tone={bookingMeta.tone} label={bookingMeta.label} />
                ) : (
                  <span className="font-mono text-[11px]">{context?.bookingStatus ?? '—'}</span>
                )}
              </span>
            }
          />
        </div>

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : unavailable ? (
          <div className="rounded-xl border border-bad/30 bg-bad-soft px-3 py-3 text-[11px] text-bad">
            <div className="flex items-start gap-2">
              <IconAlertTriangle className="mt-[1px] h-3.5 w-3.5 shrink-0" />
              <div>
                <p className="font-semibold">{t('escalation.refundPolicy.contextUnavailable')}</p>
                <Button
                  size="sm"
                  variant="secondary"
                  className="mt-2"
                  onClick={() => contextQuery.refetch()}
                >
                  {t('escalation.refundPolicy.retryLoad')}
                </Button>
              </div>
            </div>
          </div>
        ) : context ? (
          <>
            {/* 01 · Identify */}
            <Section index="01" title={t('escalation.dossier.sectionIdentify')}>
              <div className="space-y-1.5 rounded-xl border border-hairline p-3">
                <Row
                  label={t('escalation.dossier.bookingCode')}
                  value={context.bookingCode ?? ticket.bookingCode ?? t('escalation.refundPolicy.unknownAmount')}
                  mono
                />
                <Row
                  label={t('escalation.dossier.window')}
                  value={
                    ticket.bookingStartAt || ticket.bookingEndAt ? (
                      <span className="inline-flex items-center gap-1.5 font-mono text-[11px]">
                        <IconCalendar className="h-3.5 w-3.5 text-muted" />
                        {formatDateVn(ticket.bookingStartAt)} {formatTimeVn(ticket.bookingStartAt)} –{' '}
                        {formatTimeVn(ticket.bookingEndAt)}
                      </span>
                    ) : (
                      t('escalation.refundPolicy.unknownAmount')
                    )
                  }
                />
                {dossier ? (
                  <Row
                    label={t('escalation.dossier.duration')}
                    value={t('escalation.dossier.durationValue', { min: dossier.window.durationMin })}
                    mono
                  />
                ) : null}
                <Row
                  label={t('escalation.dossier.stationSnapshot')}
                  value={
                    dossier?.snapshot.stationName || dossier?.snapshot.chargePointCode ? (
                      <span className="inline-flex flex-wrap items-center justify-end gap-1">
                        {dossier?.snapshot.stationName ? (
                          <span className="font-medium">{dossier.snapshot.stationName}</span>
                        ) : null}
                        {dossier?.snapshot.chargePointCode ? (
                          <span className="rounded-md border border-hairline bg-line-2 px-1.5 py-[1px] font-mono text-[10px] text-muted">
                            {dossier.snapshot.chargePointCode}
                            {dossier.snapshot.connectorCode ? ` / ${dossier.snapshot.connectorCode}` : ''}
                          </span>
                        ) : null}
                      </span>
                    ) : (
                      t('escalation.refundPolicy.unknownAmount')
                    )
                  }
                />
                <Row
                  label={t('escalation.dossier.packageAmount')}
                  value={
                    context.packageAmountVnd != null ? (
                      <span className="font-semibold text-ink">{formatVnd(context.packageAmountVnd)}</span>
                    ) : (
                      t('escalation.refundPolicy.unknownAmount')
                    )
                  }
                />
                {dossier?.policy.version ? (
                  <Row
                    label={t('escalation.dossier.policyVersion')}
                    value={
                      <span className="rounded-md border border-brand-line bg-brand-soft px-1.5 py-[1px] font-mono text-[10px] font-semibold text-brand">
                        {dossier.policy.version}
                      </span>
                    }
                  />
                ) : null}
              </div>

              {dossier ? (
                <div className="flex flex-wrap gap-1.5">
                  {dossier.policy.cancellationGraceMin != null ? (
                    <StatusPill
                      tone="neutral"
                      label={t('escalation.dossier.policyGrace', { min: dossier.policy.cancellationGraceMin })}
                    />
                  ) : null}
                  {dossier.policy.checkInCloseBeforeEndMin != null ? (
                    <StatusPill
                      tone="neutral"
                      label={t('escalation.dossier.policyCheckInClose', { min: dossier.policy.checkInCloseBeforeEndMin })}
                    />
                  ) : null}
                  {dossier.policy.stationFailureRefundPercent != null ? (
                    <StatusPill
                      tone="warn"
                      label={t('escalation.dossier.policyStationRefund', { pct: dossier.policy.stationFailureRefundPercent })}
                    />
                  ) : null}
                  {dossier.policy.voluntaryRefundPercent != null ? (
                    <StatusPill
                      tone="neutral"
                      label={t('escalation.dossier.policyVoluntaryRefund', { pct: dossier.policy.voluntaryRefundPercent })}
                    />
                  ) : null}
                </div>
              ) : null}
            </Section>

            {/* 02 · Timeline */}
            <Section index="02" title={t('escalation.dossier.sectionTimeline')}>
              {milestones.length > 0 ? (
                <ul className="rounded-xl border border-hairline p-3">
                  {milestones.map((m, i) => (
                    <MilestoneRow
                      key={m.key}
                      item={m}
                      label={t(m.labelKey)}
                      isLast={i === milestones.length - 1}
                      reason={
                        m.key === 'cancelled'
                          ? (cancelMeta?.label ?? dossier?.timeline.cancellationReason ?? null)
                          : null
                      }
                    />
                  ))}
                </ul>
              ) : (
                <p className="rounded-xl border border-dashed border-hairline px-3 py-3 text-[11px] text-muted">
                  {t('escalation.dossier.timelineEmpty')}
                </p>
              )}
            </Section>

            {/* 03 · Money */}
            <Section index="03" title={t('escalation.dossier.sectionMoney')}>
              <div className="space-y-1.5 rounded-xl border border-hairline p-3">
                <Row
                  label={t('escalation.dossier.payment')}
                  value={
                    payment ? (
                      <span className="inline-flex flex-wrap items-center justify-end gap-1.5">
                        <StatusPill
                          tone={PAYMENT_TONE[payment.status] ?? 'neutral'}
                          label={t(`escalation.dossier.paymentStatus.${payment.status}`)}
                        />
                        <span className="font-mono text-[11px]">{formatVnd(payment.amount)}</span>
                        {payment.environment ? (
                          <span className="rounded-md border border-hairline bg-line-2 px-1.5 py-[1px] font-mono text-[9.5px] text-muted">
                            {payment.environment}
                          </span>
                        ) : null}
                      </span>
                    ) : (
                      <span className="text-muted">{t('escalation.refundPolicy.unknownAmount')}</span>
                    )
                  }
                />
                <Row
                  label={t('escalation.dossier.receipt')}
                  value={
                    receipt ? (
                      <span className="inline-flex flex-wrap items-center justify-end gap-1.5">
                        <span className="rounded-md border border-hairline bg-line-2 px-1.5 py-[1px] font-mono text-[10px] text-muted">
                          {receipt.receiptId}
                        </span>
                        <StatusPill
                          tone={receipt.classification === 'APPLIED' ? 'good' : 'warn'}
                          label={
                            receipt.classification === 'APPLIED'
                              ? t('escalation.dossier.receiptApplied')
                              : t('escalation.dossier.receiptUnapplied')
                          }
                        />
                        <span className="font-mono text-[11px]">{formatVnd(receipt.amount)}</span>
                      </span>
                    ) : (
                      <span className="text-muted">{t('escalation.dossier.receiptEmpty')}</span>
                    )
                  }
                />
                <Row
                  label={t('escalation.dossier.priceLines')}
                  value={
                    priceLines.length > 0 ? (
                      <span className="font-mono text-[11px]">
                        {priceLines.length} · {formatVnd(priceLines.reduce((sum, l) => sum + (l.amount ?? 0), 0))}
                      </span>
                    ) : (
                      <span className="text-muted">{t('escalation.refundPolicy.unknownAmount')}</span>
                    )
                  }
                />
              </div>

              {priceLines.length > 0 ? (
                <ul className="space-y-1">
                  {priceLines.map((line, i) => (
                    <li
                      key={`${line.periodCode ?? 'seg'}-${i}`}
                      className="flex items-baseline justify-between gap-2 rounded-lg border border-hairline bg-line-2/40 px-2.5 py-1.5 text-[11px]"
                    >
                      <span className="truncate font-medium text-ink">
                        {line.label}
                        <span className="ml-1.5 font-mono text-[10px] text-muted">
                          {t('escalation.dossier.priceLineRow', { min: line.durationMin })}
                        </span>
                      </span>
                      <span className="shrink-0 font-mono text-[11px] text-ink">{formatVnd(line.amount)}</span>
                    </li>
                  ))}
                </ul>
              ) : null}

              <div className="rounded-xl border border-good/25 bg-gradient-to-br from-good-soft/60 to-surface p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-good">
                    <IconCheckCircle className="h-3.5 w-3.5" />
                    {t('escalation.dossier.eligibleAmount')}
                  </span>
                  <span className="font-mono text-[14px] font-bold text-good">
                    {context.eligibleRefundAmountVnd != null
                      ? formatVnd(context.eligibleRefundAmountVnd)
                      : t('escalation.refundPolicy.unknownAmount')}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2 border-t border-good/20 pt-2">
                  <span className="text-[11px] text-muted">{t('escalation.dossier.obligation')}</span>
                  <StatusPill tone={obligation.tone} label={obligation.label} />
                </div>
                {payment?.needsReconciliation ? (
                  <p className="mt-2 inline-flex items-center gap-1.5 text-[10.5px] text-warn">
                    <IconClock className="h-3.5 w-3.5" />
                    {t('escalation.dossier.needsReconciliation')}
                  </p>
                ) : null}
              </div>
            </Section>

            {/* 04 · Basis & prior decision */}
            <Section index="04" title={t('escalation.dossier.sectionBasis')}>
              <div className="space-y-2 rounded-xl border border-hairline p-3">
                <Row
                  label={t('escalation.dossier.latestDecision')}
                  value={
                    latest ? (
                      <span className="inline-flex items-center gap-1.5">
                        <StatusPill
                          tone={latest.result === 'FULL_REFUND' ? 'good' : 'warn'}
                          label={
                            latest.result === 'FULL_REFUND'
                              ? t('escalation.refundPolicy.card.fullRefundPill')
                              : t('escalation.refundPolicy.card.insufficientPill')
                          }
                        />
                        <span className="font-mono text-[10.5px] text-muted">#{latest.sequenceNo}</span>
                      </span>
                    ) : (
                      <span className="text-muted">{t('escalation.dossier.noDecision')}</span>
                    )
                  }
                />
                {latest ? (
                  <p className="text-[10.5px] leading-snug text-muted">
                    {formatDateVn(latest.decidedAt)} {formatTimeVn(latest.decidedAt)} ·{' '}
                    {t('escalation.refundPolicy.card.byActor', { name: latest.actorDisplayName })}
                  </p>
                ) : null}
                <Row
                  label={t('escalation.dossier.refundSummary')}
                  value={
                    refundSummary ? (
                      <span className="font-mono text-[11px]">
                        {formatVnd(refundSummary.amount)} · #{refundSummary.refundId}
                      </span>
                    ) : (
                      <span className="text-muted">—</span>
                    )
                  }
                />
              </div>

              <div className="space-y-1.5 rounded-xl border border-hairline p-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
                  {t('escalation.dossier.conditionsTitle')}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <StatusPill
                    tone={
                      context.grantEligibility?.allowed ? 'good' : 'neutral'
                    }
                    label={`${t('escalation.refundPolicy.card.fullRefundPill')} · ${
                      context.grantEligibility?.allowed
                        ? t('escalation.dossier.condAllowed')
                        : t('escalation.dossier.condBlocked')
                    }`}
                  />
                  <StatusPill
                    tone={context.insufficientEligibility?.allowed ? 'good' : 'neutral'}
                    label={`${t('escalation.refundPolicy.card.insufficientPill')} · ${
                      context.insufficientEligibility?.allowed
                        ? t('escalation.dossier.condAllowed')
                        : t('escalation.dossier.condBlocked')
                    }`}
                  />
                </div>
                <p className="flex items-start gap-1.5 pt-0.5 text-[10.5px] leading-snug text-muted">
                  <IconInfoCircle className="mt-[1px] h-3.5 w-3.5 shrink-0" />
                  <span>{t('escalation.dossier.infoNote')}</span>
                </p>
              </div>
            </Section>
          </>
        ) : null}

        {/* CTA */}
        {context ? (
          <div className="pt-0.5">
            {!canReview && unavailable ? (
              <p className="mb-2 flex items-start gap-1.5 text-[10.5px] text-bad">
                <IconAlertTriangle className="mt-[1px] h-3.5 w-3.5 shrink-0" />
                <span>{t('escalation.refundPolicy.actionUnavailable')}</span>
              </p>
            ) : null}
            <Button
              fullWidth
              size="lg"
              variant={canReview ? 'primary' : 'secondary'}
              disabled={!canReview}
              onClick={onOpenReviewModal}
            >
              <IconCard className="h-4 w-4" />
              {latest
                ? t('escalation.refundPolicy.reReviewBtn')
                : t('escalation.refundPolicy.reviewBtn')}
            </Button>
            {!canReview && !unavailable ? (
              <p className="mt-2 flex items-start gap-1.5 text-[10.5px] leading-snug text-muted">
                <IconLock className="mt-[1px] h-3.5 w-3.5 shrink-0" />
                <span>{t('escalation.dossier.reviewBlocked')}</span>
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </Card>
  );
}
