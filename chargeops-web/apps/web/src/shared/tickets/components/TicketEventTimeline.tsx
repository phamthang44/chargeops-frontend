import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  formatDateVn,
  formatTimeVn,
  TICKET_EVENT_TYPE,
  useApi,
  type TicketEvent,
} from '@chargeops/api';
import { Avatar, Skeleton, StatusPill, IconHistory, IconAlertCircle } from '@chargeops/ui';

interface TicketEventTimelineProps {
  ticketId: string;
  role?: 'owner' | 'admin';
}

export function TicketEventTimeline({ ticketId, role }: TicketEventTimelineProps) {
  const { t } = useTranslation('tickets');
  const api = useApi();

  const eventsQuery = useQuery({
    queryKey: ['tickets', 'events', ticketId, role],
    queryFn: () => api.tickets.events(ticketId, { role }),
  });

  const events: TicketEvent[] = eventsQuery.data ?? [];

  if (eventsQuery.isLoading) {
    return (
      <div className="space-y-3 p-4">
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-muted">
        <IconHistory size={28} className="mb-2 text-faint" />
        <p className="text-[13px] font-medium text-ink">
          {t('timeline.emptyTitle', 'Chưa có nhật ký sự kiện nào')}
        </p>
        <p className="mt-0.5 text-[11.5px] text-faint">
          {t('timeline.emptyHelp', 'Các thao tác tự nhận việc, phân công, giải quyết vé sẽ được lưu vết bền vững tại đây.')}
        </p>
      </div>
    );
  }

  return (
    <div className="relative space-y-4 p-4">
      {/* Timeline vertical hairline line */}
      <div className="absolute left-[27px] top-6 bottom-6 w-0.5 bg-line-2 hidden sm:block" />

      {events.map((evt, idx) => {
        const meta = TICKET_EVENT_TYPE[evt.eventType] || {
          label: evt.eventType,
          tone: 'neutral' as const,
        };

        const actorKindMap: Record<string, string> = {
          ADMIN: t('actor.ADMIN', 'Quản trị viên'),
          OWNER: t('actor.OWNER', 'Chủ trạm'),
          STAFF: t('actor.STAFF', 'Nhân viên'),
          REPORTER: t('actor.driver', 'Tài xế'),
          SYSTEM: t('actor.SYSTEM', 'Hệ thống'),
        };

        const actorName = evt.actorName || evt.actorId || (evt.actorKind === 'SYSTEM' ? t('actor.SYSTEM', 'Hệ thống tự động') : t('detail.userFallback', 'Người dùng'));
        const roleLabel = actorKindMap[evt.actorKind] || evt.actorKind;

        return (
          <div key={evt.id || idx} className="relative flex items-start gap-3 sm:gap-3.5">
            <div className="relative z-10 shrink-0">
              <Avatar name={actorName} size="sm" tone={evt.actorKind === 'SYSTEM' ? 'neutral' : 'brand'} />
            </div>

            <div className="flex-1 rounded-xl border border-hairline bg-surface p-3 text-[12px] shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-hairline pb-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-ink">{actorName}</span>
                  <span className="rounded bg-chip px-1.5 py-0.2 text-[9.5px] font-medium text-muted">
                    {roleLabel}
                  </span>
                  <StatusPill tone={meta.tone} label={t(`events.${evt.eventType}`, meta.label)} />
                </div>
                <div className="text-[11px] text-faint">
                  {formatDateVn(evt.createdAt)} {formatTimeVn(evt.createdAt)}
                </div>
              </div>

              <div className="mt-2 space-y-1 text-muted">
                {evt.fromStatus !== evt.toStatus && (
                  <div className="flex items-center gap-1.5 text-[11.5px]">
                    <span className="font-medium text-faint">{t('timeline.statusTransition', 'Trạng thái:')}</span>
                    <span className="font-semibold text-ink">{t(`status.${evt.fromStatus}`, evt.fromStatus)}</span>
                    <span>→</span>
                    <span className="font-semibold text-brand">{t(`status.${evt.toStatus}`, evt.toStatus)}</span>
                  </div>
                )}

                {evt.toHandlerName && (
                  <div className="text-[11.5px]">
                    <span className="text-faint">{t('timeline.assignedTo', 'Phân công cho:')} </span>
                    <span className="font-medium text-ink">{evt.toHandlerName}</span>
                  </div>
                )}

                {evt.reason && (
                  <div className="mt-1.5 rounded-lg border border-line bg-surface-2 p-2 text-[11.5px] italic text-body">
                    “{evt.reason}”
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
