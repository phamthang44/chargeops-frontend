import { useQuery } from '@tanstack/react-query';
import { useApi, formatDateTimeVn, type StaffEquipmentHistoryItem } from '@chargeops/api';
import {
  Drawer,
  EmptyState,
  IconClock,
  IconHistory,
  IconShield,
  IconUsers,
  IconWrench,
  Skeleton,
  StatusPill,
} from '@chargeops/ui';

export interface StaffHistoryTarget {
  type: 'chargePoint' | 'connector';
  chargePointId: string;
  chargePointName?: string;
  chargePointCode?: string;
  connectorId?: string;
  connectorCode?: string;
}

export interface StaffStatusHistoryDrawerProps {
  open: boolean;
  onClose: () => void;
  stationId: string;
  target: StaffHistoryTarget | null;
}

/**
 * Status-change timeline for one charge point or connector, fed by the staff
 * history endpoints (`/staff/stations/{id}/charge-points/{cpId}/status-history`
 * and its connector sibling) — the owner drawer's endpoints require OWNER.
 */
export function StaffStatusHistoryDrawer({
  open,
  onClose,
  stationId,
  target,
}: StaffStatusHistoryDrawerProps) {
  const api = useApi();
  const isConnector = target?.type === 'connector';

  const { data, isLoading, error } = useQuery({
    queryKey: [
      'staff',
      'history',
      target?.type,
      stationId,
      target?.chargePointId,
      target?.connectorId,
    ],
    queryFn: async () => {
      if (!target || !stationId) return [];
      if (target.type === 'chargePoint') {
        const page = await api.staffOperations.chargePointHistory(stationId, target.chargePointId, {
          page: 0,
          size: 50,
        });
        return page.items;
      }
      if (target.connectorId) {
        const page = await api.staffOperations.connectorHistory(
          stationId,
          target.chargePointId,
          target.connectorId,
          { page: 0, size: 50 },
        );
        return page.items;
      }
      return [];
    },
    enabled: Boolean(open && target && stationId),
  });

  const events: StaffEquipmentHistoryItem[] = data ?? [];
  const itemName = isConnector
    ? `${target?.connectorCode || target?.connectorId} (${target?.chargePointName || target?.chargePointCode || ''})`
    : `${target?.chargePointName || target?.chargePointCode || target?.chargePointId}`;

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
            <div className="text-[15px] font-bold text-ink">
              {isConnector ? 'Lịch sử trạng thái Súng sạc' : 'Lịch sử trạng thái Trụ sạc'}
            </div>
            <div className="text-[12px] font-mono text-muted">{itemName}</div>
          </div>
        </div>
      }
      width="500px"
    >
      <div className="flex flex-col gap-4 p-4 text-[13px] text-body">
        {isLoading && (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        )}

        {!isLoading && error && (
          <div className="rounded-xl border border-bad/30 bg-bad-soft/40 p-4 text-center text-[12px] text-bad">
            Không thể tải lịch sử trạng thái: {(error as Error).message}
          </div>
        )}

        {!isLoading && !error && events.length === 0 && (
          <div className="py-8">
            <EmptyState
              title="Chưa có lịch sử trạng thái"
              description="Thiết bị này chưa ghi nhận bất kỳ sự kiện thay đổi trạng thái nào."
            />
          </div>
        )}

        {!isLoading && !error && events.length > 0 && (
          <div className="flex flex-col">
            {events.map((evt, idx) => {
              const isLast = idx === events.length - 1;
              const actorLabel =
                evt.actorType === 'STAFF'
                  ? 'Nhân viên vận hành (Staff)'
                  : evt.actorType === 'ADMIN'
                    ? 'Quản trị viên (Admin)'
                    : evt.actorType === 'OWNER'
                      ? 'Chủ trạm (Owner)'
                      : 'Hệ thống (System)';

              const actorBadgeClass =
                evt.actorType === 'STAFF'
                  ? 'border-owner/30 bg-owner-soft text-owner'
                  : evt.actorType === 'ADMIN'
                    ? 'border-brand/30 bg-brand-soft text-brand'
                    : 'border-line-2 bg-surface-2 text-faint';

              return (
                <div key={evt.id || idx} className="flex items-stretch gap-3">
                  <div className="flex flex-col items-center">
                    <div className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 border-surface bg-brand ring-2 ring-brand/20 shadow-xs">
                      <div className="h-1.5 w-1.5 rounded-full bg-white" />
                    </div>
                    {!isLast && <div className="my-1 w-[2px] flex-1 bg-line-2" />}
                  </div>

                  <div className={`flex-1 ${isLast ? 'pb-2' : 'pb-4'}`}>
                    <div className="flex flex-col gap-2 rounded-xl border border-line-2 bg-surface p-3.5 shadow-xs transition hover:border-brand/30 hover:shadow-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline pb-2 text-[11px]">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-bold ${actorBadgeClass}`}
                        >
                          {evt.actorType === 'SYSTEM' ? (
                            <IconWrench size={11} />
                          ) : evt.actorType === 'ADMIN' ? (
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

                      <div className="text-[10.5px] font-semibold uppercase tracking-wider text-faint">
                        {evt.dimension === 'CHARGE_POINT' ? 'Trụ sạc' : 'Súng sạc'}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-[12px]">
                        <StatusPill tone={toneFor(evt.fromStatus)} label={labelFor(evt.fromStatus)} />
                        <span className="font-mono font-bold text-faint">→</span>
                        <StatusPill tone={toneFor(evt.toStatus)} label={labelFor(evt.toStatus)} />
                      </div>

                      {evt.reason && (
                        <div className="rounded-[8px] border border-line-2/50 bg-surface-2 px-2.5 py-1.5 text-[11.5px] leading-relaxed text-body">
                          <span className="font-semibold text-faint">Lý do: </span>
                          <span className="font-medium text-ink">"{evt.reason}"</span>
                        </div>
                      )}

                      {evt.performedByDisplayName && (
                        <div className="text-[11px] text-faint">
                          Thực hiện bởi:{' '}
                          <span className="font-semibold text-muted">{evt.performedByDisplayName}</span>
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

const STATUS_LABELS: Record<string, { label: string; tone: 'good' | 'warn' | 'bad' | 'brand' | 'neutral' }> = {
  PENDING_ACTIVATION: { label: 'Chờ kích hoạt', tone: 'neutral' },
  ACTIVE: { label: 'Hoạt động', tone: 'good' },
  SUSPENDED: { label: 'Tạm ngưng', tone: 'warn' },
  AVAILABLE: { label: 'Sẵn sàng', tone: 'good' },
  OFFLINE: { label: 'Ngoại tuyến', tone: 'bad' },
  MAINTENANCE: { label: 'Bảo trì', tone: 'warn' },
  IN_USE: { label: 'Đang sạc', tone: 'brand' },
};

function labelFor(status: string): string {
  return STATUS_LABELS[String(status).toUpperCase()]?.label ?? status;
}

function toneFor(status: string): 'good' | 'warn' | 'bad' | 'brand' | 'neutral' {
  return STATUS_LABELS[String(status).toUpperCase()]?.tone ?? 'neutral';
}
