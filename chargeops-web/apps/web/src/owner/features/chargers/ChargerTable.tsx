import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import type { ChargePoint, Connector, ProvisioningStatus } from '@chargeops/api';
import { IconAlertTriangle, IconEdit, IconHistory, IconLock, IconWrench } from '@chargeops/ui';
import {
  getChargePointPill,
  getConnectorPill,
  canToggleChargePoint,
  canToggleConnector,
  effectiveConnectorStatus,
} from './chargerStatus';

export interface ChargePointGroup {
  chargePoint: ChargePoint;
  connectors: Connector[];
}

export interface ChargerTableProps {
  groups: ChargePointGroup[];
  selectedId: string | null;
  onSelect: (cp: ChargePoint) => void;
  /** Inline rename commit for the Charge Point's display name. */
  onRename: (id: string, name: string) => void;
  /** Cycle the Charge Point active <-> offline. */
  onCycleStatus: (cp: ChargePoint) => void;
  /** Cycle a single Connector available <-> offline. */
  onCycleConnectorStatus: (c: Connector) => void;
  onDownloadQr: (c: Connector) => void;
  onViewCpHistory: (cp: ChargePoint) => void;
  onViewConnectorHistory: (c: Connector) => void;
  onOpenIncident?: (incidentId: string) => void;
}

/**
 * One card per Charge Point (the physical device), with its Connectors listed
 * inside it. A table was the wrong shape here: Charge Points and Connectors
 * carry different attributes, so a shared column grid left half the cells empty
 * on every device row. Card containment makes the device → port hierarchy read
 * at a glance and lets each level show only the fields it actually has.
 */
export function ChargerTable({
  groups,
  selectedId,
  onSelect,
  onRename,
  onCycleStatus,
  onCycleConnectorStatus,
  onDownloadQr,
  onViewCpHistory,
  onViewConnectorHistory,
  onOpenIncident,
}: ChargerTableProps) {
  return (
    <div className="flex flex-col gap-[11px]">
      {groups.map((g) => (
        <ChargePointCard
          key={g.chargePoint.id}
          group={g}
          selected={g.chargePoint.id === selectedId}
          onSelect={onSelect}
          onRename={onRename}
          onCycleStatus={onCycleStatus}
          onCycleConnectorStatus={onCycleConnectorStatus}
          onDownloadQr={onDownloadQr}
          onViewCpHistory={onViewCpHistory}
          onViewConnectorHistory={onViewConnectorHistory}
          onOpenIncident={onOpenIncident}
        />
      ))}
    </div>
  );
}

