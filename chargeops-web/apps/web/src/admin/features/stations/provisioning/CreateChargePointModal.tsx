import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi, type ConnectorType } from '@chargeops/api';
import { Button, Modal, Select, useToast } from '@chargeops/ui';
import { getApiErrorMessage } from '../../../../i18n';
import { POWERS, useConnectorTypeOptions } from './provisioningConstants';

export interface CreateChargePointModalProps {
  stationId: string;
  stationName: string;
  onClose: () => void;
}

export function CreateChargePointModal({
  stationId,
  stationName,
  onClose,
}: CreateChargePointModalProps) {
  const { t } = useTranslation('admin');
  const api = useApi();
  const qc = useQueryClient();
  const toast = useToast();
  const connectorTypeOptions = useConnectorTypeOptions();

  const [name, setName] = useState('');
  const [zoneLabel, setZoneLabel] = useState('');
  const [connectorType, setConnectorType] = useState<ConnectorType>('CCS2');
  const [powerKw, setPowerKw] = useState(120);
  const [quantity, setQuantity] = useState(2);

  const create = useMutation({
    mutationFn: () =>
      api.chargePoints.provision({
        stationId,
        name: name.trim() || undefined,
        zoneLabel: zoneLabel.trim() || undefined,
        connectorGroups: [{ connectorType, powerKw, quantity }],
      }),
    onSuccess: (cp) => {
      qc.invalidateQueries({ queryKey: ['chargePoints'] });
      toast(t('provisioning.chargePoint.toastSuccess', { id: cp.id }), 'success');
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
            {t('provisioning.workspace.create.title')}
          </h3>
          <p className="text-[12px] text-muted mt-0.5">
            {t('provisioning.workspace.common.stationLabel')} <b className="text-ink">{stationName}</b>
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <label className="block text-[11px] font-bold uppercase text-faint mb-1">
              {t('provisioning.workspace.create.nameLabel')}
            </label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('provisioning.workspace.create.namePlaceholder')}
              className="w-full rounded-[8px] border border-line bg-surface p-2.5 text-[12.5px] text-ink focus:border-brand focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-faint mb-1">
              {t('provisioning.workspace.create.zoneLabel')}
            </label>
            <input
              value={zoneLabel}
              onChange={(e) => setZoneLabel(e.target.value)}
              placeholder={t('provisioning.workspace.create.zonePlaceholder')}
              className="w-full rounded-[8px] border border-line bg-surface p-2.5 text-[12.5px] text-ink focus:border-brand focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold uppercase text-faint mb-1">
                {t('provisioning.workspace.create.standardLabel')}
              </label>
              <Select
                value={connectorType}
                onChange={(value) => setConnectorType(value as ConnectorType)}
                options={connectorTypeOptions}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-faint mb-1">
                {t('provisioning.workspace.create.powerLabel')}
              </label>
              <Select
                value={String(powerKw)}
                onChange={(value) => setPowerKw(Number(value))}
                options={POWERS}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-faint mb-1">
                {t('provisioning.workspace.create.quantityLabel')}
              </label>
              <input
                type="number"
                min={1}
                max={8}
                value={quantity}
                onChange={(event) => setQuantity(Number(event.target.value))}
                required
                className="w-full rounded-[8px] border border-line bg-surface p-2.5 text-[12.5px] text-ink focus:border-brand focus:outline-none"
              />
            </div>
          </div>

          <div className="rounded-[8px] bg-surface-2 p-3 text-[11.5px] text-muted">
            {t('provisioning.workspace.create.help')}
          </div>
        </div>

        <div className="mt-2 flex justify-end gap-2.5 border-t border-hairline pt-3">
          <Button variant="secondary" type="button" onClick={onClose} disabled={create.isPending}>
            {t('provisioning.cancel')}
          </Button>
          <Button type="submit" disabled={create.isPending}>
            {create.isPending
              ? t('provisioning.workspace.create.submitting')
              : t('provisioning.workspace.create.submitBtn')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
