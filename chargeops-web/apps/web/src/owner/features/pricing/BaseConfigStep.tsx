import { useTranslation } from 'react-i18next';
import { SYSTEM_BOOKING_RULES } from '@chargeops/api';
import { IconBolt, IconClock, IconShieldCheck } from '@chargeops/ui';
import { StepHeader } from './StepHeader';

/** Allowed minimum booking durations (Commercial preference chosen by Station Owner: 30 | 60 | 90 mins). */
const MIN_DURATION_PRESETS = [30, 60, 90];

export interface BaseConfigStepProps {
  minBookingDurationMin: number;
  basePriceVnd: number;
  onMinDuration: (min: number) => void;
  onBasePrice: (vnd: number) => void;
}

/** Step 1 — minimum booking duration (commercial preference), default price per kWh, and system scheduling rules. */
export function BaseConfigStep({
  minBookingDurationMin,
  basePriceVnd,
  onMinDuration,
  onBasePrice,
}: BaseConfigStepProps) {
  const { t } = useTranslation('owner');
  return (
    <div>
      <StepHeader n={1} title={t('pricing.steps.step1.title', { defaultValue: 'Cấu hình cơ bản & Thời lượng' })} />
      <div className="rounded-panel border border-line-2 bg-surface p-5 flex flex-col gap-5">
        {/* Section 1: Commercial Minimum Duration (Owner Configurable) */}
        <div>
          <div className="mb-3 flex items-start gap-[11px]">
            <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[9px] bg-owner-soft">
              <IconClock size={18} className="text-owner-deep" />
            </span>
            <div>
              <div className="text-[14px] font-semibold text-ink">
                {t('pricing.steps.step1.groupTitle', { defaultValue: 'Thời lượng đặt tối thiểu (Minimum Duration)' })}
              </div>
              <div className="mt-0.5 text-[12px] text-faint">
                {t('pricing.steps.step1.groupHelp', {
                  defaultValue:
                    'Chủ trạm chọn mức sạc tối thiểu (30 / 60 / 90 phút) để tránh các booking quá ngắn gây lắt nhắt.',
                })}
              </div>
            </div>
          </div>

          <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.07em] text-faint">
            {t('pricing.steps.step1.durationLabel', { defaultValue: 'THỜI LƯỢNG ĐẶT TỐI THIỂU CHO PHÉP' })}
          </div>
          <div className="flex gap-[6px] rounded-[11px] bg-chip p-1">
            {MIN_DURATION_PRESETS.map((m) => {
              const on = m === minBookingDurationMin;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => onMinDuration(m)}
                  className={`flex-1 rounded-lg py-[10px] text-center text-[13.5px] font-semibold transition cursor-pointer ${
                    on
                      ? 'bg-surface text-ink shadow-[0_1px_2px_rgba(16,17,26,.1)] ring-1 ring-line-2'
                      : 'text-faint hover:text-body'
                  }`}
                >
                  {t('pricing.steps.step1.durationVal', { minutes: m, defaultValue: `${m} phút` })}
                </button>
              );
            })}
          </div>

          {/* Dynamic Example Hint */}
          <div className="mt-2.5 rounded-[8px] bg-surface-2 p-2.5 text-[11.5px] leading-relaxed text-muted border border-hairline">
            💡 <b>Quy cách tính giờ linh hoạt:</b> Tài xế chọn giờ bắt đầu bất kỳ (ví dụ <span className="font-mono text-ink">09:51</span>). Với mức tối thiểu <span className="font-semibold text-ink">{minBookingDurationMin} phút</span> và bước nhảy <span className="font-semibold text-ink">{SYSTEM_BOOKING_RULES.DURATION_STEP_MINUTES} phút</span>, ứng dụng đề xuất các gói sạc:{' '}
            <span className="font-mono text-owner-deep font-semibold">
              {minBookingDurationMin}p (đến {minBookingDurationMin === 30 ? '10:21' : minBookingDurationMin === 60 ? '10:51' : '11:21'})
            </span>
            {minBookingDurationMin < 180 && (
              <span className="font-mono text-muted">, {minBookingDurationMin + 30}p, {minBookingDurationMin + 60}p... (tối đa {SYSTEM_BOOKING_RULES.MAX_BOOKING_DURATION_MINUTES}p)</span>
            )}.
          </div>
        </div>

        {/* Section 2: Global System Scheduling Policy (Fixed & Read-only) */}
        <div className="border-t border-hairline pt-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-[0.07em] text-faint">
              QUY TẮC LÊN LỊCH CỐ ĐỊNH TOÀN HỆ THỐNG (SYSTEM POLICY)
            </span>
            <span className="flex items-center gap-1 text-[11px] font-medium text-owner-deep">
              <IconShieldCheck size={13} />
              <span>Tiêu chuẩn vận hành</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="rounded-[9px] border border-line-2 bg-surface-2 p-2.5">
              <div className="text-[10.5px] font-bold text-faint uppercase tracking-wider">Đệm an toàn (Buffer)</div>
              <div className="mt-1 font-mono text-[14px] font-bold text-ink">{SYSTEM_BOOKING_RULES.TURNAROUND_BUFFER_MINUTES} phút</div>
              <div className="mt-0.5 text-[10.5px] text-muted leading-tight">
                Khoảng nghỉ sau mỗi booking để xe trước rút sạc & rời vị trí.
              </div>
            </div>

            <div className="rounded-[9px] border border-line-2 bg-surface-2 p-2.5">
              <div className="text-[10.5px] font-bold text-faint uppercase tracking-wider">Bước nhảy thời lượng (Step)</div>
              <div className="mt-1 font-mono text-[14px] font-bold text-ink">{SYSTEM_BOOKING_RULES.DURATION_STEP_MINUTES} phút</div>
              <div className="mt-0.5 text-[10.5px] text-muted leading-tight">
                Bước tăng thời gian sạc trên ứng dụng đặt chỗ của tài xế.
              </div>
            </div>

            <div className="rounded-[9px] border border-line-2 bg-surface-2 p-2.5">
              <div className="text-[10.5px] font-bold text-faint uppercase tracking-wider">Thời lượng tối đa</div>
              <div className="mt-1 font-mono text-[14px] font-bold text-ink">{SYSTEM_BOOKING_RULES.MAX_BOOKING_DURATION_MINUTES} phút (3h)</div>
              <div className="mt-0.5 text-[10.5px] text-muted leading-tight">
                Giới hạn tối đa cho một phiên đặt chỗ để tránh chiếm dụng trụ.
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Base Price */}
        <div className="border-t border-hairline pt-4">
          <div className="mb-3 flex items-start gap-[11px]">
            <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[9px] bg-owner-soft">
              <IconBolt size={18} className="text-owner-deep" />
            </span>
            <div>
              <div className="text-[14px] font-semibold text-ink">
                {t('pricing.steps.step1.basePriceGroupTitle', { defaultValue: 'Giá sạc mặc định (Base Price)' })}
              </div>
              <div className="mt-0.5 text-[12px] text-faint">
                {t('pricing.steps.step1.basePriceHelp', {
                  defaultValue: 'Mức giá áp dụng cho mọi khung giờ không nằm trong quy tắc giá cao điểm/thấp điểm riêng bên dưới.',
                })}
              </div>
            </div>
          </div>

          <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.07em] text-faint">
            {t('pricing.steps.step1.basePriceLabel', { defaultValue: 'GIÁ SẠC MẶC ĐỊNH' })}
          </div>
          <div className="flex h-[48px] items-center gap-[11px] rounded-[11px] border border-line px-3.5 bg-surface">
            <span className="font-mono text-[16px] font-semibold text-faint">₫</span>
            <input
              value={basePriceVnd}
              onChange={(e) => onBasePrice(Number(e.target.value.replace(/\D/g, '')) || 0)}
              className="min-w-0 flex-1 border-none bg-transparent font-mono text-[17px] font-semibold text-ink outline-none"
              placeholder="3400"
            />
            <span className="font-mono text-[11px] font-medium text-faint">/kWh</span>
            <span className="shrink-0 rounded-full bg-owner-soft px-[11px] py-1 text-[10.5px] font-semibold text-owner-deep">
              {t('pricing.steps.step1.basePriceSub', { defaultValue: 'Giá gốc' })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
