import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { formatVnd, type TouRule } from '@chargeops/api';
import { Button, IconBarChart, IconClock, IconEdit, IconPlusCircle, IconTrash, Modal } from '@chargeops/ui';
import { StepHeader } from './StepHeader';
import { pricePctVsBase } from './touDays';

export interface TouPricingStepProps {
  rules: TouRule[];
  basePriceVnd: number;
  onAdd: () => void;
  onEdit?: (rule: TouRule) => void;
  onRemove: (id: string) => void;
}

/** Helper to render a single 24h timeline track for a specific day group */
function TimelineTrack({
  title,
  badge,
  rules,
  basePriceVnd,
  targetDayType,
}: {
  title: string;
  badge: string;
  rules: TouRule[];
  basePriceVnd: number;
  targetDayType: 'weekdays' | 'weekends' | 'daily';
}) {
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getHourRate = (hour: number) => {
    // Ưu tiên rule đặc thù cho ngày cụ thể (weekdays hoặc weekends) trước rule 'daily'
    const specificMatch = rules.find((r) => {
      if (r.days !== targetDayType) return false;
      const fromH = parseInt(r.from.split(':')[0] || '0', 10);
      const toH = parseInt(r.to.split(':')[0] || '0', 10);
      if (fromH <= toH) {
        return hour >= fromH && hour < toH;
      }
      return hour >= fromH || hour < toH;
    });

    if (specificMatch) return specificMatch;

    // Fallback sang rule 'daily'
    return rules.find((r) => {
      if (r.days !== 'daily') return false;
      const fromH = parseInt(r.from.split(':')[0] || '0', 10);
      const toH = parseInt(r.to.split(':')[0] || '0', 10);
      if (fromH <= toH) {
        return hour >= fromH && hour < toH;
      }
      return hour >= fromH || hour < toH;
    });
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-[11.5px]">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-ink">{title}</span>
          <span className="rounded bg-surface-3 px-1.5 py-0.5 text-[10px] font-mono font-bold text-muted border border-hairline">
            {badge}
          </span>
        </div>
      </div>

      <div className="flex h-6 w-full overflow-hidden rounded-[6px] border border-line-2 bg-chip">
        {hours.map((h) => {
          const match = getHourRate(h);
          let bg = 'bg-surface-3';
          let title = `${h}:00 – ${h + 1}:00: ${formatVnd(basePriceVnd)}/kWh (Giá cơ bản)`;
          if (match) {
            const pct = pricePctVsBase(match.rateVnd, basePriceVnd);
            if (pct > 0) {
              bg = 'bg-warn/85';
            } else if (pct < 0) {
              bg = 'bg-owner/85';
            } else {
              bg = 'bg-brand/70';
            }
            title = `${h}:00 – ${h + 1}:00: ${match.name} · ${formatVnd(match.rateVnd)}/kWh (${match.from}–${match.to})`;
          }
          return (
            <div
              key={h}
              title={title}
              className={`flex-1 border-r border-hairline last:border-r-0 transition-opacity hover:opacity-80 cursor-help ${bg}`}
            />
          );
        })}
      </div>

      <div className="flex justify-between font-mono text-[9px] text-faint px-0.5">
        <span>00:00</span>
        <span>06:00</span>
        <span>12:00</span>
        <span>18:00</span>
        <span>24:00</span>
      </div>
    </div>
  );
}

/** Helper to render 24h visual timeline bars based on TOU rules (supporting separate Weekdays & Weekends). */
function TouTimeline24h({ rules, basePriceVnd }: { rules: TouRule[]; basePriceVnd: number }) {
  const hasWeekdaySpecific = rules.some((r) => r.days === 'weekdays');
  const hasWeekendSpecific = rules.some((r) => r.days === 'weekends');
  const hasDaySplit = hasWeekdaySpecific || hasWeekendSpecific;

  return (
    <div className="mb-4 rounded-[10px] border border-line-3 bg-surface-2 p-3.5 flex flex-col gap-3">
      {/* Header & Legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline pb-2.5">
        <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-faint">
          Biểu đồ phân bổ giá theo khung giờ (24h)
        </span>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-owner-deep" />
            <span className="text-muted">Thấp điểm</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-surface-3 border border-line-2" />
            <span className="text-muted">Giá cơ bản</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-warn" />
            <span className="text-muted">Cao điểm</span>
          </span>
        </div>
      </div>

      {hasDaySplit ? (
        <div className="flex flex-col gap-3.5 divide-y divide-hairline">
          {/* Weekday track */}
          <TimelineTrack
            title="🏢 Ngày trong tuần"
            badge="Thứ 2 – Thứ 6"
            rules={rules}
            basePriceVnd={basePriceVnd}
            targetDayType="weekdays"
          />

          {/* Weekend track */}
          <div className="pt-3">
            <TimelineTrack
              title="🏖️ Cuối tuần"
              badge="Thứ 7 – Chủ Nhật"
              rules={rules}
              basePriceVnd={basePriceVnd}
              targetDayType="weekends"
            />
          </div>
        </div>
      ) : (
        <TimelineTrack
          title="📅 Cả tuần"
          badge="Thứ 2 – Chủ Nhật"
          rules={rules}
          basePriceVnd={basePriceVnd}
          targetDayType="daily"
        />
      )}
    </div>
  );
}

