import { Trans, useTranslation } from 'react-i18next';
import type { ChargePoint, Connector } from '@chargeops/api';
import {
  Button,
  Card,
  IconBolt,
  IconCheck,
  IconEdit,
  IconHistory,
  IconLock,
  IconPause,
  IconPin,
  IconPlay,
  IconPlusCircle,
  IconTrash,
  StatusPill,
} from '@chargeops/ui';

export interface ChargePointItemCardProps {
  chargePoint: ChargePoint;
  connectors: Connector[];
  activating: boolean;
  onAddConnector: () => void;
  onEditConnector: (connector: Connector) => void;
  onDeleteConnector: (connector: Connector) => void;
  onDeleteCp: () => void;
  onActivate: () => void;
  onSuspend: () => void;
  onReactivate: () => void;
  onViewCpHistory: () => void;
  onViewConnectorHistory: (connector: Connector) => void;
}

export function ChargePointItemCard({
  chargePoint: cp,
  connectors,
  activating,
  onAddConnector,
  onEditConnector,
  onDeleteConnector,
  onDeleteCp,
  onActivate,
  onSuspend,
  onReactivate,
  onViewCpHistory,
  onViewConnectorHistory,
}: ChargePointItemCardProps) {
  const { t } = useTranslation('admin');
  const provStatus = String(cp.provisioningStatus || '').toUpperCase();
  const operStatus = String(cp.operationalStatus || 'AVAILABLE').toUpperCase();

  const isPendingActivation =
    provStatus === 'PENDING_ACTIVATION' || provStatus === 'UNCLAIMED' || provStatus === 'PENDING';
  const isActive = provStatus === 'ACTIVE';
  const isSuspended = provStatus === 'SUSPENDED';

  const canActivate = isPendingActivation && connectors.length > 0;

  return (
    <Card
      className={`overflow-hidden border transition duration-150 ${
        isSuspended
          ? 'border-warn/40 bg-surface shadow-sm ring-1 ring-warn/10'
          : isPendingActivation
          ? 'border-brand/30 bg-surface shadow-sm'
          : 'border-line-2 bg-surface shadow-sm'
      }`}
    >
      {/* Top Header of CP */}
      <div className="flex flex-wrap items-start justify-between gap-3 px-4 py-3.5 bg-surface border-b border-hairline">
        <div className="flex items-start gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] ${
              isSuspended
                ? 'bg-warn-soft text-warn-deep'
                : isPendingActivation
                ? 'bg-brand-soft text-brand'
                : 'bg-good-soft text-good'
            }`}
          >
            <IconBolt size={20} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-[15px] text-ink">
                {cp.name || t('provisioning.workspace.chargePoint.nameFallback')}
              </span>
              <span className="font-mono text-[12px] font-bold text-brand">{cp.chargePointCode || cp.id}</span>
              {cp.zoneLabel && (
                <span className="rounded bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-faint border border-line-2">
                  <IconPin size={11} className="inline mr-1 text-faint" />
                  {cp.zoneLabel}
                </span>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted">
              <span>
                {t('provisioning.workspace.chargePoint.maxPowerLabel')}{' '}
                <b className="text-ink font-mono">{cp.maxPowerKw} kW</b>
              </span>
              <span>·</span>
              <span>
                {t('provisioning.workspace.chargePoint.connectorCountLabel')}{' '}
                <b className="text-ink">
                  {t('provisioning.workspace.chargePoint.connectorUnit', { count: connectors.length })}
                </b>
              </span>
              {isPendingActivation && (
                <span className="text-[11px] font-semibold text-brand bg-brand-soft/40 px-1.5 py-0.2 rounded">
                  {t('provisioning.workspace.chargePoint.configuring')}
                </span>
              )}
              {isActive && (
                <span className="text-[11px] text-faint flex items-center gap-1">
                  <IconLock size={11} />
                  {t('provisioning.workspace.chargePoint.hardwareLocked')}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Cấp phép Admin (Provisioning Status) */}
          <div
            className="flex items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-1 border border-line-2 cursor-help transition hover:border-brand/40"
            title={
              isPendingActivation
                ? t('provisioning.tooltips.cpPending')
                : isActive
                ? t('provisioning.tooltips.cpActive')
                : t('provisioning.tooltips.cpSuspended')
            }
          >
            <span className="text-[10.5px] font-semibold text-muted">
              {t('provisioning.badgeLabels.admin')}
            </span>
            {isPendingActivation && <StatusPill tone="neutral" label={t('provisioning.pills.pending')} />}
            {isActive && <StatusPill tone="good" label={t('provisioning.pills.active')} />}
            {isSuspended && <StatusPill tone="warn" label={t('provisioning.pills.suspended')} />}
          </div>

          {/* Kết nối Kỹ thuật (OCPP Telemetry Status if Active ONLY) */}
          {isActive && (
            <div
              className="flex items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-1 border border-line-2 cursor-help transition hover:border-brand/40"
              title={
                operStatus === 'AVAILABLE'
                  ? t('provisioning.tooltips.cpAvailable')
                  : operStatus === 'MAINTENANCE'
                  ? t('provisioning.tooltips.cpMaintenance')
                  : t('provisioning.tooltips.cpOffline')
              }
            >
              <span className="text-[10.5px] font-semibold text-muted">
                {t('provisioning.badgeLabels.telemetry')}
              </span>
              <StatusPill
                tone={operStatus === 'AVAILABLE' ? 'good' : operStatus === 'MAINTENANCE' ? 'warn' : 'bad'}
                label={
                  operStatus === 'AVAILABLE'
                    ? t('provisioning.pills.available')
                    : operStatus === 'MAINTENANCE'
                    ? t('provisioning.pills.maintenance')
                    : t('provisioning.pills.offline')
                }
              />
            </div>
          )}
        </div>
      </div>

      {/* Connector List */}
      <div className="bg-surface-2 p-3.5">
        {connectors.length === 0 ? (
          <div className="flex items-start gap-2.5 rounded-[9px] border border-warn-border bg-warn-soft p-3.5 text-[12px] text-warn-deep leading-relaxed">
            <IconLock size={16} className="mt-0.5 shrink-0" />
            <span>
              <Trans
                t={t}
                i18nKey="provisioning.workspace.connector.noConnectorsWarning"
                values={{ btn: t('provisioning.connector.addBtn') }}
                components={{ bold: <b /> }}
              />
            </span>
          </div>
        ) : (
          <div className="grid gap-2.5 sm:grid-cols-2">
            {connectors.map((c) => {
              const runStatus = String(c.runtimeStatus || 'AVAILABLE').toUpperCase();
              let connTone: 'good' | 'brand' | 'bad' | 'neutral' = 'good';
              let connLabel = t('provisioning.pills.available');
              let connTooltip = t('provisioning.tooltips.connAvailable');

              if (isPendingActivation) {
                connTone = 'neutral';
                connLabel = t('provisioning.pills.closed');
                connTooltip = t('provisioning.tooltips.connDraft');
              } else if (isSuspended) {
                connTone = 'neutral';
                connLabel = t('provisioning.pills.byCp');
                connTooltip = t('provisioning.tooltips.connSuspended');
              } else {
                if (runStatus === 'IN_USE' || runStatus === 'INUSE') {
                  connTone = 'brand';
                  connLabel = t('provisioning.pills.inUse');
                  connTooltip = t('provisioning.tooltips.connInUse');
                } else if (runStatus === 'OFFLINE') {
                  connTone = 'bad';
                  connLabel = t('provisioning.pills.offline');
                  connTooltip = t('provisioning.tooltips.connOffline');
                }
              }

              const isAc = c.connectorType === 'TYPE2';

              return (
                <div
                  key={c.id}
                  className="group relative flex flex-col justify-between gap-2.5 rounded-[10px] border border-line-2 bg-surface p-3.5 shadow-sm transition hover:border-brand/40 hover:shadow"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] border ${
                          isAc
                            ? 'border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-800 dark:bg-cyan-950 dark:text-cyan-300'
                            : 'border-brand/30 bg-brand-soft text-brand'
                        }`}
                      >
                        <IconBolt size={18} />
                      </div>
                      <div className="min-w-0 flex flex-col">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-mono text-[12px] font-bold text-ink">
                            {c.connectorCode || c.id}
                          </span>
                          <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[10.5px] font-bold text-body border border-line-2">
                            {c.connectorType}
                          </span>
                          <span className="text-[10px] font-medium text-faint">
                            ({isAc ? t('provisioning.workspace.connector.kindAc') : t('provisioning.workspace.connector.kindDc')})
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-[12px]">
                          <span className="font-mono font-bold text-brand">{c.powerKw} kW</span>
                        </div>
                      </div>
                    </div>

                    <div title={connTooltip} className="cursor-help">
                      <StatusPill tone={connTone} label={connLabel} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-hairline pt-2.5 mt-0.5">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onViewConnectorHistory(c)}
                        className="inline-flex items-center gap-1 rounded-[6px] border border-line-2 bg-surface-2 px-2 py-1 text-[11px] font-semibold text-muted hover:border-brand hover:text-brand transition cursor-pointer"
                        title={t('provisioning.workspace.connector.historyTitle')}
                      >
                        <IconHistory size={12} strokeWidth={2} />
                        <span>{t('provisioning.workspace.connector.historyBtn')}</span>
                      </button>
                    </div>

                    {isPendingActivation ? (
                      <span className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onEditConnector(c)}
                          className="inline-flex items-center gap-1 rounded-[6px] border border-brand/30 bg-brand-soft/50 px-2.5 py-1 text-[11px] font-semibold text-brand hover:bg-brand hover:text-white transition cursor-pointer"
                          title={t('provisioning.workspace.connector.editTitle')}
                        >
                          <IconEdit size={12} strokeWidth={2.2} />
                          <span>{t('provisioning.workspace.connector.editBtn')}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteConnector(c)}
                          className="inline-flex items-center gap-1 rounded-[6px] border border-bad/30 bg-bad-soft/40 px-2.5 py-1 text-[11px] font-semibold text-bad hover:bg-bad hover:text-white transition cursor-pointer"
                          title={t('provisioning.workspace.connector.deleteTitle')}
                        >
                          <IconTrash size={12} strokeWidth={2.2} />
                          <span>{t('provisioning.workspace.connector.deleteBtn')}</span>
                        </button>
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-faint bg-surface-2 px-2 py-0.5 rounded border border-line-2"
                        title={t('provisioning.workspace.connector.lockedTitle')}
                      >
                        <IconLock size={11} />
                        <span>{t('provisioning.workspace.connector.lockedBtn')}</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Action Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline px-4 py-3 bg-surface">
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={<IconHistory size={13} strokeWidth={2} />}
            onClick={onViewCpHistory}
            className="text-[12px] cursor-pointer"
            title={t('provisioning.workspace.chargePoint.historyTitle')}
          >
            {t('provisioning.workspace.chargePoint.historyBtn')}
          </Button>

          {isPendingActivation && (
            <>
              <Button
                variant="secondary"
                size="sm"
                icon={<IconPlusCircle size={14} strokeWidth={2} />}
                onClick={onAddConnector}
                className="text-[12px] cursor-pointer"
              >
                {t('provisioning.connector.addBtn')}
              </Button>
              <Button
                variant="danger"
                size="sm"
                icon={<IconTrash size={13} strokeWidth={2.2} />}
                onClick={onDeleteCp}
                className="cursor-pointer"
              >
                {t('provisioning.workspace.chargePoint.deleteDraftBtn')}
              </Button>
            </>
          )}

          {isActive && (
            <Button
              variant="danger"
              size="sm"
              icon={<IconPause size={13} strokeWidth={2.2} />}
              onClick={onSuspend}
              className="text-[12px] cursor-pointer bg-red-600/90 hover:bg-red-700 text-white shadow-sm"
            >
              {t('provisioning.workspace.chargePoint.suspendBtn')}
            </Button>
          )}

          {isSuspended && (
            <Button
              variant="secondary"
              size="sm"
              icon={<IconPlay size={13} strokeWidth={2.2} />}
              onClick={onReactivate}
              className="text-[12px] font-bold text-good border-good/40 bg-good-soft/30 hover:bg-good hover:text-white transition cursor-pointer shadow-sm"
            >
              {t('provisioning.workspace.chargePoint.reactivateBtn')}
            </Button>
          )}
        </div>

        {canActivate && (
          <Button
            size="sm"
            icon={<IconCheck size={14} strokeWidth={2.4} />}
            onClick={onActivate}
            disabled={activating}
            className="text-[12.5px] font-bold px-3.5 cursor-pointer shadow-sm"
          >
            {activating
              ? t('provisioning.chargePoint.activating')
              : t('provisioning.chargePoint.activateBtn')}
          </Button>
        )}
      </div>
    </Card>
  );
}
