import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import type { TouDays, TouRule } from '@chargeops/api';
import { Button, FormField, IconClock, Modal, Select, TextInput } from '@chargeops/ui';

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

export interface AddRuleModalProps {
  open: boolean;
  onClose: () => void;
  initialRule?: TouRule | null;
  onSave: (rule: Omit<TouRule, 'id'>, editId?: string) => void;
}

/** Add or edit a time-of-use pricing window. Local validation; the parent persists on save. */
export function AddRuleModal({ open, onClose, initialRule, onSave }: AddRuleModalProps) {
  const { t } = useTranslation('owner');
  const [name, setName] = useState('');
  const [days, setDays] = useState<TouDays>('daily');
  const [rate, setRate] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    if (initialRule) {
      setName(initialRule.name);
      setDays(initialRule.days);
      setRate(String(initialRule.rateVnd));
      setFrom(initialRule.from);
      setTo(initialRule.to);
    } else {
      setName('');
      setDays('daily');
      setRate('');
      setFrom('');
      setTo('');
    }
    setShowErrors(false);
  }, [initialRule, open]);

  const dayOpts = [
    { value: 'daily', label: t('pricing.days.daily', { defaultValue: 'Hàng ngày (T2–CN)' }) },
    { value: 'weekdays', label: t('pricing.days.weekdays', { defaultValue: 'Ngày thường (T2–T6)' }) },
    { value: 'weekends', label: t('pricing.days.weekends', { defaultValue: 'Cuối tuần (T7–CN)' }) },
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
    onSave(
      { name: name.trim(), days, from, to, rateVnd: rateNum },
      initialRule?.id,
    );
    close();
  };

  return (
    <Modal open={open} onClose={close} maxWidth={440}>
      <div className="mb-[18px] flex items-start gap-3">
        <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] bg-owner-soft">
          <IconClock size={19} className="text-owner-deep" />
        </span>
        <div>
          <div className="text-[17px] font-bold text-ink">
            {initialRule
              ? t('pricing.addRule.editTitle', { defaultValue: 'Chỉnh sửa khung giá' })
              : t('pricing.addRule.title', { defaultValue: 'Thêm khung giá' })}
          </div>
          <div className="mt-0.5 text-[12px] text-muted">
            {t('pricing.addRule.subtitle', {
              defaultValue: 'Mức giá riêng áp dụng cho các lượt đặt rơi vào khung giờ này.',
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-[13px]">
        <FormField label={t('pricing.addRule.ruleName', { defaultValue: 'TÊN KHUNG GIÁ' })}>
          <TextInput
            value={name}
            onChange={setName}
            placeholder={t('pricing.addRule.namePlaceholder', { defaultValue: 'VD: Giờ cao điểm chiều' })}
            invalid={showErrors && !name.trim()}
          />
        </FormField>
        <div className="flex gap-[11px]">
          <div className="flex-1">
            <FormField label={t('pricing.addRule.applyDays', { defaultValue: 'NGÀY ÁP DỤNG' })}>
              <Select
                value={days}
                onChange={(v) => setDays(v as TouDays)}
                options={dayOpts}
                accent="owner"
              />
            </FormField>
          </div>
          <div className="flex-1">
            <FormField label={t('pricing.addRule.priceLabel', { defaultValue: 'GIÁ SẠC (VNĐ/kWh)' })}>
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
            <FormField label={t('pricing.addRule.from', { defaultValue: 'TỪ GIỜ (HH:mm)' })}>
              <TextInput
                value={from}
                onChange={setFrom}
                placeholder="17:00"
                mono
                invalid={showErrors && !HHMM.test(from)}
              />
            </FormField>
          </div>
          <div className="flex-1">
            <FormField label={t('pricing.addRule.to', { defaultValue: 'ĐẾN GIỜ (HH:mm)' })}>
              <TextInput
                value={to}
                onChange={setTo}
                placeholder="21:00"
                mono
                invalid={showErrors && !HHMM.test(to)}
              />
            </FormField>
          </div>
        </div>
        {showErrors && invalid && (
          <div className="text-[11.5px] font-medium text-bad">
            {t('pricing.addRule.validationError', {
              defaultValue: 'Vui lòng nhập đầy đủ tên, giá và định dạng giờ hợp lệ (HH:mm).',
            })}
          </div>
        )}
      </div>

      <div className="mt-5 flex gap-2.5">
        <Button variant="secondary" size="lg" className="flex-1" onClick={close}>
          {t('pricing.addRule.cancelBtn', { defaultValue: 'Hủy' })}
        </Button>
        <Button accent="owner" size="lg" className="flex-1" onClick={submit}>
          {initialRule
            ? t('pricing.addRule.updateBtn', { defaultValue: 'Cập nhật khung giá' })
            : t('pricing.addRule.saveBtn', { defaultValue: 'Lưu khung giá' })}
        </Button>
      </div>
    </Modal>
  );
}
