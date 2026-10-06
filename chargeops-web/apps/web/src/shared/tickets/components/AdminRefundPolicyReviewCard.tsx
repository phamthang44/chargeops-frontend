import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  formatDateVn,
  formatTimeVn,
  formatVnd,
  useApi,
  type Ticket,
  type TicketEscalation,
  type AdminRefundPolicyContext,
} from '@chargeops/api';
import {
  Button,
  Card,
  IconAlertTriangle,
  IconCheckCircle,
  IconClock,
  IconInfoCircle,
  IconShieldAlert,
  IconShieldCheck,
  Skeleton,
  StatusPill,
} from '@chargeops/ui';

export interface AdminRefundPolicyReviewCardProps {
  ticket: Ticket;
  escalation: TicketEscalation | null;
  admin: boolean;
  onOpenReviewModal: () => void;
}

export function AdminRefundPolicyReviewCard({
  ticket,
  escalation,
  admin,
  onOpenReviewModal,
}: AdminRefundPolicyReviewCardProps) {
  const { t } = useTranslation('tickets');
  const api = useApi();

  const escalationId = escalation?.ticketId || ticket.id;

  const contextQuery = useQuery({
    queryKey: ['ticketEscalations', 'refundPolicyContext', ticket.id, escalationId],
    queryFn: () => api.ticketEscalations.getRefundPolicyContext(ticket.id, escalationId),
    enabled: Boolean(admin && ticket.bookingId && escalationId),
  });

  if (!admin || !ticket.bookingId) return null;

  const context = contextQuery.data;
  const isLoading = contextQuery.isLoading;
  const isClosed = ticket.status === 'CLOSED';
  const canReview = Boolean(!isClosed && (context?.reviewEligibility?.allowed ?? true));

  const latestDecision = context?.latestDecision;
  const refundSummary = context?.refundSummary;
  const hasRefundObligation = Boolean(refundSummary || (ticket.refundIds && ticket.refundIds.length > 0));

  return (
    <Card className="rounded-2xl border border-brand-line bg-surface p-4 shadow-sm space-y-3.5">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 border-b border-hairline pb-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand border border-brand-line">
            <IconShieldCheck size={16} strokeWidth={2.2} />
          </div>
          <div>
            <h3 className="text-[13px] font-bold text-ink">
              {t('escalation.refundPolicy.cardTitle', 'Rà soát chính sách hoàn tiền sự cố (BKG-057)')}
            </h3>
            <p className="text-[10.5px] text-muted">
              {t('escalation.refundPolicy.cardSubtitle', 'Thẩm quyền trọng tài rà soát theo case tranh chấp')}
            </p>
          </div>
        </div>

        <span className="rounded-md border border-brand-line bg-brand-soft px-1.5 py-0.5 text-[9.5px] font-bold text-brand uppercase tracking-wider">
          Admin Arbiter
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-2 py-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      ) : (
        <>
          {/* Dispute Booking Snapshot */}
          <div className="rounded-xl border border-line-2 bg-surface-2/60 p-3 text-[12px] space-y-2">
            <div className="flex justify-between">
              <span className="text-muted">{t('escalation.refundPolicy.card.bookingLabel', 'Mã đặt chỗ liên quan:')}</span>
              <span className="font-mono font-semibold text-brand">
                #{ticket.bookingId.slice(0, 16)}...
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">{t('escalation.refundPolicy.card.amountLabel', 'Giá trị gói sạc:')}</span>
              <span className="font-mono font-bold text-ink">
                {formatVnd(context?.eligibleRefundAmountVnd || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center border-t border-hairline pt-1.5">
              <span className="text-muted">{t('escalation.refundPolicy.card.obligationLabel', 'Nghĩa vụ hoàn tiền:')}</span>
              {hasRefundObligation ? (
                <span className="inline-flex items-center gap-1 font-semibold text-good text-[11.5px]">
                  <IconCheckCircle size={13} />
                  <span>
                    {refundSummary?.status === 'SUCCEEDED'
                      ? t('escalation.refundPolicy.card.succeeded', 'Đã hoàn thành công')
                      : t('escalation.refundPolicy.card.pending', 'Đang xử lý (PENDING)')}
                  </span>
                </span>
              ) : (
                <span className="text-faint text-[11px]">
                  {t('escalation.refundPolicy.card.notEstablished', 'Chưa xác lập nghĩa vụ hoàn')}
                </span>
              )}
            </div>
          </div>

          {/* Latest Recorded Decision if present */}
          {latestDecision && (
            <div className="rounded-xl border border-line bg-surface p-3 text-[11.5px] space-y-1.5">
              <div className="flex items-center justify-between text-[10.5px] font-semibold text-muted">
                <span className="uppercase tracking-wider">
                  {t('escalation.refundPolicy.card.latestDecision', 'Quyết định gần nhất')}
                </span>
                <span className="text-faint">
                  {formatDateVn(latestDecision.decidedAt)} {formatTimeVn(latestDecision.decidedAt)}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <StatusPill
                  tone={latestDecision.result === 'FULL_REFUND' ? 'good' : 'warn'}
                  label={
                    latestDecision.result === 'FULL_REFUND'
                      ? t('escalation.refundPolicy.card.fullRefundPill', 'Hoàn đủ 100% gói')
                      : t('escalation.refundPolicy.card.insufficientPill', 'Chưa đủ căn cứ')
                  }
                />
                <span className="text-faint text-[11px]">
                  {t('escalation.refundPolicy.card.byActor', {
                    name: latestDecision.actorDisplayName,
                    defaultValue: `bởi ${latestDecision.actorDisplayName}`,
                  })}
                </span>
              </div>
              <p className="italic text-muted line-clamp-2">"{latestDecision.reason}"</p>
            </div>
          )}

          {/* Guidelines info */}
          <div className="flex items-start gap-2 rounded-xl border border-brand-line/60 bg-brand-soft/30 p-2.5 text-[11px] leading-relaxed text-muted">
            <IconInfoCircle size={14} className="mt-0.5 shrink-0 text-brand" />
            <div>
              {t(
                'escalation.refundPolicy.infoNote',
                'Quản trị viên rà soát việc áp dụng chính sách hoàn 100% của ChargeOps trong đúng case này. Quyết định có hiệu lực thi hành ngay trên môi trường Simulator.'
              )}
            </div>
          </div>

          {/* Review Action Trigger Button */}
          <Button
            type="button"
            variant="primary"
            accent="brand"
            className="w-full justify-center text-[12px] font-semibold py-2"
            disabled={!canReview}
            onClick={onOpenReviewModal}
          >
            {hasRefundObligation
              ? t('escalation.refundPolicy.reReviewBtn', 'Rà soát lại phán quyết chính sách')
              : t('escalation.refundPolicy.reviewBtn', 'Ra phán quyết chính sách hoàn tiền')}
          </Button>
        </>
      )}
    </Card>
  );
}
