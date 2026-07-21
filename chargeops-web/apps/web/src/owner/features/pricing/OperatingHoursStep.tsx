import { useTranslation } from 'react-i18next';
import type { OperatingHour } from '@chargeops/api';
import { IconClock, Toggle } from '@chargeops/ui';
import { StepHeader } from './StepHeader';

export interface OperatingHoursStepProps {
  hours: OperatingHour[];
  onToggleDay: (day: string) => void;
  onSet247: () => void;
}

/** Step 2 — per-day open/close windows with an open/closed toggle. */
export function OperatingHoursStep({ hours, onToggleDay, onSet247 }: OperatingHoursStepProps) {
  const { t } = useTranslation('owner');
  return (
    <div>
      <StepHeader
        n={2}
        title={t('pricing.steps.step2.title')}
        action={
          <button
            onClick={onSet247}
            className="flex items-center gap-[5px] text-[12px] font-semibold text-owner hover:text-owner-strong"
          >
            <IconClock size={13} strokeWidth={2.2} />
            {t('pricing.steps.step2.toggle247')}
          </button>
        }
      />
      <div className="rounded-panel border border-line-2 bg-surface px-5 pb-4 pt-2">
        {hours.map((h) => (
          <div
            key={h.day}
            className="grid items-center gap-2.5 border-b border-hairline py-2.5"
            style={{ gridTemplateColumns: '60px 1fr 1fr 48px' }}
          >
            <span className="text-[13px] font-semibold text-body">{t(`pricing.days.${h.day}`)}</span>
            <span
              className="rounded-[9px] border border-line px-2.5 py-[7px] text-center font-mono text-[12.5px] font-medium"
              style={{ background: h.open24 ? 'var(--color-surface)' : 'var(--color-chip)', color: h.open24 ? 'var(--color-ink)' : 'var(--color-faint)' }}
            >
              {h.open24 ? h.open : '—'}
            </span>
            <span
              className="rounded-[9px] border border-line px-2.5 py-[7px] text-center font-mono text-[12.5px] font-medium"
              style={{ background: h.open24 ? 'var(--color-surface)' : 'var(--color-chip)', color: h.open24 ? 'var(--color-ink)' : 'var(--color-faint)' }}
            >
              {h.open24 ? h.close : '—'}
            </span>
            <span className="justify-self-end">
              <Toggle checked={h.open24} onChange={() => onToggleDay(h.day)} />
            </span>
          </div>
        ))}
        <p className="mt-3 text-[11.5px] leading-[1.5] text-faint">
          {t('pricing.steps.step2.helpText')}
        </p>
      </div>
    </div>
  );
}
