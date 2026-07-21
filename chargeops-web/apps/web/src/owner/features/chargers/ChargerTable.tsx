import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import type { Charger } from '@chargeops/api';
import { IconCard, ProgressBar } from '@chargeops/ui';
import { CHARGER_PILL, utilColor } from './chargerStatus';

const GRID = '0.6fr 1.2fr 0.9fr 0.6fr 1.15fr 1.3fr 0.7fr 0.6fr';

export interface ChargerTableProps {
  chargers: Charger[];
  selectedId: string | null;
  onSelect: (c: Charger) => void;
  /** Inline rename commit. */
  onRename: (id: string, name: string) => void;
  /** Cycle available → maintenance → offline. */
  onCycleStatus: (c: Charger) => void;
  onDownloadQr: (c: Charger) => void;
}

/**
 * Owner charger table. Name is inline-editable (dashed underline → input);
 * status pill cycles on click; connector/kW are admin-provisioned (read-only).
 */
export function ChargerTable({
  chargers,
  selectedId,
  onSelect,
  onRename,
  onCycleStatus,
  onDownloadQr,
}: ChargerTableProps) {
  const { t } = useTranslation('owner');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  const startEdit = (c: Charger) => {
    setEditingId(c.id);
    setDraft(c.name);
  };
  const commit = () => {
    if (editingId && draft.trim()) onRename(editingId, draft.trim());
    setEditingId(null);
  };

  return (
    <div className="min-w-[760px]">
      <div
        className="grid bg-surface-2 px-4 py-[11px] text-[10px] font-semibold uppercase tracking-[0.07em] text-faint"
        style={{ gridTemplateColumns: GRID }}
      >
        <span>{t('chargers.table.cols.id')}</span>
        <span>{t('chargers.table.cols.name')}</span>
        <span>{t('chargers.table.cols.connector')}</span>
        <span>kW 🔒</span>
        <span>{t('chargers.table.cols.status')}</span>
        <span>{t('chargers.table.cols.utilization')}</span>
        <span className="text-right">{t('chargers.table.cols.sessions')}</span>
        <span className="text-right">QR</span>
      </div>

      {chargers.map((c) => {
        const pill = CHARGER_PILL[c.status];
        const selected = c.id === selectedId;
        return (
          <div
            key={c.id}
            onClick={() => onSelect(c)}
            className="grid cursor-pointer items-center border-b border-hairline px-4 py-[11px] text-[12.5px] font-medium hover:bg-row-hover"
            style={{
              gridTemplateColumns: GRID,
              background: selected ? 'var(--color-row-hover)' : undefined,
              borderLeft: `3px solid ${selected ? '#12a150' : 'transparent'}`,
            }}
          >
            <span className="font-mono text-[11.5px] font-semibold text-brand">{c.id}</span>

            {/* inline name edit */}
            <span onClick={(e) => e.stopPropagation()}>
              {editingId === c.id ? (
                <input
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onBlur={commit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commit();
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                  className="w-[92%] rounded-[7px] border-[1.5px] border-brand px-2 py-[5px] text-[12.5px] font-medium"
                />
              ) : (
                <span
                  onClick={() => startEdit(c)}
                  className="cursor-text border-b border-dashed border-ghost pb-px font-semibold hover:border-brand"
                >
                  {c.name}
                </span>
              )}
            </span>

            <span className="text-muted">{c.connector}</span>
            <span className="text-muted">{c.powerKw} kW</span>

            {/* status cycle pill */}
            <span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCycleStatus(c);
                }}
                className="inline-flex items-center gap-[5px] rounded-full px-2.5 py-1 text-[11px] font-semibold hover:brightness-95"
                style={{ background: pill.bg, color: pill.fg }}
              >
                <span className="h-[6px] w-[6px] rounded-full" style={{ background: pill.fg }} />
                {t(`chargers.status.${c.status}`)}
              </button>
            </span>

            {/* utilization bar */}
            <span className="flex items-center gap-2">
              <ProgressBar value={c.utilizationPct} color={utilColor(c)} className="flex-1" />
              <span className="w-8 text-right font-mono text-[11px] text-muted">
                {c.utilizationPct}%
              </span>
            </span>

            <span className="text-right text-muted">{c.sessionsToday}</span>

            <span className="text-right">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDownloadQr(c);
                }}
                className="inline-flex text-brand"
                aria-label={t('chargers.table.downloadQr')}
              >
                <IconCard size={15} strokeWidth={1.9} />
              </button>
            </span>
          </div>
        );
      })}
    </div>
  );
}
