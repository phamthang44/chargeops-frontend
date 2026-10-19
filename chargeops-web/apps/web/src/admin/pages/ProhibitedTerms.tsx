import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Card,
  EmptyState,
  IconAlertTriangle,
  IconClock,
  IconEdit,
  IconPlusCircle,
  IconRefreshCw,
  IconShieldAlert,
  Pagination,
  SearchInput,
  Skeleton,
  Toggle,
  useToast,
  MoreMenu,
  type MoreMenuItem,
} from '@chargeops/ui';
import {
  formatDateVn,
  useApi,
  type ContentScope,
  type ProhibitedTerm,
} from '@chargeops/api';
import { TermUpsertModal } from '../features/prohibited-terms/TermUpsertModal';
import { TermHistoryDrawer } from '../features/prohibited-terms/TermHistoryDrawer';
import { PolicySandboxCard } from '../features/prohibited-terms/PolicySandboxCard';

const SCOPES_FILTER: { id: ContentScope | 'all'; labelKey: string }[] = [
  { id: 'all', labelKey: 'filter.all' },
  { id: 'DISPLAY_NAME', labelKey: 'scopes.DISPLAY_NAME' },
  { id: 'STATION_NAME', labelKey: 'scopes.STATION_NAME' },
  { id: 'TICKET_SUBJECT', labelKey: 'scopes.TICKET_SUBJECT' },
  { id: 'TICKET_DESCRIPTION', labelKey: 'scopes.TICKET_DESCRIPTION' },
  { id: 'TICKET_MESSAGE', labelKey: 'scopes.TICKET_MESSAGE' },
];

const PAGE_SIZE = 10;

