import { useTranslation } from 'react-i18next';
import {
  IconClock,
  IconLock,
  IconShieldAlert,
  StatusPill,
} from '@chargeops/ui';
import {
  formatDateVn,
  formatTimeVn,
  TICKET_CLOSE_REASON,
  type Ticket,
} from '@chargeops/api';
import { TicketCountdownTimer } from './TicketCountdownTimer';

export interface TicketStatusBannersProps {
  ticket: Ticket;
  isAdminStationSupervisory: boolean;
  isResolved: boolean;
  isClosed: boolean;
}

export function TicketStatusBanners({
  ticket,
  isAdminStationSupervisory,
  isResolved,
  isClosed,
}: TicketStatusBannersProps) {
  const { t } = useTranslation('tickets');
  const closeReasonMeta = ticket.closeReason ? TICKET_CLOSE_REASON[ticket.closeReason] : undefined;

  return (
    <>
      {/* Contextual Supervisory Banner for Admin on Station Tickets */}
      {isAdminStationSupervisory && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/5 p-3.5 text-[12px] text-amber-900 dark:text-amber-200">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold mt-0.5">
            <IconShieldAlert size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-bold text-[13px]">{t('supervisory.bannerTitle', 'Chế độ Giám sát Trạm sạc (SLA & Kỹ thuật)')}</div>
            <p className="mt-0.5 text-muted leading-relaxed">
              {t('supervisory.bannerDesc', 'Chủ trạm và Staff trạm {{station}} trực tiếp xử lý. Admin có thể trao đổi và điều hướng người phù hợp, ghi kết luận kỹ thuật; quyết định hoàn tiền nằm ở luồng riêng.', {
                station: ticket.stationName || t('detail.context.unknownStation', 'Trạm sạc'),
              })}
            </p>
          </div>
        </div>
      )}

      {/* BKG-052 Resolution / Closure Policy Banner Bar */}
      {isResolved && (
        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 shadow-sm backdrop-blur-md">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-500">
                <IconClock size={18} strokeWidth={2.2} />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[13px] font-bold text-amber-900 dark:text-amber-200">
                    {t('detail.resolvedBannerTitle', 'Sự cố đã được đánh dấu giải quyết', {
                      cycle: ticket.resolutionCycle ?? 1,
                    })}
                  </span>
                  {ticket.autoCloseAt && (
                    <span className="font-mono text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                      {t('detail.deadline', 'Hạn chót: {{time}} ngày {{date}}', {
                        time: formatTimeVn(ticket.autoCloseAt),
                        date: formatDateVn(ticket.autoCloseAt),
                      })}
                    </span>
                  )}
                </div>

                {ticket.resolutionReason && (
                  <p className="text-[12.5px] leading-relaxed text-ink">
                    <span className="font-semibold text-muted">{t('detail.resolutionOutcome', 'Kết quả xử lý')}:</span> “{ticket.resolutionReason}”
                  </p>
                )}

                <p className="text-[11px] leading-relaxed text-muted italic">
                  * {t('detail.autoClosePolicyDisclaimer', 'Chính sách hỗ trợ: Hệ thống đã gửi thông báo cho tài xế. Nếu không nhận được phản hồi sau 10 ngày, phiếu sẽ tự động đóng theo quy định. Việc đọc thông báo không tính là phản hồi.')}
                </p>
              </div>
            </div>

            <TicketCountdownTimer autoCloseAt={ticket.autoCloseAt} resolvedAt={ticket.resolvedAt} className="shrink-0" />
          </div>
        </div>
      )}

      {/* Closed Banner Bar */}
      {isClosed && (
        <div className="rounded-2xl border border-hairline bg-surface-2/70 p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-chip text-muted">
              <IconLock size={17} strokeWidth={2.2} />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-bold text-ink">
                  {t('detail.closedBannerTitle', 'Phiếu hỗ trợ đã được đóng và hoàn tất')}
                </span>
                {closeReasonMeta && (
                  <StatusPill tone={closeReasonMeta.tone} label={closeReasonMeta.label} />
                )}
              </div>
              <p className="text-[12px] text-muted">
                {closeReasonMeta?.description || t('detail.closedHelp', 'Phiếu hỗ trợ này đã hoàn thành. Nếu có thắc mắc hoặc sự cố phát sinh sau thời điểm này, vui lòng tạo phiếu hỗ trợ mới.')}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
