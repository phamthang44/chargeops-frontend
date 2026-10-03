import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatDateVn, formatTimeVn, type Ticket } from '@chargeops/api';
import { Button, Modal, IconAlertCircle, IconCheckCircle, IconClock, IconSend } from '@chargeops/ui';

interface ResolveTicketModalProps {
  open: boolean;
  onClose: () => void;
  ticket: Ticket;
  onSubmit: (reason: string) => Promise<void>;
  isPending: boolean;
  accent?: 'brand' | 'owner';
  hasFindings?: boolean;
  isEscalated?: boolean;
}

export function ResolveTicketModal({
  open,
  onClose,
  ticket,
  onSubmit,
  isPending,
  accent = 'brand',
  hasFindings = false,
  isEscalated = false,
}: ResolveTicketModalProps) {
  const { t } = useTranslation('tickets');
  const [reason, setReason] = useState('');

  const isStationTicketWithBooking = Boolean(ticket.stationId && ticket.bookingId);
  const isMissingFinding = isStationTicketWithBooking && !hasFindings;

  const deadlinePreview = useMemo(() => {
    const deadline = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
    return `${formatTimeVn(deadline.toISOString())} ngày ${formatDateVn(deadline.toISOString())}`;
  }, []);

  const nextCycle = (ticket.resolutionCycle ?? 0) + 1;
  const ticketCode = ticket.ticketCode || ticket.ticketNo || `#${ticket.id.slice(0, 8).toUpperCase()}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || isPending) return;
    await onSubmit(reason.trim());
    setReason('');
  };

  return (
    <Modal open={open} onClose={onClose} maxWidth={520}>
      <div className="mb-4 flex items-center justify-between border-b border-hairline pb-3">
        <h3 className="text-base font-bold text-ink">{t('resolveModal.title', 'Xác nhận Giải quyết Sự cố')}</h3>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-muted hover:bg-surface-2 hover:text-ink transition-colors"
        >
          <span className="text-sm font-bold">✕</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Cycle & Policy Info Tag */}
        <div className="flex items-center justify-between rounded-xl border border-hairline bg-surface-2 p-3 text-[12px]">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-brand">{ticketCode}</span>
            <span className="text-faint">·</span>
            <span className="font-medium text-ink">
              {t('resolveModal.cycle', 'Lần xử lý thứ {{cycle}}', { cycle: nextCycle })}
            </span>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-warn-pill px-2 py-0.5 text-[10.5px] font-bold text-warn-deep border border-warn-border">
            <IconClock size={11} strokeWidth={2.2} />
            <span>{t('resolveModal.tenDaysBadge', '10 ngày tự đóng')}</span>
          </span>
        </div>

        {/* Input Textarea for Resolution Reason */}
        <div>
          <label className="block text-[12.5px] font-semibold text-ink">
            {t('resolveModal.reasonLabel', 'Kết quả & Nội dung xử lý sự cố')} <span className="text-bad">*</span>
          </label>
          <p className="mt-0.5 text-[11px] text-muted">
            {t('resolveModal.reasonHelp', 'Mô tả chi tiết giải pháp kỹ thuật đã khắc phục. Nội dung này sẽ được thông báo trực tiếp cho tài xế.')}
          </p>
          <textarea
            required
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t(
              'resolveModal.reasonPlaceholder',
              'Ví dụ: Đã kiểm tra lại cáp tín hiệu, khởi động lại trụ sạc DC và kiểm thử phiên sạc thành công...',
            )}
            className="mt-2 w-full rounded-xl border border-line bg-surface px-3 py-2 text-[12.5px] leading-relaxed text-ink placeholder:text-faint focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
          />
        </div>

        {/* Live In-App Notification Preview for Driver */}
        <div className="rounded-xl border border-brand-line/40 bg-brand-soft/20 p-3 text-[11.5px]">
          <div className="flex items-center gap-1.5 font-bold text-brand-deep">
            <IconAlertCircle size={13} strokeWidth={2.2} />
            <span>{t('resolveModal.notificationPreviewTitle', 'Xem trước thông báo gửi cho tài xế:')}</span>
          </div>
          <p className="mt-1 leading-relaxed text-muted italic">
            “Phiếu hỗ trợ <strong>{ticketCode}</strong> đã được nhân viên trạm đánh dấu đã giải quyết: {reason.trim() ? `“${reason.trim()}”` : '[Kết quả xử lý]'}. Vui lòng kiểm tra và chọn ‘Xác nhận’ hoặc ‘Vấn đề vẫn còn’ trước <strong>{deadlinePreview}</strong>. Nếu không nhận được phản hồi sau 10 ngày, phiếu sẽ tự động đóng theo quy định.”
          </p>
        </div>

        {/* Escalated to Admin Notice */}
        {isEscalated && (
          <div className="rounded-xl border border-brand-line bg-brand-soft/40 p-3 text-[12px] text-ink">
            <div className="flex items-center gap-1.5 font-bold text-brand">
              <IconAlertCircle size={14} strokeWidth={2.2} />
              <span>{t('resolveModal.escalatedTitle', 'Admin đang xem xét yêu cầu hỗ trợ')}</span>
            </div>
            <p className="mt-1 leading-relaxed text-muted">
              {t(
                'resolveModal.escalatedDesc',
                'Trạm tạm dừng đánh dấu giải quyết cho tới khi Admin trả lại ticket để tiếp tục xử lý.'
              )}
            </p>
          </div>
        )}

        {/* Missing Technical Finding Alert */}
        {isMissingFinding && !isEscalated && (
          <div className="rounded-xl border border-warn-border bg-warn-soft p-3 text-[12px] text-ink">
            <div className="flex items-center gap-1.5 font-bold text-warn-deep">
              <IconAlertCircle size={14} strokeWidth={2.2} />
              <span>{t('resolveModal.missingFindingTitle', 'Yêu cầu Kết luận kỹ thuật trước khi giải quyết')}</span>
            </div>
            <p className="mt-1 leading-relaxed text-muted">
              {t(
                'resolveModal.missingFindingDesc',
                'Phiếu hỗ trợ này gắn liền với sự cố trạm sạc và đơn sạc. Quy trình bắt buộc phải ghi nhận Kết luận kỹ thuật (Lỗi trạm / Không phải lỗi trạm) tại thẻ bên cạnh trước khi hoàn tất phiên làm việc.'
              )}
            </p>
          </div>
        )}

        {/* Policy Disclaimer */}
        <p className="text-[11px] text-muted leading-relaxed">
          {t(
            'resolveModal.disclaimer',
            '* Sau khi gửi, hệ thống dành 10 ngày để tài xế phản hồi hoặc xác nhận. Nếu tài xế gửi tin nhắn hoặc báo vấn đề vẫn còn, phiếu sẽ tự động chuyển về trạng thái Đang xử lý.',
          )}
        </p>

        {/* Modal Actions */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-2.5 pt-2 border-t border-hairline">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isPending} className="w-full sm:w-auto justify-center">
            {t('common.cancel', 'Hủy')}
          </Button>
          <Button
            type="submit"
            accent={accent}
            disabled={!reason.trim() || isPending || isMissingFinding || isEscalated}
            className={`w-full sm:w-auto justify-center ${isMissingFinding || isEscalated ? 'opacity-50 cursor-not-allowed' : ''}`}
            icon={<IconCheckCircle size={14} strokeWidth={2.2} />}
          >
            {isPending ? t('resolveModal.submitting', 'Đang cập nhật...') : t('resolveModal.submit', 'Hoàn tất & Đánh dấu Giải quyết')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
