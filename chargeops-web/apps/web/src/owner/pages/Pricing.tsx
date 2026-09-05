import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  useApi,
  type AvailabilityRules,
  type OperatingHour,
  type PricingConfig,
  type TouRule,
} from '@chargeops/api';
import { Button, Card, PageHeader, Skeleton, useToast } from '@chargeops/ui';
import { BaseConfigStep } from '../features/pricing/BaseConfigStep';
import { OperatingHoursStep } from '../features/pricing/OperatingHoursStep';
import { TouPricingStep } from '../features/pricing/TouPricingStep';
import { AvailabilityStep } from '../features/pricing/AvailabilityStep';
import { AddRuleModal } from '../features/pricing/AddRuleModal';
import { PricingConfirmModal } from '../features/pricing/PricingConfirmModal';
import { ScheduleHistoryDrawer } from '../features/pricing/ScheduleHistoryDrawer';
import { useOwnerStation } from '../context/OwnerStationContext';

/**
 * Pricing & Hours (FR11). All four steps edit a single local draft; "Lưu thay
 * đổi" triggers the Confirmation Modal with change comparison before saving.
 * Changes only affect NEW bookings — existing bookings keep their snapshotted price (POL-06).
 */
export function Pricing() {
  const { t } = useTranslation('owner');
  const api = useApi();
  const qc = useQueryClient();
  const toast = useToast();
  const { selectedStationId, stations, isLoading: stationsLoading } = useOwnerStation();
  const [draft, setDraft] = useState<PricingConfig | null>(null);
  const [backupHours, setBackupHours] = useState<OperatingHour[] | null>(null);
  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<TouRule | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['pricing', selectedStationId],
    queryFn: () => api.pricing.get(selectedStationId),
    enabled: Boolean(selectedStationId),
  });

  // Hydrate the editable draft once the config loads.
  useEffect(() => {
    if (data) setDraft(data);
  }, [data]);

  const save = useMutation({
    mutationFn: (config: PricingConfig) => api.pricing.save(selectedStationId, config),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pricing', selectedStationId] });
      qc.invalidateQueries({ queryKey: ['pricing-history', selectedStationId] });
      setConfirmModalOpen(false);
      toast(t('pricing.saveSuccess', { defaultValue: 'Cập nhật cấu hình và áp dụng thành công!' }), 'success');
    },
    onError: (e) => {
      toast((e as Error).message, 'error');
    },
  });

  const patch = (p: Partial<PricingConfig>) => setDraft((d) => (d ? { ...d, ...p } : d));
  const patchAvailability = (p: Partial<AvailabilityRules>) =>
    setDraft((d) => (d ? { ...d, availability: { ...d.availability, ...p } } : d));

  const toggleDay = (day: string) =>
    setDraft((d) =>
      d
        ? {
            ...d,
            open24Hours: false,
            hours: d.hours.map((h) =>
              h.day === day
                ? {
                    ...h,
                    open24: !h.open24,
                    open: !h.open24 ? h.open || '06:00' : '',
                    close: !h.open24 ? h.close || '23:00' : '',
                  }
                : h,
            ),
          }
        : d,
    );
  const changeHour = (day: string, field: 'open' | 'close', value: string) =>
    setDraft((d) =>
      d
        ? {
            ...d,
            open24Hours: false,
            hours: d.hours.map((h) => (h.day === day ? { ...h, [field]: value } : h)),
          }
        : d,
    );
  const set247 = () =>
    setDraft((d) => {
      if (!d) return d;
      if (d.open24Hours) {
        // Tắt 24/7: Khôi phục lại giờ cũ trước đó nếu có, nếu không thì dùng mặc định 06:00 - 23:00
        return {
          ...d,
          open24Hours: false,
          hours:
            backupHours ??
            d.hours.map((h) => ({
              ...h,
              open24: true,
              open: '06:00',
              close: '23:00',
            })),
        };
      } else {
        // Bật 24/7: Ghi nhớ lại cấu hình giờ từng ngày hiện tại
        setBackupHours(d.hours);
        return {
          ...d,
          open24Hours: true,
          hours: d.hours.map((h) => ({ ...h, open24: true, open: '00:00', close: '00:00' })),
        };
      }
    });

  const copyMondayToAll = () => {
    setDraft((d) => {
      if (!d) return d;
      const mon = d.hours.find((h) => h.day === 'T2' || h.day === 'MONDAY');
      if (!mon) return d;
      return {
        ...d,
        open24Hours: false,
        hours: d.hours.map((h) => ({
          ...h,
          open24: mon.open24,
          open: mon.open,
          close: mon.close,
        })),
      };
    });
    toast(t('pricing.copyMondaySuccess', { defaultValue: 'Đã sao chép khung giờ Thứ 2 cho cả tuần' }), 'info');
  };

  const handleSaveRule = (rule: Omit<TouRule, 'id'>, editId?: string) => {
    setDraft((d) => {
      if (!d) return d;
      if (editId) {
        // Edit existing rule
        return {
          ...d,
          touRules: d.touRules.map((r) => (r.id === editId ? { ...rule, id: editId } : r)),
        };
      }
      // Add new rule
      return {
        ...d,
        touRules: [
          ...d.touRules,
          {
            ...rule,
            id: globalThis.crypto?.randomUUID?.() ?? `draft-${Date.now()}`,
          },
        ],
      };
    });
    setEditingRule(null);
  };

  const removeRule = (id: string) =>
    setDraft((d) => (d ? { ...d, touRules: d.touRules.filter((r) => r.id !== id) } : d));

  const handleOpenAddRule = () => {
    setEditingRule(null);
    setRuleModalOpen(true);
  };

  const handleOpenEditRule = (rule: TouRule) => {
    setEditingRule(rule);
    setRuleModalOpen(true);
  };

  return (
    <>
      <PageHeader
        title={t('pricing.title', { defaultValue: 'Giá & Giờ hoạt động' })}
        subtitle={t('pricing.subtitle', {
          defaultValue: 'Cấu hình thời lượng đặt, giá gốc, giờ mở cửa và các khung giờ cao điểm/thấp điểm.',
        })}
      />

      {error ? (
        <Card className="border-bad-border bg-bad-soft p-5 text-[13px] font-medium text-bad-deep">
          {t('pricing.loadError', { message: (error as Error).message })}
        </Card>
      ) : !stationsLoading && stations.length === 0 ? (
        <Card className="p-8 text-center border-line-2">
          <div className="text-[16px] font-bold text-ink">Chưa có trạm sạc nào</div>
          <p className="mt-1.5 text-[13px] text-muted max-w-[440px] mx-auto">
            Tài khoản hiện chưa sở hữu trạm sạc nào. Vui lòng đăng ký trạm mới tại trang Danh sách trạm trước khi cấu hình giá và giờ hoạt động.
          </p>
        </Card>
      ) : isLoading || !draft ? (
        <PricingSkeleton />
      ) : (
        <div className="mx-auto flex max-w-[880px] flex-col gap-[22px]">
          {/* Step 1: Base Config & Duration (Owner configurable: 30/60/90) */}
          <BaseConfigStep
            minBookingDurationMin={draft.minBookingDurationMin}
            basePriceVnd={draft.basePriceVnd}
            onMinDuration={(minBookingDurationMin) => patch({ minBookingDurationMin })}
            onBasePrice={(basePriceVnd) => patch({ basePriceVnd })}
          />

          {/* Step 2: Operating Hours */}
          <OperatingHoursStep
            hours={draft.hours}
            isOpen247={Boolean(draft.open24Hours)}
            effectiveFrom={data?.scheduleEffectiveFrom}
            effectiveTo={data?.scheduleEffectiveTo}
            scheduleStatus={data?.scheduleStatus}
            onToggleDay={toggleDay}
            onChangeTime={changeHour}
            onSet247={set247}
            onCopyMondayToAll={copyMondayToAll}
            onOpenHistory={() => setHistoryDrawerOpen(true)}
          />

          {/* Step 3: TOU Pricing */}
          <TouPricingStep
            rules={draft.touRules}
            basePriceVnd={draft.basePriceVnd}
            onAdd={handleOpenAddRule}
            onEdit={handleOpenEditRule}
            onRemove={removeRule}
          />

          {/* Step 4: Availability & Overstay Policy */}
          <AvailabilityStep rules={draft.availability} onChange={patchAvailability} />

          {/* Action Bar */}
          <div className="flex justify-end gap-[11px] pb-1.5 pt-0.5">
            <Button
              variant="secondary"
              size="lg"
              onClick={() => {
                if (data) setDraft(data);
                toast(t('pricing.resetSuccess', { defaultValue: 'Đã khôi phục cấu hình ban đầu' }), 'info');
              }}
            >
              {t('pricing.cancelBtn', { defaultValue: 'Hủy thay đổi' })}
            </Button>
            <Button
              accent="owner"
              size="lg"
              onClick={() => setConfirmModalOpen(true)}
              disabled={save.isPending}
            >
              {t('pricing.saveBtn', { defaultValue: 'Lưu & áp dụng ngay' })}
            </Button>
          </div>
        </div>
      )}

      {/* Add / Edit TOU Rule Modal */}
      <AddRuleModal
        open={ruleModalOpen}
        initialRule={editingRule}
        existingRules={draft?.touRules ?? []}
        onClose={() => {
          setRuleModalOpen(false);
          setEditingRule(null);
        }}
        onSave={handleSaveRule}
      />

      {/* Confirmation & Summary Preview Modal */}
      <PricingConfirmModal
        open={confirmModalOpen}
        initialConfig={data ?? null}
        draftConfig={draft}
        isSaving={save.isPending}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={() => {
          if (draft) save.mutate(draft);
        }}
      />

      {/* Schedule History Slide-over Drawer */}
      <ScheduleHistoryDrawer
        open={historyDrawerOpen}
        onClose={() => setHistoryDrawerOpen(false)}
        stationId={selectedStationId}
      />
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
