import { formatDateVn, formatVnd, type Transaction } from '@chargeops/api';
import { Card, EmptyState } from '@chargeops/ui';
import { METHOD_META } from './methodMeta';

const GRID = '1fr 1fr 0.8fr 0.9fr 1fr 0.9fr';

/** Payment green, refund red — signed amount shown with the type colour. */
function typeColor(t: Transaction) {
  return t.type === 'refund' ? '#c0392b' : '#0d8a5a';
}

/** Desktop transactions table. */
export function TxTable({ rows }: { rows: Transaction[] }) {
  return (
    <div className="min-w-[720px]">
      <div
        className="grid bg-surface-2 px-4 py-[11px] font-mono text-[10px] font-semibold tracking-[0.05em] text-faint"
        style={{ gridTemplateColumns: GRID }}
      >
        <span>MÃ GD</span>
        <span>ĐẶT CHỖ</span>
        <span>LOẠI</span>
        <span>P.THỨC</span>
        <span className="text-right">SỐ TIỀN</span>
        <span>NGÀY</span>
      </div>
      {rows.length === 0 ? (
        <EmptyState>Không có giao dịch nào khớp bộ lọc.</EmptyState>
      ) : (
        rows.map((t) => {
          const color = typeColor(t);
          return (
            <div
              key={t.id}
              className="grid items-center border-b border-hairline px-4 py-[11px] text-[12.5px] font-medium"
              style={{ gridTemplateColumns: GRID }}
            >
              <span className="font-mono text-[11px] font-semibold text-brand">{t.id}</span>
              <span className="font-mono text-[11.5px] text-muted">{t.bookingId}</span>
              <span>
                <span className="inline-flex items-center gap-[5px] text-[11.5px] font-semibold" style={{ color }}>
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
                  {t.type === 'refund' ? 'Hoàn tiền' : 'Thanh toán'}
                </span>
              </span>
              <span className="text-muted">{METHOD_META[t.method].label}</span>
              <span className="text-right font-semibold" style={{ color }}>
                {t.amountVnd < 0 ? '−' : ''}
                {formatVnd(Math.abs(t.amountVnd))}
              </span>
              <span className="text-[11.5px] text-faint">{formatDateVn(t.date)}</span>
            </div>
          );
        })
      )}
    </div>
  );
}

/** Mobile transaction cards. */
export function TxCards({ rows }: { rows: Transaction[] }) {
  if (rows.length === 0) return <EmptyState>Không có giao dịch nào khớp bộ lọc.</EmptyState>;
  return (
    <div className="flex flex-col gap-2.5">
      {rows.map((t) => {
        const color = typeColor(t);
        return (
          <Card key={t.id} className="p-[13px]">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="font-mono text-[11px] font-semibold text-brand">{t.id}</span>
              <span className="text-[13px] font-semibold" style={{ color }}>
                {t.amountVnd < 0 ? '−' : ''}
                {formatVnd(Math.abs(t.amountVnd))}
              </span>
            </div>
            <div className="flex items-center justify-between text-[12px] font-medium text-muted">
              <span>
                {t.type === 'refund' ? 'Hoàn tiền' : 'Thanh toán'} · {METHOD_META[t.method].label}
              </span>
              <span>
                {t.bookingId} · {formatDateVn(t.date)}
              </span>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
