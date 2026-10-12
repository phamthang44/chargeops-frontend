import { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi, type ChargePoint, type ConnectorType } from '@chargeops/api';
import { Button, Modal, Select, useToast } from '@chargeops/ui';
import { getApiErrorMessage } from '../../../../i18n';
import { POWERS, useConnectorTypeOptions } from './provisioningConstants';

export interface AddConnectorModalProps {
  stationId?: string;
  chargePoint: ChargePoint;
  onClose: () => void;
}

export function AddConnectorModal({
  stationId,
  chargePoint,
  onClose,
}: AddConnectorModalProps) {
  const { t } = useTranslation('admin');
  const api = useApi();
  const qc = useQueryClient();
  const toast = useToast();
  const connectorTypeOptions = useConnectorTypeOptions();

  const [connectorCode, setConnectorCode] = useState('C-01');
  const [connectorType, setConnectorType] = useState<ConnectorType>('CCS2');
  const [powerKw, setPowerKw] = useState(60);

  const create = useMutation({
    mutationFn: () =>
      api.connectors.provision({
        stationId: stationId || chargePoint.stationId,
        chargePointId: chargePoint.id,
        connectorCode: connectorCode.trim() || 'C-01',
        connectorType,
        powerKw,
      }),
    onSuccess: (c) => {
      qc.invalidateQueries({ queryKey: ['connectors'] });
      qc.invalidateQueries({ queryKey: ['chargePoints'] });
      toast(t('provisioning.connector.toastSuccess', { id: c.connectorCode || c.id }), 'success');
      onClose();
    },
    onError: (e) => toast(getApiErrorMessage(e), 'error'),
  });

  return (
    <Modal open onClose={onClose} maxWidth={480}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate();
        }}
        className="flex flex-col gap-4 text-[13px] text-body"
      >
        <div className="border-b border-hairline pb-2.5">
          <h3 className="text-[16px] font-bold text-ink">
            {t('provisioning.workspace.connectorForm.addTitle')}
          </h3>
          <p className="text-[12px] text-muted mt-0.5">
            {t('provisioning.workspace.common.cpLabel')}{' '}
            <b className="font-mono text-brand">{chargePoint.chargePointCode || chargePoint.id}</b>
            {chargePoint.name ? ` (${chargePoint.name})` : ''}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <label className="block text-[11px] font-bold uppercase text-faint mb-1">
              {t('provisioning.workspace.connectorForm.codeLabel')}
            </label>
            <input
              autoFocus
              value={connectorCode}
              onChange={(e) => setConnectorCode(e.target.value)}
              placeholder={t('provisioning.workspace.connectorForm.codePlaceholder')}
              required
              className="w-full rounded-[8px] border border-line-2 bg-surface p-2.5 text-[12.5px] font-mono text-ink focus:border-brand focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-faint mb-1">
              {t('provisioning.workspace.connectorForm.typeLabel')}
            </label>
            <Select
              value={connectorType}
              onChange={(val) => setConnectorType(val as ConnectorType)}
              options={connectorTypeOptions}
            />
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold uppercase text-faint mb-1">
                {t('provisioning.workspace.connectorForm.powerLabel')}
              </label>
              <Select
                value={String(powerKw)}
                onChange={(val) => setPowerKw(Number(val))}
                options={POWERS}
              />
            </div>
          </div>

          <div className="rounded-[8px] bg-surface-2 p-3 text-[11.5px] text-muted border border-line-2">
            <Trans
              t={t}
              i18nKey="provisioning.workspace.connectorForm.addHelp"
              components={{ bold: <b /> }}
            />
          </div>
        </div>

        <div className="mt-2 flex justify-end gap-2.5 border-t border-hairline pt-3">
          <Button variant="secondary" type="button" onClick={onClose} disabled={create.isPending}>
            {t('provisioning.cancel')}
          </Button>
          <Button type="submit" disabled={create.isPending}>
            {create.isPending
              ? t('provisioning.workspace.connectorForm.addSubmitting')
              : t('provisioning.workspace.connectorForm.addSubmitBtn')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
