import { useTranslation } from 'react-i18next';
import type { ReactNode } from 'react';
import type { AvailabilityRules } from '@chargeops/api';
import { SYSTEM_BOOKING_RULES } from '@chargeops/api';
import { IconAlertTriangle, IconCalendar, IconClock, IconShieldCheck } from '@chargeops/ui';
import { StepHeader } from './StepHeader';

export interface AvailabilityStepProps {
  rules?: AvailabilityRules;
  onChange?: (patch: Partial<AvailabilityRules>) => void;
}

/** Step 4 — System-wide availability & operational standards. */
export function AvailabilityStep({}: AvailabilityStepProps) {
  const { t } = useTranslation('owner');
  return (
    <div>
      <StepHeader n={4} title={t('pricing.steps.step4.title', { defaultValue: 'Quy chuẩn Khả dụng & Vận hành' })} />
      <div className="rounded-panel border border-line-2 bg-surface px-5 pb-[18px] pt-2 flex flex-col gap-1">
        {/* Row 1: No-Show Auto-Release */}
        <Row
          title={t('pricing.steps.step4.lockTitle', { defaultValue: 'Tự động hủy khi quá giờ hẹn (Không đến nhận chỗ)' })}
          desc={t('pricing.steps.step4.lockDesc', {
            defaultValue: `Hệ thống tự động hủy giữ chỗ và giải phóng cổng sạc sau ${SYSTEM_BOOKING_RULES.NO_SHOW_AUTO_LOCK_MINUTES} phút nếu tài xế không thực hiện check-in đúng giờ.`,
          })}
          control={
            <span className="flex items-center gap-1.5 rounded-[9px] border border-line px-3 py-1.5 text-[12px] font-semibold text-owner-deep bg-owner-soft font-mono">
              <IconShieldCheck size={14} className="text-owner-deep" />
              <span>{SYSTEM_BOOKING_RULES.NO_SHOW_AUTO_LOCK_MINUTES} phút (Bắt buộc)</span>
            </span>
          }
        />

        {/* Row 2: Short-term Horizon */}
        <Row
          title={t('pricing.steps.step4.advanceTitle', { defaultValue: 'Khung thời gian mở đặt trước' })}
          desc={t('pricing.steps.step4.advanceDesc', {
            defaultValue: 'Chỉ mở nhận đặt chỗ cho Hôm nay và Ngày mai (~48 giờ) để bảo đảm lịch hẹn luôn chuẩn xác và không bị treo slot.',
          })}
          control={
            <span className="flex items-center gap-1.5 rounded-[9px] border border-line px-3 py-1.5 text-[12px] font-semibold text-ink bg-surface-2 font-mono">
              <IconCalendar size={14} className="text-faint" />
              <span>{SYSTEM_BOOKING_RULES.MAX_ADVANCE_BOOKING_DAYS} ngày (Hôm nay & Ngày mai)</span>
            </span>
          }
        />

        {/* Row 3: Turnaround Buffer */}
        <Row
          title="Thời gian giãn ca giữa 2 lượt sạc"
          desc="Khoảng nghỉ cố định bắt buộc sau mỗi lượt sạc để xe trước rút sạc, di chuyển ra khỏi vị trí an toàn trước khi lượt kế tiếp bắt đầu."
          control={
            <span className="flex items-center gap-1.5 rounded-[9px] border border-line px-3 py-1.5 text-[12px] font-semibold text-ink bg-surface-2 font-mono">
              <IconClock size={14} className="text-faint" />
              <span>{SYSTEM_BOOKING_RULES.TURNAROUND_BUFFER_MINUTES} phút cố định</span>
            </span>
          }
          last
        />

        {/* Operational Philosophy Box */}
        <div className="mt-3.5 rounded-[10px] border border-brand/20 bg-brand-soft/25 p-3.5 text-[12px] leading-relaxed text-body">
          <div className="flex items-center gap-1.5 font-bold text-brand-strong mb-1">
            <IconAlertTriangle size={15} className="text-brand shrink-0" />
            <span>Nguyên tắc vận hành cốt lõi: Lịch đặt chỗ & Lượt sạc thực tế</span>
          </div>
          <div className="text-muted flex flex-col gap-1.5 mt-1.5">
            <div>
              • <b>Lịch đặt chỗ là cam kết:</b> Quyền sử dụng theo khung giờ đã chốt với tài xế. Xe trước sạc xong sớm không tự ý đẩy lịch của người sau lên sớm hơn mà tạo thêm khoảng nghỉ an toàn.
            </div>
            <div>
              • <b>10 phút giãn ca là thời gian đổi xe:</b> Đảm bảo xe trước rút sạc và lái ra khỏi vị trí an toàn trước khi xe sau tiến vào.
            </div>
            <div>
              • <b>Tài xế đỗ xe quá giờ hẹn:</b> Hệ thống tính phí phạt đỗ quá giờ riêng, <b>tuyệt đối không tự ý dời hay đè lịch</b> của lượt đặt chỗ tiếp theo.
            </div>
            <div>
              • <b>Lịch hoạt động áp dụng cho lượt đặt mới:</b> Cấu hình mới chỉ áp dụng cho các lượt đặt chỗ phát sinh sau thời điểm lưu; các lịch đặt đã xác nhận trước đó vẫn giữ nguyên vẹn thời gian và mức giá ban đầu.
            </div>
          </div>
        </div>

        {/* Valid Config Badge */}
        <div className="mt-3 flex items-center gap-[11px] rounded-card border border-owner-border bg-owner-soft px-4 py-[13px]">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-owner">
            <IconShieldCheck size={15} className="text-white" strokeWidth={2.6} />
          </span>
          <div>
            <div className="text-[12.5px] font-semibold text-owner-deep">
              {t('pricing.steps.step4.validConfig', { defaultValue: 'Cấu hình khả dụng chuẩn hóa toàn sàn' })}
            </div>
            <div className="text-[11.5px] text-owner-deep">
              {t('pricing.steps.step4.validConfigHelp', {
                defaultValue: 'Toàn bộ quy chuẩn vận hành được đồng bộ nhất quán theo tiêu chuẩn SLA của nền tảng ChargeOps.',
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({
  title,
  desc,
  control,
  last,
}: {
  title: string;
  desc: string;
  control: ReactNode;
  last?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-3.5 py-3.5 ${last ? '' : 'border-b border-hairline'}`}
    >
      <div>
        <div className="text-[13.5px] font-semibold text-ink">{title}</div>
        <div className="mt-0.5 text-[11.5px] text-faint">{desc}</div>
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  );
}
