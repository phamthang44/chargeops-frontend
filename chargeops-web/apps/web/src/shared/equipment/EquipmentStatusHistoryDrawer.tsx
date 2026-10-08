import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  formatDateTimeVn,
  useApi,
  type ChargePointStatusEvent,
  type ConnectorStatusEvent,
} from '@chargeops/api';
import {
  Drawer,
  EmptyState,
  IconBolt,
  IconClock,
  IconHistory,
  IconShield,
  IconUsers,
  Skeleton,
  StatusPill,
} from '@chargeops/ui';
import { ApiErrorState } from '../components/ApiErrorState';
import { formatStatusReason } from './formatStatusReason';

export interface EquipmentStatusTarget {
  type: 'chargePoint' | 'connector';
  chargePointId: string;
  chargePointName?: string;
  chargePointCode?: string;
  connectorId?: string;
  connectorCode?: string;
}

export interface EquipmentStatusHistoryDrawerProps {
  open: boolean;
  onClose: () => void;
  stationId: string;
  target: EquipmentStatusTarget | null;
}

/** Status code → tone; the visible label comes from `common:equipmentHistory.status.*`. */
const STATUS_TONES: Record<string, 'good' | 'warn' | 'bad' | 'brand' | 'neutral'> = {
  // Provisioning
  PENDING_ACTIVATION: 'neutral',
  ACTIVE: 'good',
  SUSPENDED: 'warn',
  // Operational
  AVAILABLE: 'good',
  OFFLINE: 'bad',
  MAINTENANCE: 'warn',
  // Connector runtime
  IN_USE: 'brand',
  INUSE: 'brand',
};

function toneOf(status?: string | null): 'good' | 'warn' | 'bad' | 'brand' | 'neutral' {
  if (!status) return 'neutral';
  return STATUS_TONES[String(status).toUpperCase()] || 'neutral';
}

