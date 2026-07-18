import { useState } from 'react';
import type { TouDays, TouRule } from '@chargeops/api';
import { FormField, IconClock, Modal, TextInput } from '@chargeops/ui';

const DAY_OPTS: { value: TouDays; label: string }[] = [
  { value: 'daily', label: 'Mỗi ngày' },
  { value: 'weekdays', label: 'T2–T6' },
  { value: 'weekends', label: 'T7–CN' },
];

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

export interface AddRuleModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (rule: Omit<TouRule, 'id'>) => void;
}

/** Add a time-of-use pricing window. Local validation; the parent persists on save. */
export function AddRuleModal({ open, onClose, onAdd }: AddRuleModalProps) {
  const [name, setName] = useState('');
  const [days, setDays] = useState<TouDays>('daily');
  const [rate, setRate] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [showErrors, setShowErrors] = useState(false);

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
          <div className="text-[17px] font-bold">Thêm khung giờ</div>
          <div className="mt-0.5 text-[12px] text-muted">
            Mức giá riêng mà các lượt đặt trong khung giờ này sẽ chụp lại.
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-[13px]">
        <FormField label="TÊN QUY TẮC">
          <TextInput
            value={name}
            onChange={setName}
            placeholder="VD: Giờ cao điểm tối"
            invalid={showErrors && !name.trim()}
          />
        </FormField>
        <div className="flex gap-[11px]">
          <div className="flex-1">
            <FormField label="NGÀY ÁP DỤNG">
              <select
                value={days}
                onChange={(e) => setDays(e.target.value as TouDays)}
                className="w-full cursor-pointer rounded-[9px] border border-line bg-white px-[11px] py-[9px] text-[13px] font-medium"
              >
                {DAY_OPTS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
          <div className="flex-1">
            <FormField label="GIÁ (₫/kWh)">
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
            <FormField label="TỪ">
              <TextInput value={from} onChange={setFrom} placeholder="17:00" mono invalid={showErrors && !HHMM.test(from)} />
            </FormField>
          </div>
          <div className="flex-1">
            <FormField label="ĐẾN">
              <TextInput value={to} onChange={setTo} placeholder="21:00" mono invalid={showErrors && !HHMM.test(to)} />
            </FormField>
          </div>
        </div>
        {showErrors && invalid && (
          <div className="text-[11.5px] font-medium text-bad">
            Vui lòng nhập tên quy tắc, mức giá và khung giờ hợp lệ (HH:mm).
          </div>
        )}
      </div>

      <div className="mt-5 flex gap-2.5">
        <button
          onClick={close}
          className="flex-1 rounded-[10px] border border-line py-3 text-[13px] font-semibold text-body hover:bg-canvas"
        >
          Hủy bỏ
        </button>
        <button
          onClick={submit}
          className="flex-1 rounded-[10px] bg-owner py-3 text-[13px] font-semibold text-white shadow-[0_1px_3px_rgba(18,161,80,.35)] hover:bg-owner-strong"
        >
          Lưu khung giờ
        </button>
      </div>
    </Modal>
  );
}
