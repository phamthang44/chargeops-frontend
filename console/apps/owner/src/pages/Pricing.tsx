import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  useApi,
  type AvailabilityRules,
  type PricingConfig,
  type TouRule,
} from '@chargeops/api';
import { Card, PageHeader, Skeleton, useToast } from '@chargeops/ui';
import { BaseConfigStep } from '../features/pricing/BaseConfigStep';
import { OperatingHoursStep } from '../features/pricing/OperatingHoursStep';
import { TouPricingStep } from '../features/pricing/TouPricingStep';
import { AvailabilityStep } from '../features/pricing/AvailabilityStep';
import { AddRuleModal } from '../features/pricing/AddRuleModal';

/**
 * Pricing & Hours (FR11). All four steps edit a single local draft; "Lưu thay
 * đổi" persists the whole config. Changes only affect NEW bookings — existing
 * bookings keep their snapshotted price (POL-06 / BookingPriceLine).
 */
export function Pricing() {
  const api = useApi();
  const qc = useQueryClient();
  const toast = useToast();
  const [draft, setDraft] = useState<PricingConfig | null>(null);
  const [ruleModal, setRuleModal] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['pricing'],
    queryFn: () => api.pricing.get(),
  });

  // Hydrate the editable draft once the config loads.
  useEffect(() => {
    if (data) setDraft(data);
  }, [data]);

  const save = useMutation({
    mutationFn: (config: PricingConfig) => api.pricing.save(config),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pricing'] });
      toast('Đã lưu cấu hình giá & giờ hoạt động', 'success');
    },
    onError: (e) => toast((e as Error).message, 'error'),
  });

  const patch = (p: Partial<PricingConfig>) => setDraft((d) => (d ? { ...d, ...p } : d));
  const patchAvailability = (p: Partial<AvailabilityRules>) =>
    setDraft((d) => (d ? { ...d, availability: { ...d.availability, ...p } } : d));

  const toggleDay = (day: string) =>
    setDraft((d) =>
      d ? { ...d, hours: d.hours.map((h) => (h.day === day ? { ...h, open24: !h.open24 } : h)) } : d,
    );
  const set247 = () =>
    setDraft((d) =>
      d
        ? { ...d, hours: d.hours.map((h) => ({ ...h, open24: true, open: '00:00', close: '24:00' })) }
        : d,
    );

  const addRule = (rule: Omit<TouRule, 'id'>) =>
    setDraft((d) => (d ? { ...d, touRules: [...d.touRules, { ...rule, id: `TOU-${Date.now()}` }] } : d));
  const removeRule = (id: string) =>
    setDraft((d) => (d ? { ...d, touRules: d.touRules.filter((r) => r.id !== id) } : d));

  return (
    <>
      <PageHeader
        title="Giá & giờ hoạt động"
        subtitle="Giá gốc, khung giờ TOU và giờ mở cửa. Thay đổi chỉ áp dụng cho đặt chỗ mới."
      />

      {error ? (
        <Card className="border-bad-border bg-bad-soft p-5 text-[13px] font-medium text-bad-deep">
          Không tải được cấu hình: {(error as Error).message}
        </Card>
      ) : isLoading || !draft ? (
        <PricingSkeleton />
      ) : (
        <div className="mx-auto flex max-w-[880px] flex-col gap-[22px]">
          <BaseConfigStep
            slotDurationMin={draft.slotDurationMin}
            basePriceVnd={draft.basePriceVnd}
            onSlot={(slotDurationMin) => patch({ slotDurationMin })}
            onBasePrice={(basePriceVnd) => patch({ basePriceVnd })}
          />
          <OperatingHoursStep hours={draft.hours} onToggleDay={toggleDay} onSet247={set247} />
          <TouPricingStep
            rules={draft.touRules}
            basePriceVnd={draft.basePriceVnd}
            onAdd={() => setRuleModal(true)}
            onRemove={removeRule}
          />
          <AvailabilityStep rules={draft.availability} onChange={patchAvailability} />

          <div className="flex justify-end gap-[11px] pb-1.5 pt-0.5">
            <button
              onClick={() => data && setDraft(data)}
              className="rounded-[11px] border border-line px-6 py-3 text-[13px] font-semibold text-body hover:bg-canvas"
            >
              Hủy bỏ
            </button>
            <button
              onClick={() => draft && save.mutate(draft)}
              disabled={save.isPending}
              className="rounded-[11px] bg-owner px-7 py-3 text-[13px] font-semibold text-white shadow-[0_1px_3px_rgba(18,161,80,.35)] hover:bg-owner-strong disabled:opacity-60"
            >
              {save.isPending ? 'Đang lưu…' : 'Lưu thay đổi'}
            </button>
          </div>
        </div>
      )}

      <AddRuleModal open={ruleModal} onClose={() => setRuleModal(false)} onAdd={addRule} />
    </>
  );
}

function PricingSkeleton() {
  return (
    <div className="mx-auto flex max-w-[880px] flex-col gap-[22px]">
      {Array.from({ length: 4 }, (_, i) => (
        <Skeleton key={i} className="h-[200px] rounded-panel" />
      ))}
    </div>
  );
}
