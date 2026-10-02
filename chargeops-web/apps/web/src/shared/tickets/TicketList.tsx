import { useTranslation } from 'react-i18next';
import {
  formatDateVn,
  formatTimeVn,
  TICKET_CATEGORY,
  TICKET_PRIORITY,
  TICKET_STATUS,
  type Ticket,
  type TicketCategory,
  type TicketPriority,
  type TicketStatus,
} from '@chargeops/api';
import { Avatar, Card, EmptyState, IconCheckCircle, IconClock, IconUsers, StatusPill } from '@chargeops/ui';

const GRID = '150px 1fr 140px 140px 130px';

function PriorityDot({ priority }: { priority?: TicketPriority }) {
  const { t } = useTranslation('tickets');
  const p = priority || 'MEDIUM';
  const meta = TICKET_PRIORITY[p] || { label: p, tone: 'neutral' };
  const label = t(`priority.${p}`, meta.label);
  const dotColor =
    p === 'CRITICAL'
      ? 'bg-bad-deep ring-2 ring-bad/20 animate-pulse'
      : p === 'HIGH'
      ? 'bg-warn-deep'
      : p === 'MEDIUM'
      ? 'bg-brand'
      : 'bg-muted';

  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted">
      <span className={`h-2 w-2 rounded-full ${dotColor}`} />
      <span>{label}</span>
    </span>
  );
}

function Meta({ t: tk }: { t: Ticket }) {
  const { t } = useTranslation('tickets');
  const categoryKey = tk.category as TicketCategory;
  const categoryLabel = t(`category.${categoryKey}`, TICKET_CATEGORY[categoryKey] ?? tk.category);
  const reporter = tk.reporterName || tk.driverName || 'Tài xế';
  const timestamp = tk.updatedAt || tk.createdAt;
  const hasRefund = Boolean(tk.refundIds && tk.refundIds.length > 0);
  const isEscalated = Boolean((tk as any).isEscalated || (tk as any).escalatedAt);

  return (
    <div className="min-w-0 pr-3">
      <div className="flex items-center gap-2">
        <span className="truncate font-semibold text-ink">{tk.subject || tk.title || 'Phiếu hỗ trợ'}</span>
        {isEscalated && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded bg-purple-500/15 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 text-[10px] font-bold border border-purple-500/25">
            <span>⚡ {t('meta.escalatedBadge', 'Chờ phân xử')}</span>
          </span>
        )}
        {hasRefund && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded bg-good-soft px-1.5 py-0.5 text-[10px] font-bold text-good-deep">
            <IconCheckCircle size={11} strokeWidth={2.2} />
            <span>Hoàn 100%</span>
          </span>
        )}
      </div>

      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-muted">
        <span className="rounded bg-chip px-1.5 py-0.5 text-[10px] font-medium text-body">
          {categoryLabel}
        </span>

        {tk.bookingId && (
          <span className="font-mono text-[10.5px] text-brand">
            #{String(tk.bookingId).slice(0, 8)}
          </span>
        )}

        <span>·</span>
        <span className="truncate">{reporter}</span>
        <span>·</span>
        <span className="shrink-0 text-faint">
          {formatDateVn(timestamp)} {formatTimeVn(timestamp)}
        </span>
      </div>
    </div>
  );
}

