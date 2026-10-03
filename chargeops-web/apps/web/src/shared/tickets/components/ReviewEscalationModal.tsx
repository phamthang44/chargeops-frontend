import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ReviewTicketEscalationPayload, TicketEscalationClosureReason } from '@chargeops/api';
import {
  Button,
  Modal,
  Select,
  IconCheckCircle,
  IconInfoCircle,
  IconRefreshCw,
  IconShieldCheck,
  IconX,
} from '@chargeops/ui';

const REASONS: TicketEscalationClosureReason[] = [
  'RESOLVED_EXTERNALLY',
  'INSUFFICIENT_INFORMATION',
  'NO_PLATFORM_ACTION_REQUIRED',
  'OUT_OF_SUPPORT_SCOPE',
  'OTHER',
];

const REASON_HINTS: Record<TicketEscalationClosureReason, string> = {
  RESOLVED_EXTERNALLY: 'Sự cố đã được các bên thỏa thuận và xử lý trực tiếp ngoài hệ thống.',
  INSUFFICIENT_INFORMATION: 'Tài xế hoặc trạm không cung cấp đủ dữ liệu/chứng cứ kỹ thuật để tiếp tục xử lý.',
  NO_PLATFORM_ACTION_REQUIRED: 'Nền tảng đã hoàn thành trách nhiệm điều phối, không còn hành động cần thực hiện.',
  OUT_OF_SUPPORT_SCOPE: 'Nội dung khiếu nại nằm ngoài phạm vi và chính sách hỗ trợ vận hành của nền tảng.',
  OTHER: 'Các nguyên nhân đặc thù khác được giải trình cụ thể trong ghi chú biên bản bên dưới.',
};

interface Props {
  open: boolean;
  action: ReviewTicketEscalationPayload['action'];
  pending: boolean;
  onClose: () => void;
  onSubmit: (note: string, closureReason?: TicketEscalationClosureReason) => Promise<void>;
}

