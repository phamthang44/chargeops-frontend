import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  IconAlertTriangle,
  IconBolt,
  IconClock,
  Modal,
  StatusPill,
} from '@chargeops/ui';
import type {
  ConnectorRuntimeStatus,
  OperationalChargePointStatus,
  StaffChargePointItem,
  StaffConnectorItem,
} from '@chargeops/api';

export type StaffStatusTarget =
  | {
      kind: 'chargePoint';
      chargePoint: StaffChargePointItem;
      /** Connector count under this charge point — shown in the impact copy. */
      connectorCount: number;
      next: OperationalChargePointStatus;
    }
  | {
      kind: 'connector';
      chargePoint: StaffChargePointItem;
      connector: StaffConnectorItem;
      next: ConnectorRuntimeStatus;
    };

export interface StaffStatusChangeDialogProps {
  target: StaffStatusTarget | null;
  saving: boolean;
  onClose: () => void;
  onConfirm: (target: StaffStatusTarget, reason: string) => void;
  onReportIncident?: (target: StaffStatusTarget) => void;
}

const REASON_PRESETS: Record<string, string[]> = {
  MAINTENANCE: [
    'Bảo trì định kỳ phần hardware',
    'Kiểm tra an toàn đường dây & trạm biến áp',
    'Bảo dưỡng và vệ sinh đầu súng sạc',
    'Nâng cấp firmware / phần mềm điều khiển',
  ],
  OFFLINE: [
    'Tạm ngắt nguồn điện',
    'Sự cố thiết bị phần cứng',
    'Tạm đóng cửa khu vực trạm sạc',
    'Khu vực thi công / sửa chữa hạ tầng',
  ],
};

/**
 * Confirmation gate for staff status changes (Ops-03 / Ops-04). The request
 * carries `expectedVersion` (optimistic lock) plus the mandatory reason for any
 * non-AVAILABLE target; the server refuses with `STAFF_OP_002` when a booking
 * or charging session is still attached, so that case surfaces as an error
 * rather than a pre-check.
 */