/** Desktop table. Click a row to open the ticket thread. */
export function TicketTable({ rows, onOpen }: { rows: Ticket[]; onOpen: (t: Ticket) => void }) {
  const { t } = useTranslation('tickets');
  if (rows.length === 0) return <EmptyState>{t('emptyState')}</EmptyState>;

  return (
    <div className="min-w-[840px]">
      <div
        className="grid bg-surface-2 px-4 py-[11px] text-[10px] font-bold uppercase tracking-[0.08em] text-faint"
        style={{ gridTemplateColumns: GRID }}
      >
        <span>{t('table.cols.id')} / {t('table.cols.priority', 'Ưu tiên')}</span>
        <span>{t('table.cols.content')}</span>
        <span>{t('table.cols.station')}</span>
        <span>{t('table.cols.handler', 'Người phụ trách')}</span>
        <span className="text-center">{t('table.cols.status')}</span>
      </div>
      {rows.map((tk) => {
        const statusKey = (String(tk.status || 'OPEN').toUpperCase()) as TicketStatus;
        const meta = TICKET_STATUS[statusKey] ?? { label: tk.status, tone: 'neutral' as const };
        const statusLabel = t(`status.${statusKey}`, meta.label);
        const code = tk.ticketCode || tk.ticketNo || (tk.id ? `TKT-${tk.id.slice(0, 8).toUpperCase()}` : '—');
        const handlerName = tk.assignedHandlerName || tk.assignedToName;

        return (
          <div
            key={tk.id}
            onClick={() => onOpen(tk)}
            className="grid cursor-pointer items-center border-b border-hairline px-4 py-3 text-[12.5px] font-medium hover:bg-row-hover transition-colors"
            style={{ gridTemplateColumns: GRID }}
          >
            <div className="flex flex-col gap-0.5">
              <span className="font-mono text-[11.5px] font-bold text-brand">{code}</span>
              <PriorityDot priority={tk.priority} />
            </div>

            <Meta t={tk} />

            <span className="truncate text-muted text-[12px]">{tk.stationName ?? '—'}</span>

            {/* Handler column */}
            <div className="flex items-center gap-2 min-w-0 pr-2">
              {handlerName ? (
                <>
                  <Avatar name={handlerName} size="sm" tone="brand" />
                  <span className="truncate text-[12px] text-ink font-medium">{handlerName}</span>
                </>
              ) : (
                <span className="inline-flex items-center gap-1 rounded bg-amber-500/15 px-2 py-0.5 text-[10.5px] font-bold text-amber-500">
                  <IconUsers size={11} strokeWidth={2} />
                  <span>{t('table.unassigned', 'Chờ tiếp nhận')}</span>
                </span>
              )}
            </div>

            <div className="flex flex-col items-center gap-1">
              <StatusPill tone={meta.tone} label={statusLabel} />
              {statusKey === 'RESOLVED' && tk.autoCloseAt && (
                <span className="flex items-center gap-1 font-mono text-[10px] font-semibold text-amber-500">
                  <IconClock size={10} strokeWidth={2.2} />
                  <span>10 ngày</span>
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Mobile list (replaces the table below md). */
export function TicketCards({ rows, onOpen }: { rows: Ticket[]; onOpen: (t: Ticket) => void }) {
  const { t } = useTranslation('tickets');
  if (rows.length === 0) return <EmptyState>{t('emptyState')}</EmptyState>;

  return (
    <div className="flex flex-col gap-2.5">
      {rows.map((tk) => {
        const statusKey = (String(tk.status || 'OPEN').toUpperCase()) as TicketStatus;
        const meta = TICKET_STATUS[statusKey] ?? { label: tk.status, tone: 'neutral' as const };
        const statusLabel = t(`status.${statusKey}`, meta.label);
        const code = tk.ticketCode || tk.ticketNo || (tk.id ? `TKT-${tk.id.slice(0, 8).toUpperCase()}` : '—');
        const categoryKey = tk.category as TicketCategory;
        const categoryLabel = t(`category.${categoryKey}`, TICKET_CATEGORY[categoryKey] ?? tk.category);
        const reporter = tk.reporterName || tk.driverName || 'Tài xế';
        const hasRefund = Boolean(tk.refundIds && tk.refundIds.length > 0);
        const handlerName = tk.assignedHandlerName || tk.assignedToName;

        return (
          <Card key={tk.id} className="cursor-pointer p-3.5 hover:border-line-2 transition-all" onClick={() => onOpen(tk)}>
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11.5px] font-bold text-brand">{code}</span>
                <PriorityDot priority={tk.priority} />
              </div>
              <StatusPill tone={meta.tone} label={statusLabel} />
            </div>

            <div className="mb-1 flex items-center gap-2">
              <span className="text-[13.5px] font-bold text-ink">{tk.subject || tk.title || 'Phiếu hỗ trợ'}</span>
              {hasRefund && (
                <span className="inline-flex shrink-0 items-center gap-1 rounded bg-good-soft px-1.5 py-0.5 text-[10px] font-bold text-good-deep">
                  <IconCheckCircle size={11} strokeWidth={2.2} />
                  <span>Hoàn 100%</span>
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted">
              <span className="rounded bg-chip px-1.5 py-0.5 text-[10px] font-medium text-body">
                {categoryLabel}
              </span>
              {tk.stationName && (
                <>
                  <span>·</span>
                  <span className="truncate">{tk.stationName}</span>
                </>
              )}
              <span>·</span>
              <span className="truncate">{reporter}</span>
            </div>

            <div className="mt-2.5 flex items-center justify-between border-t border-hairline pt-2 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="text-faint">{t('table.cols.handler', 'Phụ trách')}:</span>
                <span className="font-medium text-ink">{handlerName || t('table.unassigned', 'Chưa tiếp nhận')}</span>
              </div>
              <span className="text-faint">
                {formatDateVn(tk.updatedAt || tk.createdAt)}
              </span>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
