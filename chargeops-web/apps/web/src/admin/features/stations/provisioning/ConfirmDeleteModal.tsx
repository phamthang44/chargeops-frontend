import { Trans, useTranslation } from 'react-i18next';
import type { ChargePoint, Connector } from '@chargeops/api';
import { Button, IconAlertTriangle, IconTrash, Modal } from '@chargeops/ui';

export interface ConfirmDeleteModalProps {
  open: boolean;
  type: 'chargePoint' | 'connector';
  chargePoint: ChargePoint;
  connector?: Connector;
  isSubmitting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDeleteModal({
  open,
  type,
  chargePoint,
  connector,
  isSubmitting,
  onConfirm,
  onClose,
}: ConfirmDeleteModalProps) {
  const { t } = useTranslation('admin');
  const isCp = type === 'chargePoint';
  const title = isCp
    ? t('provisioning.workspace.delete.cpTitle')
    : t('provisioning.workspace.delete.connTitle');
  const cpName = chargePoint.name || chargePoint.chargePointCode || chargePoint.id;
  const connCode = connector?.connectorCode || connector?.id || t('provisioning.workspace.delete.connectorFallback');

  return (
    <Modal open={open} onClose={onClose} maxWidth={460}>
      <div className="flex flex-col gap-4 text-[13px] text-body">
        <div className="border-b border-hairline pb-2.5">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-bad-soft text-bad">
              <IconTrash size={15} />
            </span>
            <h3 className="text-[16px] font-bold text-ink">{title}</h3>
          </div>
          <p className="text-[12px] text-muted mt-1">
            {isCp ? (
              <>
                {t('provisioning.workspace.delete.cpLabel')}{' '}
                <b className="font-mono text-ink">{cpName}</b>
              </>
            ) : (
              <>
                {t('provisioning.workspace.delete.codeLabel')}{' '}
                <b className="font-mono text-brand">{connCode}</b> ·{' '}
                {t('provisioning.workspace.delete.cpLabel')}{' '}
                <b className="text-ink">{cpName}</b>
              </>
            )}
          </p>
        </div>

        <div className="flex items-start gap-3 rounded-[10px] bg-bad-soft/30 p-3.5 text-xs leading-relaxed text-bad-deep">
          <IconAlertTriangle size={18} className="mt-0.5 shrink-0 text-bad" />
          <div>
            {isCp ? (
              <Trans
                t={t}
                i18nKey="provisioning.workspace.delete.cpBody"
                values={{ name: cpName }}
                components={{ bold: <b /> }}
              />
            ) : (
              <Trans
                t={t}
                i18nKey="provisioning.workspace.delete.connBody"
                values={{
                  code: connCode,
                  type: connector?.connectorType,
                  power: connector?.powerKw,
                  cp: cpName,
                }}
                components={{ bold: <b /> }}
              />
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 border-t border-hairline pt-3">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={isSubmitting}>
            {t('provisioning.cancel')}
          </Button>
          <Button
            variant="danger"
            size="sm"
            disabled={isSubmitting}
            onClick={onConfirm}
            className="flex items-center gap-1.5 font-bold cursor-pointer"
          >
            <IconTrash size={13} strokeWidth={2.2} />
            <span>
              {isSubmitting
                ? t('provisioning.workspace.delete.deleting')
                : isCp
                ? t('provisioning.workspace.delete.confirmCpBtn')
                : t('provisioning.workspace.delete.confirmConnectorBtn')}
            </span>
          </Button>
        </div>
      </div>
    </Modal>
  );
}
