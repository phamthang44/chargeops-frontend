import { useTranslation } from 'react-i18next';
import { useEffect, useState, type ReactNode } from 'react';
import type { ChargePoint, Connector, ProvisioningStatus } from '@chargeops/api';

import { Button, Card, IconBolt, IconClock, IconLock, IconX, QrGlyph } from '@chargeops/ui';
import {
  CHARGE_POINT_PILL,
  CONNECTOR_PILL,
  OWNER_CHARGE_POINT_CYCLE,
  canToggleConnector,
  effectiveConnectorStatus,
} from './chargerStatus';

export interface ChargerDetailPanelProps {
  chargePoint: ChargePoint;
  connectors: Connector[];
  saving: boolean;
  onClose: () => void;
  onSave: (id: string, patch: { name: string; zoneLabel: string; status: ProvisioningStatus }) => void;
  onCycleConnectorStatus: (c: Connector) => void;
  onDownloadQr: (c: Connector) => void;
}

/** Right-hand editor: Charge Point identity/zone/status on top, its Connectors (locked specs, own QR) below. */
export function ChargerDetailPanel({
  chargePoint,
  connectors,
  saving,
  onClose,
  onSave,
  onCycleConnectorStatus,
  onDownloadQr,
}: ChargerDetailPanelProps) {
  const { t } = useTranslation('owner');
  const [name, setName] = useState(chargePoint.name);
  const [zoneLabel, setZoneLabel] = useState(chargePoint.zoneLabel ?? '');
  const [status, setStatus] = useState<ProvisioningStatus>(chargePoint.status);

  useEffect(() => {
    setName(chargePoint.name);
    setZoneLabel(chargePoint.zoneLabel ?? '');
    setStatus(chargePoint.status);
  }, [chargePoint.id, chargePoint.name, chargePoint.zoneLabel, chargePoint.status]);

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

      {/* status */}
      <SectionTitle className="mt-[18px]" icon={<IconClock size={15} className="text-owner" />}>
        {t('chargePoints.panel.operationGroup')}
      </SectionTitle>
      <div className="flex gap-[7px]">
        {OWNER_CHARGE_POINT_CYCLE.map((s) => {
          const pill = CHARGE_POINT_PILL[s];
          const on = s === status;
          return (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-[10px] border-[1.5px] px-1 py-2.5 text-[12px] font-semibold transition"
              style={{
                borderColor: on ? pill.fg : 'var(--color-line)',
                background: on ? pill.bg : 'var(--color-surface)',
                color: on ? pill.fg : 'var(--color-muted)',
              }}
            >
              <span className="h-[7px] w-[7px] rounded-full" style={{ background: pill.fg }} />
              {t(`chargePoints.status.${s}`)}
            </button>
          );
        })}
      </div>

      <Button
        accent="owner"
        size="lg"
        fullWidth
        className="mt-4"
        onClick={() => onSave(chargePoint.id, { name: name.trim() || chargePoint.name, zoneLabel: zoneLabel.trim(), status })}
        disabled={saving}
      >
        {saving ? t('chargePoints.panel.saving') : t('chargePoints.panel.saveBtn')}
      </Button>

      {/* connectors */}
      <SectionTitle className="mt-[22px]" icon={<IconBolt size={15} className="text-owner" />}>
        {t('connectors.panel.groupTitle', { count: connectors.length })}
      </SectionTitle>
      <div className="flex flex-col gap-[13px]">
        {connectors.map((c) => (
          <ConnectorCard
            key={c.id}
            connector={c}
            chargePointStatus={chargePoint.status}
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
  chargePointStatus,
  onCycleStatus,
  onDownloadQr,
}: {
  connector: Connector;
  chargePointStatus: ProvisioningStatus;
  onCycleStatus: (c: Connector) => void;
  onDownloadQr: (c: Connector) => void;
}) {
  const { t } = useTranslation('owner');
  const effective = effectiveConnectorStatus(chargePointStatus, c.runtimeStatus);
  const canToggle = canToggleConnector(chargePointStatus, c.runtimeStatus);
  const pill = CONNECTOR_PILL[effective];

  return (
    <div className="rounded-card border border-line-3 p-3.5">
      <div className="mb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[12px] font-semibold text-brand">{c.id}</span>
          <span className="text-[12.5px] font-semibold">{c.name}</span>
        </div>
        <button
          onClick={() => onCycleStatus(c)}
          disabled={!canToggle}
          title={chargePointStatus !== 'active' ? t('connectors.card.lockedByDevice') : undefined}
          className="inline-flex items-center gap-[5px] rounded-full px-2.5 py-1 text-[11px] font-semibold hover:brightness-95 disabled:cursor-not-allowed disabled:hover:brightness-100"
          style={{ background: pill.bg, color: pill.fg }}
        >
          <span className="h-[6px] w-[6px] rounded-full" style={{ background: pill.fg }} />
          {t(`connectors.status.${effective}`)}
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

      <div className="flex items-center gap-[11px] rounded-card border border-line-3 bg-surface-2 p-3">
        <span className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[10px] border border-line-3 bg-surface">
          <QrGlyph size={38} />
        </span>
        <div className="min-w-0 flex-1 text-[11px] leading-[1.4] text-faint">{t('connectors.panel.qrHelp')}</div>
        <button
          onClick={() => onDownloadQr(c)}
          className="flex shrink-0 items-center gap-1.5 rounded-[9px] border-[1.5px] border-owner-border px-[11px] py-[7px] text-[11.5px] font-semibold text-owner-deep hover:bg-owner-soft"
        >
          {t('connectors.panel.downloadQrBtn')}
        </button>
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
