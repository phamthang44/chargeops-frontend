import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  useApi,
  type ConnectorRuntimeStatus,
  type OperationalChargePointStatus,
} from '@chargeops/api';
import {
  Button,
  Card,
  IconAlertTriangle,
  IconHistory,
  IconWrench,
  KpiCard,
  PageHeader,
  Skeleton,
  StatusPill,
  useToast,
} from '@chargeops/ui';
import { getApiErrorMessage } from '../../i18n';
import { ApiErrorState } from '../../shared/components/ApiErrorState';
import { ResourceStateCard } from '../../shared/components/ResourceStateCard';
import { ReportIncidentModal } from '../../owner/features/chargers/ReportIncidentModal';
import { ConnectorIncidentDrawer } from '../../owner/features/chargers/ConnectorIncidentDrawer';
import { useStaffStation } from '../context/StaffStationContext';
import { useStaffEquipment, type StaffEquipmentGroup } from '../hooks/useStaffEquipment';
import {
  StaffStatusChangeDialog,
  type StaffStatusTarget,
} from '../features/StaffStatusChangeDialog';
import {
  StaffStatusHistoryDrawer,
  type StaffHistoryTarget,
} from '../features/StaffStatusHistoryDrawer';

const CP_TARGETS: OperationalChargePointStatus[] = ['AVAILABLE', 'OFFLINE', 'MAINTENANCE'];
const CONNECTOR_TARGETS: ConnectorRuntimeStatus[] = ['AVAILABLE', 'OFFLINE'];

/**
 * Day-to-day equipment screen (Ops-03/Ops-04 + BKG-054/055): status changes go
 * through the staff endpoints with the item's `version` as the optimistic lock,
 * and emergency incident reporting is embedded here rather than in a separate
 * route.
 */
