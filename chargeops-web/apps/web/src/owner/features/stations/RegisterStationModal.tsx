import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi, type RegisterStationRequest } from '@chargeops/api';
import { Button, FormField, IconHome, Modal, Select, TextInput, useToast } from '@chargeops/ui';
import { getApiErrorMessage } from '../../../i18n';

interface FormState {
  name: string;
  addressLine: string;
  description: string;
  provinceCode: string;
  wardCode: string;
  latitude: string;
  longitude: string;
  contactPhone: string;
  plannedChargePointCount: number;
}

const EMPTY: FormState = {
  name: '',
  addressLine: '',
  description: '',
  provinceCode: '',
  wardCode: '',
  latitude: '21.0285',
  longitude: '105.8542',
  contactPhone: '',
  plannedChargePointCount: 4,
};

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
  const [form, setForm] = useState<FormState>(EMPTY);
  const [showErrors, setShowErrors] = useState(false);

  // Fetch provinces dynamically from Location API
  const provincesQ = useQuery({
    queryKey: ['location', 'provinces'],
    queryFn: () => api.location.getProvinces(),
    enabled: open,
  });

  // Fetch wards dynamically whenever provinceCode is selected
  const wardsQ = useQuery({
    queryKey: ['location', 'wards', form.provinceCode],
    queryFn: () => api.location.getWards(form.provinceCode),
    enabled: open && Boolean(form.provinceCode),
  });

  const provinceOptions = (provincesQ.data ?? []).map((p) => ({
    value: p.code,
    label: p.fullName || p.name,
  }));

  const wardOptions = (wardsQ.data ?? []).map((w) => ({
    value: w.code,
    label: w.fullName || w.name,
  }));

  // Auto-select first province if none selected
  useEffect(() => {
    if (open && !form.provinceCode && provincesQ.data && provincesQ.data.length > 0) {
      setForm((f) => ({ ...f, provinceCode: provincesQ.data[0].code }));
    }
  }, [open, provincesQ.data, form.provinceCode]);

  // When province changes, select first ward or clear if none
  useEffect(() => {
    if (wardsQ.data && wardsQ.data.length > 0) {
      if (!wardsQ.data.some((w) => w.code === form.wardCode)) {
        setForm((f) => ({ ...f, wardCode: wardsQ.data[0].code }));
      }
    } else if (wardsQ.data && wardsQ.data.length === 0) {
      setForm((f) => ({ ...f, wardCode: '' }));
    }
  }, [wardsQ.data]);

  const nameInvalid = !form.name.trim();
  const addrInvalid = !form.addressLine.trim();
  const provinceInvalid = !form.provinceCode;
  const wardInvalid = !form.wardCode;
  const phoneInvalid = !form.contactPhone.trim() || !/^\+?[0-9]{9,15}$/.test(form.contactPhone.replace(/\s+/g, ''));
  const latInvalid = isNaN(Number(form.latitude)) || Number(form.latitude) < -90 || Number(form.latitude) > 90;
  const lngInvalid = isNaN(Number(form.longitude)) || Number(form.longitude) < -180 || Number(form.longitude) > 180;
  const countInvalid = Number(form.plannedChargePointCount) < 1;

  const mutation = useMutation({
    mutationFn: (input: RegisterStationRequest) => api.stations.register(input),
    onSuccess: (station) => {
      qc.invalidateQueries({ queryKey: ['stations', 'mine'] });
      toast(t('stations.register.toastSuccess', { name: station.name }), 'success');
      close();
    },
    onError: (e) => toast(getApiErrorMessage(e), 'error'),
  });

  const close = () => {
    setForm(EMPTY);
    setShowErrors(false);
    onClose();
  };

  const submit = () => {
    if (nameInvalid || addrInvalid || provinceInvalid || wardInvalid || phoneInvalid || latInvalid || lngInvalid || countInvalid) {
      setShowErrors(true);
      return;
    }
    mutation.mutate({
      name: form.name.trim(),
      addressLine: form.addressLine.trim(),
      description: form.description.trim() || undefined,
      provinceCode: form.provinceCode,
      wardCode: form.wardCode,
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      contactPhone: form.contactPhone.trim(),
      plannedChargePointCount: Number(form.plannedChargePointCount) || 1,
    });
  };

  return (
    <Modal open={open} onClose={close} maxWidth={520}>
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

      <div className="max-h-[60vh] overflow-y-auto pr-1 flex flex-col gap-[14px]">
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

        <div className="grid grid-cols-2 gap-[11px]">
          <FormField label={t('stations.register.province')}>
            <Select
              value={form.provinceCode}
              onChange={(provinceCode) => setForm((f) => ({ ...f, provinceCode, wardCode: '' }))}
              options={provinceOptions}
              accent="owner"
              searchable
              searchPlaceholder={t('stations.register.searchProvince')}
              disabled={provincesQ.isLoading || provinceOptions.length === 0}
            />
          </FormField>

          <FormField label={t('stations.register.ward')}>
            <Select
              value={form.wardCode}
              onChange={(wardCode) => setForm((f) => ({ ...f, wardCode }))}
              options={wardOptions}
              accent="owner"
              searchable
              searchPlaceholder={t('stations.register.searchWard')}
              disabled={wardsQ.isLoading || wardOptions.length === 0}
            />
          </FormField>
        </div>

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
            value={form.addressLine}
            onChange={(addressLine) => setForm((f) => ({ ...f, addressLine }))}
            placeholder={t('stations.register.addressPlaceholder')}
            invalid={showErrors && addrInvalid}
          />
        </FormField>

        <div className="grid grid-cols-2 gap-[11px]">
          <FormField
            label={t('stations.register.contactPhone')}
            hint={showErrors && phoneInvalid ? t('stations.register.contactPhoneRequired') : undefined}
            error={showErrors && phoneInvalid}
          >
            <TextInput
              value={form.contactPhone}
              onChange={(contactPhone) => setForm((f) => ({ ...f, contactPhone }))}
              placeholder={t('stations.register.contactPhonePlaceholder')}
              invalid={showErrors && phoneInvalid}
            />
          </FormField>

          <FormField label={t('stations.register.plannedChargers')}>
            <TextInput
              value={String(form.plannedChargePointCount)}
              onChange={(v) =>
                setForm((f) => ({ ...f, plannedChargePointCount: Number(v.replace(/\D/g, '')) || 0 }))
              }
              mono
            />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-[11px]">
          <FormField label={t('stations.register.latitude')}>
            <TextInput
              value={form.latitude}
              onChange={(latitude) => setForm((f) => ({ ...f, latitude }))}
              placeholder="VD: 21.0285"
              mono
              invalid={showErrors && latInvalid}
            />
          </FormField>

          <FormField label={t('stations.register.longitude')}>
            <TextInput
              value={form.longitude}
              onChange={(longitude) => setForm((f) => ({ ...f, longitude }))}
              placeholder="VD: 105.8542"
              mono
              invalid={showErrors && lngInvalid}
            />
          </FormField>
        </div>

        <FormField label={t('stations.register.description')}>
          <TextInput
            value={form.description}
            onChange={(description) => setForm((f) => ({ ...f, description }))}
            placeholder={t('stations.register.descriptionPlaceholder')}
          />
        </FormField>

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

