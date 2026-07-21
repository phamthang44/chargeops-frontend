import { useTranslation } from 'react-i18next';
import { formatDateVn, formatVnd, type Transaction } from '@chargeops/api';
import { Card, EmptyState } from '@chargeops/ui';
import { METHOD_META } from './methodMeta';

const GRID = '1fr 1fr 0.8fr 0.9fr 1fr 0.9fr';

/** Payment green, refund red — signed amount shown with the type colour. */
function typeColor(t: Transaction) {
  return t.type === 'refund' ? 'var(--color-bad)' : 'var(--color-good)';
}

/** Desktop transactions table. */
export function TxTable({ rows }: { rows: Transaction[] }) {
  const { t } = useTranslation('owner');
  return (
    <div className="min-w-[720px]">
      <div
        className="grid bg-surface-2 px-4 py-[11px] text-[10px] font-semibold uppercase tracking-[0.07em] text-faint"
        style={{ gridTemplateColumns: GRID }}
      >
        <span>{t('revenue.table.cols.txId')}</span>
        <span>{t('revenue.table.cols.bookingId')}</span>
        <span>{t('revenue.table.cols.type')}</span>
        <span>{t('revenue.table.cols.method')}</span>
        <span className="text-right">{t('revenue.table.cols.amount')}</span>
        <span>{t('revenue.table.cols.date')}</span>
      </div>
      {rows.length === 0 ? (
        <EmptyState>{t('revenue.table.empty')}</EmptyState>
      ) : (
        rows.map((tx) => {
          const color = typeColor(tx);
          return (
            <div
              key={tx.id}
              className="grid items-center border-b border-hairline px-4 py-[11px] text-[12.5px] font-medium"
              style={{ gridTemplateColumns: GRID }}
            >
              <span className="font-mono text-[11px] font-semibold text-brand">{tx.id}</span>
              <span className="font-mono text-[11.5px] text-muted">{tx.bookingId}</span>
              <span>
                <span className="inline-flex items-center gap-[5px] text-[11.5px] font-semibold" style={{ color }}>
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
                  {tx.type === 'refund' ? t('revenue.table.types.refund') : t('revenue.table.types.payment')}
                </span>
              </span>
              <span className="text-muted">{t(`revenue.methods.${tx.method}`, { defaultValue: METHOD_META[tx.method].label })}</span>
              <span className="text-right font-semibold" style={{ color }}>
                {tx.amountVnd < 0 ? '−' : ''}
                {formatVnd(Math.abs(tx.amountVnd))}
              </span>
              <span className="text-[11.5px] text-faint">{formatDateVn(tx.date)}</span>
            </div>
          );
        })
      )}
    </div>
  );
}

/** Mobile transaction cards. */
export function TxCards({ rows }: { rows: Transaction[] }) {
  const { t } = useTranslation('owner');
  if (rows.length === 0) return <EmptyState>{t('revenue.table.empty')}</EmptyState>;
  return (
    <div className="flex flex-col gap-2.5">
      {rows.map((tx) => {
        const color = typeColor(tx);
        return (
          <Card key={tx.id} className="p-[13px]">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="font-mono text-[11px] font-semibold text-brand">{tx.id}</span>
              <span className="text-[13px] font-semibold" style={{ color }}>
                {tx.amountVnd < 0 ? '−' : ''}
                {formatVnd(Math.abs(tx.amountVnd))}
              </span>
            </div>
            <div className="flex items-center justify-between text-[12px] font-medium text-muted">
              <span>
                {t('revenue.table.typeWithMethod', {
                  type: tx.type === 'refund' ? t('revenue.table.types.refund') : t('revenue.table.types.payment'),
                  method: t(`revenue.methods.${tx.method}`, { defaultValue: METHOD_META[tx.method].label }),
                })}
              </span>
              <span>
                {tx.bookingId} · {formatDateVn(tx.date)}
              </span>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
