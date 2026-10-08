import { useTranslation } from 'react-i18next';
import { useEffect, useState, type ReactNode } from 'react';
import type { ChargePoint, Connector, OperationalChargePointStatus, ProvisioningStatus } from '@chargeops/api';

import { Button, Card, IconBolt, IconClock, IconHistory, IconLock, IconShieldAlert, IconWrench, IconX } from '@chargeops/ui';
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
  onViewCpHistory: (cp: ChargePoint) => void;
  onViewConnectorHistory: (c: Connector) => void;
  onReportIncident?: (c: Connector) => void;
  onOpenIncident?: (incidentId: string) => void;
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
  onViewCpHistory,
  onViewConnectorHistory,
  onReportIncident,
  onOpenIncident,
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

      {/* History button for CP */}
      <div className="mb-3.5 mt-2">
        <Button
          variant="secondary"
          size="sm"
          icon={<IconHistory size={14} strokeWidth={2} />}
          onClick={() => onViewCpHistory(chargePoint)}
          className="w-full text-[12px] cursor-pointer"
        >
          {t('chargePoints.panel.historyBtn', 'Xem lịch sử trạng thái trụ sạc')}
        </Button>
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
        className="mb-[15px] w-full rounded-[10px] border border-line-3 bg-surface px-3 py-2.5 text-[13px] font-semibold"
      />

      <FieldLabel>{t('chargePoints.panel.zoneLabel')}</FieldLabel>
      <input
        value={zoneLabel}
        onChange={(e) => setZoneLabel(e.target.value)}
        placeholder={t('chargePoints.panel.zonePlaceholder')}
        className="mb-[15px] w-full rounded-[10px] border border-line-3 bg-surface px-3 py-2.5 text-[13px] font-semibold"
      />

      <Button
        variant="primary"
        size="sm"
        disabled={saving || (name === chargePoint.name && zoneLabel === (chargePoint.zoneLabel ?? ''))}
        onClick={() => onSave(chargePoint.id, { name: name.trim(), zoneLabel: zoneLabel.trim() })}
        className="w-full bg-owner text-white hover:bg-owner-deep cursor-pointer"
      >
        {saving ? t('chargePoints.panel.saving') : t('chargePoints.panel.saveBtn')}
      </Button>

      {/* operational status */}
      <SectionTitle className="mt-[22px]" icon={<IconClock size={15} className="text-owner" />}>
        {t('chargePoints.panel.statusGroup')}
      </SectionTitle>

      <div className="mb-2 rounded-[10px] border border-line-3 p-3">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.05em] text-faint">
          {t('chargePoints.panel.provStatus')}
        </div>
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold"
            style={{ background: provPill.bg, color: provPill.fg }}
          >
            {t(provPill.key)}
          </span>
          {!isProvActive && (
            <span className="text-[11px] text-faint">
              ({chargePoint.provisioningStatus === 'PENDING_ACTIVATION'
                ? t('chargePoints.panel.provPendingHelp')
                : t('chargePoints.panel.provSuspendedHelp')})
            </span>
          )}
        </div>
      </div>

      <div className="rounded-[10px] border border-line-3 p-3">
        <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.05em] text-faint">
          {t('chargePoints.panel.operStatus')}
        </div>
        <p className="mb-2.5 text-[11px] leading-[1.45] text-faint">
          {isProvActive
            ? t('chargePoints.panel.operHelp')
            : t('chargePoints.panel.operLocked')}
        </p>

        <div className="grid grid-cols-3 gap-1.5 rounded-lg bg-surface-2 p-1">
          {operStatuses.map((st) => {
            const isCur = chargePoint.operationalStatus === st;
            const label = t(`chargePoints.operationalStatus.${st}`);
            return (
              <button
                key={st}
                type="button"
                disabled={!isProvActive || isCur}
                onClick={() => onCycleStatus(chargePoint, st)}
                className={`rounded-[6px] py-1.5 text-center text-[11.5px] font-semibold transition ${
                  isCur
                    ? 'bg-surface text-ink shadow-xs'
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
            onViewConnectorHistory={onViewConnectorHistory}
            onReportIncident={onReportIncident}
            onOpenIncident={onOpenIncident}
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
  onViewConnectorHistory,
  onReportIncident,
  onOpenIncident,
}: {
  connector: Connector;
  chargePoint: ChargePoint;
  onCycleStatus: (c: Connector) => void;
  onDownloadQr: (c: Connector) => void;
  onViewConnectorHistory: (c: Connector) => void;
  onReportIncident?: (c: Connector) => void;
  onOpenIncident?: (incidentId: string) => void;
}) {
  const { t } = useTranslation('owner');
  const hasActiveIncident = Boolean(c.activeIncidentId);
  const effective = effectiveConnectorStatus(cp.provisioningStatus, cp.operationalStatus, c.runtimeStatus);
  const canToggle = canToggleConnector(cp.provisioningStatus, cp.operationalStatus, c.runtimeStatus);
  const pill = getConnectorPill(effective);
  const inheritedDown = cp.provisioningStatus !== 'ACTIVE' || cp.operationalStatus === 'OFFLINE' || cp.operationalStatus === 'MAINTENANCE';

  return (
    <div className="rounded-card border border-line-3 p-3.5">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="font-mono text-[12px] font-semibold text-brand">{c.connectorCode || c.id}</span>
          <span className="truncate text-[12.5px] font-semibold">
            {c.name || t('connectors.panel.defaultName', 'Cổng sạc {{type}}', { type: c.connectorType })}
          </span>
        </div>
        <button
          onClick={() => onCycleStatus(c)}
          disabled={!canToggle || hasActiveIncident}
          title={
            hasActiveIncident
              ? t('connectors.panel.incidentBlockedTooltip', 'Cổng sạc đang có sự cố cần khắc phục trước khi bật lại')
              : inheritedDown
                ? t('connectors.card.lockedByDevice')
                : undefined
          }
          className="inline-flex shrink-0 whitespace-nowrap items-center gap-[5px] rounded-full px-2.5 py-1 text-[11px] font-semibold hover:brightness-95 disabled:cursor-not-allowed disabled:hover:brightness-100"
          style={{
            background: hasActiveIncident ? 'rgba(239, 68, 68, 0.15)' : pill.bg,
            color: hasActiveIncident ? '#ef4444' : pill.fg,
          }}
        >
          <span
            className="h-[6px] w-[6px] rounded-full"
            style={{ background: hasActiveIncident ? '#ef4444' : pill.fg }}
          />
          {hasActiveIncident
            ? t('connectors.status.incident', 'Có sự cố')
            : t(`connectors.status.${effective}`, { defaultValue: t(pill.key) })}
        </button>
      </div>

      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex shrink-0 whitespace-nowrap items-center gap-[5px] rounded-full bg-warn-soft px-[9px] py-1 font-mono text-[10px] font-semibold text-warn">
          <IconLock size={11} strokeWidth={2.1} />
          <span>{t('connectors.panel.adminProvided')}</span>
        </span>
        <div className="flex shrink-0 items-center gap-1.5">
          {hasActiveIncident ? (
            <button
              type="button"
              onClick={() => onOpenIncident?.(c.activeIncidentId!)}
              title={t('connectors.panel.resolveIncidentTooltip', 'Cổng sạc đang có sự cố cần xử lý. Bấm để xem chi tiết và khắc phục.')}
              className="inline-flex shrink-0 whitespace-nowrap items-center gap-1 rounded-md border border-bad bg-bad px-2.5 py-1 text-[11px] font-semibold text-white shadow-xs hover:bg-bad/90 transition cursor-pointer"
            >
              <IconWrench size={12} strokeWidth={2} />
              <span>{t('connectors.panel.resolveIncidentBtn', 'Khắc phục')}</span>
            </button>
          ) : (
            onReportIncident && (
              <button
                type="button"
                onClick={() => onReportIncident(c)}
                title={t('connectors.panel.reportIncidentTooltip', 'Báo cáo sự cố khẩn cấp trên cổng sạc này (BKG-054)')}
                className="inline-flex shrink-0 whitespace-nowrap items-center gap-1 rounded-md border border-bad/30 bg-bad-soft px-2 py-1 text-[11px] font-semibold text-bad hover:bg-bad hover:text-white transition cursor-pointer"
              >
                <IconShieldAlert size={12} strokeWidth={2} />
                <span>{t('connectors.panel.incidentBtn', 'Báo sự cố')}</span>
              </button>
            )
          )}
          <button
            type="button"
            onClick={() => onViewConnectorHistory(c)}
            className="inline-flex shrink-0 whitespace-nowrap items-center gap-1 rounded-md border border-line-2 bg-surface-2 px-2.5 py-1 text-[11px] font-semibold text-muted hover:border-owner hover:text-owner transition cursor-pointer"
          >
            <IconHistory size={12} strokeWidth={2} />
            <span>{t('connectors.panel.historyBtn', 'Lịch sử')}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <LockedSpec label={t('connectors.panel.connector')} value={c.connectorType} />
        <LockedSpec label={t('connectors.panel.power')} value={`${c.powerKw} kW`} />
        <LockedSpec label={t('connectors.panel.chargerType', 'LOẠI SẠC')} value={c.chargerType || 'DC'} />
        <LockedSpec
          label={t('connectors.panel.runtimeStatus', 'TRẠNG THÁI')}
          value={hasActiveIncident ? t('connectors.status.incident', 'Có sự cố') : t(`connectors.status.${effective}`, { defaultValue: t(pill.key) })}
        />
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
      <div className="rounded-[10px] border border-line-3 bg-chip px-3 py-2 text-[12px] font-semibold text-body truncate">
        {value}
      </div>
    </div>
  );
}