export function ProhibitedTerms() {
  const { t } = useTranslation('admin');
  const api = useApi();
  const qc = useQueryClient();
  const toast = useToast();

  // Filters & Pagination
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [scopeFilter, setScopeFilter] = useState<ContentScope | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [page, setPage] = useState(1);

  // Modals & Drawers
  const [upsertModalOpen, setUpsertModalOpen] = useState(false);
  const [activeTermForEdit, setActiveTermForEdit] = useState<ProhibitedTerm | null>(null);
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [activeTermForHistory, setActiveTermForHistory] = useState<ProhibitedTerm | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const enabledParam = statusFilter === 'all' ? undefined : statusFilter === 'enabled';
  const scopeParam = scopeFilter === 'all' ? undefined : scopeFilter;

  // Query
  const { data: pageData, isLoading, isFetching, refetch } = useQuery({
    queryKey: [
      'prohibited-terms',
      'list',
      { search: debouncedSearch, scope: scopeParam, enabled: enabledParam, page, size: PAGE_SIZE },
    ],
    queryFn: () =>
      api.prohibitedTerms.list({
        q: debouncedSearch || undefined,
        scope: scopeParam,
        enabled: enabledParam,
        page,
        size: PAGE_SIZE,
      }),
    placeholderData: keepPreviousData,
  });

  // Toggle status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: ({ term, nextEnabled }: { term: ProhibitedTerm; nextEnabled: boolean }) =>
      api.prohibitedTerms.updateStatus(term.id, {
        enabled: nextEnabled,
        version: term.version,
      }),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['prohibited-terms'] });
      toast(
        variables.nextEnabled
          ? t('prohibitedTerms.toast.enabled')
          : t('prohibitedTerms.toast.disabled'),
        'success',
      );
    },
    onError: (err: any) => {
      qc.invalidateQueries({ queryKey: ['prohibited-terms'] });
      toast(err?.message || t('prohibitedTerms.toast.error'), 'error');
    },
  });

  const items = pageData?.items ?? [];
  const totalElements = pageData?.total ?? 0;
  const totalPages = Math.ceil(totalElements / PAGE_SIZE) || 1;

  const handleOpenCreate = () => {
    setActiveTermForEdit(null);
    setUpsertModalOpen(true);
  };

  const handleOpenEdit = (term: ProhibitedTerm) => {
    setActiveTermForEdit(term);
    setUpsertModalOpen(true);
  };

  const handleOpenHistory = (term: ProhibitedTerm) => {
    setActiveTermForHistory(term);
    setHistoryDrawerOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-[10.5px] font-bold tracking-[0.15em] uppercase text-brand">
              {t('prohibitedTerms.eyebrow')}
            </span>
            <span className="text-[11.5px] text-muted">
              {t('prohibitedTerms.cacheSyncNote')}
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink">
            {t('prohibitedTerms.title')}
          </h1>
          <p className="mt-0.5 text-[13px] text-muted max-w-2xl">
            {t('prohibitedTerms.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            type="button"
            variant="secondary"
            size="md"
            icon={<IconRefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />}
            onClick={() => refetch()}
          >
            {t('dashboard.refresh', 'Làm mới')}
          </Button>
          <Button
            type="button"
            accent="brand"
            size="md"
            icon={<IconPlusCircle size={15} />}
            onClick={handleOpenCreate}
          >
            {t('prohibitedTerms.createBtn')}
          </Button>
        </div>
      </div>

      {/* Seed Rules Notification Banner */}
      <div className="flex items-start gap-3 rounded-2xl border border-warn/30 bg-warn/5 p-4 text-[12.5px] text-body">
        <IconAlertTriangle size={18} className="mt-0.5 shrink-0 text-warn-deep" />
        <div className="flex-1 leading-relaxed">
          <span className="font-semibold text-warn-deep">Thông báo chính sách: </span>
          {t('prohibitedTerms.seedDisabledBanner')}
        </div>
      </div>

      {/* Main Grid: Asymmetrical Bento Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Column: Data Table & Filters (col-span-8) */}
        <div className="xl:col-span-8 space-y-4">
          <Card bordered className="bg-surface p-4 shadow-sm rounded-2xl">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="w-full sm:w-72">
                <SearchInput
                  value={searchInput}
                  onChange={setSearchInput}
                  placeholder={t('prohibitedTerms.searchPlaceholder')}
                />
              </div>

              {/* Status Segmented Tabs */}
              <div className="flex items-center rounded-xl bg-surface-2 p-1 border border-border/60">
                {(['all', 'enabled', 'disabled'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => {
                      setStatusFilter(st);
                      setPage(1);
                    }}
                    className={`rounded-lg px-3 py-1 text-[11.5px] font-medium transition-all ${
                      statusFilter === st
                        ? 'bg-surface text-ink font-semibold shadow-xs'
                        : 'text-muted hover:text-ink'
                    }`}
                  >
                    {t(`prohibitedTerms.filter.${st}`)}
                  </button>
                ))}
              </div>
            </div>

            {/* Scope Filter Chips */}
            <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-hairline pt-3">
              <span className="text-[11.5px] font-semibold text-muted mr-1">
                Phạm vi:
              </span>
              {SCOPES_FILTER.map((sc) => (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => {
                    setScopeFilter(sc.id);
                    setPage(1);
                  }}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all ${
                    scopeFilter === sc.id
                      ? 'bg-brand text-white font-semibold'
                      : 'bg-surface-2 text-body hover:bg-surface-3'
                  }`}
                >
                  {t(`prohibitedTerms.${sc.labelKey}`)}
                </button>
              ))}
            </div>

            {/* Data Table */}
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-[12.5px]">
                <thead>
                  <tr className="border-b border-hairline text-[11px] uppercase tracking-wider text-muted">
                    <th className="pb-3 font-semibold">{t('prohibitedTerms.table.term')}</th>
                    <th className="pb-3 font-semibold">{t('prohibitedTerms.table.matchType')}</th>
                    <th className="pb-3 font-semibold">{t('prohibitedTerms.table.scopes')}</th>
                    <th className="pb-3 font-semibold text-center">{t('prohibitedTerms.table.status')}</th>
                    <th className="pb-3 font-semibold">{t('prohibitedTerms.table.updatedAt')}</th>
                    <th className="pb-3 font-semibold text-right">{t('prohibitedTerms.table.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        <td className="py-3.5"><Skeleton className="h-5 w-28" /></td>
                        <td className="py-3.5"><Skeleton className="h-5 w-20" /></td>
                        <td className="py-3.5"><Skeleton className="h-5 w-32" /></td>
                        <td className="py-3.5"><Skeleton className="h-5 w-12 mx-auto" /></td>
                        <td className="py-3.5"><Skeleton className="h-5 w-24" /></td>
                        <td className="py-3.5"><Skeleton className="h-5 w-8 ml-auto" /></td>
                      </tr>
                    ))
                  ) : items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12">
                        <EmptyState className="py-12">
                          <IconShieldAlert size={32} className="mx-auto mb-2 text-faint" />
                          <div className="text-[14px] font-bold text-ink">{t('prohibitedTerms.table.empty')}</div>
                          <div className="mt-1 max-w-md text-[12.5px] text-muted">{t('prohibitedTerms.searchPlaceholder')}</div>
                        </EmptyState>
                      </td>
                    </tr>
                  ) : (
                    items.map((term) => {
                      const isWordPhrase = term.matchType === 'WORD_OR_PHRASE';

                      const moreMenuItems: MoreMenuItem[] = [
                        {
                          key: 'edit',
                          label: t('prohibitedTerms.table.edit'),
                          icon: <IconEdit size={14} />,
                          onClick: () => handleOpenEdit(term),
                        },
                        {
                          key: 'history',
                          label: t('prohibitedTerms.table.history'),
                          icon: <IconClock size={14} />,
                          onClick: () => handleOpenHistory(term),
                        },
                      ];

                      return (
                        <tr key={term.id} className="hover:bg-surface-2/40 transition-colors">
                          {/* Term */}
                          <td className="py-3.5 pr-2">
                            <div className="flex flex-col">
                              <span className="font-mono text-[13px] font-bold text-ink">
                                "{term.term}"
                              </span>
                              {term.note && (
                                <span className="text-[11px] text-muted line-clamp-1 italic">
                                  {term.note}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Match Type */}
                          <td className="py-3.5 pr-2">
                            <span
                              className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10.5px] font-semibold ${
                                isWordPhrase
                                  ? 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20'
                                  : 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-500/20'
                              }`}
                            >
                              {isWordPhrase
                                ? t('prohibitedTerms.table.phraseBadge')
                                : t('prohibitedTerms.table.exactBadge')}
                            </span>
                          </td>

                          {/* Scopes */}
                          <td className="py-3.5 pr-2">
                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                              {term.scopes.slice(0, 2).map((sc) => (
                                <span
                                  key={sc}
                                  className="rounded bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-body"
                                >
                                  {t(`prohibitedTerms.scopes.${sc}`, { defaultValue: sc })}
                                </span>
                              ))}
                              {term.scopes.length > 2 && (
                                <span className="rounded bg-surface-3 px-1.5 py-0.5 text-[10px] font-semibold text-muted">
                                  +{term.scopes.length - 2}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Status Toggle */}
                          <td className="py-3.5 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <div className={toggleStatusMutation.isPending ? 'pointer-events-none opacity-50' : ''}>
                                <Toggle
                                  checked={term.enabled}
                                  onChange={(nextChecked) =>
                                    toggleStatusMutation.mutate({
                                      term,
                                      nextEnabled: nextChecked,
                                    })
                                  }
                                />
                              </div>
                              <span className={`text-[9.5px] font-medium ${term.enabled ? 'text-success' : 'text-faint'}`}>
                                {term.enabled ? t('prohibitedTerms.table.active') : t('prohibitedTerms.table.inactive')}
                              </span>
                            </div>
                          </td>

                          {/* Updated At */}
                          <td className="py-3.5 text-muted text-[11.5px]">
                            {term.updatedAt ? formatDateVn(term.updatedAt) : '—'}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 text-right">
                            <MoreMenu items={moreMenuItems} />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4 border-t border-hairline pt-3 flex items-center justify-between">
                <div className="text-[11.5px] text-muted">
                  Tổng số: <span className="font-semibold text-ink">{totalElements}</span> quy tắc
                </div>
                <Pagination
                  page={page - 1} // Pagination component in @chargeops/ui is 0-based
                  pageSize={PAGE_SIZE}
                  total={totalElements}
                  onPage={(p0) => setPage(p0 + 1)}
                />
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Interactive Policy Sandbox (col-span-4) */}
        <div className="xl:col-span-4">
          <PolicySandboxCard />
        </div>
      </div>

      {/* Modals & Drawers */}
      <TermUpsertModal
        open={upsertModalOpen}
        term={activeTermForEdit}
        onClose={() => setUpsertModalOpen(false)}
        onSuccess={() => refetch()}
      />

      <TermHistoryDrawer
        open={historyDrawerOpen}
        term={activeTermForHistory}
        onClose={() => setHistoryDrawerOpen(false)}
      />
    </div>
  );
}
