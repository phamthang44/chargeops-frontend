import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('owner');
  return (
    <div>
      <StepHeader n={4} title={t('pricing.steps.step4.title')} />
      <div className="rounded-panel border border-line-2 bg-surface px-5 pb-[18px] pt-1.5">
        <Row
          title={t('pricing.steps.step4.lockTitle')}
          desc={t('pricing.steps.step4.lockDesc')}
          control={<Toggle checked={rules.autoLock} onChange={(v) => onChange({ autoLock: v })} />}
        />
        <Row
          title={t('pricing.steps.step4.advanceTitle')}
          desc={t('pricing.steps.step4.advanceDesc')}
          control={
            <span className="flex items-center gap-[7px] rounded-[9px] border border-line px-[13px] py-2 text-[12.5px] font-semibold text-ink">
              <IconCalendar size={14} className="text-faint" />
              {t('pricing.steps.step4.advanceDays', { days: rules.maxAdvanceDays })}
            </span>
          }
        />
        <Row
          title={t('pricing.steps.step4.nightTitle')}
          desc={t('pricing.steps.step4.nightDesc')}
          last
          control={<Toggle checked={rules.nightDiscount} onChange={(v) => onChange({ nightDiscount: v })} />}
        />

        <div className="mt-3.5 flex items-center gap-[11px] rounded-card border border-owner-border bg-owner-soft px-4 py-[13px]">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-owner">
            <IconShieldCheck size={15} className="text-white" strokeWidth={2.6} />
          </span>
          <div>
            <div className="text-[12.5px] font-semibold text-owner-deep">{t('pricing.steps.step4.validConfig')}</div>
            <div className="text-[11.5px] text-owner-deep">
              {t('pricing.steps.step4.validConfigHelp')}
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
