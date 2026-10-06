import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import {
  Button,
  DateTimeInput,
  IconAlertTriangle,
  IconCheckCircle,
  IconInfoCircle,
  IconShieldCheck,
  IconX,
  Modal,
  useToast,
} from '@chargeops/ui';
import {
  formatVnd,
  useApi,
  type OwnerBookingDetail,
  type OwnerStationFailureContext,
} from '@chargeops/api';

export interface OwnerAdmitFailureModalProps {
  open: boolean;
  onClose: () => void;
  booking: OwnerBookingDetail | null;
  context?: OwnerStationFailureContext | null;
  onSuccess?: () => void;
}

export function OwnerAdmitFailureModal({
  open,
  onClose,
  booking,
  context,
  onSuccess,
}: OwnerAdmitFailureModalProps) {
  const { t } = useTranslation('owner');
  const api = useApi();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [affectedAt, setAffectedAt] = useState(() => {
    if (booking?.startAt) {
      return new Date(booking.startAt).toISOString().slice(0, 16);
    }
    return new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  });
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!booking) return null;

  const refundAmount = context?.eligibleRefundAmountVnd ?? booking.totalAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanReason = reason.trim();
    if (cleanReason.length < 5) {
      setValidationError(
        t('bookings.ownerAdmitModal.reasonRequired', 'Vui lòng cung cấp lý do cụ thể (tối thiểu 5 ký tự).')
      );
      return;
    }
    if (cleanReason.length > 2000) {
      setValidationError(
        t('bookings.ownerAdmitModal.reasonTooLong', 'Lý do không được vượt quá 2000 ký tự.')
      );
      return;
    }

    if (!affectedAt) {
      setValidationError(
        t('bookings.ownerAdmitModal.affectedAtRequired', 'Vui lòng chọn thời điểm xảy ra sự cố.')
      );
      return;
    }

    const affectedDate = new Date(affectedAt);
    if (affectedDate.getTime() > Date.now()) {
      setValidationError(
        t('bookings.ownerAdmitModal.futureAffectedAt', 'Thời điểm sự cố không thể ở tương lai.')
      );
      return;
    }

    if (booking.endAt && affectedDate.getTime() > new Date(booking.endAt).getTime()) {
      setValidationError(
        t('bookings.ownerAdmitModal.afterEndAt', 'Thời điểm sự cố không thể diễn ra sau khi đặt chỗ đã kết thúc.')
      );
      return;
    }

    setValidationError(null);
    setIsSubmitting(true);

    try {
      const idempotencyKey =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `idemp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      const currentVersion = context?.bookingVersion ?? booking.version;
      const currentDecisionVersion = context?.decisionVersion ?? 0;

      await api.ownerBookings.admitStationFailure(
        booking.bookingId,
        {
          expectedVersion: currentVersion,
          expectedDecisionVersion: currentDecisionVersion,
          affectedAt: affectedDate.toISOString(),
          reason: cleanReason,
        },
        idempotencyKey
      );

      toast(
        t(
          'bookings.ownerAdmitModal.successToast',
          'Đã ghi nhận trách nhiệm sự cố và xác lập nghĩa vụ hoàn tiền thành công!'
        ),
        'success'
      );

      // Invalidate relevant queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['ownerBookings'] }),
        queryClient.invalidateQueries({ queryKey: ['ownerFinance'] }),
        queryClient.invalidateQueries({ queryKey: ['ownerRefunds'] }),
      ]);

      setReason('');
      onSuccess?.();
      onClose();
    } catch (err: any) {
      const message =
        err?.message ||
        err?.error ||
        t('bookings.ownerAdmitModal.genericError', 'Có lỗi xảy ra khi xác nhận trách nhiệm sự cố.');
      if (err?.code === 'VERSION_CONFLICT' || message.includes('VERSION_CONFLICT') || message.includes('DECISION_CHANGED')) {
        toast(
          t(
            'bookings.ownerAdmitModal.versionConflict',
            'Dữ liệu hoặc chuỗi quyết định đã thay đổi trên máy chủ. Đang làm mới dữ liệu...'
          ),
          'warning'
        );
        queryClient.invalidateQueries({ queryKey: ['ownerBookings', 'detail', booking.bookingId] });
      } else {
        toast(message, 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} maxWidth={520}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-hairline pb-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand-line bg-brand-soft text-brand">
              <IconShieldCheck size={20} strokeWidth={2.2} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[15px] font-bold tracking-tight text-ink">
                  {t('bookings.ownerAdmitModal.title', 'Nhận trách nhiệm sự cố & Hoàn tiền (BKG-056)')}
                </h3>
              </div>
              <p className="mt-0.5 text-[11.5px] text-muted">
                {t('bookings.ownerAdmitModal.codeStatusSub', 'Mã: #{{code}} · Trạng thái: {{status}}', {
                  code: booking.bookingCode || booking.bookingId,
                  status: booking.status,
                })}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-ink transition-colors"
          >
            <IconX size={15} strokeWidth={2.2} />
          </button>
        </div>

        {/* Operational Context Info */}
        <div className="flex items-start gap-2.5 rounded-xl border border-brand-line bg-brand-soft/40 p-3 text-[11.5px] leading-relaxed text-muted">
          <IconInfoCircle size={16} className="mt-0.5 shrink-0 text-brand" />
          <div>
            <div className="font-semibold text-ink mb-0.5">
              {t('bookings.ownerAdmitModal.warningTitle', 'Chủ động xác nhận trách nhiệm của trạm')}
            </div>
            <p>
              {t(
                'bookings.ownerAdmitModal.warningDesc',
                'Thao tác này xác nhận sự cố trạm đã ảnh hưởng đến đặt chỗ của tài xế. Hệ thống sẽ ghi nhận quyết định bất biến và lập tức xác lập nghĩa vụ hoàn đủ 100% giá gói vào tài khoản mô phỏng của tài xế mà không cần can thiệp từ quản trị viên.'
              )}
            </p>
          </div>
        </div>

        {/* Booking Summary */}
        <div className="rounded-xl border border-line bg-surface p-3.5 text-[12px] space-y-2">
          <div className="flex justify-between">
            <span className="text-muted">{t('bookings.ownerAdmitModal.connectorLabel', 'Cổng sạc:')}</span>
            <span className="font-semibold text-ink">
              {booking.station?.connectorCode || t('bookings.drawer.connectorDefault', 'Cổng sạc')} ({booking.station?.stationName})
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">{t('bookings.ownerAdmitModal.driverLabel', 'Tài xế:')}</span>
            <span className="font-semibold text-ink">{booking.driverDisplayName}</span>
          </div>
          <div className="flex justify-between border-t border-hairline pt-2 text-brand">
            <span className="font-semibold">{t('bookings.ownerAdmitModal.refundObligationLabel', 'Nghĩa vụ hoàn lại cho khách (100%):')}</span>
            <span className="font-mono font-bold text-[13.5px]">{formatVnd(refundAmount)}</span>
          </div>
        </div>

        {/* Affected At input */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[12.5px] font-semibold text-ink">
              {t('bookings.ownerAdmitModal.affectedAtLabel', 'Thời điểm xảy ra sự cố')} <span className="text-bad">*</span>
            </label>
            <span className="text-[10.5px] font-medium text-faint">
              {t('bookings.ownerAdmitModal.affectedAtHint', 'Không được ở tương lai')}
            </span>
          </div>
          <DateTimeInput
            value={affectedAt}
            onChange={(val) => {
              setAffectedAt(val);
              if (validationError) setValidationError(null);
            }}
            accent="brand"
          />
        </div>

        {/* Reason Textarea */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[12.5px] font-semibold text-ink">
              {t('bookings.ownerAdmitModal.reasonLabel', 'Lý do nhận trách nhiệm')} <span className="text-bad">*</span>
            </label>
            <span className="text-[10.5px] font-medium text-faint">
              {t('bookings.ownerAdmitModal.reasonHint', 'Lưu vết vĩnh viễn')}
            </span>
          </div>

          <textarea
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (validationError) setValidationError(null);
            }}
            placeholder={t(
              'bookings.ownerAdmitModal.reasonPlaceholder',
              'Mô tả nguyên nhân và xác nhận trách nhiệm (ví dụ: Trạm xác nhận mất điện nguồn trong khung giờ khách sạc, đồng ý hoàn 100% gói...)'
            )}
            rows={3}
            disabled={isSubmitting}
            className={`w-full rounded-xl border bg-surface px-3 py-2 text-[12.5px] text-ink placeholder:text-faint transition focus:outline-none focus:ring-2 ${
              validationError
                ? 'border-bad focus:border-bad focus:ring-bad/20'
                : 'border-line focus:border-brand focus:ring-brand/15'
            }`}
          />

          {validationError && (
            <p className="text-[11.5px] font-medium text-bad flex items-center gap-1">
              <IconAlertTriangle size={12} />
              <span>{validationError}</span>
            </p>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 border-t border-hairline pt-3.5">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            {t('bookings.ownerAdmitModal.closeBtn', 'Đóng')}
          </Button>
          <Button
            type="submit"
            variant="primary"
            accent="owner"
            disabled={isSubmitting || !reason.trim()}
          >
            {isSubmitting
              ? t('bookings.ownerAdmitModal.submitting', 'Đang xử lý...')
              : t('bookings.ownerAdmitModal.confirmBtn', 'Xác nhận & Hoàn đủ 100%')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
