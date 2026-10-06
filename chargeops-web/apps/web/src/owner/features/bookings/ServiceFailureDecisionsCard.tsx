import { useTranslation } from 'react-i18next';
import {
  formatDateVn,
  formatTimeVn,
  formatVnd,
  type ServiceFailureDecisionSummary,
} from '@chargeops/api';
import {
  Card,
  IconAlertTriangle,
  IconCheckCircle,
  IconClock,
  IconShield,
  IconShieldAlert,
  StatusPill,
} from '@chargeops/ui';

export interface ServiceFailureDecisionsCardProps {
  decisions?: ServiceFailureDecisionSummary[];
  latestDecision?: ServiceFailureDecisionSummary | null;
}

export function ServiceFailureDecisionsCard({
  decisions = [],
  latestDecision,
}: ServiceFailureDecisionsCardProps) {
  const { t } = useTranslation('owner');

  // Combine or prioritize decisions array
  const allDecisions = decisions.length > 0
    ? decisions
    : latestDecision
    ? [latestDecision]
    : [];

  if (allDecisions.length === 0) return null;

  return (
    <Card className="rounded-2xl border border-line-3 bg-surface p-4 shadow-2xs">
      <div className="mb-3.5 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-[13px] font-bold text-ink">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-warn-pill text-warn-deep">
            <IconShieldAlert size={14} strokeWidth={2.2} />
          </span>
          <span>{t('bookings.serviceFailureDecisions.title', 'Hồ sơ quyết định sự cố')}</span>
        </h3>
        <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10.5px] font-semibold text-muted">
          {t('bookings.serviceFailureDecisions.decisionsCount', '{{count}} quyết định', { count: allDecisions.length })}
        </span>
      </div>

      <div className="space-y-3">
        {allDecisions.map((dec) => {
          const isOwnerCancel = dec.kind === 'OWNER_CANCEL_BOOKING';
          const isOwnerAdmission = dec.kind === 'OWNER_ACCEPT_STATION_FAILURE';
          const isAdminReview = dec.kind === 'ADMIN_REVIEW_STATION_FAILURE';

          const kindLabel = isOwnerCancel
            ? t('bookings.serviceFailureDecisions.kind.OWNER_CANCEL_BOOKING', 'Chủ trạm hủy do sự cố')
            : isOwnerAdmission
            ? t('bookings.serviceFailureDecisions.kind.OWNER_ACCEPT_STATION_FAILURE', 'Chủ trạm nhận trách nhiệm')
            : t('bookings.serviceFailureDecisions.kind.ADMIN_REVIEW_STATION_FAILURE', 'Admin rà soát chính sách');

          const kindTone: 'bad' | 'warn' | 'brand' = isOwnerCancel
            ? 'bad'
            : isOwnerAdmission
            ? 'brand'
            : 'warn';

          const resultLabel = dec.result === 'FULL_REFUND'
            ? t('bookings.serviceFailureDecisions.result.FULL_REFUND', 'Hoàn đủ 100% gói')
            : dec.result === 'NO_APPLIED_PAYMENT'
            ? t('bookings.serviceFailureDecisions.result.NO_APPLIED_PAYMENT', 'Không phát sinh hoàn tiền')
            : t('bookings.serviceFailureDecisions.result.INSUFFICIENT_EVIDENCE', 'Chưa đủ căn cứ hoàn');

          const resultTone: 'good' | 'neutral' | 'warn' = dec.result === 'FULL_REFUND'
            ? 'good'
            : dec.result === 'NO_APPLIED_PAYMENT'
            ? 'neutral'
            : 'warn';

          return (
            <div
              key={dec.decisionId || dec.sequenceNo}
              className="rounded-xl border border-line-2 bg-surface-2/60 p-3 text-[12px] space-y-2 transition-colors hover:border-line-hover"
            >
              {/* Header row: Decision Sequence + Actor Badge + Result Pill */}
              <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-hairline pb-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-mono text-[10.5px] font-bold text-muted bg-surface px-1.5 py-0.5 rounded border border-line">
                    #{dec.sequenceNo}
                  </span>
                  <StatusPill tone={kindTone} label={kindLabel} />
                  <StatusPill tone={resultTone} label={resultLabel} />
                </div>
                <div className="flex items-center gap-1 text-[10.5px] text-faint">
                  <IconClock size={11} />
                  <span>{formatDateVn(dec.decidedAt)} {formatTimeVn(dec.decidedAt)}</span>
                </div>
              </div>

              {/* Actor & Timing Info */}
              <div className="grid grid-cols-2 gap-2 text-[11px] text-muted">
                <div>
                  <span className="text-faint">{t('bookings.serviceFailureDecisions.actorLabel', 'Người quyết định:')} </span>
                  <span className="font-semibold text-ink">{dec.actorDisplayName || dec.actorKind}</span>
                </div>
                {dec.affectedAt && (
                  <div>
                    <span className="text-faint">{t('bookings.serviceFailureDecisions.affectedAtLabel', 'Thời điểm sự cố:')} </span>
                    <span className="font-semibold text-ink">
                      {formatDateVn(dec.affectedAt)} {formatTimeVn(dec.affectedAt)}
                    </span>
                  </div>
                )}
              </div>

              {/* Stored Reason Body */}
              <div className="rounded-lg bg-surface border border-line/70 p-2.5 text-[11.5px] leading-relaxed text-body">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-faint mb-1">
                  {t('bookings.serviceFailureDecisions.reasonRecordedTitle', 'Nội dung lý do ghi nhận:')}
                </div>
                <div className="italic text-ink">"{dec.reason}"</div>
              </div>

              {/* Financial Outcome summary if refund created */}
              {dec.refundId && (
                <div className="flex items-center justify-between pt-1 text-[11px] font-medium border-t border-hairline">
                  <span className="text-muted flex items-center gap-1">
                    <IconCheckCircle size={12} className="text-good-deep" />
                    <span>
                      {t('bookings.serviceFailureDecisions.refundObligationLabel', 'Nghĩa vụ hoàn tiền (#{{refundId}}...):', {
                        refundId: dec.refundId.slice(0, 10),
                      })}
                    </span>
                  </span>
                  <span className="font-mono font-bold text-bad">
                    {formatVnd(dec.amountVnd || 0)}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
