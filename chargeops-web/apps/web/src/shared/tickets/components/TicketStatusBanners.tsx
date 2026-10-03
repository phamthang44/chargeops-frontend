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

  const isDriverRequester =
    escalation?.requestedByRole === 'driver' ||
    (Boolean(escalation?.requestedBy) &&
      (escalation?.requestedBy === ticket.reporterId ||
        escalation?.requestedBy === ticket.reporterUserId ||
        escalation?.requestedBy === ticket.driverId));

  const requesterDisplayName = isDriverRequester
    ? ticket.driverName || ticket.reporterName
    : ticket.stationName;

  return (
    <>
      {/* Administrative review, including its recorded outcome after completion. */}
      {escalation && (
        <div className="flex items-start gap-3 rounded-2xl border border-brand-line bg-brand-soft/50 p-4 text-[12.5px] text-ink shadow-xs">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand font-bold mt-0.5 border border-brand-line">
            <IconShieldAlert size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-[13.5px] text-ink">
                {isEscalated
                  ? t('escalation.bannerTitle', 'Admin đang xem xét yêu cầu hỗ trợ')
                  : isClosed
                  ? t('escalation.bannerClosedTitle', 'Yêu cầu xem xét đã hoàn tất cùng hồ sơ phiếu')
                  : isResolved
                  ? t('escalation.bannerResolvedAwaitingTitle', 'Sự cố đã được giải quyết, đang chờ tài xế xác nhận')
                  : t('escalation.bannerResolvedTitle', 'Admin đã hoàn tất xem xét yêu cầu hỗ trợ')}
              </span>
              <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-[10.5px] font-bold text-brand border border-brand-line">
                {isEscalated
                  ? t('escalation.badge', 'Đang xem xét')
                  : isClosed
                  ? t('status.CLOSED', 'Đã đóng')
                  : isResolved
                  ? t('status.RESOLVED', 'Đã giải quyết')
                  : t('status.COMPLETED', 'Đã xử lý')}
              </span>
            </div>

            <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[12px] bg-surface rounded-xl p-3 border border-line shadow-2xs">
              <div>
                <span className="text-muted font-medium">{t('escalation.requestedBy', 'Người yêu cầu xem xét')}: </span>
                <span className="font-semibold text-ink inline-flex items-center gap-1.5">
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${
                      isDriverRequester ? 'bg-sky-500 ring-2 ring-sky-500/20' : 'bg-amber-500 ring-2 ring-amber-500/20'
                    }`}
                  />
                  <span>
                    {isDriverRequester
                      ? requesterDisplayName
                        ? `${t('escalation.roleDriver', 'Tài xế')} (${requesterDisplayName})`
                        : t('escalation.roleDriver', 'Tài xế')
                      : requesterDisplayName
                      ? `${t('escalation.roleOwner', 'Chủ trạm')} (${requesterDisplayName})`
                      : t('escalation.roleOwner', 'Chủ trạm')}
                  </span>
                </span>
              </div>
              <div>
                <span className="text-muted font-medium">{t('escalation.reasonLabel', 'Lý do khiếu nại')}: </span>
                <span className="font-semibold text-ink">
                  {escalation?.reason === 'DRIVER_UNRESPONSIVE_24H'
                    ? t('escalation.reasons.unresponsive24h', 'Trạm sạc không phản hồi quá 24h')
                    : escalation?.reason === 'DISPUTED_NOT_STATION_FAILURE'
                    ? t('escalation.reasons.disputedFinding', 'Tài xế khiếu nại kết luận không phải lỗi trạm')
                    : escalation?.reason === 'STATION_DENIED'
                    ? t('escalation.reasons.stationDenied', 'Khiếu nại kết luận từ chối của trạm')
                    : escalation?.reason || t('escalation.reasons.other', 'Yêu cầu hỗ trợ chuyển cấp')}
                </span>
              </div>
              {escalation?.notes && (
                <div className="sm:col-span-2">
                  <span className="text-muted font-medium">{t('escalation.notesLabel', 'Ghi chú bổ sung')}: </span>
                  <span className="text-body italic">“{escalation.notes}”</span>
                </div>
              )}
            </div>

            {escalation.resolvedAt ? (
              <div className="mt-2.5 rounded-xl border border-line bg-surface/90 p-3 space-y-2 shadow-2xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11.5px] font-bold text-ink">
                    {t('escalation.review.resultLabel', 'Kết quả xem xét:')}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold border ${
                      escalation.resolutionType === 'RETURN_TO_STATION'
                        ? 'bg-warn-soft text-warn-deep border-warn-border'
                        : 'bg-chip text-ink border-line'
                    }`}
                  >
                    {escalation.resolutionType === 'RETURN_TO_STATION'
                      ? t('escalation.review.returnTitle', 'Trả lại trạm xử lý')
                      : t('escalation.review.closeTitle', 'Kết thúc xử lý hỗ trợ')}
                  </span>
                  {escalation.closureReason && (
                    <span className="inline-flex items-center rounded-md bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-muted border border-hairline">
                      {t(`escalation.review.reasons.${escalation.closureReason}`, escalation.closureReason)}
                    </span>
                  )}
                </div>
                {escalation.resolutionNote && (
                  <div className="flex items-start gap-1.5 text-[11.5px] text-body pt-1.5 border-t border-hairline">
                    <span className="font-medium text-muted shrink-0">
                      {t('escalation.review.noteLabel', 'Ghi chú biên bản:')}
                    </span>
                    <span className="italic text-ink font-medium">“{escalation.resolutionNote}”</span>
                  </div>
                )}
              </div>
            ) : isClosed ? (
              <p className="mt-2 text-[11px] leading-relaxed text-muted">
                <strong className="text-ink">Trạng thái:</strong>{' '}
                {closeReasonMeta?.label ||
                  (ticket.closeReason === 'REPORTER_CONFIRMED'
                    ? 'Tài xế đã xác nhận giải quyết sự cố và đóng phiếu hỗ trợ.'
                    : 'Phiếu hỗ trợ đã được đóng hoàn tất.')}
              </p>
            ) : isResolved ? (
              <p className="mt-2 text-[11px] leading-relaxed text-muted">
                <strong className="text-ink">Trạng thái:</strong> Sự cố đã được xử lý và đánh dấu giải quyết, đang chờ tài xế xác nhận.
              </p>
            ) : (
              <p className="mt-2 text-[11px] leading-relaxed text-muted">
                {t('escalation.arbiterDisclaimer', 'Admin phối hợp xử lý yêu cầu hỗ trợ và ghi lại kết quả xem xét.')}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Contextual Supervisory Banner for Admin on Station Tickets (active only) */}
      {isAdminStationSupervisory && !isClosed && !isResolved && (
        <div className="flex items-start gap-3 rounded-2xl border border-warn-border bg-warn-soft p-3.5 text-[12px] text-ink">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-warn-pill text-warn-deep font-bold mt-0.5 border border-warn-border">
            <IconShieldAlert size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-bold text-[13px] text-warn-deep">{t('supervisory.bannerTitle', 'Chế độ Giám sát Trạm sạc (SLA & Kỹ thuật)')}</div>
            <p className="mt-0.5 text-muted leading-relaxed">
              {t('supervisory.bannerDesc', 'Chủ trạm và Staff trạm {{station}} trực tiếp xử lý. Khi có yêu cầu chuyển cấp, Admin ghi chú xem xét hỗ trợ.', {
                station: ticket.stationName || t('detail.context.unknownStation', 'Trạm sạc'),
              })}
            </p>
          </div>
        </div>
      )}

      {/* BKG-052 Resolution / Closure Policy Banner Bar */}
      {isResolved && (
        <div className="rounded-2xl border border-warn-border bg-warn-soft p-4 shadow-xs">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-warn-pill text-warn-deep border border-warn-border">
                <IconClock size={18} strokeWidth={2.2} />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[13px] font-bold text-warn-deep">
                    {t('detail.resolvedBannerTitle', 'Sự cố đã được đánh dấu giải quyết', {
                      cycle: ticket.resolutionCycle ?? 1,
                    })}
                  </span>
                  {ticket.autoCloseAt && (
                    <span className="font-mono text-[11px] font-semibold text-warn">
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
