import { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi, type ChargePoint, type Connector, type ConnectorType } from '@chargeops/api';
import { Button, Modal, Select, useToast } from '@chargeops/ui';
import { getApiErrorMessage } from '../../../../i18n';
import { POWERS, useConnectorTypeOptions } from './provisioningConstants';

export interface EditConnectorModalProps {
  stationId?: string;
  chargePoint: ChargePoint;
  connector: Connector;
  onClose: () => void;
}

export function EditConnectorModal({
  stationId,
  chargePoint,
  connector,
  onClose,
}: EditConnectorModalProps) {
  const { t } = useTranslation('admin');
  const api = useApi();
  const qc = useQueryClient();
  const toast = useToast();
  const connectorTypeOptions = useConnectorTypeOptions();

  const [connectorType, setConnectorType] = useState<ConnectorType>(
    (connector.connectorType as ConnectorType) || 'CCS2'
  );
  const [powerKw, setPowerKw] = useState<number>(Number(connector.powerKw) || 60);

  const updateMutation = useMutation({
    mutationFn: () =>
      api.connectors.update(connector.id, {
        stationId: stationId || chargePoint.stationId,
        chargePointId: chargePoint.id,
        connectorType,
        powerKw,
      }),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ['connectors'] });
      qc.invalidateQueries({ queryKey: ['chargePoints'] });
      toast(t('provisioning.workspace.connectorForm.updateToast', { id: updated.connectorCode || updated.id }), 'success');
      onClose();
    },
    onError: (e) => toast(getApiErrorMessage(e), 'error'),
  });

  return (
    <Modal open onClose={onClose} maxWidth={480}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          updateMutation.mutate();
        }}
        className="flex flex-col gap-4 text-[13px] text-body"
      >
        <div className="border-b border-hairline pb-2.5">
          <h3 className="text-[16px] font-bold text-ink">
            {t('provisioning.workspace.connectorForm.editTitle')}
          </h3>
          <p className="text-[12px] text-muted mt-0.5">
            {t('provisioning.workspace.connectorForm.editCodeLabel')}{' '}
            <b className="font-mono text-brand">{connector.connectorCode || connector.id}</b> ·{' '}
            {t('provisioning.workspace.common.cpLabel')} <b>{chargePoint.name || chargePoint.chargePointCode || chargePoint.id}</b>
          </p>
        </div>

        <div className="rounded-[8px] border border-brand/30 bg-brand-soft/20 p-3 text-[11.5px] leading-relaxed text-brand-strong">
          <Trans
            t={t}
            i18nKey="provisioning.workspace.connectorForm.editNotice"
            components={{ bold: <b /> }}
          />
        </div>

        <div className="flex flex-col gap-3">
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
        </div>

        <div className="mt-2 flex justify-end gap-2.5 border-t border-hairline pt-3">
          <Button variant="secondary" type="button" onClick={onClose} disabled={updateMutation.isPending}>
            {t('provisioning.cancel')}
          </Button>
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending
              ? t('provisioning.workspace.connectorForm.editSubmitting')
              : t('provisioning.workspace.connectorForm.editSubmitBtn')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