export function StaffChargers() {
  const { t } = useTranslation('staff');
  const api = useApi();
  const qc = useQueryClient();
  const toast = useToast();
  const { selectedStationId, currentStation } = useStaffStation();
  const stationId = selectedStationId || '';
  const equipment = useStaffEquipment(selectedStationId || undefined);

  const [target, setTarget] = useState<StaffStatusTarget | null>(null);
  const [historyTarget, setHistoryTarget] = useState<StaffHistoryTarget | null>(null);
  const [incidentTarget, setIncidentTarget] = useState<
    Extract<StaffStatusTarget, { kind: 'connector' }> | null
  >(null);
  const [activeIncidentId, setActiveIncidentId] = useState<string | null>(null);

  const invalidate = () => qc.invalidateQueries({ queryKey: ['staff'] });

  const changeChargePoint = useMutation({
    mutationFn: ({
      target: t2,
      reason,
    }: {
      target: Extract<StaffStatusTarget, { kind: 'chargePoint' }>;
      reason: string;
    }) =>
      api.staffOperations.changeChargePointStatus(stationId, t2.chargePoint.id, {
        operationalStatus: t2.next,
        expectedVersion: t2.chargePoint.version,
        reason: reason || undefined,
      }),
    onSuccess: () => {
      setTarget(null);
      void invalidate();
      toast(t('chargers.statusUpdated'), 'success');
    },
    onError: (e) => toast(getApiErrorMessage(e), 'error'),
  });

  const changeConnector = useMutation({
    mutationFn: ({
      target: t2,
      reason,
    }: {
      target: Extract<StaffStatusTarget, { kind: 'connector' }>;
      reason: string;
    }) =>
      api.staffOperations.changeConnectorStatus(
        stationId,
        t2.chargePoint.id,
        t2.connector.id,
        {
          runtimeStatus: t2.next,
          expectedVersion: t2.connector.version,
          reason: reason || undefined,
        },
      ),
    onSuccess: () => {
      setTarget(null);
      void invalidate();
      toast(t('chargers.statusUpdated'), 'success');
    },
    onError: (e) => toast(getApiErrorMessage(e), 'error'),
  });

  const saving = changeChargePoint.isPending || changeConnector.isPending;
  const offlineCount = equipment.offlineConnectors.length;

  return (
    <>
      <PageHeader
        title={t('chargers.title')}
        subtitle={
          currentStation
            ? t('chargers.subtitle', { station: currentStation.name })
            : t('chargers.subtitleFallback')
        }
      />

      {equipment.error ? (
        <ApiErrorState
          error={equipment.error}
          eyebrow={t('chargers.error.eyebrow', { defaultValue: 'Cổng sạc' })}
          title={t('chargers.error.title', { defaultValue: 'Không thể tải danh sách cổng sạc' })}
          onRetry={() => equipment.refetch()}
        />
      ) : equipment.isLoading ? (
        <ChargersSkeleton />
      ) : equipment.groups.length === 0 ? (
        <ResourceStateCard
          tone="brand"
          eyebrow={t('chargers.title', { defaultValue: 'Cổng sạc' })}
          title={t('chargers.emptyTitle')}
          description={t('chargers.emptyBody')}
        />
      ) : (
        <>
          <div className="mb-4 grid grid-cols-3 gap-[13px]">
            <KpiCard
              label={t('chargers.kpi.chargePoints')}
              value={String(equipment.chargePoints.length)}
              delta={t('chargers.kpi.chargePointsSub')}
            />
            <KpiCard
              label={t('chargers.kpi.connectors')}
              value={String(equipment.connectors.length)}
              delta={t('chargers.kpi.connectorsSub', {
                available: equipment.connectors.filter((c) => c.runtimeStatus === 'AVAILABLE').length,
              })}
              deltaClass="text-faint"
            />
            <KpiCard
              label={t('chargers.kpi.offline')}
              value={String(offlineCount)}
              delta={offlineCount > 0 ? t('chargers.kpi.offlineSub') : t('chargers.kpi.allOnline')}
              deltaClass={offlineCount > 0 ? 'text-bad' : 'text-good'}
            />
          </div>

          <div className="flex flex-col gap-3">
            {equipment.groups.map((group) => (
              <ChargePointCard
                key={group.chargePoint.id}
                group={group}
                onStatus={(next) =>
                  setTarget({
                    kind: 'chargePoint',
                    chargePoint: group.chargePoint,
                    connectorCount: group.connectors.length,
                    next,
                  })
                }
                onConnectorStatus={(connector, next) =>
                  setTarget({ kind: 'connector', chargePoint: group.chargePoint, connector, next })
                }
                onHistory={(next) => setHistoryTarget(next)}
                onReportIncident={(next) => {
                  if (next.connector.activeIncidentId) {
                    setActiveIncidentId(next.connector.activeIncidentId);
                    return;
                  }
                  setIncidentTarget(next);
                }}
                onOpenIncident={(incidentId) => setActiveIncidentId(incidentId)}
              />
            ))}
          </div>
        </>
      )}

      <StaffStatusChangeDialog
        target={target}
        saving={saving}
        onClose={() => setTarget(null)}
        onConfirm={(confirmed, reason) => {
          if (confirmed.kind === 'chargePoint') {
            changeChargePoint.mutate({ target: confirmed, reason });
          } else {
            changeConnector.mutate({ target: confirmed, reason });
          }
        }}
        onReportIncident={(next) => {
          if (next.kind !== 'connector') return;
          setTarget(null);
          setIncidentTarget(next);
        }}
      />

      <StaffStatusHistoryDrawer
        open={Boolean(historyTarget)}
        onClose={() => setHistoryTarget(null)}
        stationId={stationId}
        target={historyTarget}
      />

      {incidentTarget && (
        <ReportIncidentModal
          open
          onClose={() => setIncidentTarget(null)}
          stationId={stationId}
          chargePoint={{ name: incidentTarget.chargePoint.name || incidentTarget.chargePoint.code }}
          connector={{
            id: incidentTarget.connector.id,
            connectorCode: incidentTarget.connector.code,
            connectorType: incidentTarget.connector.connectorType,
            version: incidentTarget.connector.version,
          }}
          onSuccess={(inc) => {
            setIncidentTarget(null);
            setActiveIncidentId(inc.incidentId);
            void invalidate();
          }}
        />
      )}

      <ConnectorIncidentDrawer
        open={Boolean(activeIncidentId)}
        onClose={() => setActiveIncidentId(null)}
        stationId={stationId}
        incidentId={activeIncidentId}
        onIncidentUpdated={() => {
          void invalidate();
        }}
      />
    </>
  );
}

