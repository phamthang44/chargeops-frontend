import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Button, FormField, Modal } from '@chargeops/ui';

export interface RejectModalProps {
  open: boolean;
  stationName: string;
  pending: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

/** Reject a station registration with a required reason (shown to the owner). */
export function RejectModal({ open, stationName, pending, onClose, onConfirm }: RejectModalProps) {
  const { t } = useTranslation('admin');
  const [reason, setReason] = useState('');
  const [err, setErr] = useState(false);

  const close = () => {
    setReason('');
    setErr(false);
    onClose();
  };
  const submit = () => {
    if (!reason.trim()) {
      setErr(true);
      return;
    }
    onConfirm(reason.trim());
    setReason('');
    setErr(false);
  };

  return (
    <Modal open={open} onClose={close} maxWidth={420}>
      <div className="mb-0.5 text-[17px] font-bold">{t('rejectModal.title')}</div>
      <div className="mb-4 text-[12.5px] text-muted">
        {t('rejectModal.subtitle', { name: stationName })}
      </div>
      <FormField label={t('rejectModal.reasonLabel')} error={err} hint={err ? t('rejectModal.reasonRequired') : undefined}>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={t('rejectModal.placeholder')}
          className={`h-[84px] w-full resize-none rounded-[9px] border px-[11px] py-2.5 text-[13px] ${
            err ? 'border-bad' : 'border-line'
          }`}
        />
      </FormField>
      <div className="mt-[18px] flex gap-2.5">
        <Button variant="secondary" className="flex-1" onClick={close}>
          {t('rejectModal.cancelBtn')}
        </Button>
        <Button variant="danger" className="flex-1" onClick={submit} disabled={pending}>
          {pending ? t('rejectModal.processing') : t('rejectModal.confirmBtn')}
        </Button>
      </div>
    </Modal>
  );
}
