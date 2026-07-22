import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  useApi,
  type AvailabilityRules,
  type PricingConfig,
  type TouRule,
} from '@chargeops/api';
import { Button, Card, PageHeader, Skeleton, useToast } from '@chargeops/ui';
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
  const { t } = useTranslation('owner');
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
      toast(t('pricing.saveSuccess'), 'success');
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
        title={t('pricing.title')}
        subtitle={t('pricing.subtitle')}
      />

      {error ? (
        <Card className="border-bad-border bg-bad-soft p-5 text-[13px] font-medium text-bad-deep">
          {t('pricing.loadError', { message: (error as Error).message })}
        </Card>
      ) : isLoading || !draft ? (
        <PricingSkeleton />
      ) : (
        <div className="mx-auto flex max-w-[880px] flex-col gap-[22px]">
          <BaseConfigStep
            minBookingDurationMin={draft.minBookingDurationMin}
            basePriceVnd={draft.basePriceVnd}
            onMinDuration={(minBookingDurationMin) => patch({ minBookingDurationMin })}
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
            <Button variant="secondary" size="lg" onClick={() => data && setDraft(data)}>
              {t('pricing.cancelBtn')}
            </Button>
            <Button accent="owner" size="lg" onClick={() => draft && save.mutate(draft)} disabled={save.isPending}>
              {save.isPending ? t('pricing.saving') : t('pricing.saveBtn')}
            </Button>
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
