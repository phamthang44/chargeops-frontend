import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi, type StationRegistrationDetail, type RegisterStationRequest } from '@chargeops/api';
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
export function RegisterStationModal({ open, onClose, registration }: { open: boolean; onClose: () => void; registration?: StationRegistrationDetail }) {
  const { t } = useTranslation('owner');
  const api = useApi();
  const qc = useQueryClient();
  const toast = useToast();
  const [form, setForm] = useState<FormState>(() => registration ? {
    name: registration.name, addressLine: registration.addressLine, description: registration.description ?? '',
    provinceCode: registration.provinceCode, wardCode: registration.wardCode,
    latitude: String(registration.latitude), longitude: String(registration.longitude),
    contactPhone: registration.contactPhone, plannedChargePointCount: registration.plannedChargePointCount,
  } : EMPTY);
  const [showErrors, setShowErrors] = useState(false);
  const [serverErrors, setServerErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const setField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [field]: value, ...(field === 'provinceCode' ? { wardCode: '' } : {}) }));
    setServerErrors((errors) => ({ ...errors, [field]: undefined, ...(field === 'provinceCode' ? { wardCode: undefined } : {}) }));
  };

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

  // Match RegisterStationRequest and PhoneValidator, including formatted numbers and +84.
  const cleanPhone = form.contactPhone.replace(/\D/g, '').replace(/^84/, '0');
  const validationKeys: Partial<Record<keyof FormState, string>> = {};
  const requiredText = (field: 'name' | 'addressLine' | 'contactPhone', key: string, max: number) => {
    if (!form[field].trim()) validationKeys[field] = 'validation.station.' + key + '.required';
    else if (form[field].trim().length > max) validationKeys[field] = 'validation.station.' + key + '.maxLength';
  };
  requiredText('name', 'name', 100);
  requiredText('addressLine', 'address', 200);
  requiredText('contactPhone', 'contactPhone', 20);
  if (!validationKeys.contactPhone && !/^0[35789]\d{8}$/.test(cleanPhone)) {
    validationKeys.contactPhone = 'validation.station.contactPhone.invalid';
  }
  if (form.description.trim().length > 500) validationKeys.description = 'validation.station.description.maxLength';
  for (const field of ['provinceCode', 'wardCode'] as const) {
    if (!form[field]) validationKeys[field] = 'validation.station.' + field + '.required';
    else if (!/^\d+$/.test(form[field])) validationKeys[field] = 'validation.station.' + field + '.invalid';
  }
  for (const [field, limit] of [['latitude', 90], ['longitude', 180]] as const) {
    if (!form[field].trim()) validationKeys[field] = 'validation.station.' + field + '.required';
    else if (!Number.isFinite(Number(form[field])) || Math.abs(Number(form[field])) > limit) {
      validationKeys[field] = 'validation.station.' + field + '.invalid';
    }
  }
  if (!Number.isInteger(form.plannedChargePointCount) || form.plannedChargePointCount < 1 || form.plannedChargePointCount > 2147483647) {
    validationKeys.plannedChargePointCount = 'validation.station.plannedChargePointCount.min';
  }
  const errorFor = (field: keyof FormState) =>
    serverErrors[field] || (showErrors && validationKeys[field] ? getApiErrorMessage({ messageKey: validationKeys[field] }) : undefined);

  const mutation = useMutation({
    mutationFn: (input: RegisterStationRequest) => registration
      ? api.stations.updateRegistration(registration.id, registration.version, input)
      : api.stations.register(input),
    onSuccess: (station) => {
      qc.invalidateQueries({ queryKey: ['stations', 'mine'] });
      qc.invalidateQueries({ queryKey: ['stations', 'registration'] });
      toast(registration ? t('stations.edit.toastSuccess') : t('stations.register.toastSuccess', { name: station.name }), 'success');
      close();
    },
    onError: (e) => {
      const details = (e as { details?: unknown }).details;
      const errors: Partial<Record<keyof FormState, string>> = {};
      if (details && typeof details === 'object' && !Array.isArray(details)) {
        for (const [field, failure] of Object.entries(details)) {
          if (Object.prototype.hasOwnProperty.call(EMPTY, field) && failure && typeof failure === 'object') {
            errors[field as keyof FormState] = getApiErrorMessage(failure);
          }
        }
      }
      setServerErrors(errors);
      toast(Object.values(errors).join('\n') || getApiErrorMessage(e), 'error');
    },
  });

  const close = () => {
    setForm(EMPTY);
    setShowErrors(false);
    setServerErrors({});
    mutation.reset();
    onClose();
  };

  const submit = () => {
    setServerErrors({});
    if (Object.keys(validationKeys).length > 0) {
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
          <div className="text-[17px] font-bold">{t(registration ? 'stations.edit.title' : 'stations.register.title')}</div>
          <div className="mt-0.5 text-[12px] text-muted">
            {t(registration ? 'stations.edit.subtitle' : 'stations.register.subtitle')}
          </div>
        </div>
      </div>

      <div className="max-h-[60vh] overflow-y-auto pr-1 flex flex-col gap-[14px]">
        <FormField
          label={t('stations.register.stationName')}
          hint={errorFor('name') || t('stations.register.nameHelp')}
          error={Boolean(errorFor('name'))}
        >
          <TextInput
            value={form.name}
            onChange={(name) => setField('name', name)}
            placeholder={t('stations.register.namePlaceholder')}
            invalid={Boolean(errorFor('name'))}
          />
        </FormField>

        <div className="grid grid-cols-2 gap-[11px]">
          <FormField label={t('stations.register.province')} hint={errorFor('provinceCode')} error={Boolean(errorFor('provinceCode'))}>
            <Select
              value={form.provinceCode}
              onChange={(provinceCode) => setField('provinceCode', provinceCode)}
              options={provinceOptions}
              accent="owner"
              searchable
              searchPlaceholder={t('stations.register.searchProvince')}
              disabled={provincesQ.isLoading || provinceOptions.length === 0}
            />
          </FormField>

          <FormField label={t('stations.register.ward')} hint={errorFor('wardCode')} error={Boolean(errorFor('wardCode'))}>
            <Select
              value={form.wardCode}
              onChange={(wardCode) => setField('wardCode', wardCode)}
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
          hint={errorFor('addressLine') || t('stations.register.addressHelp')}
          error={Boolean(errorFor('addressLine'))}
        >
          <TextInput
            value={form.addressLine}
            onChange={(addressLine) => setField('addressLine', addressLine)}
            placeholder={t('stations.register.addressPlaceholder')}
            invalid={Boolean(errorFor('addressLine'))}
          />
        </FormField>

        <div className="grid grid-cols-2 gap-[11px]">
          <FormField
            label={t('stations.register.contactPhone')}
            hint={errorFor('contactPhone')}
            error={Boolean(errorFor('contactPhone'))}
          >
            <TextInput
              value={form.contactPhone}
              onChange={(contactPhone) => setField('contactPhone', contactPhone)}
              placeholder={t('stations.register.contactPhonePlaceholder')}
              invalid={Boolean(errorFor('contactPhone'))}
            />
          </FormField>

          <FormField label={t('stations.register.plannedChargers')} hint={errorFor('plannedChargePointCount')} error={Boolean(errorFor('plannedChargePointCount'))}>
            <TextInput
              invalid={Boolean(errorFor('plannedChargePointCount'))}
              value={String(form.plannedChargePointCount)}
              onChange={(v) =>
                setField('plannedChargePointCount', Number(v.replace(/\D/g, '')) || 0)
              }
              mono
            />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-[11px]">
          <FormField label={t('stations.register.latitude')} hint={errorFor('latitude')} error={Boolean(errorFor('latitude'))}>
            <TextInput
              value={form.latitude}
              onChange={(latitude) => setField('latitude', latitude)}
              placeholder={t('stations.register.latitudePlaceholder', { defaultValue: 'VD: 21.0285' })}
              mono
              invalid={Boolean(errorFor('latitude'))}
            />
          </FormField>

          <FormField label={t('stations.register.longitude')} hint={errorFor('longitude')} error={Boolean(errorFor('longitude'))}>
            <TextInput
              value={form.longitude}
              onChange={(longitude) => setField('longitude', longitude)}
              placeholder={t('stations.register.longitudePlaceholder', { defaultValue: 'VD: 105.8542' })}
              mono
              invalid={Boolean(errorFor('longitude'))}
            />
          </FormField>
        </div>

        <FormField label={t('stations.register.description')} hint={errorFor('description')} error={Boolean(errorFor('description'))}>
          <TextInput
            invalid={Boolean(errorFor('description'))}
            value={form.description}
            onChange={(description) => setField('description', description)}
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
          {mutation.isPending ? t('stations.register.submitting') : t(registration ? 'stations.edit.save' : 'stations.register.submitBtn')}
        </Button>
      </div>
    </Modal>
  );
}

