import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi, type StationRegistration } from '@chargeops/api';
import { Button, FormField, IconHome, Modal, Select, TextInput, useToast } from '@chargeops/ui';

const CITIES = ['Hà Nội', 'TP.HCM', 'Đà Nẵng', 'Cần Thơ', 'Hải Phòng'];
const CITY_OPTIONS = CITIES.map((c) => ({ value: c, label: c }));

const EMPTY: StationRegistration = { name: '', city: 'Hà Nội', address: '', plannedChargers: 4 };

/**
 * FR12 — register a new station. Submits a PENDING registration; validation is
 * client-side here and re-checked by the backend. Business licence is verified
 * off-platform (no document upload in this screen).
 */
export function RegisterStationModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation('owner');
  const api = useApi();
  const qc = useQueryClient();
  const toast = useToast();
  const [form, setForm] = useState<StationRegistration>(EMPTY);
  const [showErrors, setShowErrors] = useState(false);

  const nameInvalid = !form.name.trim();
  const addrInvalid = !form.address.trim();

  const mutation = useMutation({
    mutationFn: (input: StationRegistration) => api.stations.register(input),
    onSuccess: (station) => {
      qc.invalidateQueries({ queryKey: ['stations', 'mine'] });
      toast(t('stations.register.toastSuccess', { name: station.name }), 'success');
      close();
    },
    onError: (e) => toast((e as Error).message, 'error'),
  });

  const close = () => {
    setForm(EMPTY);
    setShowErrors(false);
    onClose();
  };

  const submit = () => {
    if (nameInvalid || addrInvalid) {
      setShowErrors(true);
      return;
    }
    mutation.mutate({ ...form, plannedChargers: Number(form.plannedChargers) || 1 });
  };

  return (
    <Modal open={open} onClose={close} maxWidth={460}>
      <div className="mb-[18px] flex items-start gap-3">
        <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] bg-owner-soft">
          <IconHome size={20} className="text-owner" />
        </span>
        <div>
          <div className="text-[17px] font-bold">{t('stations.register.title')}</div>
          <div className="mt-0.5 text-[12px] text-muted">
            {t('stations.register.subtitle')}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-[15px]">
        <FormField
          label={t('stations.register.stationName')}
          hint={
            showErrors && nameInvalid
              ? t('stations.register.nameRequired')
              : t('stations.register.nameHelp')
          }
          error={showErrors && nameInvalid}
        >
          <TextInput
            value={form.name}
            onChange={(name) => setForm((f) => ({ ...f, name }))}
            placeholder={t('stations.register.namePlaceholder')}
            invalid={showErrors && nameInvalid}
          />
        </FormField>

        <FormField
          label={t('stations.register.address')}
          hint={
            showErrors && addrInvalid
              ? t('stations.register.addressRequired')
              : t('stations.register.addressHelp')
          }
          error={showErrors && addrInvalid}
        >
          <TextInput
            value={form.address}
            onChange={(address) => setForm((f) => ({ ...f, address }))}
            placeholder={t('stations.register.addressPlaceholder')}
            invalid={showErrors && addrInvalid}
          />
        </FormField>

        <div className="flex gap-[11px]">
          <div className="flex-[1.4]">
            <FormField label={t('stations.register.city')}>
              <Select
                value={form.city}
                onChange={(city) => setForm((f) => ({ ...f, city }))}
                options={CITY_OPTIONS}
                accent="owner"
              />
            </FormField>
          </div>
          <div className="flex-[0.8]">
            <FormField label={t('stations.register.plannedChargers')}>
              <TextInput
                value={String(form.plannedChargers)}
                onChange={(v) =>
                  setForm((f) => ({ ...f, plannedChargers: Number(v.replace(/\D/g, '')) || 0 }))
                }
                mono
              />
            </FormField>
          </div>
        </div>

        <div className="flex gap-2.5 rounded-[10px] border border-warn-border bg-warn-soft px-[13px] py-[11px] text-[11px] leading-[1.5] text-warn-deep">
          <span>
            {t('stations.register.licenseHelp')}
          </span>
        </div>
      </div>

      <div className="mt-[22px] flex gap-[11px]">
        <Button variant="secondary" size="lg" className="flex-1" onClick={close}>
          {t('stations.register.cancelBtn')}
        </Button>
        <Button accent="owner" size="lg" className="flex-[1.4]" onClick={submit} disabled={mutation.isPending}>
          {mutation.isPending ? t('stations.register.submitting') : t('stations.register.submitBtn')}
        </Button>
      </div>
    </Modal>
  );
}
