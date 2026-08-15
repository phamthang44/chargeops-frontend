import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  formatDateVn,
  formatDateTimeVn,
  useApi,
  type Station,
  type StationStatusEventType,
} from '@chargeops/api';
import {
  Button,
  IconAlertTriangle,
  IconCheck,
  IconClock,
  IconRefreshCw,
  IconSend,
  IconX,
  Modal,
  Skeleton,
  StatusPill,
} from '@chargeops/ui';

interface Props {
  station: Station;
  open: boolean;
  onClose: () => void;
}

const EVENT_CONFIG: Record<
  StationStatusEventType,
  {
    titleKey: string;
    tone: 'brand' | 'good' | 'bad' | 'warn' | 'neutral';
    icon: typeof IconCheck;
  }
> = {
  SUBMITTED: {
    titleKey: 'stations.timeline.events.submitted',
    tone: 'brand',
    icon: IconSend,
  },
  APPROVED: {
    titleKey: 'stations.timeline.events.approved',
    tone: 'good',
    icon: IconCheck,
  },
  REJECTED: {
    titleKey: 'stations.timeline.events.rejected',
    tone: 'bad',
    icon: IconX,
  },
  RESUBMITTED: {
    titleKey: 'stations.timeline.events.resubmitted',
    tone: 'brand',
    icon: IconRefreshCw,
  },
  SUSPENDED: {
    titleKey: 'stations.timeline.events.suspended',
    tone: 'warn',
    icon: IconAlertTriangle,
  },
  REACTIVATED: {
    titleKey: 'stations.timeline.events.reactivated',
    tone: 'good',
    icon: IconCheck,
  },
  WITHDRAWN: {
    titleKey: 'stations.timeline.events.withdrawn',
    tone: 'neutral',
    icon: IconClock,
  },
};

export function StationTimelineModal({ station, open, onClose }: Props) {
  const { t } = useTranslation('owner');
  const api = useApi();

  const { data: history, isLoading, error } = useQuery({
    queryKey: ['stations', 'history', station.id],
    queryFn: () => api.stations.statusHistory(station.id),
    enabled: open,
  });

  return (
    <Modal open={open} onClose={onClose} maxWidth={540}>
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-hairline pb-3">
          <div>
            <div className="text-[16px] font-bold text-ink">
              {t('stations.timeline.title', { name: station.name })}
            </div>
            <div className="mt-0.5 text-[12px] text-muted">
              {station.stationCode || station.id}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-faint hover:bg-surface-2 hover:text-ink"
          >
            <IconX size={18} />
          </button>
        </div>

        {/* Station Subheader */}
        <div className="flex items-center justify-between rounded-[10px] border border-hairline bg-surface-2 p-3">
          <div>
            <div className="text-[13px] font-bold text-ink">{station.name}</div>
            <div className="text-[11.5px] text-muted">{station.city || station.provinceName}</div>
          </div>
          <StatusPill
            tone={
              station.status === 'active' || station.status === 'ACTIVE'
                ? 'good'
                : station.status === 'rejected' || station.status === 'REJECTED'
                  ? 'bad'
                  : 'warn'
            }
            label={station.status}
          />
        </div>

        {/* Timeline Content */}
        {isLoading ? (
          <div className="flex flex-col gap-3 py-4">
            <Skeleton className="h-16 w-full rounded-[8px]" />
            <Skeleton className="h-16 w-full rounded-[8px]" />
          </div>
        ) : error ? (
          <div className="rounded-[9px] border border-bad-border bg-bad-soft p-3.5 text-[12.5px] text-bad-deep">
            {t('stations.timeline.loadError', { message: (error as Error).message })}
          </div>
        ) : !history || history.length === 0 ? (
          <div className="py-8 text-center text-[13px] text-muted">
            {t('stations.timeline.noHistory')}
          </div>
        ) : (
          <div className="relative my-2 max-h-[50vh] overflow-y-auto pr-1 flex flex-col gap-0 pl-3">
            {/* Timeline vertical bar */}
            <div className="absolute top-3 bottom-3 left-[23px] w-[2px] bg-line-3" />

            {history.map((item) => {
              const eventKey = item.eventType as StationStatusEventType;
              const cfg = EVENT_CONFIG[eventKey] ?? {
                titleKey: item.eventType,
                tone: 'neutral' as const,
                icon: IconClock,
              };
              const Icon = cfg.icon;

              return (
                <div key={item.id} className="relative z-10 flex items-start gap-3.5 pb-6 last:pb-1">
                  {/* Event Icon Circle */}
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border shadow-xs ${
                      cfg.tone === 'good'
                        ? 'border-good-border bg-good-soft text-good'
                        : cfg.tone === 'bad'
                          ? 'border-bad-border bg-bad-soft text-bad-deep'
                          : cfg.tone === 'warn'
                            ? 'border-warn-border bg-warn-soft text-warn-deep'
                            : 'border-brand/30 bg-brand/10 text-brand'
                    }`}
                  >
                    <Icon size={14} />
                  </div>

                  {/* Event Details */}
                  <div className="flex-1 rounded-[10px] border border-hairline bg-surface p-3 shadow-xs">
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <div className="text-[13px] font-bold text-ink">
                        {t(cfg.titleKey, { defaultValue: item.eventType })}
                      </div>
                      <div className="text-[11px] font-medium text-faint">
                        {formatDateTimeVn(item.performedAt)}
                      </div>
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11.5px] text-muted">
                      <span>{t('stations.timeline.performedBy')}:</span>
                      <span className="font-semibold text-ink">{item.performedByName}</span>
                      {item.performedByEmail && (
                        <span className="text-[11px] text-faint">({item.performedByEmail})</span>
                      )}
                      {item.performedByRole && (
                        <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-medium text-faint">
                          {item.performedByRole}
                        </span>
                      )}
                    </div>

                    {/* Status transition badge */}
                    <div className="mt-2 flex items-center gap-1 text-[11px] font-mono text-faint">
                      <span>{item.fromStatus || '—'}</span>
                      <span>→</span>
                      <span className="font-bold text-ink">{item.toStatus}</span>
                    </div>

                    {/* Rejection / Suspension reason callout */}
                    {item.reason && (
                      <div className="mt-2.5 rounded-[8px] border border-bad-border/60 bg-bad-soft/60 p-2.5 text-[12px] leading-relaxed text-bad-deep">
                        <div className="font-semibold text-[11px] uppercase tracking-wider">
                          {t('stations.timeline.reasonTitle')}:
                        </div>
                        <div className="mt-0.5">{item.reason}</div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="mt-2 flex justify-end border-t border-hairline pt-3">
          <Button variant="ghost" onClick={onClose}>
            {t('common:close', 'Đóng')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
