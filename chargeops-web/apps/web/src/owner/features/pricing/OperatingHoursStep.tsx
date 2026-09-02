import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatDateTimeVn, type OperatingHour } from '@chargeops/api';
import { IconClock, IconCopy, Toggle, TimeSelect } from '@chargeops/ui';
import { StepHeader } from './StepHeader';
import { Open247WarningModal } from './Open247WarningModal';

export interface OperatingHoursStepProps {
  hours: OperatingHour[];
  isOpen247: boolean;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  scheduleStatus?: string | null;
  onToggleDay: (day: string) => void;
  onChangeTime: (day: string, field: 'open' | 'close', value: string) => void;
  onSet247: () => void;
  onCopyMondayToAll?: () => void;
  onOpenHistory?: () => void;
}

const DAY_LABELS: Record<string, { full: string; short: string; isWeekend?: boolean }> = {
  T2: { full: 'Thứ Hai', short: 'T2' },
  T3: { full: 'Thứ Ba', short: 'T3' },
  T4: { full: 'Thứ Tư', short: 'T4' },
  T5: { full: 'Thứ Năm', short: 'T5' },
  T6: { full: 'Thứ Sáu', short: 'T6' },
  T7: { full: 'Thứ Bảy', short: 'T7', isWeekend: true },
  CN: { full: 'Chủ Nhật', short: 'CN', isWeekend: true },
  MONDAY: { full: 'Thứ Hai', short: 'T2' },
  TUESDAY: { full: 'Thứ Ba', short: 'T3' },
  WEDNESDAY: { full: 'Thứ Tư', short: 'T4' },
  THURSDAY: { full: 'Thứ Năm', short: 'T5' },
  FRIDAY: { full: 'Thứ Sáu', short: 'T6' },
  SATURDAY: { full: 'Thứ Bảy', short: 'T7', isWeekend: true },
  SUNDAY: { full: 'Chủ Nhật', short: 'CN', isWeekend: true },
};

/**
 * Step 2 — Per-day operating windows with custom time pickers, 24/7 presets,
 * and smart batch copy actions.
 */
