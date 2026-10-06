import { useTranslation } from 'react-i18next';
import { Avatar, Button, Card, IconCheck, IconPhone, IconUsers } from '@chargeops/ui';
import type { Ticket } from '@chargeops/api';

export interface TicketHandlerCardProps {
  ticket: Ticket;
  admin: boolean;
  isAdminStationSupervisory: boolean;
  isAdminPlatformDirect: boolean;
  isAssigned: boolean;
  isClosed: boolean;
  isResolved: boolean;
  resolvedHandlerName: string | null;
  assignedStaff?: any;
  isClaiming: boolean;
  onClaim: () => void;
  onOpenAssign: () => void;
  /** Station staff claim tickets themselves — no manual reassignment (Ops-06). */
  canAssign?: boolean;
}

export function TicketHandlerCard({
  ticket,
  admin,
  isAdminStationSupervisory,
  isAdminPlatformDirect,
  isAssigned,
  isClosed,
  isResolved,
  resolvedHandlerName,
  assignedStaff,
  isClaiming,
  onClaim,
  onOpenAssign,
  canAssign = true,
}: TicketHandlerCardProps) {
  const { t } = useTranslation('tickets');

  return (
    <Card className="rounded-2xl border border-line bg-surface p-4 shadow-xs">
      <div className="flex items-center justify-between mb-3 border-b border-hairline pb-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-surface-2 text-muted">
            <IconUsers size={14} />
          </div>
          <h2 className="text-[13px] font-bold text-ink">
            {isAdminStationSupervisory
              ? t('supervisory.stationUnit', 'Đơn vị vận hành trạm')
              : isAdminPlatformDirect
              ? t('platformQueue.handlerTitle', 'Chuyên viên Nền tảng')
              : t('detail.handlerCard.title', 'Người phụ trách')}
          </h2>
        </div>

        {isAssigned ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-good-soft px-2.5 py-0.5 text-[10.5px] font-bold text-good-deep border border-good/20">
            <span className="h-1.5 w-1.5 rounded-full bg-good animate-pulse" />
            {t('detail.handlerCard.activeBadge', 'Đang phụ trách')}
          </span>
        ) : (
          <span className="rounded-full bg-warn-pill px-2 py-0.5 text-[10.5px] font-semibold text-warn-deep border border-warn-border">
            {t('detail.handlerCard.unassignedBadge', 'Chờ phân công')}
          </span>
        )}
      </div>

      {isAssigned ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <Avatar
                name={resolvedHandlerName || (isAdminPlatformDirect ? t('platformQueue.handlerFallback', 'Chuyên viên Nền tảng') : t('detail.handlerCard.techFallback', 'Kỹ thuật viên'))}
                size="md"
                tone="brand"
              />
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface bg-good" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-ink text-[13.5px] truncate">
                {resolvedHandlerName || (isAdminPlatformDirect ? t('platformQueue.handlerFallback', 'Chuyên viên Nền tảng') : t('detail.handlerCard.stationTechFallback', 'Kỹ thuật viên trạm'))}
              </div>
              <div className="font-mono text-[11px] text-muted truncate">
                {ticket.assignedHandlerId ? `#${ticket.assignedHandlerId.slice(0, 8)}` : (isAdminPlatformDirect ? t('platformQueue.adminDirect', 'Nền tảng trực tiếp') : t('detail.handlerCard.stationAssigned', 'Trạm phụ trách'))} ·{' '}
                {isAdminPlatformDirect
                  ? t('platformQueue.handlerTitle', 'Chuyên viên Nền tảng')
                  : t('detail.handlerCard.techRole', 'Kỹ thuật viên')}
              </div>
            </div>
          </div>

          {canAssign && !isClosed && !isResolved && !isAdminStationSupervisory && (
            <div className="pt-2 border-t border-hairline">
              <Button
                size="sm"
                variant="secondary"
                fullWidth
                onClick={onOpenAssign}
                icon={<IconUsers size={13} strokeWidth={2} />}
                className="w-full justify-center"
              >
                {isAdminPlatformDirect
                  ? t('platformQueue.reassignAdminBtn', 'Điều chuyển chuyên viên khác')
                  : t('detail.handlerCard.changeBtn', 'Điều chuyển nhân sự')}
              </Button>
            </div>
          )}

          {isAdminStationSupervisory && (
            <div className="rounded-xl bg-surface-2 p-2.5 text-[11.5px] text-muted border border-hairline leading-relaxed">
              {t(
                'supervisory.stationAssignedNotice',
                'Kỹ thuật viên trạm đang trực tiếp kiểm tra và xử lý sự cố thiết bị tại chỗ.'
              )}
            </div>
          )}

          {(assignedStaff?.email || assignedStaff?.maskedPhone) && (
            <div className="rounded-xl bg-surface-2 p-2.5 text-[11.5px] text-muted space-y-1 border border-hairline">
              {assignedStaff.email && (
                <div className="truncate">
                  <span className="text-faint">Email:</span> {assignedStaff.email}
                </div>
              )}
              {assignedStaff.maskedPhone && (
                <div className="flex items-center gap-1">
                  <IconPhone size={11} className="text-faint" />
                  <span>{assignedStaff.maskedPhone}</span>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-warn-border bg-warn-soft p-3.5 text-[12px]">
          <div className="flex items-start gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-warn-pill text-warn-deep font-bold mt-0.5 border border-warn-border">
              <IconUsers size={15} />
            </div>
            <div>
              <div className="font-semibold text-warn-deep">
                {t('detail.handlerCard.unassignedTitle', 'Chưa có người phụ trách')}
              </div>
              <p className="mt-0.5 text-[11px] text-muted leading-relaxed">
                {isAdminStationSupervisory
                  ? t(
                      'supervisory.stationUnassignedNotice',
                      'Chủ trạm hoặc nhân viên trực trạm chịu trách nhiệm tiếp nhận và phân công kỹ thuật viên cho phiếu này.'
                    )
                  : isAdminPlatformDirect
                  ? t(
                      'platformQueue.unassignedNotice',
                      'Phiếu sự cố hệ thống đang chờ Chuyên viên Nền tảng tiếp nhận xử lý.'
                    )
                  : t(
                      'detail.handlerCard.unassignedDesc',
                      'Phiếu hỗ trợ đang trong hàng đợi xử lý. Quản lý hoặc nhân viên trạm có thể nhận xử lý trực tiếp hoặc phân công cho kỹ thuật viên.'
                    )}
              </p>
            </div>
          </div>

          {!isClosed && !isResolved && (
            <div className="mt-3 flex items-center gap-2">
              {isAdminPlatformDirect ? (
                <div className="flex items-center gap-2 w-full">
                  <Button
                    accent="brand"
                    size="sm"
                    className="flex-1"
                    disabled={isClaiming}
                    onClick={onClaim}
                    icon={<IconCheck size={14} strokeWidth={2.5} />}
                  >
                    {isClaiming ? t('detail.claiming', 'Đang nhận...') : t('platformQueue.claimBtn', 'Tiếp nhận')}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={onOpenAssign}
                    icon={<IconUsers size={13} />}
                  >
                    {t('detail.assignBtnShort', 'Phân công')}
                  </Button>
                </div>
              ) : !admin ? (
                <>
                  <Button
                    accent="brand"
                    size="sm"
                    className="flex-1"
                    disabled={isClaiming}
                    onClick={onClaim}
                    icon={<IconCheck size={14} strokeWidth={2.5} />}
                  >
                    {isClaiming ? t('detail.claiming', 'Đang nhận...') : t('detail.claimBtn', 'Tự nhận xử lý')}
                  </Button>
                  {canAssign && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={onOpenAssign}
                      icon={<IconUsers size={13} />}
                    >
                      {t('detail.assignBtnShort', 'Phân công')}
                    </Button>
                  )}
                </>
              ) : null}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