export function StaffStatusChangeDialog({
  target,
  saving,
  onClose,
  onConfirm,
  onReportIncident,
}: StaffStatusChangeDialogProps) {
  const { t } = useTranslation('staff');
  const [reason, setReason] = useState('');

  useEffect(() => {
    setReason('');
  }, [target]);

  if (!target) return null;

  const goingDown = target.next === 'OFFLINE' || target.next === 'MAINTENANCE';
  const requiresReason = target.next !== 'AVAILABLE';
  const isMaint = target.next === 'MAINTENANCE';
  const isReasonValid = !requiresReason || reason.trim().length >= 3;

  const currentStatus =
    target.kind === 'chargePoint' ? target.chargePoint.operationalStatus : target.connector.runtimeStatus;
  const name =
    target.kind === 'chargePoint'
      ? target.chargePoint.name || target.chargePoint.code
      : target.connector.code || target.connector.id;
  const version = target.kind === 'chargePoint' ? target.chargePoint.version : target.connector.version;
  const presets = REASON_PRESETS[target.next] ?? [];

  return (
    <Modal open onClose={onClose} maxWidth={480}>
      <div className="mb-3 flex items-start gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] ${
            isMaint ? 'bg-warn-soft' : goingDown ? 'bg-bad-soft' : 'bg-owner-soft'
          }`}
        >
          {isMaint ? (
            <IconClock size={18} className="text-warn" />
          ) : goingDown ? (
            <IconAlertTriangle size={18} className="text-bad" />
          ) : (
            <IconBolt size={18} className="text-owner" />
          )}
        </span>
        <div className="min-w-0 flex-1 pt-0.5">
          <div className="text-[15.5px] font-bold leading-snug">
            {t('statusDialog.title', { name })}
          </div>
          <div className="mt-1 flex items-center gap-2 text-[12px]">
            <StatusPill tone={statusTone(currentStatus)} label={t(`status.${currentStatus}`)} />
            <span className="font-mono font-bold text-faint">→</span>
            <StatusPill tone={statusTone(target.next)} label={t(`status.${target.next}`)} />
          </div>
        </div>
      </div>

      {goingDown && (
        <ul className="flex flex-col gap-2 rounded-card border border-line-3 p-3.5">
          <Impact tone="bad">
            {target.kind === 'chargePoint'
              ? t('statusDialog.impactDevice', { count: target.connectorCount })
              : t('statusDialog.impactConnector')}
          </Impact>
          <Impact tone="bad">{t('statusDialog.impactHidden')}</Impact>
          <Impact tone="muted">{t('statusDialog.impactRestore')}</Impact>
        </ul>
      )}

      {target.kind === 'connector' && target.next === 'OFFLINE' && onReportIncident && (
        <div className="mt-3 rounded-xl border border-bad-border bg-bad-soft p-3 text-[12px] text-bad-deep">
          <div className="mb-1 flex items-center gap-1.5 font-bold text-bad">
            <IconAlertTriangle size={15} />
            <span>{t('statusDialog.incidentTitle')}</span>
          </div>
          <p className="mb-2 text-[11.5px] leading-relaxed">{t('statusDialog.incidentBody')}</p>
          <Button
            size="sm"
            variant="danger"
            className="w-full justify-center"
            onClick={() => onReportIncident(target)}
          >
            {t('statusDialog.incidentBtn')}
          </Button>
        </div>
      )}

      <div className="mt-3.5 flex flex-col gap-1.5 rounded-[10px] border border-line-2 bg-surface-2 p-3">
        <label className="text-[11.5px] font-bold text-ink">
          {t('statusDialog.reasonLabel')}
          {requiresReason && <span className="text-bad"> *</span>}
        </label>
        {presets.length > 0 && (
          <div className="mb-1 flex flex-wrap gap-1.5">
            {presets.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setReason(p)}
                className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition ${
                  reason === p
                    ? 'border-owner bg-owner text-white font-semibold'
                    : 'border-line-2 bg-surface text-body hover:border-line-3'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
        <textarea
          rows={2}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={t('statusDialog.reasonPlaceholder')}
          className="w-full rounded-[8px] border border-line bg-surface px-3 py-2 text-[12px] font-medium text-ink focus:border-owner focus:outline-none"
        />
        <span className="text-[10.5px] text-faint">{t('statusDialog.versionNote', { version })}</span>
      </div>

      <div className="mt-[18px] flex justify-end gap-2.5">
        <Button variant="secondary" onClick={onClose}>
          {t('statusDialog.cancel')}
        </Button>
        <Button
          variant={isMaint ? 'primary' : goingDown ? 'danger' : 'primary'}
          onClick={() => onConfirm(target, reason.trim())}
          disabled={saving || !isReasonValid}
        >
          {saving ? t('statusDialog.applying') : t('statusDialog.confirm')}
        </Button>
      </div>
    </Modal>
  );
}

function statusTone(status: string): 'good' | 'warn' | 'bad' | 'brand' | 'neutral' {
  switch (status) {
    case 'AVAILABLE':
    case 'ACTIVE':
      return 'good';
    case 'MAINTENANCE':
      return 'warn';
    case 'OFFLINE':
    case 'SUSPENDED':
      return 'bad';
    case 'IN_USE':
      return 'brand';
    default:
      return 'neutral';
  }
}

function Impact({ tone, children }: { tone: 'bad' | 'muted'; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-[12px] leading-[1.5]">
      <span
        className={`mt-[6px] h-[5px] w-[5px] shrink-0 rounded-full ${tone === 'bad' ? 'bg-bad' : 'bg-disabled'}`}
      />
      <span className={tone === 'bad' ? 'text-body' : 'text-muted'}>{children}</span>
    </li>
  );
}
