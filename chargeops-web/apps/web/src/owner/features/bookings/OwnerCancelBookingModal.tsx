import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import {
  Button,
  IconAlertTriangle,
  IconInfoCircle,
  IconShieldAlert,
  IconX,
  Modal,
  useToast,
} from '@chargeops/ui';
import {
  BOOKING_STATUS,
  formatVnd,
  useApi,
  type OwnerBookingDetail,
  type OwnerStationFailureContext,
} from '@chargeops/api';

export interface OwnerCancelBookingModalProps {
  open: boolean;
  onClose: () => void;
  booking: OwnerBookingDetail | null;
  context?: OwnerStationFailureContext | null;
  onSuccess?: () => void;
}

export function OwnerCancelBookingModal({
  open,
  onClose,
  booking,
  context,
  onSuccess,
}: OwnerCancelBookingModalProps) {
  const { t } = useTranslation('owner');
  const api = useApi();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!booking) return null;

  const isPaid =
    booking.payment?.status === 'PAID' ||
    (booking.totalAmount > 0 && booking.status === 'CONFIRMED');

  const refundAmount = context?.eligibleRefundAmountVnd ?? (isPaid ? booking.totalAmount : 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanReason = reason.trim();
    if (cleanReason.length < 5) {
      setValidationError(
        t('bookings.ownerCancelModal.reasonRequired', 'Vui lòng cung cấp lý do cụ thể (tối thiểu 5 ký tự).')
      );
      return;
    }
    if (cleanReason.length > 2000) {
      setValidationError(
        t('bookings.ownerCancelModal.reasonTooLong', 'Lý do không được vượt quá 2000 ký tự.')
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

      await api.ownerBookings.cancelForStationFailure(
        booking.bookingId,
        {
          expectedVersion: currentVersion,
          reason: cleanReason,
        },
        idempotencyKey
      );

      toast(
        t('bookings.ownerCancelModal.successToast', 'Đã hủy đặt chỗ do sự cố trạm thành công!'),
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
        t('bookings.ownerCancelModal.genericError', 'Có lỗi xảy ra khi thực hiện hủy đặt chỗ.');
      if (err?.code === 'VERSION_CONFLICT' || message.includes('VERSION_CONFLICT')) {
        toast(
          t(
            'bookings.ownerCancelModal.versionConflict',
            'Dữ liệu đặt chỗ đã thay đổi trên máy chủ. Đang tải lại thông tin mới nhất...'
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
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-bad-border bg-bad-soft text-bad">
              <IconShieldAlert size={20} strokeWidth={2.2} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[15px] font-bold tracking-tight text-ink">
                  {t('bookings.ownerCancelModal.title', 'Hủy đặt chỗ do sự cố trạm (BKG-056)')}
                </h3>
              </div>
              <p className="mt-0.5 text-[11.5px] text-muted">
                {t('bookings.ownerCancelModal.codeVersionSub', 'Mã: #{{code}} · Phiên bản: v{{version}}', {
                  code: booking.bookingCode || booking.bookingId,
                  version: booking.version,
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

        {/* Operational Warning Context */}
        <div
          className={`flex items-start gap-2.5 rounded-xl border p-3 text-[11.5px] leading-relaxed ${
            isPaid
              ? 'border-bad-border bg-bad-soft text-bad-deep'
              : 'border-line-2 bg-surface-2 text-muted'
          }`}
        >
          <IconAlertTriangle
            size={16}
            className={`mt-0.5 shrink-0 ${isPaid ? 'text-bad' : 'text-faint'}`}
          />
          <div>
            <div className="font-semibold mb-0.5">
              {isPaid
                ? t('bookings.ownerCancelModal.paidTitle', 'Đã thu tiền gói sạc — Tự động hoàn 100%')
                : t('bookings.ownerCancelModal.unpaidTitle', 'Đặt chỗ chưa thanh toán')}
            </div>
            <p>
              {isPaid
                ? t(
                    'bookings.ownerCancelModal.paidWarning',
                    `Khoản thu sẽ được lập tức xác lập nghĩa vụ hoàn đủ 100% giá gói (${formatVnd(
                      refundAmount
                    )}) vào tài khoản mô phỏng của tài xế. Cổng sạc sẽ được giải phóng.`
                  )
                : t(
                    'bookings.ownerCancelModal.unpaidWarning',
                    'Đặt chỗ chưa áp dụng khoản thu. Khi xác nhận, đặt chỗ sẽ kết thúc và giải phóng cổng sạc mà không phát sinh hoàn tiền.'
                  )}
            </p>
          </div>
        </div>

        {/* Booking Snapshot Breakdown */}
        <div className="rounded-xl border border-line bg-surface p-3.5 text-[12px] space-y-2">
          <div className="flex justify-between">
            <span className="text-muted">{t('bookings.ownerCancelModal.connectorLabel', 'Cổng sạc:')}</span>
            <span className="font-semibold text-ink">
              {booking.station?.connectorCode || t('bookings.drawer.connectorDefault', 'Cổng sạc')} ({booking.station?.stationName})
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">{t('bookings.ownerCancelModal.driverLabel', 'Tài xế:')}</span>
            <span className="font-semibold text-ink">{booking.driverDisplayName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">{t('bookings.ownerCancelModal.statusLabel', 'Trạng thái đặt chỗ:')}</span>
            <span className="font-semibold text-ink">
              {t(`bookings.status.${booking.status}`, { defaultValue: BOOKING_STATUS[booking.status]?.label ?? booking.status })}
            </span>
          </div>
          <div className="flex justify-between border-t border-hairline pt-2">
            <span className="text-muted">{t('bookings.ownerCancelModal.totalAmountLabel', 'Tổng tiền gói sạc:')}</span>
            <span className="font-mono font-bold text-ink">{formatVnd(booking.totalAmount)}</span>
          </div>
          {isPaid && (
            <div className="flex justify-between text-bad">
              <span className="font-semibold">{t('bookings.ownerCancelModal.refundObligationLabel', 'Nghĩa vụ hoàn lại cho khách (100%):')}</span>
              <span className="font-mono font-bold text-[13px]">{formatVnd(refundAmount)}</span>
            </div>
          )}
        </div>

        {/* Mandatory Reason Input */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[12.5px] font-semibold text-ink">
              {t('bookings.ownerCancelModal.reasonLabel', 'Lý do trạm không thể phục vụ')} <span className="text-bad">*</span>
            </label>
            <span className="text-[10.5px] font-medium text-faint">
              {t('bookings.ownerCancelModal.reasonHint', 'Biên bản lưu vết')}
            </span>
          </div>

          <textarea
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (validationError) setValidationError(null);
            }}
            placeholder={t(
              'bookings.ownerCancelModal.reasonPlaceholder',
              'Mô tả chi tiết sự cố trạm/trụ/cổng (ví dụ: Mất điện lưới toàn trạm, cổng sạc lỗi mạch bảo vệ, nguy cơ an toàn... Không ghi thông tin mật).'
            )}
            rows={3}
            disabled={isSubmitting}
            className={`w-full rounded-xl border bg-surface px-3 py-2 text-[12.5px] text-ink placeholder:text-faint transition focus:outline-none focus:ring-2 ${
              validationError
                ? 'border-bad focus:border-bad focus:ring-bad/20'
                : 'border-line focus:border-bad focus:ring-bad/15'
            }`}
          />

          {validationError && (
            <p className="text-[11.5px] font-medium text-bad flex items-center gap-1">
              <IconAlertTriangle size={12} />
              <span>{validationError}</span>
            </p>
          )}

          <div className="flex items-start gap-1.5 text-[11px] text-faint">
            <IconInfoCircle size={13} className="shrink-0 mt-0.5" />
            <span>
              {t(
                'bookings.ownerCancelModal.publicAuditNote',
                'Lý do này sẽ được lưu trữ vĩnh viễn và hiển thị công khai tới tài xế để đối chiếu.'
              )}
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 border-t border-hairline pt-3.5">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            {t('bookings.ownerCancelModal.closeBtn', 'Đóng')}
          </Button>
          <Button
            type="submit"
            variant="danger"
            disabled={isSubmitting || !reason.trim()}
          >
            {isSubmitting
              ? t('bookings.ownerCancelModal.submitting', 'Đang xử lý...')
              : t('bookings.ownerCancelModal.confirmBtn', 'Xác nhận hủy do sự cố trạm')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