export function EquipmentStatusHistoryDrawer({
  open,
  onClose,
  stationId,
  target,
}: EquipmentStatusHistoryDrawerProps) {
  const { t } = useTranslation('common');
  const api = useApi();
  const isConnector = target?.type === 'connector';

  const statusMeta = (status?: string | null): { label: string; tone: 'good' | 'warn' | 'bad' | 'brand' | 'neutral' } => {
    if (!status) return { label: '—', tone: 'neutral' };
    const upper = String(status).toUpperCase();
    return {
      label: t(`equipmentHistory.status.${upper}`, { defaultValue: status }),
      tone: toneOf(status),
    };
  };

  const { data: history, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: [
      'equipmentStatusHistory',
      target?.type,
      stationId,
      target?.chargePointId,
      target?.connectorId,
    ],
    queryFn: async () => {
      if (!target || !stationId) return [];
      if (target.type === 'chargePoint') {
        return api.chargePoints.statusHistory(target.chargePointId, stationId);
      }
      if (target.type === 'connector' && target.connectorId) {
        return api.connectors.statusHistory(target.connectorId, stationId, target.chargePointId);
      }
      return [];
    },
    enabled: Boolean(open && target && stationId),
  });

  const title = isConnector
    ? t('equipmentHistory.titleConnector')
    : t('equipmentHistory.titleChargePoint');
  const itemName = isConnector
    ? `${target?.connectorCode || target?.connectorId} (${target?.chargePointName || t('equipmentHistory.fallbackChargePoint')})`
    : `${target?.chargePointName || target?.chargePointCode || target?.chargePointId}`;

  const events = (history ?? []) as Array<ChargePointStatusEvent | ConnectorStatusEvent>;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-soft text-brand">
            <IconHistory size={16} />
          </span>
          <div>
            <div className="text-[15px] font-bold text-ink">{title}</div>
            <div className="text-[12px] font-mono text-muted">{itemName}</div>
          </div>
        </div>
      }
      width="500px"
    >
      <div className="flex flex-col gap-4 p-4 text-[13px] text-body">
        {/* Context info banner */}
        <div className="rounded-[9px] border border-line-2 bg-surface-2 p-3 text-[12px] text-muted">
          <div className="flex items-center gap-2">
            <IconBolt size={14} className="text-brand shrink-0" />
            <span>
              {t('equipmentHistory.banner')}
            </span>
          </div>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        )}

        {/* Error state */}
        {!isLoading && error && (
          <ApiErrorState
            error={error}
            compact
            eyebrow={t('equipmentHistory.error.eyebrow')}
            title={t('equipmentHistory.error.title')}
            onRetry={() => refetch()}
            isRetrying={isFetching}
          />
        )}

        {/* Empty state */}
        {!isLoading && !error && events.length === 0 && (
          <div className="py-8">
            <EmptyState
              title={t('equipmentHistory.empty.title')}
              description={t('equipmentHistory.empty.description')}
            />
          </div>
        )}

        {/* Timeline Events List */}
        {!isLoading && !error && events.length > 0 && (
          <div className="flex flex-col">
            {events.map((evt, idx) => {
              const isLast = idx === events.length - 1;
              const fromMeta = statusMeta(evt.fromStatus);
              const toMeta = statusMeta(evt.toStatus);
              const isCpEvt = 'statusDimension' in evt;
              const dimension = isCpEvt ? (evt as ChargePointStatusEvent).statusDimension : null;

              const actorLabel =
                evt.actorType === 'ADMIN'
                  ? t('equipmentHistory.actor.admin')
                  : evt.actorType === 'OWNER'
                  ? t('equipmentHistory.actor.owner')
                  : t('equipmentHistory.actor.system');

              const actorBadgeClass =
                evt.actorType === 'ADMIN'
                  ? 'border-brand/30 bg-brand-soft text-brand'
                  : evt.actorType === 'OWNER'
                  ? 'border-owner/30 bg-owner-soft text-owner'
                  : 'border-line-2 bg-surface-2 text-faint';

              return (
                <div key={evt.id || idx} className="flex items-stretch gap-3">
                  {/* Timeline Column (Dot + Connecting Line) */}
                  <div className="flex flex-col items-center">
                    <div className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 border-surface bg-brand ring-2 ring-brand/20 shadow-xs">
                      <div className="h-1.5 w-1.5 rounded-full bg-white" />
                    </div>
                    {!isLast && <div className="w-[2px] flex-1 bg-line-2 my-1" />}
                  </div>

                  {/* Event Card Content */}
                  <div className={`flex-1 ${isLast ? 'pb-2' : 'pb-4'}`}>
                    <div className="flex flex-col gap-2 rounded-xl border border-line-2 bg-surface p-3.5 shadow-xs transition hover:border-brand/30 hover:shadow-sm">
                      {/* Event Header: Actor & Timestamp */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline pb-2 text-[11px]">
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-bold ${actorBadgeClass}`}>
                          {evt.actorType === 'ADMIN' ? (
                            <IconShield size={11} />
                          ) : (
                            <IconUsers size={11} />
                          )}
                          <span>{actorLabel}</span>
                        </span>

                        <span className="flex items-center gap-1 font-mono text-faint">
                          <IconClock size={11} />
                          <span>{formatDateTimeVn(evt.performedAt)}</span>
                        </span>
                      </div>

                      {/* Dimension chip if ChargePoint */}
                      {dimension && (
                        <div className="text-[10.5px] font-semibold uppercase tracking-wider text-faint">
                          {dimension === 'PROVISIONING'
                            ? t('equipmentHistory.dimension.provisioning')
                            : t('equipmentHistory.dimension.operational')}
                        </div>
                      )}

                      {/* Transition: From Status -> To Status */}
                      <div className="flex flex-wrap items-center gap-2 text-[12px]">
                        <StatusPill tone={fromMeta.tone} label={fromMeta.label} />
                        <span className="text-faint font-bold font-mono">→</span>
                        <StatusPill tone={toMeta.tone} label={toMeta.label} />
                      </div>

                      {/* Reason / Note if available */}
                      {evt.reason && (
                        <div className="rounded-[8px] bg-surface-2 px-2.5 py-1.5 text-[11.5px] text-body border border-line-2/50 leading-relaxed">
                          <span className="font-semibold text-faint">{t('equipmentHistory.reasonLabel')} </span>
                          <span className="text-ink font-medium">
                            {formatStatusReason(evt.reason, t, 'incidentAction' in evt ? evt : undefined)}
                          </span>
                        </div>
                      )}

                      {/* Performed by user info */}
                      {evt.performedByDisplayName && (
                        <div className="text-[11px] text-faint">
                          {t('equipmentHistory.performedBy')} <span className="font-semibold text-muted">{evt.performedByDisplayName}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Drawer>
  );
}
