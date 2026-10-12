import { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import type { ChargePoint } from '@chargeops/api';
import { Button, Modal } from '@chargeops/ui';

export interface ActivateChargePointModalProps {
  chargePoint: ChargePoint;
  actualConnectorCount: number;
  isSubmitting: boolean;
  onSubmit: (expectedConnectorCount: number) => void;
  onClose: () => void;
}

export function ActivateChargePointModal({
  chargePoint,
  actualConnectorCount,
  isSubmitting,
  onSubmit,
  onClose,
}: ActivateChargePointModalProps) {
  const { t } = useTranslation('admin');
  const [expectedCount, setExpectedCount] = useState('');
  const parsedCount = Number(expectedCount);
  const isPositiveInteger = Number.isInteger(parsedCount) && parsedCount >= 1;
  const countMatches = isPositiveInteger && parsedCount === actualConnectorCount;

  return (
    <Modal open onClose={onClose} maxWidth={480}>
      <div className="flex flex-col gap-4 text-[13px] text-body">
        <div className="border-b border-hairline pb-2.5">
          <h3 className="text-[16px] font-bold text-ink">
            {t('provisioning.workspace.activate.title')}
          </h3>
          <p className="mt-0.5 text-[12px] text-muted">
            {t('provisioning.workspace.common.cpLabel')}{' '}
            <b className="text-ink">{chargePoint.name || chargePoint.chargePointCode || chargePoint.id}</b>
          </p>
        </div>

        <div className="rounded-xl border border-warn-border bg-warn-soft p-3.5 text-xs leading-relaxed text-warn-deep">
          <Trans
            t={t}
            i18nKey="provisioning.workspace.activate.warning"
            values={{ count: actualConnectorCount }}
            components={{ bold: <b /> }}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase text-faint">
            {t('provisioning.workspace.activate.countLabel')}
          </label>
          <input
            autoFocus
            type="number"
            min={1}
            step={1}
            value={expectedCount}
            onChange={(event) => setExpectedCount(event.target.value)}
            placeholder={t('provisioning.workspace.activate.countPlaceholder', { count: actualConnectorCount })}
            className="w-full rounded-xl border border-line-2 bg-surface p-3 text-xs text-ink placeholder:text-faint focus:border-brand focus:outline-none"
          />
          {isPositiveInteger && !countMatches && (
            <p className="mt-1.5 text-xs text-bad font-medium">
              {t('provisioning.workspace.activate.countMismatch', { count: actualConnectorCount })}
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-hairline pt-3">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={isSubmitting}>
            {t('provisioning.cancel')}
          </Button>
          <Button
            size="sm"
            disabled={!countMatches || isSubmitting}
            onClick={() => onSubmit(parsedCount)}
          >
            {isSubmitting ? t('provisioning.activating') : t('provisioning.workspace.activate.confirmBtn')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
