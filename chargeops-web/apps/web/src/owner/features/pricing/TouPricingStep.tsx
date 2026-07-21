import { useTranslation } from 'react-i18next';
import { formatVnd, type TouRule } from '@chargeops/api';
import { IconBarChart, IconClock, IconPlusCircle } from '@chargeops/ui';
import { StepHeader } from './StepHeader';
import { pricePctVsBase } from './touDays';

export interface TouPricingStepProps {
  rules: TouRule[];
  basePriceVnd: number;
  onAdd: () => void;
  onRemove: (id: string) => void;
}

/** Step 3 — time-of-use windows whose rate a booking snapshots. */
export function TouPricingStep({ rules, basePriceVnd, onAdd, onRemove }: TouPricingStepProps) {
  const { t } = useTranslation('owner');
  return (
    <div>
      <StepHeader
        n={3}
        title={t('pricing.steps.step3.title')}
        action={
          <button
            onClick={onAdd}
            className="flex items-center gap-[5px] text-[12px] font-semibold text-owner hover:text-owner-strong"
          >
            <IconPlusCircle size={13} strokeWidth={2.2} />
            {t('pricing.steps.step3.addRule')}
          </button>
        }
      />
      <div className="rounded-panel border border-line-2 bg-surface p-5">
        {rules.length === 0 ? (
          <div className="py-[22px] text-center text-[12.5px] font-medium text-faint">
            {t('pricing.steps.step3.noRules')}
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-[11px]">
              {rules.map((r) => {
                const pct = pricePctVsBase(r.rateVnd, basePriceVnd);
                const higher = pct >= 0;
                return (
                  <div key={r.id} className="rounded-card border border-line-3 p-4">
                    <div className="mb-[13px] flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-[11px]">
                        <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[9px] bg-owner-soft">
                          <IconClock size={17} className="text-owner" />
                        </span>
                        <div className="min-w-0">
                          <div className="text-[13.5px] font-semibold">{r.name}</div>
                          <div className="mt-0.5 font-mono text-[11px] text-faint">
                            {r.from}–{r.to} · {t(`pricing.days.${r.days}`)}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => onRemove(r.id)}
                        className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg text-bad hover:bg-bad-soft"
                        aria-label={t('pricing.steps.step3.deleteBtn')}
                      >
                        ✕
                      </button>
                    </div>
                    <div className="flex items-end justify-between gap-3">
                      <div className="font-mono text-[20px] font-bold text-ink">
                        {formatVnd(r.rateVnd)}
                        <span className="font-mono text-[11px] font-medium text-faint"> /kWh</span>
                      </div>
                      <div className="text-right">
                        <div className="text-[8.5px] font-semibold uppercase tracking-[0.06em] text-faint">
                          {t('pricing.steps.step3.vsBase')}
                        </div>
                        <div
                          className="mt-px text-[16px] font-bold"
                          style={{ color: higher ? 'var(--color-warn)' : 'var(--color-owner-deep)' }}
                        >
                          {higher ? '+' : ''}
                          {pct}%
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-[13px] flex gap-[11px] rounded-card border border-owner-border bg-owner-soft px-4 py-3.5">
              <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg bg-owner-tint">
                <IconBarChart size={16} className="text-owner-deep" />
              </span>
              <div>
                <div className="mb-[3px] text-[12.5px] font-semibold text-owner-deep">
                  {t('pricing.steps.step3.tipTitle')}
                </div>
                <div className="text-[12px] leading-[1.55] text-owner-deep">
                  {t('pricing.steps.step3.tipText')}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