export function ReviewEscalationModal({ open, action, pending, onClose, onSubmit }: Props) {
  const { t } = useTranslation('tickets');
  const [note, setNote] = useState('');
  const [reason, setReason] = useState<TicketEscalationClosureReason>('NO_PLATFORM_ACTION_REQUIRED');

  if (!open) return null;
  const closing = action === 'CLOSE_SUPPORT_CASE';
  const title = closing ? t('escalation.review.closeTitle') : t('escalation.review.returnTitle');

  const selectOptions = REASONS.map((item) => ({
    value: item,
    label: t(`escalation.review.reasons.${item}`),
  }));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!note.trim() || pending) return;
    try {
      await onSubmit(note.trim(), closing ? reason : undefined);
      setNote('');
    } catch {
      // The caller displays the API error and keeps this form open for retry.
    }
  };

  return (
    <Modal open={open} onClose={onClose} maxWidth={520}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Header with Action Badge */}
        <div className="flex items-start justify-between gap-3 border-b border-hairline pb-3.5">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                closing
                  ? 'border-warn-border bg-warn-pill text-warn-deep'
                  : 'border-brand-line bg-brand-soft text-brand'
              }`}
            >
              {closing ? (
                <IconShieldCheck size={20} strokeWidth={2.2} />
              ) : (
                <IconRefreshCw size={19} strokeWidth={2.2} />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[15px] font-bold tracking-tight text-ink">{title}</h3>
                <span className="rounded-md border border-line bg-surface-2 px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wider text-muted">
                  Admin Escalation
                </span>
              </div>
              <p className="mt-0.5 text-[11.5px] text-muted">
                {closing
                  ? t('escalation.review.closeDescription')
                  : t('escalation.review.returnDescription')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-ink transition-colors"
            title={t('escalation.review.cancel')}
          >
            <IconX size={15} strokeWidth={2.2} />
          </button>
        </div>

        {/* Operational Context Card */}
        <div
          className={`flex items-start gap-2.5 rounded-xl border p-3 text-[11.5px] leading-relaxed ${
            closing
              ? 'border-warn-border bg-warn-soft text-muted'
              : 'border-brand-line bg-brand-soft/40 text-muted'
          }`}
        >
          <IconInfoCircle
            size={15}
            className={`mt-0.5 shrink-0 ${closing ? 'text-warn-deep' : 'text-brand'}`}
          />
          <div>
            {closing ? (
              <span>
                Thao tác này sẽ <strong className="font-semibold text-ink">kết thúc quy trình xem xét hỗ trợ</strong>.
                Hồ sơ ticket và lý do đóng sẽ được lưu vết kiểm toán vĩnh viễn trong hệ thống.
              </span>
            ) : (
              <span>
                Yêu cầu can thiệp sẽ khép lại và bàn giao lại cho{' '}
                <strong className="font-semibold text-ink">Chủ trạm & Nhân viên trạm</strong> tiếp tục xử lý trực tiếp với tài xế.
              </span>
            )}
          </div>
        </div>

        {/* Closure Reason Field (when closing) */}
        {closing && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[12.5px] font-semibold text-ink">
                {t('escalation.review.closureReason')} <span className="text-bad">*</span>
              </label>
              <span className="text-[10.5px] font-medium text-faint">Phân loại xử lý</span>
            </div>

            <Select
              value={reason}
              onChange={(val) => setReason(val as TicketEscalationClosureReason)}
              options={selectOptions}
              accent="brand"
              className="w-full"
            />

            {/* Dynamic Reason Hint */}
            <div className="flex items-center gap-1.5 rounded-lg bg-surface-2/60 px-2.5 py-1.5 text-[11px] text-muted border border-hairline">
              <IconInfoCircle size={12} className="shrink-0 text-faint" />
              <span>{REASON_HINTS[reason]}</span>
            </div>
          </div>
        )}

        {/* Admin Note Field */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[12.5px] font-semibold text-ink">
              {t('escalation.review.note')} <span className="text-bad">*</span>
            </label>
            <span className="text-[11px] font-mono text-faint">{note.length}/2000</span>
          </div>

          <p className="text-[11px] text-muted">
            {closing
              ? 'Nêu rõ tóm tắt nội dung trao đổi, kết quả làm việc với các bên hoặc căn cứ kỹ thuật của Admin.'
              : 'Ghi rõ hướng dẫn xử lý hoặc các hạng mục trạm cần kiểm tra lại trước khi thông báo tài xế.'}
          </p>

          <textarea
            required
            maxLength={2000}
            rows={4}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder={
              closing
                ? 'Ví dụ: Đã làm việc với chủ trạm và khách hàng, các bên thống nhất phương án hỗ trợ trực tiếp ngoài hệ thống...'
                : 'Ví dụ: Đề nghị kỹ thuật viên trạm đo kiểm lại thông số trụ sạc và cập nhật biên bản kỹ thuật mới...'
            }
            className="w-full rounded-xl border border-line bg-surface-2/40 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-ink placeholder:text-faint focus:border-brand focus:bg-surface focus:ring-2 focus:ring-brand/15 focus:outline-none transition-all resize-y min-h-[90px]"
          />
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between border-t border-hairline pt-3.5">
          <span className="text-[11px] text-faint">Esc để đóng</span>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={onClose}
              disabled={pending}
            >
              {t('escalation.review.cancel')}
            </Button>

            <Button
              type="submit"
              variant="primary"
              accent="brand"
              size="md"
              disabled={!note.trim() || pending}
              icon={
                pending ? (
                  <IconRefreshCw size={14} className="animate-spin" />
                ) : closing ? (
                  <IconCheckCircle size={15} strokeWidth={2.2} />
                ) : (
                  <IconRefreshCw size={14} strokeWidth={2.2} />
                )
              }
            >
              {pending ? t('escalation.review.saving') : title}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
