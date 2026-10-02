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
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10.5px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {t('detail.handlerCard.activeBadge', 'Đang phụ trách')}
          </span>
        ) : (
          <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10.5px] font-semibold text-amber-600 dark:text-amber-400 border border-amber-500/20">
            {t('detail.handlerCard.unassignedBadge', 'Chờ phân công')}
          </span>
        )}
      </div>

      {isAssigned ? (
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar
                  name={resolvedHandlerName || t('detail.handlerCard.techFallback', 'Kỹ thuật viên')}
                  size="md"
                  tone="brand"
                />
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface bg-emerald-500" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-ink text-[13.5px] truncate">
                  {resolvedHandlerName || t('detail.handlerCard.stationTechFallback', 'Kỹ thuật viên trạm')}
                </div>
                <div className="font-mono text-[11px] text-muted truncate">
                  {ticket.assignedHandlerId ? `#${ticket.assignedHandlerId.slice(0, 8)}` : t('detail.handlerCard.stationAssigned', 'Trạm phụ trách')} ·{' '}
                  {isAdminPlatformDirect
                    ? t('platformQueue.handlerTitle', 'Chuyên viên Nền tảng')
                    : t('detail.handlerCard.techRole', 'Kỹ thuật viên')}
                </div>
              </div>
            </div>

            {!isClosed && !isResolved && !isAdminStationSupervisory && (
              <Button
                size="sm"
                variant="secondary"
                onClick={onOpenAssign}
                icon={<IconUsers size={13} strokeWidth={2} />}
              >
                {t('detail.handlerCard.changeBtn', 'Điều chuyển')}
              </Button>
            )}
          </div>

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
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-3.5 text-[12px]">
          <div className="flex items-start gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold mt-0.5">
              <IconUsers size={15} />
            </div>
            <div>
              <div className="font-semibold text-amber-900 dark:text-amber-200">
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
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={onOpenAssign}
                    icon={<IconUsers size={13} />}
                  >
                    {t('detail.assignBtnShort', 'Phân công')}
                  </Button>
                </>
              ) : null}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