function ChargePointCard({
  group: { chargePoint: cp, connectors },
  selected,
  onSelect,
  onRename,
  onCycleStatus,
  onCycleConnectorStatus,
  onDownloadQr,
  onViewCpHistory,
  onViewConnectorHistory,
  onOpenIncident,
}: {
  group: ChargePointGroup;
  selected: boolean;
} & Omit<ChargerTableProps, 'groups' | 'selectedId'>) {
  const { t } = useTranslation('owner');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(cp.name);

  const commit = () => {
    if (draft.trim() && draft.trim() !== cp.name) onRename(cp.id, draft.trim());
    setEditing(false);
  };

  const pill = getChargePointPill(cp.provisioningStatus, cp.operationalStatus);
  const canToggle = canToggleChargePoint(cp.provisioningStatus);
  const maxKw = cp.maxPowerKw || connectors.reduce((max, c) => Math.max(max, c.powerKw || 0), 0);
  const deviceDown =
    cp.provisioningStatus !== 'ACTIVE' || cp.operationalStatus === 'OFFLINE' || cp.operationalStatus === 'MAINTENANCE';

  return (
    <div
      className={`overflow-hidden rounded-card border bg-surface transition-colors ${
        selected ? 'border-owner' : 'border-line'
      }`}
    >
      {/* ---- device header ---- */}
      <div
        onClick={() => onSelect(cp)}
        className="flex cursor-pointer items-start justify-between gap-3 px-4 py-3 hover:bg-row-hover"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span onClick={(e) => e.stopPropagation()}>
              {editing ? (
                <input
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onBlur={commit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commit();
                    if (e.key === 'Escape') setEditing(false);
                  }}
                  className="w-[200px] rounded-[7px] border border-owner px-2 py-[3px] text-[14px] font-semibold"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setDraft(cp.name);
                    setEditing(true);
                  }}
                  title={t('chargers.renameHint', 'Bấm để đổi tên')}
                  className="group inline-flex items-center gap-1.5 text-[14.5px] font-semibold text-ink"
                >
                  {cp.name}
                  <IconEdit size={12} className="text-faint opacity-0 transition-opacity group-hover:opacity-100" />
                </button>
              )}
            </span>
            {cp.chargePointCode && (
              <span className="text-[12px] tabular-nums text-faint" title={cp.id}>
                {cp.chargePointCode}
              </span>
            )}
          </div>

          <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[12.5px] text-muted">
            <span className={cp.zoneLabel ? '' : 'italic text-faint'}>
              {cp.zoneLabel || t('chargers.noZone', 'Chưa ghi chú vị trí')}
            </span>
            <span className="text-disabled">·</span>
            <span>{t('chargePoints.connectorCount', { count: connectors.length })}</span>
            {maxKw > 0 && (
              <>
                <span className="text-disabled">·</span>
                <span className="tabular-nums">{t('chargers.maxPower', { kw: maxKw })}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onViewCpHistory(cp);
            }}
            className="inline-flex items-center gap-1 rounded-ctl px-2 py-1 text-[12px] font-medium text-muted transition-colors hover:bg-chip hover:text-ink"
            title={t('chargePoints.history.cpTooltip')}
          >
            <IconHistory size={13} strokeWidth={2} />
            <span>{t('chargePoints.history.shortLabel')}</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (canToggle) onCycleStatus(cp);
            }}
            disabled={!canToggle}
            title={!canToggle ? t('chargePoints.pendingTooltip') : undefined}
            className="whitespace-nowrap rounded-full px-2 py-[2px] text-[11.5px] font-medium hover:brightness-95 disabled:cursor-not-allowed disabled:hover:brightness-100"
            style={{ background: pill.bg, color: pill.fg }}
          >
            {t(pill.key)}
          </button>
        </div>
      </div>

      {/* BR-CHG-01 — say once, for the whole device, why every port below is down */}
      {deviceDown && connectors.length > 0 && (
        <div className="flex items-start gap-1.5 border-t border-hairline bg-warn-soft px-4 py-2 text-[12px] text-warn-deep">
          <IconAlertTriangle size={13} strokeWidth={2} className="mt-[3px] shrink-0" />
          <span>
            {cp.provisioningStatus === 'PENDING_ACTIVATION'
              ? t('connectors.card.pendingActivation')
              : t('connectors.card.deviceDown', { status: t(pill.key) })}
          </span>
        </div>
      )}

      {/* ---- connectors: one row each, divided by hairlines ---- */}
      {connectors.length === 0 ? (
        <div className="border-t border-hairline px-4 py-2.5 text-[12px] text-faint">{t('connectors.card.none')}</div>
      ) : (
        connectors.map((c) => (
          <ConnectorRow
            key={c.id}
            connector={c}
            chargePoint={cp}
            onCycleStatus={onCycleConnectorStatus}
            onDownloadQr={onDownloadQr}
            onViewConnectorHistory={onViewConnectorHistory}
            onOpenIncident={onOpenIncident}
          />
        ))
      )}
    </div>
  );
}

