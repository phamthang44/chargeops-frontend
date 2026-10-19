import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, IconClock, Modal, Skeleton, StatusPill, type PillTone } from '@chargeops/ui';
import { formatDateVn, useApi, type ProhibitedTerm, type ProhibitedTermChange } from '@chargeops/api';

export interface TermHistoryDrawerProps {
  open: boolean;
  term: ProhibitedTerm | null;
  onClose: () => void;
}

function parseSnapshot(raw: string | null | undefined): any | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function TermHistoryDrawer({ open, term, onClose }: TermHistoryDrawerProps) {
  const { t } = useTranslation('admin');
  const api = useApi();

  const { data: pageData, isLoading } = useQuery({
    queryKey: ['prohibited-terms', 'history', term?.id],
    queryFn: () => (term ? api.prohibitedTerms.history(term.id, { page: 1, size: 50 }) : Promise.resolve({ items: [], total: 0, page: 1, pageSize: 50 })),
    enabled: Boolean(term) && open,
  });

  if (!term) return null;

  const items = pageData?.items ?? [];

  const getActionMeta = (action: ProhibitedTermChange['action']): { label: string; tone: PillTone } => {
    switch (action) {
      case 'CREATE':
        return { label: t('prohibitedTerms.history.action.CREATE'), tone: 'brand' };
      case 'UPDATE':
        return { label: t('prohibitedTerms.history.action.UPDATE'), tone: 'neutral' };
      case 'ENABLE':
        return { label: t('prohibitedTerms.history.action.ENABLE'), tone: 'good' };
      case 'DISABLE':
        return { label: t('prohibitedTerms.history.action.DISABLE'), tone: 'bad' };
      case 'SEED':
        return { label: t('prohibitedTerms.history.action.SEED'), tone: 'warn' };
      default:
        return { label: action, tone: 'neutral' };
    }
  };

  return (
    <Modal open={open} onClose={onClose} maxWidth={640}>
      <div className="flex items-center justify-between border-b border-line/80 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-soft text-brand">
            <IconClock size={19} />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-ink">
              {t('prohibitedTerms.history.title', 'Lịch sử thay đổi quy tắc')}
            </h3>
            <p className="text-[12px] text-muted">
              {t('prohibitedTerms.table.term')}: <span className="font-semibold text-ink font-mono">"{term.term}"</span> · ID: {term.id.slice(0, 8)}...
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink transition-colors"
        >
          ✕
        </button>
      </div>

      <div className="mt-4 flex max-h-[520px] flex-col gap-3 overflow-y-auto pr-1">
        {isLoading ? (
          <div className="flex flex-col gap-2.5">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center text-[13px] text-faint">
            {t('prohibitedTerms.history.empty', 'Chưa có sự kiện lịch sử nào được ghi nhận.')}
          </div>
        ) : (
          items.map((change) => {
            const meta = getActionMeta(change.action);
            const before = parseSnapshot(change.beforeSnapshot);
            const after = parseSnapshot(change.afterSnapshot);
            const isSystem = !change.actorId || change.action === 'SEED';

            return (
              <Card key={change.id} bordered={true} className="bg-surface p-4 rounded-xl border-line/80 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <StatusPill tone={meta.tone} label={meta.label} />
                    <span className="text-[12px] text-muted">
                      {change.changedAt ? formatDateVn(change.changedAt) : '—'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11.5px] font-medium text-body">
                    <span className="text-muted">Tác nhân:</span>
                    {isSystem ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-warn-pill border border-warn-border/70 px-2 py-0.5 text-[11px] font-semibold text-warn-deep">
                        ⚡ {t('prohibitedTerms.history.actorSystem', 'Hệ thống')}
                      </span>
                    ) : (
                      <span className="font-mono text-[11.5px] text-ink font-semibold">
                        {change.actorId ? `Admin (${change.actorId.slice(0, 8)})` : t('prohibitedTerms.history.actorAdmin')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Diff Viewer */}
                <div className="mt-3 border-t border-line/70 pt-2.5 text-[12px] space-y-2">
                  {after && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11.5px]">
                      <div>
                        <span className="text-muted">{t('prohibitedTerms.table.status')}: </span>
                        <span className={`font-semibold ${after.enabled ? 'text-good-deep' : 'text-faint'}`}>
                          {after.enabled ? t('prohibitedTerms.table.active') : t('prohibitedTerms.table.inactive')}
                        </span>
                        {before && before.enabled !== after.enabled && (
                          <span className="text-muted line-through ml-1.5 opacity-60">
                            ({before.enabled ? t('prohibitedTerms.table.active') : t('prohibitedTerms.table.inactive')})
                          </span>
                        )}
                      </div>

                      <div>
                        <span className="text-muted">{t('prohibitedTerms.table.matchType')}: </span>
                        <span className="font-semibold text-ink">{after.matchType}</span>
                        {before && before.matchType !== after.matchType && (
                          <span className="text-muted line-through ml-1.5 opacity-60">
                            ({before.matchType})
                          </span>
                        )}
                      </div>

                      <div className="sm:col-span-2">
                        <span className="text-muted">{t('prohibitedTerms.table.scopes')}: </span>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {(after.scopes || []).map((sc: string) => {
                            const isNew = before && !before.scopes?.includes(sc);
                            return (
                              <span
                                key={sc}
                                className={`rounded px-1.5 py-0.5 text-[10.5px] font-medium ${
                                  isNew
                                    ? 'bg-good-soft text-good border border-good/30 font-semibold'
                                    : 'bg-surface-2 text-body border border-line/70'
                                }`}
                              >
                                {t(`prohibitedTerms.scopes.${sc}`, { defaultValue: sc })}
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      {after.note && (
                        <div className="sm:col-span-2 text-[11.5px] text-muted italic bg-surface-2 p-2.5 rounded-lg border border-line/70">
                          "{after.note}"
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>

      <div className="mt-4 flex justify-end border-t border-line/80 pt-3">
        <Button variant="secondary" size="md" onClick={onClose}>
          {t('common.close', 'Đóng')}
        </Button>
      </div>
    </Modal>
  );
}
