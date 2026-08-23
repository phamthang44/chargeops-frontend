import { useQuery } from '@tanstack/react-query';
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

const STATUS_LABELS: Record<string, { label: string; tone: 'good' | 'warn' | 'bad' | 'brand' | 'neutral' }> = {
  // Provisioning
  PENDING_ACTIVATION: { label: 'Chờ kích hoạt', tone: 'neutral' },
  ACTIVE: { label: 'Hoạt động', tone: 'good' },
  SUSPENDED: { label: 'Tạm ngưng', tone: 'warn' },
  // Operational
  AVAILABLE: { label: 'Sẵn sàng', tone: 'good' },
  OFFLINE: { label: 'Ngoại tuyến', tone: 'bad' },
  MAINTENANCE: { label: 'Bảo trì', tone: 'warn' },
  // Connector runtime
  IN_USE: { label: 'Đang sạc', tone: 'brand' },
  INUSE: { label: 'Đang sạc', tone: 'brand' },
};

function formatStatus(status?: string | null): { label: string; tone: 'good' | 'warn' | 'bad' | 'brand' | 'neutral' } {
  if (!status) return { label: '—', tone: 'neutral' };
  const upper = String(status).toUpperCase();
  return STATUS_LABELS[upper] || { label: status, tone: 'neutral' };
}

export function EquipmentStatusHistoryDrawer({
  open,
  onClose,
  stationId,
  target,
}: EquipmentStatusHistoryDrawerProps) {
  const api = useApi();
  const isConnector = target?.type === 'connector';

  const { data: history, isLoading, error } = useQuery({
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

  const title = isConnector ? 'Lịch sử trạng thái Súng sạc' : 'Lịch sử trạng thái Trụ sạc';
  const itemName = isConnector
    ? `${target?.connectorCode || target?.connectorId} (${target?.chargePointName || 'Trụ sạc'})`
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
              Nhật ký ghi nhận mọi thay đổi trạng thái từ Quản trị viên (Admin), Chủ trạm (Owner) và Hệ thống (System).
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
          <div className="rounded-xl border border-bad/30 bg-bad-soft/40 p-4 text-center text-[12px] text-bad">
            Không thể tải lịch sử trạng thái: {(error as Error).message}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && events.length === 0 && (
          <div className="py-8">
            <EmptyState
              title="Chưa có lịch sử trạng thái"
              description="Thiết bị này chưa ghi nhận bất kỳ sự kiện thay đổi trạng thái nào trong hệ thống."
            />
          </div>
        )}

        {/* Timeline Events List */}
        {!isLoading && !error && events.length > 0 && (
          <div className="flex flex-col">
            {events.map((evt, idx) => {
              const isLast = idx === events.length - 1;
              const fromMeta = formatStatus(evt.fromStatus);
              const toMeta = formatStatus(evt.toStatus);
              const isCpEvt = 'statusDimension' in evt;
              const dimension = isCpEvt ? (evt as ChargePointStatusEvent).statusDimension : null;

              const actorLabel =
                evt.actorType === 'ADMIN'
                  ? 'Quản trị viên (Admin)'
                  : evt.actorType === 'OWNER'
                  ? 'Chủ trạm (Owner)'
                  : 'Hệ thống (System)';

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
                          {dimension === 'PROVISIONING' ? 'Vòng đời cấp hạ tầng' : 'Trạng thái vận hành trạm'}
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
                          <span className="font-semibold text-faint">Lý do: </span>
                          <span className="text-ink font-medium">"{evt.reason}"</span>
                        </div>
                      )}

                      {/* Performed by user info */}
                      {evt.performedByDisplayName && (
                        <div className="text-[11px] text-faint">
                          Thực hiện bởi: <span className="font-semibold text-muted">{evt.performedByDisplayName}</span>
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