/** Step 3 — time-of-use windows whose rate a booking snapshots. */
export function TouPricingStep({ rules, basePriceVnd, onAdd, onEdit, onRemove }: TouPricingStepProps) {
  const { t } = useTranslation('owner');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const ruleToDelete = rules.find((r) => r.id === deleteId);

  return (
    <div>
      <StepHeader
        n={3}
        title={t('pricing.steps.step3.title')}
        action={
          <button
            type="button"
            onClick={onAdd}
            className="flex items-center gap-[5px] text-[12px] font-semibold text-owner hover:text-owner-strong cursor-pointer"
          >
            <IconPlusCircle size={13} strokeWidth={2.2} />
            {t('pricing.steps.step3.addRule')}
          </button>
        }
      />
      <div className="rounded-panel border border-line-2 bg-surface p-5">
        {/* 24h Timeline Bar */}
        <TouTimeline24h rules={rules} basePriceVnd={basePriceVnd} />

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
                  <div key={r.id} className="rounded-card border border-line-3 p-4 bg-surface transition-shadow hover:shadow-sm">
                    <div className="mb-[13px] flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-[11px]">
                        <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[9px] bg-owner-soft">
                          <IconClock size={17} className="text-owner-deep" />
                        </span>
                        <div className="min-w-0">
                          <div className="text-[13.5px] font-semibold text-ink">{r.name}</div>
                          <div className="mt-0.5 font-mono text-[11px] text-faint">
                            {r.from}–{r.to} · {t(`pricing.days.${r.days}`)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {onEdit && (
                          <button
                            type="button"
                            onClick={() => onEdit(r)}
                            className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg text-muted hover:bg-chip transition-colors cursor-pointer"
                            title="Chỉnh sửa khung giá này"
                          >
                            <IconEdit size={14} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setDeleteId(r.id)}
                          className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg text-bad hover:bg-bad-soft transition-colors cursor-pointer"
                          aria-label={t('pricing.steps.step3.deleteBtn')}
                          title="Xóa khung giá"
                        >
                          <IconTrash size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-end justify-between gap-3 border-t border-hairline pt-3">
                      <div className="font-mono text-[19px] font-bold text-ink">
                        {formatVnd(r.rateVnd)}
                        <span className="font-mono text-[11px] font-medium text-faint"> /kWh</span>
                      </div>
                      <div className="text-right">
                        <div className="text-[8.5px] font-semibold uppercase tracking-[0.06em] text-faint">
                          {t('pricing.steps.step3.vsBase')}
                        </div>
                        <div
                          className="mt-px text-[15px] font-bold"
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

      {/* Delete Rule Confirmation Modal */}
      <Modal open={Boolean(deleteId)} onClose={() => setDeleteId(null)} maxWidth={400}>
        <div>
          <div className="text-[16px] font-bold text-ink">Xóa khung giá này?</div>
          <div className="mt-1.5 text-[12.5px] text-muted">
            Bạn có chắc chắn muốn xóa khung giá <b>"{ruleToDelete?.name}"</b> ({ruleToDelete?.from}–{ruleToDelete?.to}) không? Các khung giờ này sẽ tự động quay về áp dụng mức giá gốc.
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setDeleteId(null)}>
              Hủy bỏ
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                if (deleteId) onRemove(deleteId);
                setDeleteId(null);
              }}
            >
              Xác nhận xóa
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
