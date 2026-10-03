import { useTranslation } from 'react-i18next';
import {
  Button,
  IconCheck,
  IconCheckCircle,
  IconLock,
  IconRefreshCw,
  IconShieldAlert,
  IconUsers,
} from '@chargeops/ui';
import { TICKET_CLOSE_REASON, type Ticket } from '@chargeops/api';
import { TicketCountdownTimer } from './TicketCountdownTimer';

export interface TicketActionDockProps {
  ticket: Ticket;
  admin: boolean;
  isAdminStationSupervisory: boolean;
  isAdminPlatformDirect: boolean;
  isOpen: boolean;
  isInProgress: boolean;
  isResolved: boolean;
  isClosed: boolean;
  isClaiming: boolean;
  isEscalated?: boolean;
  onClaim: () => void;
  onOpenAssign: () => void;
  onOpenResolve: () => void;
  onOpenEscalate?: () => void;
  onReviewEscalation?: (action: 'RETURN_TO_STATION' | 'CLOSE_SUPPORT_CASE') => void;
  hasFindings?: boolean;
}

export function TicketActionDock({
  ticket,
  admin,
  isAdminStationSupervisory,
  isAdminPlatformDirect,
  isOpen,
  isInProgress,
  isResolved,
  isClosed,
  isClaiming,
  isEscalated,
  onClaim,
  onOpenAssign,
  onOpenResolve,
  onOpenEscalate,
  onReviewEscalation,
  hasFindings = false,
}: TicketActionDockProps) {
  const { t } = useTranslation('tickets');
  const closeReasonMeta = ticket.closeReason ? TICKET_CLOSE_REASON[ticket.closeReason] : undefined;
  const isStationTicketWithBooking = Boolean(ticket.stationId && ticket.bookingId);
  const canResolve = !isStationTicketWithBooking || hasFindings;

  return (
    <div className="flex w-full shrink-0 flex-col sm:w-auto sm:flex-row sm:flex-wrap sm:items-center gap-2">
      {/* Admin must also be able to complete an escalation left active on a closed ticket. */}
      {isAdminStationSupervisory && isEscalated && (
        <div className="flex flex-wrap items-center gap-2">
          {isEscalated ? (
            <>
              {!isClosed && !isResolved && (
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => onReviewEscalation?.('RETURN_TO_STATION')}
                  icon={<IconRefreshCw size={13} strokeWidth={2.2} className="text-muted" />}
                >
                  {t('escalation.review.returnTitle', 'Trả lại trạm xử lý')}
                </Button>
              )}
              <Button
                variant="primary"
                accent="brand"
                size="md"
                onClick={() => onReviewEscalation?.('CLOSE_SUPPORT_CASE')}
                icon={<IconCheckCircle size={14} strokeWidth={2.2} />}
              >
                {isClosed ? 'Hoàn tất yêu cầu xem xét' : t('escalation.review.closeTitle', 'Kết thúc xử lý hỗ trợ')}
              </Button>
            </>
          ) : (
            <span className="text-xs text-muted">Không có yêu cầu xem xét đang mở.</span>
          )}
        </div>
      )}

      {/* Case B: Admin in Platform Direct Queue */}
      {isAdminPlatformDirect && !isClosed && !isResolved && (
        <div className="flex w-full sm:w-auto flex-col sm:flex-row gap-2">
          {isOpen && (
            <>
              <Button
                accent="brand"
                size="md"
                disabled={isClaiming}
                onClick={onClaim}
                className="w-full sm:w-auto justify-center"
                icon={<IconCheck size={14} strokeWidth={2.5} />}
              >
                {isClaiming
                  ? t('detail.claiming', 'Đang nhận...')
                  : t('platformQueue.claimBtn', 'Tiếp nhận xử lý sự cố')}
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={onOpenAssign}
                className="w-full sm:w-auto justify-center"
                icon={<IconUsers size={14} strokeWidth={2} />}
              >
                {t('platformQueue.assignAdminBtn', 'Phân công chuyên viên')}
              </Button>
            </>
          )}

          {isInProgress && (
            <>
              <Button
                accent="brand"
                size="md"
                onClick={onOpenResolve}
                className="w-full sm:w-auto justify-center"
                icon={<IconCheckCircle size={14} strokeWidth={2.2} />}
              >
                {t('detail.resolveBtn', 'Đánh dấu Đã giải quyết')}
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={onOpenAssign}
                className="w-full sm:w-auto justify-center"
                icon={<IconUsers size={14} strokeWidth={2} />}
              >
                {t('detail.reassignBtn', 'Điều chuyển')}
              </Button>
            </>
          )}
        </div>
      )}

      {/* Case C: Station Owner & Station Staff (!admin) */}
      {!admin && !isClosed && !isResolved && (
        <div className="flex w-full sm:w-auto flex-col sm:flex-row flex-wrap gap-2">
          {/* If under Admin arbitration, station cannot resolve or re-escalate */}
          {isEscalated ? (
            <div className="inline-flex w-full sm:w-auto justify-center items-center gap-1.5 rounded-full border border-brand-line bg-brand-soft px-3 py-1.5 text-[11.5px] font-semibold text-brand">
              <IconShieldAlert size={14} strokeWidth={2} />
              <span>{t('escalation.underArbitrationBadge', 'Admin đang xem xét yêu cầu hỗ trợ')}</span>
            </div>
          ) : (
            <>
              {isOpen && (
                <>
                  <Button
                    accent="brand"
                    size="md"
                    disabled={isClaiming}
                    onClick={onClaim}
                    className="w-full sm:w-auto justify-center"
                    icon={<IconCheck size={14} strokeWidth={2.5} />}
                  >
                    {isClaiming
                      ? t('detail.claiming', 'Đang nhận...')
                      : t('detail.claimBtn', 'Tự nhận xử lý')}
                  </Button>
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={onOpenAssign}
                    className="w-full sm:w-auto justify-center"
                    icon={<IconUsers size={14} strokeWidth={2} />}
                  >
                    {t('detail.assignBtn', 'Gán nhân viên')}
                  </Button>
                </>
              )}

              {isInProgress && (
                <>
                  <div className="flex flex-col sm:flex-row items-center gap-1.5 w-full sm:w-auto">
                    <Button
                      accent="brand"
                      size="md"
                      disabled={!canResolve}
                      onClick={onOpenResolve}
                      className={`w-full sm:w-auto justify-center ${!canResolve ? 'opacity-60 cursor-not-allowed' : ''}`}
                      icon={<IconCheckCircle size={14} strokeWidth={2.2} />}
                      title={!canResolve ? t('detail.resolveRequiresFinding', 'Yêu cầu ghi nhận kết luận kỹ thuật trước khi đánh dấu giải quyết') : undefined}
                    >
                      {t('detail.resolveBtn', 'Đánh dấu Đã giải quyết')}
                    </Button>
                    {!canResolve && (
                      <span className="text-[10px] font-semibold text-warn-deep bg-warn-pill border border-warn-border px-2 py-0.5 rounded-full">
                        * Cần có kết luận kỹ thuật
                      </span>
                    )}
                  </div>
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={onOpenAssign}
                    className="w-full sm:w-auto justify-center"
                    icon={<IconUsers size={14} strokeWidth={2} />}
                  >
                    {t('detail.reassignBtn', 'Điều chuyển')}
                  </Button>
                </>
              )}

              {/* Station Dispute Escalation Button */}
              {onOpenEscalate && (
                <Button
                  variant="secondary"
                  size="md"
                  onClick={onOpenEscalate}
                  icon={<IconShieldAlert size={14} strokeWidth={2} />}
                  className="w-full sm:w-auto justify-center border-brand-line text-brand hover:bg-brand-soft"
                >
                  {t('escalation.ownerEscalateBtn', 'Yêu cầu Admin xem xét')}
                </Button>
              )}
            </>
          )}
        </div>
      )}

      {isResolved && (
        <div className="flex w-full sm:w-auto items-center justify-center sm:justify-start gap-2">
          <TicketCountdownTimer autoCloseAt={ticket.autoCloseAt} resolvedAt={ticket.resolvedAt} />
        </div>
      )}

      {isClosed && (
        <div className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full border border-hairline bg-surface-2 px-3.5 py-1.5 text-[12px] font-semibold text-muted shadow-sm">
          <IconLock size={14} className="text-faint" />
          <span>
            {closeReasonMeta?.label ||
              (ticket.closeReason === 'REPORTER_CONFIRMED'
                ? t('events.REPORTER_CONFIRMED', 'Tài xế xác nhận đóng')
                : t('status.CLOSED', 'Đã đóng hoàn tất'))}
          </span>
        </div>
      )}
    </div>
  );
}