function ConnectorRow({
  connector: c,
  chargePoint: cp,
  onCycleStatus,
  onDownloadQr,
  onViewConnectorHistory,
  onOpenIncident,
}: {
  connector: Connector;
  chargePoint: ChargePoint;
  onCycleStatus: (c: Connector) => void;
  onDownloadQr: (c: Connector) => void;
  onViewConnectorHistory: (c: Connector) => void;
  onOpenIncident?: (incidentId: string) => void;
}) {
  const { t } = useTranslation('owner');
  const hasActiveIncident = Boolean(c.activeIncidentId);
  const effective = effectiveConnectorStatus(cp.provisioningStatus, cp.operationalStatus, c.runtimeStatus);
  const canToggle = canToggleConnector(cp.provisioningStatus, cp.operationalStatus, c.runtimeStatus);
  const pill = getConnectorPill(effective);
  const inheritedDown =
    cp.provisioningStatus !== 'ACTIVE' || cp.operationalStatus === 'OFFLINE' || cp.operationalStatus === 'MAINTENANCE';
  const usage = [
    c.sessionsToday ? `${c.sessionsToday} ${t('chargers.sessionsCount', 'lượt sạc')}` : null,
    c.kwhToday ? `${c.kwhToday} kWh` : null,
  ].filter(Boolean);

  return (
    <div
      className={`flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-hairline py-2.5 pl-4 pr-3 sm:flex-nowrap ${
        inheritedDown ? 'opacity-70' : ''
      }`}
    >
      {/* identity + locked hardware spec */}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-[12px] tabular-nums text-faint">{c.connectorCode || c.id}</span>
          <span className="truncate text-[13px] font-medium text-ink">
            {c.name || t('connectors.panel.defaultName', { type: c.connectorType })}
          </span>
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[12px] text-muted">
          <span className="inline-flex items-center gap-1" title={t('chargers.specLocked', 'Do quản trị viên cấp, chỉ đọc')}>
            {c.connectorType} · {c.powerKw} kW{c.chargerType ? ` · ${c.chargerType}` : ''}
            <IconLock size={10} strokeWidth={2.2} className="text-disabled" />
          </span>
          {usage.length > 0 && (
            <>
              <span className="text-disabled">·</span>
              <span className="tabular-nums">{usage.join(' · ')}</span>
            </>
          )}
        </div>
      </div>

      {/* status + actions */}
      <div className="ml-auto flex shrink-0 items-center gap-1">
        {hasActiveIncident && (
          <button
            type="button"
            onClick={() => onOpenIncident?.(c.activeIncidentId!)}
            className="inline-flex items-center gap-1 whitespace-nowrap rounded-ctl bg-bad px-2.5 py-1 text-[12px] font-semibold text-white transition-colors hover:bg-bad-strong"
            title={t('connectors.panel.resolveIncidentTooltip', 'Xem chi tiết sự cố và khắc phục')}
          >
            <IconWrench size={12} strokeWidth={2} />
            {t('connectors.panel.resolveIncidentBtn', 'Khắc phục')}
          </button>
        )}
        <button
          type="button"
          onClick={() => onDownloadQr(c)}
          className="rounded-ctl px-2 py-1 text-[12px] font-medium text-muted transition-colors hover:bg-chip hover:text-ink"
          title={t('connectors.panel.downloadQrBtn', 'Tải QR')}
        >
          QR
        </button>
        <button
          type="button"
          onClick={() => onViewConnectorHistory(c)}
          className="inline-flex items-center gap-1 rounded-ctl px-2 py-1 text-[12px] font-medium text-muted transition-colors hover:bg-chip hover:text-ink"
          title={t('chargePoints.history.connectorTooltip')}
        >
          <IconHistory size={13} strokeWidth={2} />
          {t('chargePoints.history.shortLabel')}
        </button>
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
          className={`ml-1 whitespace-nowrap rounded-full px-2 py-[2px] text-[11.5px] font-medium hover:brightness-95 disabled:cursor-not-allowed disabled:hover:brightness-100 ${
            hasActiveIncident ? 'bg-bad-soft text-bad' : ''
          }`}
          style={hasActiveIncident ? undefined : { background: pill.bg, color: pill.fg }}
        >
          {hasActiveIncident
            ? t('connectors.status.incident', 'Có sự cố')
            : t(`connectors.status.${effective}`, { defaultValue: t(pill.key) })}
        </button>
      </div>
    </div>
  );
}
