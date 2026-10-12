import { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import type { ChargePoint } from '@chargeops/api';
import { Button, IconAlertTriangle, IconBolt, Modal } from '@chargeops/ui';

export interface SuspendReactivateChargePointModalProps {
  chargePoint: ChargePoint;
  action: 'suspend' | 'reactivate';
  isSubmitting: boolean;
  onSubmit: (reason: string) => void;
  onClose: () => void;
}

export function SuspendReactivateChargePointModal({
  chargePoint,
  action,
  isSubmitting,
  onSubmit,
  onClose,
}: SuspendReactivateChargePointModalProps) {
  const { t } = useTranslation('admin');
  const [reason, setReason] = useState('');
  const isSuspend = action === 'suspend';
  const cpName = chargePoint.name || chargePoint.chargePointCode || chargePoint.id;

  return (
    <Modal open onClose={onClose} maxWidth={500}>
      <div className="flex flex-col gap-4 text-[13px] text-body">
        <div className="border-b border-hairline pb-2.5">
          <h3 className="text-[16px] font-bold text-ink">
            {isSuspend
              ? t('provisioning.workspace.suspend.title')
              : t('provisioning.workspace.reactivate.title')}
          </h3>
          <p className="text-[12px] text-muted mt-0.5">
            {t('provisioning.workspace.common.cpLabel')}{' '}
            <b className="text-ink">{cpName}</b>
          </p>
        </div>

        <div
          className={`flex items-start gap-3 rounded-xl border p-3.5 text-xs leading-relaxed ${
            isSuspend ? 'border-warn-border bg-warn-soft text-warn-deep' : 'border-good/30 bg-good-soft/30 text-ink'
          }`}
        >
          <div className="mt-0.5 shrink-0">
            {isSuspend ? <IconAlertTriangle size={18} /> : <IconBolt size={18} className="text-good" />}
          </div>
          <div>
            {isSuspend ? (
              <Trans
                t={t}
                i18nKey="provisioning.workspace.suspend.body"
                values={{ name: cpName }}
                components={{ bold: <b /> }}
              />
            ) : (
              <Trans
                t={t}
                i18nKey="provisioning.workspace.reactivate.body"
                values={{ name: cpName }}
                components={{ bold: <b /> }}
              />
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-faint mb-1.5">
            {isSuspend
              ? t('provisioning.workspace.suspend.reasonLabel')
              : t('provisioning.workspace.reactivate.reasonLabel')}
          </label>
          <textarea
            autoFocus
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder={
              isSuspend
                ? t('provisioning.workspace.suspend.reasonPlaceholder')
                : t('provisioning.workspace.reactivate.reasonPlaceholder')
            }
            className="w-full rounded-xl border border-line-2 bg-surface p-3 text-xs text-ink placeholder:text-faint focus:border-brand focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-hairline pt-3">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={isSubmitting}>
            {t('provisioning.cancel')}
          </Button>
          <Button
            variant={isSuspend ? 'danger' : 'primary'}
            size="sm"
            disabled={!reason.trim() || isSubmitting}
            onClick={() => onSubmit(reason.trim())}
          >
            {isSubmitting
              ? t('provisioning.workspace.common.processing')
              : isSuspend
              ? t('provisioning.workspace.suspend.confirmBtn')
              : t('provisioning.workspace.reactivate.confirmBtn')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
