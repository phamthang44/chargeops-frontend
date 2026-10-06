import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  formatVnd,
  useApi,
  type Ticket,
  type OwnerBookingDetail,
} from '@chargeops/api';
import {
  Button,
  Card,
  IconCheckCircle,
  IconInfoCircle,
  IconShieldAlert,
  Skeleton,
} from '@chargeops/ui';

export interface OwnerDisputeAdmissionCardProps {
  ticket: Ticket;
  onOpenAdmitModal: (booking: OwnerBookingDetail) => void;
}

export function OwnerDisputeAdmissionCard({
  ticket,
  onOpenAdmitModal,
}: OwnerDisputeAdmissionCardProps) {
  const { t } = useTranslation('tickets');
  const api = useApi();

  const bookingId = ticket.bookingId;

  const bookingQuery = useQuery({
    queryKey: ['ownerBookings', 'detail', bookingId],
    queryFn: () => (bookingId ? api.ownerBookings.get(bookingId) : null),
    enabled: Boolean(bookingId),
  });

  const contextQuery = useQuery({
    queryKey: ['ownerBookings', 'stationFailureContext', bookingId],
    queryFn: () => (bookingId ? api.ownerBookings.getStationFailureContext(bookingId) : null),
    enabled: Boolean(bookingId),
  });

  if (!bookingId) return null;

  const isLoading = bookingQuery.isLoading || contextQuery.isLoading;
  const booking = bookingQuery.data;
  const context = contextQuery.data;

  const canAdmit = Boolean(booking?.actions?.canAdmitStationFailure ?? context?.admissionEligibility?.allowed);
  const refundSummary = context?.refundSummary;
  const hasRefund = Boolean(refundSummary || (ticket.refundIds && ticket.refundIds.length > 0));

  if (isLoading) {
    return (
      <Card className="rounded-2xl border border-line bg-surface p-4 shadow-sm space-y-2">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </Card>
    );
  }

  if (!booking) return null;

  return (
    <Card className="rounded-2xl border border-owner-border/70 bg-owner-soft/30 p-4 shadow-sm space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 border-b border-hairline pb-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-owner-soft text-owner border border-owner-border">
            <IconShieldAlert size={16} strokeWidth={2.2} />
          </div>
          <div>
            <h3 className="text-[13px] font-bold text-ink">
              {t('escalation.ownerAdmission.title', 'Chủ trạm nhận trách nhiệm (BKG-056)')}
            </h3>
            <p className="text-[10.5px] text-muted">
              {t('escalation.ownerAdmission.subtitle', 'Giải quyết tranh chấp bằng cam kết hoàn đủ 100%')}
            </p>
          </div>
        </div>

        <span className="rounded-md border border-owner-border bg-owner-soft px-1.5 py-0.5 text-[9.5px] font-bold text-owner uppercase tracking-wider">
          Owner Action
        </span>
      </div>

      {hasRefund ? (
        <div className="rounded-xl border border-good-border bg-good-soft/40 p-3 text-[12px] space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-good-deep">
            <IconCheckCircle size={15} />
            <span>{t('escalation.ownerAdmission.refundEstablished', 'Đã xác lập nghĩa vụ hoàn đủ 100% gói sạc')}</span>
          </div>
          <p className="text-[11px] text-muted leading-relaxed">
            {t(
              'escalation.ownerAdmission.refundEstablishedDesc',
              'Hệ thống đã ghi nhận trách nhiệm kỹ thuật và tự động xử lý hoàn tiền cho tài xế. Không cần thao tác thêm.'
            )}
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-line-2 bg-surface p-3 text-[11.5px] space-y-1.5">
            <div className="flex justify-between">
              <span className="text-muted">{t('escalation.ownerAdmission.bookingAmountLabel', 'Gói sạc liên quan:')}</span>
              <span className="font-mono font-semibold text-ink">
                {formatVnd(booking.totalAmount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">{t('escalation.ownerAdmission.bookingStatusLabel', 'Trạng thái đơn:')}</span>
              <span className="font-semibold text-ink">{booking.status}</span>
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-xl bg-surface/70 p-2.5 text-[11px] leading-relaxed text-muted border border-hairline">
            <IconInfoCircle size={14} className="mt-0.5 shrink-0 text-owner" />
            <div>
              {t(
                'escalation.ownerAdmission.notice',
                'Hồ sơ đang trong luồng xem xét của Admin. Chủ trạm có quyền chủ động nhận trách nhiệm để thiết lập hoàn đủ 100% cho tài xế mà không cần chờ Admin ra phán quyết.'
              )}
            </div>
          </div>

          {canAdmit ? (
            <Button
              type="button"
              variant="primary"
              accent="owner"
              className="w-full justify-center text-[12px] font-semibold py-2 bg-owner hover:bg-owner-hover text-white border-transparent"
              onClick={() => onOpenAdmitModal(booking)}
            >
              {t('escalation.ownerAdmission.actionBtn', 'Nhận trách nhiệm lỗi trạm & Hoàn tiền 100%')}
            </Button>
          ) : (
            <div className="text-[11px] text-faint italic text-center py-1">
              {context?.admissionEligibility?.reason || t('escalation.ownerAdmission.notEligible', 'Đơn sạc chưa đủ điều kiện nhận lỗi trạm.')}
            </div>
          )}
        </>
      )}
    </Card>
  );
}
