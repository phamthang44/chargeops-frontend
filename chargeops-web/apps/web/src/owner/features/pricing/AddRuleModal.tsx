import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import type { TouDays, TouRule } from '@chargeops/api';
import { Button, FormField, IconClock, Modal, Select, TextInput } from '@chargeops/ui';

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

export interface AddRuleModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (rule: Omit<TouRule, 'id'>) => void;
}

/** Add a time-of-use pricing window. Local validation; the parent persists on save. */
export function AddRuleModal({ open, onClose, onAdd }: AddRuleModalProps) {
  const { t } = useTranslation('owner');
  const [name, setName] = useState('');
  const [days, setDays] = useState<TouDays>('daily');
  const [rate, setRate] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [showErrors, setShowErrors] = useState(false);

  const dayOpts = [
    { value: 'daily', label: t('pricing.days.daily') },
    { value: 'weekdays', label: t('pricing.days.weekdays') },
    { value: 'weekends', label: t('pricing.days.weekends') },
  ];

  const rateNum = Number(rate.replace(/\D/g, ''));
  const invalid = !name.trim() || !rateNum || !HHMM.test(from) || !HHMM.test(to);

  const close = () => {
    setName('');
    setDays('daily');
    setRate('');
    setFrom('');
    setTo('');
    setShowErrors(false);
    onClose();
  };

  const submit = () => {
    if (invalid) {
      setShowErrors(true);
      return;
    }
    onAdd({ name: name.trim(), days, from, to, rateVnd: rateNum });
    close();
  };

  return (
    <Modal open={open} onClose={close} maxWidth={440}>
      <div className="mb-[18px] flex items-start gap-3">
        <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] bg-owner-soft">
          <IconClock size={19} className="text-owner" />
        </span>
        <div>
          <div className="text-[17px] font-bold">{t('pricing.addRule.title')}</div>
          <div className="mt-0.5 text-[12px] text-muted">
            {t('pricing.addRule.subtitle')}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-[13px]">
        <FormField label={t('pricing.addRule.ruleName')}>
          <TextInput
            value={name}
            onChange={setName}
            placeholder={t('pricing.addRule.namePlaceholder')}
            invalid={showErrors && !name.trim()}
          />
        </FormField>
        <div className="flex gap-[11px]">
          <div className="flex-1">
            <FormField label={t('pricing.addRule.applyDays')}>
              <Select
                value={days}
                onChange={(v) => setDays(v as TouDays)}
                options={dayOpts}
                accent="owner"
              />
            </FormField>
          </div>
          <div className="flex-1">
            <FormField label={t('pricing.addRule.priceLabel')}>
              <TextInput
                value={rate}
                onChange={setRate}
                placeholder="VD: 4200"
                mono
                invalid={showErrors && !rateNum}
              />
            </FormField>
          </div>
        </div>
        <div className="flex gap-[11px]">
          <div className="flex-1">
            <FormField label={t('pricing.addRule.from')}>
              <TextInput value={from} onChange={setFrom} placeholder="17:00" mono invalid={showErrors && !HHMM.test(from)} />
            </FormField>
          </div>
          <div className="flex-1">
            <FormField label={t('pricing.addRule.to')}>
              <TextInput value={to} onChange={setTo} placeholder="21:00" mono invalid={showErrors && !HHMM.test(to)} />
            </FormField>
          </div>
        </div>
        {showErrors && invalid && (
          <div className="text-[11.5px] font-medium text-bad">
            {t('pricing.addRule.validationError')}
          </div>
        )}
      </div>

      <div className="mt-5 flex gap-2.5">
        <Button variant="secondary" size="lg" className="flex-1" onClick={close}>
          {t('pricing.addRule.cancelBtn')}
        </Button>
        <Button accent="owner" size="lg" className="flex-1" onClick={submit}>
          {t('pricing.addRule.saveBtn')}
        </Button>
      </div>
    </Modal>
  );
}