export function OperatingHoursStep({
  hours,
  isOpen247,
  effectiveFrom,
  scheduleStatus,
  onToggleDay,
  onChangeTime,
  onSet247,
  onCopyMondayToAll,
  onOpenHistory,
}: OperatingHoursStepProps) {
  const { t } = useTranslation('owner');
  const [warningModalOpen, setWarningModalOpen] = useState(false);

  const openDaysCount = hours.filter((h) => h.open24).length;

  const handleToggle247 = () => {
    if (isOpen247) {
      // Đang 24/7 tắt đi thì không cần cảnh báo
      onSet247();
    } else {
      // Bật 24/7 thì mở modal cảnh báo cam kết
      setWarningModalOpen(true);
    }
  };

  return (
    <div>
      <StepHeader
        n={2}
        title={t('pricing.steps.step2.title', { defaultValue: 'Giờ hoạt động hàng tuần' })}
        action={
          <div className="flex items-center gap-2">
            {onOpenHistory && (
              <button
                type="button"
                onClick={onOpenHistory}
                className="flex items-center gap-1.5 rounded-[7px] border border-line bg-surface px-2.5 py-1 text-[11.5px] font-medium text-body transition hover:border-line-hover hover:bg-surface-2 cursor-pointer"
                title={t('pricing.steps.step2.historyTooltip', { defaultValue: 'Xem nhật ký các phiên bản giờ mở/đóng đã áp dụng' })}
              >
                <IconClock size={12} className="text-owner-deep" />
                <span>{t('pricing.steps.step2.viewHistory', { defaultValue: 'Xem lịch sử thay đổi' })}</span>
              </button>
            )}
            {!isOpen247 && onCopyMondayToAll && (
              <button
                type="button"
                onClick={onCopyMondayToAll}
                className="flex items-center gap-1 rounded-[7px] border border-line bg-surface px-2.5 py-1 text-[11.5px] font-medium text-body transition hover:border-line-hover hover:bg-surface-2 cursor-pointer"
                title={t('pricing.steps.step2.copyMondayTooltip', { defaultValue: 'Sao chép khung giờ Thứ 2 cho tất cả các ngày khác' })}
              >
                <IconCopy size={12} className="text-muted" />
                <span>{t('pricing.steps.step2.copyMonday', { defaultValue: 'Sao chép T2 cho cả tuần' })}</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleToggle247}
              className={`flex items-center gap-1.5 rounded-[7px] px-2.5 py-1 text-[12px] font-semibold transition cursor-pointer ${
                isOpen247
                  ? 'border border-owner-border bg-owner-soft text-owner-deep ring-1 ring-owner/20'
                  : 'border border-line bg-surface text-owner hover:border-owner/40 hover:bg-owner-soft/40'
              }`}
            >
              <IconClock size={13} strokeWidth={2.2} />
              <span>
                {isOpen247
                  ? t('pricing.steps.step2.is247', { defaultValue: '✓ Đang mở 24/7' })
                  : t('pricing.steps.step2.toggle247', { defaultValue: 'Đặt mở 24/7' })}
              </span>
            </button>
          </div>
        }
      />

      <div className="rounded-panel border border-line-2 bg-surface p-5 flex flex-col gap-3.5">
        {/* Effective Version Status & Reassurance Policies */}
        <div className="flex flex-col gap-2 rounded-[10px] border border-line-2 bg-surface-2/70 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11.5px] font-bold text-emerald-600 border border-emerald-500/25">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {t('pricing.steps.step2.activeSchedule', { defaultValue: 'Đang áp dụng' })}
              </span>
              {effectiveFrom ? (
                <span className="inline-flex items-center gap-1 text-[12px] text-muted font-mono">
                  {t('pricing.steps.step2.effectiveFrom', { defaultValue: 'Có hiệu lực từ:' })}{' '}
                  <strong className="text-ink font-semibold">{formatDateTimeVn(effectiveFrom)}</strong>
                </span>
              ) : (
                <span className="text-[12px] text-muted italic">
                  {t('pricing.steps.step2.defaultSchedule', { defaultValue: 'Đang áp dụng lịch mặc định hệ thống' })}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1 border-t border-hairline pt-2 text-[11.5px] leading-relaxed text-muted">
            <div className="flex items-center gap-1.5 text-ink font-medium">
              <span className="text-owner-deep shrink-0 font-bold">⚡</span>
              <span>{t('pricing.steps.step2.effectiveImmediately', { defaultValue: 'Các thay đổi sẽ có hiệu lực ngay sau khi bạn xác nhận lưu.' })}</span>
            </div>
            <div className="flex items-center gap-1.5 text-faint">
              <span className="text-muted shrink-0">🛡️</span>
              <span>{t('pricing.steps.step2.keepExistingBookings', { defaultValue: 'Các lịch đặt đã được xác nhận trước đó vẫn giữ nguyên vẹn khung giờ và mức giá cam kết.' })}</span>
            </div>
          </div>
        </div>

        {/* Subheader info bar */}
        <div className="flex items-center justify-between border-b border-hairline pb-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-faint">
          <div className="w-[110px]">Ngày trong tuần</div>
          <div className="flex-1 grid grid-cols-2 gap-3 text-center">
            <span>Giờ mở cửa</span>
            <span>Giờ đóng cửa</span>
          </div>
          <div className="w-[50px] text-right">Mở cửa</div>
        </div>

        {/* List of 7 days */}
        <div className="flex flex-col divide-y divide-hairline">
          {hours.map((h) => {
            const dayInfo = DAY_LABELS[h.day] ?? { full: h.day, short: h.day };
            const isClosed = !h.open24;

            return (
              <div
                key={h.day}
                className="flex items-center justify-between gap-3 py-2.5 transition hover:bg-surface-2/60 px-1 rounded-lg"
              >
                {/* Day label */}
                <div className="w-[110px] shrink-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[13.5px] font-semibold text-ink">{dayInfo.full}</span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-mono font-bold ${
                        dayInfo.isWeekend
                          ? 'bg-warn-soft text-warn-deep'
                          : 'bg-chip text-muted'
                      }`}
                    >
                      {dayInfo.short}
                    </span>
                  </div>
                </div>

                {/* Time inputs or Closed / 24-7 banner */}
                <div className="flex-1 min-w-0">
                  {isOpen247 ? (
                    <div className="flex h-[36px] items-center justify-center gap-2 rounded-[9px] border border-owner-border bg-owner-soft/80 px-3 text-center font-mono text-[12.5px] font-bold text-owner-deep shadow-2xs">
                      <IconClock size={14} className="text-owner-deep" />
                      <span>Mở liên tục 24/7 (00:00 – 24:00)</span>
                    </div>
                  ) : isClosed ? (
                    <div className="flex h-[36px] items-center justify-center gap-1.5 rounded-[9px] border border-line-2 bg-chip/80 px-3 text-center text-[12px] font-medium text-faint">
                      <span>Đóng cửa (Nghỉ phục vụ)</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 items-center gap-3">
                      <TimeSelect
                        value={h.open || '06:00'}
                        onChange={(val) => onChangeTime(h.day, 'open', val)}
                        stepMinutes={30}
                        accent="owner"
                        aria-label={`Giờ mở cửa ${dayInfo.full}`}
                      />
                      <TimeSelect
                        value={h.close || '23:00'}
                        onChange={(val) => onChangeTime(h.day, 'close', val)}
                        stepMinutes={30}
                        accent="owner"
                        aria-label={`Giờ đóng cửa ${dayInfo.full}`}
                      />
                    </div>
                  )}
                </div>

                {/* Toggle Day */}
                <div className="w-[50px] shrink-0 flex justify-end">
                  <Toggle
                    checked={h.open24}
                    onChange={() => {
                      if (!isOpen247) onToggleDay(h.day);
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer helper note */}
        <div className="mt-1 flex items-start gap-2 rounded-[8px] bg-surface-2 p-2.5 text-[11.5px] leading-relaxed text-muted border border-hairline">
          <span className="shrink-0 text-base leading-none">💡</span>
          <div>
            <b>Quy cách giờ đóng mở:</b> Trạm đang mở{' '}
            <span className="font-semibold text-ink">
              {isOpen247 ? '7/7 ngày (24/7)' : `${openDaysCount}/7 ngày`}
            </span>
            . Nếu giờ đóng cửa nhỏ hơn giờ mở cửa (ví dụ{' '}
            <span className="font-mono text-ink font-semibold">22:00 – 02:00</span>
            ), hệ thống tự động hiểu là trạm mở xuyên qua nửa đêm sang sáng hôm sau.
          </div>
        </div>
      </div>

      {/* Confirmation Warning Modal when activating 24/7 */}
      <Open247WarningModal
        open={warningModalOpen}
        onClose={() => setWarningModalOpen(false)}
        onConfirm={onSet247}
      />
    </div>
  );
}
