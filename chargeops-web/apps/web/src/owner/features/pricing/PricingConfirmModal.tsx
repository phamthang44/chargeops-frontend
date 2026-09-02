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

const DAY_NAMES: Record<string, string> = {
  T2: 'Thứ Hai',
  T3: 'Thứ Ba',
  T4: 'Thứ Tư',
  T5: 'Thứ Năm',
  T6: 'Thứ Sáu',
  T7: 'Thứ Bảy',
  CN: 'Chủ Nhật',
  MONDAY: 'Thứ Hai',
  TUESDAY: 'Thứ Ba',
  WEDNESDAY: 'Thứ Tư',
  THURSDAY: 'Thứ Năm',
  FRIDAY: 'Thứ Sáu',
  SATURDAY: 'Thứ Bảy',
  SUNDAY: 'Chủ Nhật',
};

interface DayDiff {
  dayLabel: string;
  fromText: string;
  toText: string;
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

  const hoursDiffs: DayDiff[] = [];
  if (initialConfig) {
    if (Boolean(initialConfig.open24Hours) !== Boolean(draftConfig.open24Hours)) {
      if (draftConfig.open24Hours) {
        hoursDiffs.push({
          dayLabel: 'Toàn trạm',
          fromText: 'Cấu hình theo ngày',
          toText: 'Mở liên tục 24/7',
        });
      } else {
        hoursDiffs.push({
          dayLabel: 'Toàn trạm',
          fromText: 'Mở 24/7',
          toText: 'Chuyển sang cấu hình theo ngày',
        });
      }
    }

    if (!draftConfig.open24Hours) {
      draftConfig.hours.forEach((draftH) => {
        const initH = initialConfig.hours.find((h) => h.day === draftH.day);
        if (!initH) return;
        const initOpen = Boolean(initH.open24);
        const draftOpen = Boolean(draftH.open24);
        const initTime = `${initH.open || '06:00'} – ${initH.close || '23:00'}`;
        const draftTime = `${draftH.open || '06:00'} – ${draftH.close || '23:00'}`;

        if (initOpen !== draftOpen || (draftOpen && initTime !== draftTime)) {
          hoursDiffs.push({
            dayLabel: DAY_NAMES[draftH.day] ?? draftH.day,
            fromText: initOpen ? initTime : 'Đóng cửa',
            toText: draftOpen ? draftTime : 'Đóng cửa',
          });
        }
      });
    }
  }

  const operatingHoursChanged = hoursDiffs.length > 0;
  const touRulesChanged =
    Boolean(initialConfig) &&
    JSON.stringify(initialConfig?.touRules) !== JSON.stringify(draftConfig.touRules);

  return (
    <Modal open={open} onClose={onClose} maxWidth={540}>
      <div>
        {/* Header */}
        <div className="mb-3.5 flex items-start gap-3 border-b border-hairline pb-3.5">
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

        {/* Effective Time Banner */}
        <div className="mb-3 flex items-center justify-between rounded-[9px] border border-owner-border/70 bg-owner-soft/70 px-3.5 py-2 text-[12.5px] font-medium text-owner-deep">
          <div className="flex items-center gap-2">
            <IconClock size={16} className="text-owner-deep shrink-0" />
            <span>Thời điểm áp dụng:</span>
          </div>
          <span className="font-bold text-ink">Ngay sau khi xác nhận lưu</span>
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

          {/* Operating Hours & Day-by-Day Diffs */}
          <div className="flex flex-col py-1 border-b border-hairline gap-1">
            <div className="flex items-center justify-between">
              <span className="text-muted">Giờ hoạt động hàng tuần:</span>
              <span className={`font-semibold ${operatingHoursChanged ? 'text-owner-deep font-bold' : 'text-ink'}`}>
                {draftConfig.open24Hours
                  ? 'Mở cửa 24/7'
                  : operatingHoursChanged
                    ? `Đã điều chỉnh (${hoursDiffs.length} ngày thay đổi)`
                    : 'Không thay đổi'}
              </span>
            </div>
            {hoursDiffs.length > 0 && (
              <div className="mt-1 flex flex-col gap-1 rounded-[8px] bg-surface p-2.5 border border-hairline text-[11.5px]">
                {hoursDiffs.map((diff, i) => (
                  <div key={i} className="flex items-center justify-between py-0.5">
                    <span className="font-semibold text-ink">{diff.dayLabel}:</span>
                    <div className="flex items-center gap-1.5 font-mono">
                      <span className="text-faint line-through">{diff.fromText}</span>
                      <span className="text-faint">→</span>
                      <span className="font-bold text-owner-deep">{diff.toText}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
              <span className={`font-bold ${touRulesChanged ? 'text-owner-deep font-extrabold' : 'text-ink'}`}>
                {draftConfig.touRules.length} khung giá
                {touRulesChanged && !touCountChanged ? ' · nội dung đã đổi' : ''}
              </span>
            </div>
          </div>

          {/* System Safety Buffer */}
          <div className="flex items-center justify-between py-1 text-faint text-[11.5px]">
            <span>Thời gian giãn ca giữa 2 lượt:</span>
            <span className="font-mono font-medium">{SYSTEM_BOOKING_RULES.TURNAROUND_BUFFER_MINUTES} phút cố định</span>
          </div>
        </div>

        {/* Policy Notice Callout */}
        <div className="mb-5 rounded-[10px] border border-warn-border bg-warn-soft/60 p-3 text-[12px] leading-relaxed text-warn-deep">
          <div className="flex items-center gap-1.5 font-bold text-ink">
            <IconAlertTriangle size={16} className="text-warn shrink-0" />
            <span>Quy định bảo toàn lịch hẹn đã xác nhận</span>
          </div>
          <div className="mt-1 text-muted">
            Cấu hình mới chỉ áp dụng cho các lượt đặt chỗ <b>phát sinh sau thời điểm lưu</b>. Các lịch đặt đã được tài xế xác nhận trước đó vẫn được giữ nguyên vẹn mức giá và khung giờ cam kết ban đầu.
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
              : t('pricing.confirmModal.confirmBtn', { defaultValue: 'Lưu & áp dụng ngay' })}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
