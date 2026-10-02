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
  type TicketEscalation,
} from '@chargeops/api';
import { TicketCountdownTimer } from './TicketCountdownTimer';

export interface TicketStatusBannersProps {
  ticket: Ticket;
  isAdminStationSupervisory: boolean;
  isResolved: boolean;
  isClosed: boolean;
  isEscalated?: boolean;
  escalation?: TicketEscalation | null;
}

export function TicketStatusBanners({
  ticket,
  isAdminStationSupervisory,
  isResolved,
  isClosed,
  isEscalated = false,
  escalation,
}: TicketStatusBannersProps) {
  const { t } = useTranslation('tickets');
  const closeReasonMeta = ticket.closeReason ? TICKET_CLOSE_REASON[ticket.closeReason] : undefined;

  return (
    <>
      {/* Dispute Escalation Arbitration Banner */}
      {(isEscalated || escalation) && (
        <div className="flex items-start gap-3 rounded-2xl border border-purple-500/30 bg-purple-500/10 p-4 text-[12.5px] text-purple-950 dark:text-purple-200 shadow-xs">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-purple-500/20 text-purple-700 dark:text-purple-300 font-bold mt-0.5">
            <IconShieldAlert size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-[13.5px]">
                {t('escalation.bannerTitle', 'Vụ việc đã được chuyển lên Quản trị viên phân xử (Dispute Escalation)')}
              </span>
              <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-[10.5px] font-extrabold text-purple-700 dark:text-purple-300 border border-purple-500/30">
                {t('escalation.badge', 'Đang phân xử')}
              </span>
            </div>

            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[12px] bg-surface/60 rounded-xl p-2.5 border border-purple-500/20">
              <div>
                <span className="text-muted font-medium">{t('escalation.requestedBy', 'Bên đề nghị phân xử')}: </span>
                <span className="font-semibold text-ink">
                  {escalation?.requestedByRole === 'driver' ? t('escalation.roleDriver', 'Tài xế') : t('escalation.roleOwner', 'Chủ trạm')}
                </span>
              </div>
              <div>
                <span className="text-muted font-medium">{t('escalation.reasonLabel', 'Lý do khiếu nại')}: </span>
                <span className="font-semibold text-ink">
                  {escalation?.reason === 'DRIVER_UNRESPONSIVE_24H'
                    ? t('escalation.reasons.unresponsive24h', 'Trạm sạc không phản hồi quá 24h')
                    : escalation?.reason === 'DISPUTED_NOT_STATION_FAILURE'
                    ? t('escalation.reasons.disputedFinding', 'Tài xế khiếu nại kết luận không phải lỗi trạm')
                    : escalation?.reason || t('escalation.reasons.other', 'Khiếu nại phân xử')}
                </span>
              </div>
              {escalation?.notes && (
                <div className="sm:col-span-2">
                  <span className="text-muted font-medium">{t('escalation.notesLabel', 'Ghi chú bổ sung')}: </span>
                  <span className="text-body italic">“{escalation.notes}”</span>
                </div>
              )}
            </div>

            <p className="mt-2 text-[11px] leading-relaxed text-muted">
              * {t('escalation.arbiterDisclaimer', 'Vai trò Admin: Trọng tài công tâm, thu thập bằng chứng từ hai phía và đưa ra phán quyết hỗ trợ. Admin không trực tiếp can thiệp kỹ thuật tại trạm.')}
            </p>
          </div>
        </div>
      )}
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
