import { useTranslation } from 'react-i18next';
import {
  Button,
  IconCheck,
  IconCheckCircle,
  IconLock,
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
}: TicketActionDockProps) {
  const { t } = useTranslation('tickets');
  const closeReasonMeta = ticket.closeReason ? TICKET_CLOSE_REASON[ticket.closeReason] : undefined;

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2">
      {/* Case A: Admin in Station Supervisory / Escalated Mode (Arbiter only, cannot assign station staff) */}
      {isAdminStationSupervisory && (
        <div className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-[11.5px] font-semibold text-purple-700 dark:text-purple-300">
          <span>⚖️ {t('escalation.arbiterRolePill', 'Tuyến phân xử Admin')}</span>
        </div>
      )}

      {/* Case B: Admin in Platform Direct Queue */}
      {isAdminPlatformDirect && (
        <>
          {isOpen && (
            <>
              <Button
                accent="brand"
                size="md"
                disabled={isClaiming}
                onClick={onClaim}
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
                icon={<IconCheckCircle size={14} strokeWidth={2.2} />}
              >
                {t('detail.resolveBtn', 'Đánh dấu Đã giải quyết')}
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={onOpenAssign}
                icon={<IconUsers size={14} strokeWidth={2} />}
              >
                {t('detail.reassignBtn', 'Điều chuyển')}
              </Button>
            </>
          )}
        </>
      )}

      {/* Case C: Station Owner & Station Staff (!admin) */}
      {!admin && (
        <>
          {isOpen && (
            <>
              <Button
                accent="brand"
                size="md"
                disabled={isClaiming}
                onClick={onClaim}
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
                icon={<IconUsers size={14} strokeWidth={2} />}
              >
                {t('detail.assignBtn', 'Gán nhân viên')}
              </Button>
            </>
          )}

          {isInProgress && (
            <>
              <Button
                accent="brand"
                size="md"
                onClick={onOpenResolve}
                icon={<IconCheckCircle size={14} strokeWidth={2.2} />}
              >
                {t('detail.resolveBtn', 'Đánh dấu Đã giải quyết')}
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={onOpenAssign}
                icon={<IconUsers size={14} strokeWidth={2} />}
              >
                {t('detail.reassignBtn', 'Điều chuyển')}
              </Button>
            </>
          )}

          {/* Station Dispute Escalation Button */}
          {!isClosed && !isEscalated && onOpenEscalate && (
            <Button
              variant="secondary"
              size="md"
              onClick={onOpenEscalate}
              icon={<IconShieldAlert size={14} strokeWidth={2} />}
              className="border-purple-500/30 text-purple-700 hover:bg-purple-500/10 dark:text-purple-300"
            >
              {t('escalation.ownerEscalateBtn', 'Yêu cầu Admin phân xử')}
            </Button>
          )}
        </>
      )}

      {isResolved && (
        <div className="flex items-center gap-2">
          <TicketCountdownTimer autoCloseAt={ticket.autoCloseAt} resolvedAt={ticket.resolvedAt} />
        </div>
      )}

      {isClosed && (
        <div className="inline-flex items-center gap-2 rounded-full border border-hairline bg-surface-2 px-3.5 py-1.5 text-[12px] font-semibold text-muted shadow-sm">
          <IconLock size={14} className="text-faint" />
          <span>{closeReasonMeta?.label || t('status.CLOSED', 'Đã đóng vĩnh viễn')}</span>
        </div>
      )}
    </div>
  );
}
