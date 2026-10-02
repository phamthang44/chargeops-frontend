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
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/15 text-purple-600 dark:text-purple-400">
            <IconShieldAlert size={18} strokeWidth={2.2} />
          </div>
          <div>
            <h3 className="text-base font-bold text-ink">
              {t('escalation.modal.title', 'Yêu cầu Admin Phân xử Tranh chấp')}
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
        <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-3.5 text-[12px] leading-relaxed text-purple-800 dark:text-purple-200">
          <div className="flex items-center gap-1.5 font-semibold text-purple-900 dark:text-purple-100">
            <IconAlertCircle size={14} strokeWidth={2.2} className="shrink-0" />
            <span>{t('escalation.modal.roleNoticeTitle', 'Vai trò trọng tài độc lập của Admin')}</span>
          </div>
          <p className="mt-1 text-[11.5px] opacity-90">
            {t(
              'escalation.modal.roleNoticeDesc',
              'Khi bạn gửi yêu cầu, phiếu hỗ trợ sẽ được chuyển sang hàng chờ Phân xử Tranh chấp của Quản trị viên (Dispute Arbiter). Admin sẽ kiểm tra đối chiếu nhật ký phiên sạc và đưa ra quyết định xử lý cuối cùng.',
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
            className="mt-2 w-full rounded-xl border border-line bg-surface px-3 py-2 text-[12.5px] leading-relaxed text-ink placeholder:text-faint focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/15"
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
        <div className="flex items-center justify-end gap-2 border-t border-hairline pt-3">
          <Button type="button" variant="secondary" size="md" onClick={onClose} disabled={isPending}>
            {t('escalation.modal.cancelBtn', 'Hủy')}
          </Button>
          <Button
            type="submit"
            accent="brand"
            size="md"
            disabled={reason.trim().length < 10 || isPending}
            className="bg-purple-600 hover:bg-purple-700 text-white border-none"
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