function ChargePointCard({
  group,
  onStatus,
  onConnectorStatus,
  onHistory,
  onReportIncident,
  onOpenIncident,
}: {
  group: StaffEquipmentGroup;
  onStatus: (next: OperationalChargePointStatus) => void;
  onConnectorStatus: (
    connector: StaffEquipmentGroup['connectors'][number],
    next: ConnectorRuntimeStatus,
  ) => void;
  onHistory: (target: StaffHistoryTarget) => void;
  onReportIncident: (
    target: Extract<StaffStatusTarget, { kind: 'connector' }>,
  ) => void;
  onOpenIncident: (incidentId: string) => void;
}) {
  const { t } = useTranslation('staff');
  const { chargePoint, connectors } = group;
  const provisioned = chargePoint.provisioningStatus === 'ACTIVE';

  return (
    <Card className="overflow-hidden border border-line/60 shadow-subtle">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline bg-surface-2/80 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-owner-soft text-owner">
            <IconWrench size={15} />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[13.5px] font-bold text-ink">
                {chargePoint.name || chargePoint.code}
              </span>
              <span className="rounded bg-chip px-2 py-0.5 font-mono text-[10px] font-semibold text-faint">
                {chargePoint.code}
              </span>
              {chargePoint.zoneLabel && (
                <span className="text-[11.5px] text-muted">· {chargePoint.zoneLabel}</span>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-[11.5px] text-muted">
              <StatusPill
                tone={toneFor(chargePoint.operationalStatus)}
                label={t(`status.${chargePoint.operationalStatus}`)}
              />
              {!provisioned && (
                <span className="font-medium text-warn">
                  {t('chargers.notProvisioned', {
                    status: t(`status.${chargePoint.provisioningStatus}`),
                  })}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {provisioned &&
            CP_TARGETS.filter((s) => s !== chargePoint.operationalStatus).map((s) => (
              <Button key={s} size="sm" variant="secondary" onClick={() => onStatus(s)}>
                {t('chargers.setTo', { status: t(`status.${s}`) })}
              </Button>
            ))}
          <Button
            size="sm"
            variant="ghost"
            onClick={() =>
              onHistory({
                type: 'chargePoint',
                chargePointId: chargePoint.id,
                chargePointName: chargePoint.name,
                chargePointCode: chargePoint.code,
              })
            }
          >
            <IconHistory size={13} /> {t('chargers.historyBtn')}
          </Button>
        </div>
      </div>

      {connectors.length === 0 ? (
        <div className="px-4 py-3 text-[12px] text-muted">{t('chargers.noConnectors')}</div>
      ) : (
        <div className="divide-y divide-hairline">
          {connectors.map((connector) => {
            const locked = connector.runtimeStatus === 'IN_USE';
            const hasOpenIncident = Boolean(connector.activeIncidentId);
            return (
              <div
                key={connector.id}
                className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 hover:bg-surface-2/40 ${
                  hasOpenIncident ? 'border-l-2 border-bad bg-bad-soft/20' : ''
                }`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="font-mono text-[12px] font-semibold text-brand">
                    {connector.code || connector.id}
                  </span>
                  <span className="text-[12px] text-muted">{connector.connectorType}</span>
                  <StatusPill
                    tone={hasOpenIncident ? 'bad' : toneFor(connector.runtimeStatus)}
                    label={hasOpenIncident ? t('chargers.incidentStatus', 'CÓ SỰ CỐ') : t(`status.${connector.runtimeStatus}`)}
                  />
                  {hasOpenIncident && (
                    <span className="flex items-center gap-1 rounded bg-bad-soft px-1.5 py-0.5 text-[11px] font-medium text-bad">
                      <IconAlertTriangle size={11} /> {t('chargers.handlingIncident', 'Đang xử lý sự cố')}
                    </span>
                  )}
                  {locked && (
                    <span className="flex items-center gap-1 text-[11px] text-faint">
                      <IconAlertTriangle size={11} /> {t('chargers.inUseLock')}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {!locked &&
                    CONNECTOR_TARGETS.filter((s) => s !== connector.runtimeStatus).map((s) => {
                      const isBlocked = hasOpenIncident && s === 'AVAILABLE';
                      return (
                        <Button
                          key={s}
                          size="sm"
                          variant={s === 'OFFLINE' ? 'danger-soft' : 'secondary'}
                          disabled={isBlocked}
                          title={
                            isBlocked
                              ? t(
                                  'chargers.incidentBlockedTooltip',
                                  'Cổng đang có sự cố chưa được khắc phục. Vui lòng khắc phục sự cố trước khi bật lại.',
                                )
                              : undefined
                          }
                          onClick={() => onConnectorStatus(connector, s)}
                        >
                          {t('chargers.setTo', { status: t(`status.${s}`) })}
                        </Button>
                      );
                    })}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      onHistory({
                        type: 'connector',
                        chargePointId: chargePoint.id,
                        chargePointName: chargePoint.name,
                        chargePointCode: chargePoint.code,
                        connectorId: connector.id,
                        connectorCode: connector.code,
                      })
                    }
                  >
                    <IconHistory size={13} /> {t('chargers.historyBtn')}
                  </Button>

                  {hasOpenIncident ? (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => onOpenIncident(connector.activeIncidentId!)}
                    >
                      <IconWrench size={13} /> {t('chargers.resolveBtn', 'Khắc phục sự cố')}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="danger-soft"
                      onClick={() =>
                        onReportIncident({
                          kind: 'connector',
                          chargePoint,
                          connector,
                          next: 'OFFLINE',
                        })
                      }
                    >
                      <IconAlertTriangle size={13} /> {t('chargers.reportBtn')}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function toneFor(status: string): 'good' | 'warn' | 'bad' | 'brand' | 'neutral' {
  switch (status) {
    case 'AVAILABLE':
    case 'ACTIVE':
    case 'OPERATING':
      return 'good';
    case 'MAINTENANCE':
    case 'PENDING_ACTIVATION':
      return 'warn';
    case 'OFFLINE':
    case 'SUSPENDED':
    case 'PAUSED':
      return 'bad';
    case 'IN_USE':
      return 'brand';
    default:
      return 'neutral';
  }
}

function ChargersSkeleton() {
  return (
    <>
      <div className="mb-4 grid grid-cols-3 gap-[13px]">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-[92px] rounded-card" />
        ))}
      </div>
      <Skeleton className="h-[320px] rounded-card" />
    </>
  );
}
