import { useTranslation } from 'react-i18next';
import { formatVnd, SYSTEM_BOOKING_RULES, type PricingConfig } from '@chargeops/api';
import { Button, IconAlertTriangle, IconCheck, IconClock, Modal } from '@chargeops/ui';

export interface PricingConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isSaving: boolean;
  initialConfig: PricingConfig | null;
  draftConfig: PricingConfig | null;
}

export function PricingConfirmModal({
  open,
  onClose,
  onConfirm,
  isSaving,
  initialConfig,
  draftConfig,
}: PricingConfirmModalProps) {
  const { t } = useTranslation('owner');
  if (!draftConfig) return null;

  const basePriceChanged = initialConfig && initialConfig.basePriceVnd !== draftConfig.basePriceVnd;
  const minDurationChanged = initialConfig && initialConfig.minBookingDurationMin !== draftConfig.minBookingDurationMin;
  const touCountChanged = initialConfig && initialConfig.touRules.length !== draftConfig.touRules.length;

  return (
    <Modal open={open} onClose={onClose} maxWidth={520}>
      <div>
        {/* Header */}
        <div className="mb-4 flex items-start gap-3 border-b border-hairline pb-3.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-owner-soft">
            <IconClock size={20} className="text-owner-deep" />
          </span>
          <div>
            <div className="text-[17px] font-bold text-ink">
              {t('pricing.confirmModal.title', { defaultValue: 'Xác nhận thay đổi Giá & Giờ hoạt động' })}
            </div>
            <div className="mt-0.5 text-[12px] text-muted">
              {t('pricing.confirmModal.subtitle', {
                defaultValue: 'Vui lòng kiểm tra lại các thông số cấu hình trước khi áp dụng cho trạm sạc.',
              })}
            </div>
          </div>
        </div>

        {/* Change Comparison Summary */}
        <div className="mb-4 flex flex-col gap-2 rounded-[11px] border border-line-2 bg-surface-2 p-3.5 text-[12.5px]">
          <div className="text-[11px] font-bold uppercase tracking-[0.05em] text-faint mb-1">
            Tóm tắt các thông số điều chỉnh
          </div>

          {/* Base Price */}
          <div className="flex items-center justify-between py-1 border-b border-hairline">
            <span className="text-muted">Giá sạc gốc / kWh:</span>
            <div className="flex items-center gap-1.5 font-mono">
              {initialConfig && basePriceChanged && (
                <>
                  <span className="text-faint line-through">{formatVnd(initialConfig.basePriceVnd)}</span>
                  <span className="text-faint">→</span>
                </>
              )}
              <span className={`font-bold ${basePriceChanged ? 'text-owner-deep font-extrabold' : 'text-ink'}`}>
                {formatVnd(draftConfig.basePriceVnd)}
              </span>
            </div>
          </div>

          {/* Min Duration */}
          <div className="flex items-center justify-between py-1 border-b border-hairline">
            <span className="text-muted">Thời lượng đặt tối thiểu (Thương mại):</span>
            <div className="flex items-center gap-1.5 font-mono">
              {initialConfig && minDurationChanged && (
                <>
                  <span className="text-faint line-through">{initialConfig.minBookingDurationMin} phút</span>
                  <span className="text-faint">→</span>
                </>
              )}
              <span className={`font-bold ${minDurationChanged ? 'text-owner-deep font-extrabold' : 'text-ink'}`}>
                {draftConfig.minBookingDurationMin} phút
              </span>
            </div>
          </div>

          {/* TOU Rules count */}
          <div className="flex items-center justify-between py-1 border-b border-hairline">
            <span className="text-muted">Số khung giá theo giờ (TOU):</span>
            <div className="flex items-center gap-1.5 font-mono">
              {initialConfig && touCountChanged && (
                <>
                  <span className="text-faint line-through">{initialConfig.touRules.length} khung</span>
                  <span className="text-faint">→</span>
                </>
              )}
              <span className={`font-bold ${touCountChanged ? 'text-owner-deep font-extrabold' : 'text-ink'}`}>
                {draftConfig.touRules.length} khung giá
              </span>
            </div>
          </div>

          {/* System Safety Buffer */}
          <div className="flex items-center justify-between py-1 text-faint text-[11.5px]">
            <span>Đệm an toàn giữa 2 lượt (System Buffer):</span>
            <span className="font-mono font-medium">{SYSTEM_BOOKING_RULES.TURNAROUND_BUFFER_MINUTES} phút cố định</span>
          </div>
        </div>

        {/* Policy Notice Callout */}
        <div className="mb-5 rounded-[10px] border border-warn-border bg-warn-soft/60 p-3 text-[12px] leading-relaxed text-warn-deep">
          <div className="flex items-center gap-1.5 font-bold text-ink">
            <IconAlertTriangle size={16} className="text-warn shrink-0" />
            <span>Quy định bảo toàn lịch hẹn (Booking Stability Policy)</span>
          </div>
          <div className="mt-1 text-muted">
            Cấu hình mới chỉ áp dụng cho các lượt đặt chỗ <b>phát sinh sau thời điểm lưu</b>. Các booking đã được tài xế xác nhận trước đó vẫn được giữ nguyên vẹn mức giá và cam kết lịch hẹn ban đầu.
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5">
          <Button variant="secondary" size="md" onClick={onClose} disabled={isSaving}>
            {t('pricing.confirmModal.cancelBtn', { defaultValue: 'Tiếp tục chỉnh sửa' })}
          </Button>
          <Button
            accent="owner"
            size="md"
            onClick={onConfirm}
            disabled={isSaving}
            icon={<IconCheck size={16} strokeWidth={2.4} />}
          >
            {isSaving
              ? t('pricing.saving', { defaultValue: 'Đang lưu…' })
              : t('pricing.confirmModal.confirmBtn', { defaultValue: 'Xác nhận & Áp dụng' })}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
