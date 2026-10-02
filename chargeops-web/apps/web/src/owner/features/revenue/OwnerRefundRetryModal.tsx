import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Button, IconRefreshCw, IconAlertTriangle, useToast } from '@chargeops/ui';
import { useApi, formatVnd, type OwnerRefund } from '@chargeops/api';

export interface OwnerRefundRetryModalProps {
  open: boolean;
  onClose: () => void;
  refund: OwnerRefund | null;
  onSuccess: () => void;
}

export function OwnerRefundRetryModal({
  open,
  onClose,
  refund,
  onSuccess,
}: OwnerRefundRetryModalProps) {
  const { t } = useTranslation('owner');
  const api = useApi();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!refund) return null;

  const handleConfirmRetry = async () => {
    setIsSubmitting(true);
    try {
      // Auto-generate Idempotency-Key
      const idempotencyKey = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `idemp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      await api.ownerRefunds.retry(
        refund.refundId,
        { expectedVersion: refund.version },
        idempotencyKey,
      );

      toast(
        t('finance.refunds.retrySuccess', {
          defaultValue: 'Yêu cầu hoàn tiền đã được gửi lại thành công!',
        }),
        'success',
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      toast(
        err?.message ||
          t('finance.refunds.retryError', {
            defaultValue: 'Không thể thử lại hoàn tiền. Vui lòng kiểm tra kết nối và thử lại.',
          }),
        'error',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} maxWidth={460}>
      <div className="mb-4 flex items-center justify-between border-b border-hairline pb-3">
        <div>
          <h3 className="text-base font-bold text-ink">
            {t('finance.refunds.retryModal.title', 'Xác nhận thử lại hoàn tiền')}
          </h3>
          <p className="text-[11px] text-muted">
            Refund #{refund.refundId} · Booking #{refund.bookingCode || refund.bookingId}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-muted hover:bg-surface-2 hover:text-ink transition-colors"
        >
          <span className="text-sm font-bold">✕</span>
        </button>
      </div>
      <div className="space-y-4">
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-3 text-[12px] text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
          <IconAlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <div className="space-y-1">
            <div className="font-bold">
              {t('finance.refunds.retryModal.warningTitle', 'Cơ chế Idempotency & Bảo toàn sổ sách')}
            </div>
            <p className="text-[11.5px] leading-relaxed opacity-90">
              {t(
                'finance.refunds.retryModal.warningDesc',
                'Hệ thống sẽ thử lại lệnh hoàn tiền cho tài xế với mã khóa chống trùng lặp. Số tiền được tính toán tự động 100% theo chính sách, không thể thay đổi.'
              )}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-line-2 bg-surface p-4 shadow-2xs space-y-2 text-[12px]">
          <div className="flex justify-between">
            <span className="text-muted">{t('finance.refunds.table.cols.station', 'Trạm sạc')}:</span>
            <span className="font-semibold text-ink">#{refund.stationId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">{t('finance.refunds.table.cols.amount', 'Số tiền hoàn trả')}:</span>
            <span className="font-mono font-bold text-good text-[14px]">+{formatVnd(refund.amount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">{t('finance.refunds.table.cols.reason', 'Lý do phát sinh')}:</span>
            <span className="font-medium text-body">
              {refund.reason === 'VOLUNTARY_GRACE'
                ? 'Ân hạn 10 phút'
                : refund.reason === 'STATION_UNAVAILABLE'
                ? 'Trạm không phục vụ'
                : refund.reason}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Version hồ sơ:</span>
            <span className="font-mono text-faint">v{refund.version}</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            {t('common.cancel', 'Hủy')}
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirmRetry}
            disabled={isSubmitting}
            className="flex items-center gap-1.5"
          >
            {isSubmitting && <IconRefreshCw size={13} className="animate-spin" />}
            <span>{isSubmitting ? 'Đang gửi...' : t('finance.refunds.retryModal.confirmBtn', 'Xác nhận thử lại')}</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
}
