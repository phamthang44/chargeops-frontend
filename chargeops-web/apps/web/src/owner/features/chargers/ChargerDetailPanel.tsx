import { useTranslation } from 'react-i18next';
import { useEffect, useState, type ReactNode } from 'react';
import type { ChargePoint, Connector, OperationalChargePointStatus, ProvisioningStatus } from '@chargeops/api';

import { Button, Card, IconBolt, IconClock, IconLock, IconX } from '@chargeops/ui';
import {
  getChargePointPill,
  getConnectorPill,
  PROVISIONING_STATUS_PILL,
  canToggleConnector,
  effectiveConnectorStatus,
} from './chargerStatus';

export interface ChargerDetailPanelProps {
  chargePoint: ChargePoint;
  connectors: Connector[];
  saving: boolean;
  onClose: () => void;
  onSave: (id: string, patch: { name: string; zoneLabel: string }) => void;
  onCycleStatus: (cp: ChargePoint, target?: OperationalChargePointStatus) => void;
  onCycleConnectorStatus: (c: Connector) => void;
  onDownloadQr: (c: Connector) => void;
}

/** Right-hand editor: Charge Point identity/zone on top, operational status toggle, its Connectors below. */
export function ChargerDetailPanel({
  chargePoint,
  connectors,
  saving,
  onClose,
  onSave,
  onCycleStatus,
  onCycleConnectorStatus,
  onDownloadQr,
}: ChargerDetailPanelProps) {
  const { t } = useTranslation('owner');
  const [name, setName] = useState(chargePoint.name);
  const [zoneLabel, setZoneLabel] = useState(chargePoint.zoneLabel ?? '');

  useEffect(() => {
    setName(chargePoint.name);
    setZoneLabel(chargePoint.zoneLabel ?? '');
  }, [chargePoint.id, chargePoint.name, chargePoint.zoneLabel]);

  const provPill = PROVISIONING_STATUS_PILL[chargePoint.provisioningStatus] || PROVISIONING_STATUS_PILL.PENDING_ACTIVATION;
  const isProvActive = chargePoint.provisioningStatus === 'ACTIVE';
  const operPill = getChargePointPill(chargePoint.provisioningStatus, chargePoint.operationalStatus);

  const operStatuses: OperationalChargePointStatus[] = ['AVAILABLE', 'OFFLINE', 'MAINTENANCE'];

  return (
    <Card className="p-[18px]">
      <div className="mb-1.5 flex items-start justify-between">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.07em] text-owner">
            {t('chargePoints.panel.editTitle')}
          </div>
          <div className="mt-1 text-[17px] font-bold">{chargePoint.name}</div>
        </div>
        <button
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-faint hover:bg-chip"
          aria-label={t('chargePoints.panel.close')}
        >
          <IconX size={16} strokeWidth={2} />
        </button>
      </div>

      {/* identity */}
      <SectionTitle icon={<IconBolt size={15} className="text-owner" />}>
        {t('chargePoints.panel.identityGroup')}
      </SectionTitle>
      <FieldLabel>{t('chargePoints.panel.chargePointId')}</FieldLabel>
      <div className="mb-[5px] flex items-center gap-2 rounded-[10px] border border-line-3 bg-chip px-[13px] py-[11px]">
        <span className="flex-1 font-mono text-[13px] font-semibold text-body">{chargePoint.id}</span>
        <IconLock size={14} className="text-disabled" />
      </div>
      <p className="mb-[15px] text-[11px] leading-[1.5] text-faint">{t('chargePoints.panel.idHelp')}</p>

      <FieldLabel>{t('chargePoints.panel.displayName')}</FieldLabel>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t('chargePoints.panel.namePlaceholder')}
        className="w-full rounded-[10px] border border-line px-[13px] py-[11px] text-[13.5px] font-medium focus:border-owner"
      />

      <div className="mt-[11px]">
        <FieldLabel>{t('chargePoints.panel.zoneLabel')}</FieldLabel>
        <input
          value={zoneLabel}
          onChange={(e) => setZoneLabel(e.target.value)}
          placeholder={t('chargePoints.panel.zonePlaceholder')}
          className="w-full rounded-[10px] border border-line px-[13px] py-[11px] text-[13.5px] font-medium focus:border-owner"
        />
        <p className="mt-[7px] text-[11px] leading-[1.5] text-faint">{t('chargePoints.panel.zoneHelp')}</p>
      </div>

      <Button
        accent="owner"
        size="lg"
        fullWidth
        className="mt-4"
        onClick={() => onSave(chargePoint.id, { name: name.trim() || chargePoint.name, zoneLabel: zoneLabel.trim() })}
        disabled={saving}
      >
        {saving ? t('chargePoints.panel.saving') : t('chargePoints.panel.saveBtn')}
      </Button>

      {/* status lifecycle section */}
      <SectionTitle className="mt-[20px]" icon={<IconClock size={15} className="text-owner" />}>
        {t('chargePoints.panel.operationGroup')}
      </SectionTitle>

      {/* Provisioning Status (Admin) */}
      <div className="mb-2.5 flex items-center justify-between rounded-[10px] border border-line-3 bg-surface-2 p-3">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.05em] text-faint">
            Cấp phép hạ tầng (Admin)
          </div>
          <div className="mt-0.5 text-[12px] font-bold text-ink">
            {provPill.label}
          </div>
        </div>
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
          style={{ background: provPill.bg, color: provPill.fg }}
        >
          <span className="h-[6px] w-[6px] rounded-full" style={{ background: provPill.fg }} />
          {chargePoint.provisioningStatus}
        </span>
      </div>

      {/* Operational Status (Owner selector) */}
      <div className="rounded-[10px] border border-line-3 bg-surface-2 p-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.05em] text-faint">
              Trạng thái vận hành (Owner)
            </div>
            <div className="mt-0.5 text-[12px] font-bold text-ink">
              {operPill.label}
            </div>
          </div>
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
            style={{ background: operPill.bg, color: operPill.fg }}
          >
            <span className="h-[6px] w-[6px] rounded-full" style={{ background: operPill.fg }} />
            {chargePoint.operationalStatus}
          </span>
        </div>

        {/* 3 Operational Action Buttons */}
        <div className="mt-2.5 grid grid-cols-3 gap-1.5 border-t border-hairline pt-2.5">
          {operStatuses.map((st) => {
            const isCurrent = chargePoint.operationalStatus === st;
            const label = st === 'AVAILABLE' ? 'Hoạt động' : st === 'MAINTENANCE' ? 'Bảo trì' : 'Offline';
            return (
              <button
                key={st}
                type="button"
                onClick={() => onCycleStatus(chargePoint, st)}
                disabled={!isProvActive || isCurrent}
                className={`flex items-center justify-center rounded-[7px] py-1.5 text-[11px] font-bold transition ${
                  isCurrent
                    ? 'border border-line bg-surface text-ink shadow-sm'
                    : 'bg-surface text-muted hover:text-ink hover:bg-chip disabled:cursor-not-allowed disabled:opacity-40'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* connectors */}
      <SectionTitle className="mt-[22px]" icon={<IconBolt size={15} className="text-owner" />}>
        {t('connectors.panel.groupTitle', { count: connectors.length })}
      </SectionTitle>
      <div className="flex flex-col gap-[13px]">
        {connectors.map((c) => (
          <ConnectorCard
            key={c.id}
            connector={c}
            chargePoint={chargePoint}
            onCycleStatus={onCycleConnectorStatus}
            onDownloadQr={onDownloadQr}
          />
        ))}
      </div>
    </Card>
  );
}

function ConnectorCard({
  connector: c,
  chargePoint: cp,
  onCycleStatus,
  onDownloadQr,
}: {
  connector: Connector;
  chargePoint: ChargePoint;
  onCycleStatus: (c: Connector) => void;
  onDownloadQr: (c: Connector) => void;
}) {
  const { t } = useTranslation('owner');
  const effective = effectiveConnectorStatus(cp.provisioningStatus, cp.operationalStatus, c.runtimeStatus);
  const canToggle = canToggleConnector(cp.provisioningStatus, cp.operationalStatus, c.runtimeStatus);
  const pill = getConnectorPill(effective);
  const inheritedDown = cp.provisioningStatus !== 'ACTIVE' || cp.operationalStatus === 'OFFLINE' || cp.operationalStatus === 'MAINTENANCE';

  return (
    <div className="rounded-card border border-line-3 p-3.5">
      <div className="mb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[12px] font-semibold text-brand">{c.connectorCode || c.id}</span>
          <span className="text-[12.5px] font-semibold">{c.name || `Cổng sạc ${c.connectorType}`}</span>
        </div>
        <button
          onClick={() => onCycleStatus(c)}
          disabled={!canToggle}
          title={inheritedDown ? t('connectors.card.lockedByDevice') : undefined}
          className="inline-flex items-center gap-[5px] rounded-full px-2.5 py-1 text-[11px] font-semibold hover:brightness-95 disabled:cursor-not-allowed disabled:hover:brightness-100"
          style={{ background: pill.bg, color: pill.fg }}
        >
          <span className="h-[6px] w-[6px] rounded-full" style={{ background: pill.fg }} />
          {t(`connectors.status.${effective}`, { defaultValue: pill.label })}
        </button>
      </div>

      <div className="mb-2.5 flex items-center justify-between gap-2">
        <span className="flex items-center gap-[5px] rounded-full bg-warn-soft px-[9px] py-1 font-mono text-[10px] text-warn">
          <IconLock size={11} strokeWidth={2.1} />
          {t('connectors.panel.adminProvided')}
        </span>
      </div>
      <div className="mb-2.5 flex gap-[11px]">
        <LockedSpec label={t('connectors.panel.connector')} value={c.connectorType} />
        <LockedSpec label={t('connectors.panel.power')} value={`${c.powerKw} kW`} />
      </div>

      <div className="mb-2.5 grid grid-cols-2 gap-2.5">
        <PerfStat label={t('connectors.panel.utilization')} value={`${c.utilizationPct}%`} />
        <PerfStat label="UPTIME 30N" value={`${c.uptime30dPct}%`} />
        <PerfStat label={t('connectors.panel.sessions')} value={String(c.sessionsToday)} />
        <PerfStat label={t('connectors.panel.kwh')} value={String(c.kwhToday)} />
      </div>

      <div className="flex items-center justify-between gap-3 rounded-card border border-line-3 bg-surface-2 p-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[10px] border border-line-3 bg-surface">
            <IconBolt size={22} className="text-owner" />
          </span>
          <div className="min-w-0 flex flex-col">
            <span className="text-[12px] font-bold text-ink">Dynamic QR Check-in</span>
            <span className="text-[11px] text-muted">Mã challenge 60s trên màn hình trụ</span>
          </div>
        </div>
        <a
          href={`/simulator?connectorId=${c.id}`}
          target="_blank"
          rel="noreferrer"
          className="flex shrink-0 items-center justify-center gap-1 rounded-[9px] bg-emerald-600 px-3 py-1.5 text-[11.5px] font-bold text-white hover:bg-emerald-500 shadow-sm transition"
        >
          ⚡ Mở Simulator
        </a>
      </div>
    </div>
  );
}

function SectionTitle({
  icon,
  children,
  className = '',
}: {
  icon: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mb-3 flex items-center gap-2.5 ${className}`}>
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-owner-soft">
        {icon}
      </span>
      <span className="text-[13.5px] font-semibold">{children}</span>
    </div>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <div className="mb-[7px] text-[10px] font-semibold uppercase tracking-[0.07em] text-faint">
      {children}
    </div>
  );
}

function LockedSpec({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1">
      <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.05em] text-faint">{label}</div>
      <div className="rounded-[10px] border border-line-3 bg-chip px-3 py-2.5 text-[12.5px] font-semibold text-body">
        {value}
      </div>
    </div>
  );
}

function PerfStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[10px] border border-line-3 p-[11px]">
      <div className="text-[9px] font-semibold uppercase tracking-[0.05em] text-faint">{label}</div>
      <div className="mt-[3px] text-[17px] font-bold">{value}</div>
    </div>
  );
}
