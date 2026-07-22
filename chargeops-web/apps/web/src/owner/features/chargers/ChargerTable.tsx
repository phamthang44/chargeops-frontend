import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import type { ChargePoint, Connector, ProvisioningStatus } from '@chargeops/api';
import { IconAlertTriangle, IconBolt, IconCard, IconLock, IconPin, ProgressBar } from '@chargeops/ui';
import {
  CHARGE_POINT_PILL,
  CONNECTOR_PILL,
  canToggleConnector,
  effectiveConnectorStatus,
  utilColor,
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

  const pill = CHARGE_POINT_PILL[cp.status];

  return (
    <div
      className={`overflow-hidden rounded-card border bg-surface transition ${
        selected ? 'border-owner ring-2 ring-owner/15' : 'border-line-2'
      }`}
    >
      {/* ---- device header ---- */}
      <div
        onClick={() => onSelect(cp)}
        className="flex cursor-pointer items-start gap-3 px-4 py-[13px] hover:bg-row-hover"
      >
        <span className="mt-px flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-owner-soft">
          <IconBolt size={17} className="text-owner" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
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
                  className="w-[190px] rounded-[7px] border-[1.5px] border-owner px-2 py-[3px] text-[14px] font-semibold"
                />
              ) : (
                <span
                  onClick={() => {
                    setDraft(cp.name);
                    setEditing(true);
                  }}
                  className="cursor-text border-b border-dashed border-ghost pb-px text-[14.5px] font-bold hover:border-owner"
                >
                  {cp.name}
                </span>
              )}
            </span>
            <span className="font-mono text-[11px] font-semibold text-faint">{cp.id}</span>
          </div>

          <div className="mt-[3px] flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11.5px] font-medium text-faint">
            {cp.zoneLabel && (
              <span className="flex items-center gap-1">
                <IconPin size={11} strokeWidth={2} />
                {cp.zoneLabel}
              </span>
            )}
            <span className="flex items-center gap-1">
              <span className="h-[3px] w-[3px] rounded-full bg-disabled" />
              {t('chargePoints.connectorCount', { count: connectors.length })}
            </span>
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onCycleStatus(cp);
          }}
          className="mt-px inline-flex shrink-0 items-center gap-[5px] rounded-full px-2.5 py-1 text-[11px] font-semibold hover:brightness-95"
          style={{ background: pill.bg, color: pill.fg }}
        >
          <span className="h-[6px] w-[6px] rounded-full" style={{ background: pill.fg }} />
          {t(`chargePoints.status.${cp.status}`)}
        </button>
      </div>

      {/* ---- connectors ---- */}
      <div className="border-t border-hairline bg-surface-2 px-3 py-2.5">
        {/* BR-CHG-01 — say once, for the whole group, why every port below is down */}
        {cp.status !== 'active' && connectors.length > 0 && (
          <div className="mb-2 flex items-start gap-1.5 rounded-[9px] border border-warn-border bg-warn-soft px-2.5 py-2 text-[11px] leading-[1.45] font-medium text-warn-deep">
            <IconAlertTriangle size={13} strokeWidth={2} className="mt-px shrink-0" />
            <span>
              {t('connectors.card.deviceDown', { status: t(`chargePoints.status.${cp.status}`) })}
            </span>
          </div>
        )}

        {connectors.length === 0 ? (
          <div className="px-1 py-2 text-[11.5px] font-medium text-faint">
            {t('connectors.card.none')}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {connectors.map((c) => (
              <ConnectorRow
                key={c.id}
                connector={c}
                chargePointStatus={cp.status}
                onCycleStatus={onCycleConnectorStatus}
                onDownloadQr={onDownloadQr}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ConnectorRow({
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
  const inheritedDown = chargePointStatus !== 'active';

  return (
    <div className={`rounded-[10px] border border-line-3 bg-surface px-3 py-2.5 ${inheritedDown ? 'opacity-70' : ''}`}>
      {/* identity + runtime status */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="font-mono text-[11.5px] font-semibold text-brand">{c.id}</span>
          <span className="truncate text-[12.5px] font-semibold">{c.name}</span>
        </div>
        <button
          onClick={() => onCycleStatus(c)}
          disabled={!canToggle}
          title={inheritedDown ? t('connectors.card.lockedByDevice') : undefined}
          className="inline-flex shrink-0 items-center gap-[5px] rounded-full px-2.5 py-1 text-[11px] font-semibold hover:brightness-95 disabled:cursor-not-allowed disabled:hover:brightness-100"
          style={{ background: pill.bg, color: pill.fg }}
        >
          <span className="h-[6px] w-[6px] rounded-full" style={{ background: pill.fg }} />
          {t(`connectors.status.${effective}`)}
        </button>
      </div>

      {/* locked hardware spec + today's metrics + QR */}
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-chip px-2.5 py-1 text-[11px] font-semibold text-body">
          {c.connectorType} · {c.powerKw} kW
          <IconLock size={10} strokeWidth={2.2} className="text-disabled" />
        </span>

        <span className="flex min-w-[112px] flex-1 items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.05em] text-faint">
            {t('connectors.card.util')}
          </span>
          <ProgressBar
            value={c.utilizationPct}
            color={utilColor({ runtimeStatus: effective, utilizationPct: c.utilizationPct })}
            className="min-w-[40px] flex-1"
          />
          <span className="w-8 shrink-0 text-right font-mono text-[11px] text-muted">
            {c.utilizationPct}%
          </span>
        </span>

        <span className="text-[11.5px] font-medium text-muted">
          {t('connectors.card.sessions', { count: c.sessionsToday })}
        </span>

        <button
          onClick={() => onDownloadQr(c)}
          className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-[8px] border-[1.5px] border-owner-border px-2.5 py-[5px] text-[11px] font-semibold text-owner-deep hover:bg-owner-soft"
        >
          <IconCard size={13} strokeWidth={1.9} />
          {t('connectors.table.downloadQr')}
        </button>
      </div>
    </div>
  );
}
