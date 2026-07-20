import type { ReactNode } from 'react';
import type { AvailabilityRules } from '@chargeops/api';
import { IconCalendar, IconShieldCheck, Toggle } from '@chargeops/ui';
import { StepHeader } from './StepHeader';

export interface AvailabilityStepProps {
  rules: AvailabilityRules;
  onChange: (patch: Partial<AvailabilityRules>) => void;
}

/** Step 4 — auto-lock, max advance booking, night discount. */
export function AvailabilityStep({ rules, onChange }: AvailabilityStepProps) {
  return (
    <div>
      <StepHeader n={4} title="Quy tắc khả dụng" />
      <div className="rounded-panel border border-line-2 bg-white px-5 pb-[18px] pt-1.5">
        <Row
          title="Tự động khoá slot"
          desc="Khoá slot sau 15 phút nếu khách không check-in."
          control={<Toggle checked={rules.autoLock} onChange={(v) => onChange({ autoLock: v })} />}
        />
        <Row
          title="Cho phép đặt trước tối đa"
          desc="Thời gian khách có thể đặt slot trước."
          control={
            <span className="flex items-center gap-[7px] rounded-[9px] border border-line px-[13px] py-2 text-[12.5px] font-semibold text-ink">
              <IconCalendar size={14} className="text-faint" />
              {rules.maxAdvanceDays} ngày
            </span>
          }
        />
        <Row
          title="Giá ưu tiên sạc đêm"
          desc="Giảm 10% cho khung giờ 00:00 – 05:00."
          last
          control={<Toggle checked={rules.nightDiscount} onChange={(v) => onChange({ nightDiscount: v })} />}
        />

        <div className="mt-3.5 flex items-center gap-[11px] rounded-card border border-owner-border bg-owner-soft px-4 py-[13px]">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-owner">
            <IconShieldCheck size={15} className="text-white" strokeWidth={2.6} />
          </span>
          <div>
            <div className="text-[12.5px] font-semibold text-owner-deep">Cấu hình hợp lệ</div>
            <div className="text-[11.5px] text-[#3f6b4f]">
              Tất cả khung giờ đã được kiểm tra không trùng lặp.
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
        <div className="text-[13.5px] font-semibold">{title}</div>
        <div className="mt-0.5 text-[11.5px] text-faint">{desc}</div>
      </div>
      {control}
    </div>
  );
}
