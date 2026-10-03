import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type Ticket } from '@chargeops/api';
import { Button, Modal, IconAlertCircle, IconShieldAlert } from '@chargeops/ui';

export interface EscalateTicketModalProps {
  open: boolean;
  onClose: () => void;
  ticket: Ticket;
  onSubmit: (reason: string) => Promise<void>;
  isPending: boolean;
}

export function EscalateTicketModal({
  open,
  onClose,
  ticket,
  onSubmit,
  isPending,
}: EscalateTicketModalProps) {
  const { t } = useTranslation('tickets');
  const [reason, setReason] = useState('');

  const ticketCode = ticket.ticketCode || ticket.ticketNo || `#${ticket.id.slice(0, 8).toUpperCase()}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = reason.trim();
    if (trimmed.length < 10 || isPending) return;
    await onSubmit(trimmed);
    setReason('');
  };

  return (
    <Modal open={open} onClose={onClose} maxWidth={520}>
      <div className="mb-4 flex items-center justify-between border-b border-hairline pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-soft text-brand border border-brand-line">
            <IconShieldAlert size={18} strokeWidth={2.2} />
          </div>
          <div>
            <h3 className="text-base font-bold text-ink">
              {t('escalation.modal.title', 'Yêu cầu Admin xem xét hỗ trợ')}
            </h3>
            <p className="text-[11px] text-muted">
              {ticketCode} · {ticket.stationName || t('escalation.modal.stationFallback', 'Trạm sạc')}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-muted hover:bg-surface-2 hover:text-ink transition-colors"
        >
          <span className="text-sm font-bold">✕</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Arbiter Role Guidance Callout */}
        <div className="rounded-xl border border-brand-line bg-brand-soft/40 p-3.5 text-[12px] leading-relaxed text-ink">
          <div className="flex items-center gap-1.5 font-semibold text-brand">
            <IconAlertCircle size={14} strokeWidth={2.2} className="shrink-0" />
            <span>{t('escalation.modal.roleNoticeTitle', 'Admin điều phối hỗ trợ')}</span>
          </div>
          <p className="mt-1 text-[11.5px] text-muted">
            {t(
              'escalation.modal.roleNoticeDesc',
              'Admin sẽ xem xét bối cảnh, ghi chú kết quả và trả lại trạm hoặc kết thúc support case với lý do rõ ràng.',
            )}
          </p>
        </div>

        {/* Input Reason */}
        <div>
          <label className="block text-[12.5px] font-semibold text-ink">
            {t('escalation.modal.reasonLabel', 'Lý do trạm yêu cầu Admin can thiệp')}{' '}
            <span className="text-bad">*</span>
          </label>
          <p className="mt-0.5 text-[11px] text-muted">
            {t(
              'escalation.modal.reasonHelp',
              'Nêu rõ điểm bất đồng (ví dụ: tài xế báo trụ ngắt nhưng telemetry log ghi nhận xe tự ngắt), kết quả kỹ thuật trạm đã kiểm tra. Tối thiểu 10 ký tự.',
            )}
          </p>
          <textarea
            required
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t(
              'escalation.modal.reasonPlaceholder',
              'Ví dụ: Trạm đã kiểm tra camera và log phần cứng, trụ sạc hoạt động bình thường theo đúng chuẩn. Hai bên không đạt được đồng thuận về việc bồi hoàn...',
            )}
            className="mt-2 w-full rounded-xl border border-line bg-surface px-3 py-2 text-[12.5px] leading-relaxed text-ink placeholder:text-faint focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
          />
          <div className="mt-1 flex justify-between text-[11px] text-faint">
            <span>
              {reason.trim().length < 10
                ? t('escalation.modal.minCharsNotice', 'Còn thiếu {{count}} ký tự', {
                    count: 10 - reason.trim().length,
                  })
                : t('escalation.modal.validNotice', 'Hợp lệ')}
            </span>
            <span>{reason.length}/2000</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 border-t border-hairline pt-3">
          <Button type="button" variant="secondary" size="md" onClick={onClose} disabled={isPending} className="w-full sm:w-auto justify-center">
            {t('escalation.modal.cancelBtn', 'Hủy')}
          </Button>
          <Button
            type="submit"
            variant="primary"
            accent="brand"
            size="md"
            disabled={reason.trim().length < 10 || isPending}
            className="w-full sm:w-auto justify-center"
          >
            {isPending
              ? t('escalation.modal.submitting', 'Đang gửi...')
              : t('escalation.modal.submitBtn', 'Xác nhận chuyển Admin')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
