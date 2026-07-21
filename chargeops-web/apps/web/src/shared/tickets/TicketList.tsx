import { useTranslation } from 'react-i18next';
import { formatDateVn, formatTimeVn, TICKET_CATEGORY, TICKET_STATUS, type Ticket } from '@chargeops/api';
import { Card, EmptyState, StatusPill } from '@chargeops/ui';

const GRID = '110px 1fr 140px 120px';

function Meta({ t: tk }: { t: Ticket }) {
  return (
    <div className="min-w-0">
      <div className="truncate font-semibold text-ink">{tk.subject}</div>
      <div className="mt-0.5 truncate text-[11.5px] text-muted">
        {TICKET_CATEGORY[tk.category]} · {tk.reporterName} · {formatDateVn(tk.updatedAt)} {formatTimeVn(tk.updatedAt)}
      </div>
    </div>
  );
}

/** Desktop table. Click a row to open the ticket thread. */
export function TicketTable({ rows, onOpen }: { rows: Ticket[]; onOpen: (t: Ticket) => void }) {
  const { t } = useTranslation('tickets');
  if (rows.length === 0) return <EmptyState>{t('emptyState')}</EmptyState>;
  return (
    <div className="min-w-[720px]">
      <div
        className="grid bg-surface-2 px-4 py-[11px] text-[10px] font-semibold uppercase tracking-[0.07em] text-faint"
        style={{ gridTemplateColumns: GRID }}
      >
        <span>{t('table.cols.id')}</span>
        <span>{t('table.cols.content')}</span>
        <span>{t('table.cols.station')}</span>
        <span className="text-center">{t('table.cols.status')}</span>
      </div>
      {rows.map((tk) => {
        const meta = TICKET_STATUS[tk.status];
        return (
          <div
            key={tk.id}
            onClick={() => onOpen(tk)}
            className="grid cursor-pointer items-center border-b border-hairline px-4 py-3 text-[12.5px] font-medium hover:bg-[#fafaff]"
            style={{ gridTemplateColumns: GRID }}
          >
            <span className="font-mono text-[11.5px] font-semibold text-brand">{tk.id}</span>
            <Meta t={tk} />
            <span className="truncate text-muted">{tk.stationName ?? '—'}</span>
            <span className="text-center">
              <StatusPill tone={meta.tone} label={meta.label} />
            </span>
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
        const meta = TICKET_STATUS[tk.status];
        return (
          <Card key={tk.id} className="cursor-pointer p-[13px]" onClick={() => onOpen(tk)}>
            <div className="mb-[7px] flex items-center justify-between gap-2">
              <span className="font-mono text-[11.5px] font-semibold text-brand">{tk.id}</span>
              <StatusPill tone={meta.tone} label={meta.label} />
            </div>
            <div className="mb-1 text-[14px] font-semibold">{tk.subject}</div>
            <div className="flex items-center justify-between text-[12px] font-medium text-muted">
              <span>{TICKET_CATEGORY[tk.category]} · {tk.reporterName}</span>
              <span>{tk.stationName ?? '—'}</span>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
