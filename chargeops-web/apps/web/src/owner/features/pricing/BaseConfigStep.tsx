import { useTranslation } from 'react-i18next';
import { IconBolt } from '@chargeops/ui';
import { StepHeader } from './StepHeader';

const SLOTS = [30, 60, 90];

export interface BaseConfigStepProps {
  slotDurationMin: number;
  basePriceVnd: number;
  onSlot: (min: number) => void;
  onBasePrice: (vnd: number) => void;
}

/** Step 1 — slot duration segmented control + default price per kWh. */
export function BaseConfigStep({ slotDurationMin, basePriceVnd, onSlot, onBasePrice }: BaseConfigStepProps) {
  const { t } = useTranslation('owner');
  return (
    <div>
      <StepHeader n={1} title={t('pricing.steps.step1.title')} />
      <div className="rounded-panel border border-line-2 bg-white p-5">
        <div className="mb-[18px] flex items-start gap-[11px]">
          <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[9px] bg-owner-soft">
            <IconBolt size={18} className="text-owner" />
          </span>
          <div>
            <div className="text-[14px] font-semibold">{t('pricing.steps.step1.groupTitle')}</div>
            <div className="mt-0.5 text-[12px] text-faint">
              {t('pricing.steps.step1.groupHelp')}
            </div>
          </div>
        </div>

        <div className="mb-[9px] text-[10px] font-semibold uppercase tracking-[0.07em] text-faint">
          {t('pricing.steps.step1.durationLabel')}
        </div>
        <div className="mb-[18px] flex gap-[5px] rounded-[11px] bg-[#f1f3f5] p-1">
          {SLOTS.map((m) => {
            const on = m === slotDurationMin;
            return (
              <button
                key={m}
                onClick={() => onSlot(m)}
                className={`flex-1 rounded-lg py-[11px] text-center text-[14px] font-semibold transition ${
                  on ? 'bg-white text-ink shadow-[0_1px_2px_rgba(16,17,26,.1)]' : 'text-faint'
                }`}
              >
                {t('pricing.steps.step1.durationVal', { minutes: m })}
              </button>
            );
          })}
        </div>

        <div className="mb-[9px] text-[10px] font-semibold uppercase tracking-[0.07em] text-faint">
          {t('pricing.steps.step1.basePriceLabel')}
        </div>
        <div className="flex h-[50px] items-center gap-[11px] rounded-[11px] border border-line px-3.5">
          <span className="font-mono text-[16px] font-semibold text-faint">₫</span>
          <input
            value={basePriceVnd}
            onChange={(e) => onBasePrice(Number(e.target.value.replace(/\D/g, '')) || 0)}
            className="min-w-0 flex-1 border-none bg-transparent font-mono text-[17px] font-semibold text-ink outline-none"
          />
          <span className="font-mono text-[11px] font-medium text-faint">/kWh</span>
          <span className="shrink-0 rounded-full bg-owner-soft px-[11px] py-1 text-[10.5px] font-semibold text-owner-deep">
            {t('pricing.steps.step1.basePriceSub')}
          </span>
        </div>
        <p className="mt-[9px] text-[11.5px] leading-[1.5] text-faint">
          {t('pricing.steps.step1.basePriceHelp')}
        </p>
      </div>
    </div>
  );
}
