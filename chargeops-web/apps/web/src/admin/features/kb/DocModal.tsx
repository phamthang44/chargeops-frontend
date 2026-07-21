import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import type { PolicyDoc } from '@chargeops/api';
import { Button, FormField, Modal, Select } from '@chargeops/ui';

const CATEGORIES = ['Hủy & hoàn tiền', 'Check-in', 'Thanh toán', 'Giá', 'Trụ sạc', 'Tài khoản'];

const CAT_KEYS: Record<string, string> = {
  'Hủy & hoàn tiền': 'docModal.categories.cancellationRefund',
  'Check-in': 'docModal.categories.checkIn',
  'Thanh toán': 'docModal.categories.payment',
  'Giá': 'docModal.categories.pricing',
  'Trụ sạc': 'docModal.categories.chargers',
  'Tài khoản': 'docModal.categories.accounts',
};

export interface DocModalProps {
  open: boolean;
  /** Editing an existing doc, or null to create. */
  doc: PolicyDoc | null;
  pending: boolean;
  onClose: () => void;
  onSave: (input: { id?: string; category: string; content: string }) => void;
}

/** Create/edit a policy doc. Saving re-embeds it for the RAG assistant. */
export function DocModal({ open, doc, pending, onClose, onSave }: DocModalProps) {
  const { t } = useTranslation('admin');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [content, setContent] = useState('');
  const [err, setErr] = useState(false);

  useEffect(() => {
    if (open) {
      setCategory(doc?.category ?? CATEGORIES[0]);
      setContent(doc?.content ?? '');
      setErr(false);
    }
  }, [open, doc]);

  const submit = () => {
    if (!content.trim()) {
      setErr(true);
      return;
    }
    onSave({ id: doc?.id, category, content: content.trim() });
  };

  const categoryOptions = CATEGORIES.map((c) => ({
    value: c,
    label: t(CAT_KEYS[c] || c, { defaultValue: c }),
  }));

  return (
    <Modal open={open} onClose={onClose} maxWidth={480}>
      <div className="mb-0.5 text-[17px] font-bold">
        {doc ? t('docModal.editTitle') : t('docModal.addTitle')}
      </div>
      <div className="mb-[18px] text-[12.5px] text-muted">
        {t('docModal.subtitle')}
      </div>
      <div className="flex flex-col gap-[13px]">
        <FormField label={t('docModal.categoryLabel')}>
          <Select value={category} onChange={setCategory} options={categoryOptions} />
        </FormField>
        <FormField label={t('docModal.contentLabel')} error={err} hint={err ? t('docModal.contentRequired') : undefined}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t('docModal.placeholder')}
            className={`h-[110px] w-full resize-none rounded-[9px] border px-[11px] py-2.5 text-[13px] leading-[1.5] ${
              err ? 'border-bad' : 'border-line'
            }`}
          />
        </FormField>
      </div>
      <div className="mt-5 flex gap-2.5">
        <Button variant="secondary" className="flex-1" onClick={onClose}>
          {t('docModal.cancelBtn')}
        </Button>
        <Button className="flex-1" onClick={submit} disabled={pending}>
          {pending ? t('docModal.saving') : t('docModal.saveBtn')}
        </Button>
      </div>
    </Modal>
  );
}
