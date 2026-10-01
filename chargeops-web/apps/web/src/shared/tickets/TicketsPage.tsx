import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  TICKET_CATEGORY,
  TICKET_STATUS,
  useApi,
  type Ticket,
  type TicketCategory,
  type TicketStatus,
} from '@chargeops/api';
import {
  Card,
  FilterTabs,
  IconAlertCircle,
  IconCheckCircle,
  IconClock,
  IconLock,
  IconUsers,
  PageHeader,
  Pagination,
  SearchInput,
  Select,
  Skeleton,
  type FilterTab,
} from '@chargeops/ui';
import { TicketCards, TicketTable } from './TicketList';

const PAGE_SIZE = 10;
type StatusKey = TicketStatus | 'all';
type CategoryKey = TicketCategory | 'all';
type QueueScope = 'all' | 'my' | 'unassigned';
type AdminWorkstream = 'all' | 'platform' | 'station';

export function TicketsPage({ admin = false }: { admin?: boolean }) {
  const { t } = useTranslation('tickets');
  const api = useApi();
  const navigate = useNavigate();

  const [workstream, setWorkstream] = useState<AdminWorkstream>('all');
  const [status, setStatus] = useState<StatusKey>('all');
  const [category, setCategory] = useState<CategoryKey>('all');
  const [stationId, setStationId] = useState<string | 'all'>('all');
  const [queueScope, setQueueScope] = useState<QueueScope>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  const resetTo = (fn: () => void) => {
    setPage(0);
    fn();
  };

  const summaryQuery = useQuery({
    queryKey: ['tickets', 'summary'],
    queryFn: () => api.tickets.summary(),
    refetchInterval: 10000,
  });

  const stationsQuery = useQuery({
    queryKey: ['stations', admin ? 'all' : 'mine'],
    queryFn: () => (admin ? api.stations.all() : api.stations.mine()),
  });

  const listQuery = useQuery({
    queryKey: ['tickets', 'list', { status, category, stationId, queueScope, search, page }],
    queryFn: () =>
      api.tickets.list({
        status,
        category,
        stationId: admin && workstream === 'platform' ? undefined : stationId,
        queueScope: queueScope === 'all' ? undefined : (queueScope as any),
        search,
        page,
        pageSize: PAGE_SIZE,
      }),
    placeholderData: keepPreviousData,
    refetchInterval: 10000,
  });

  const data = listQuery.data;
  const total = data?.total ?? 0;
  const summary = summaryQuery.data as any;

  // BKG-052 4-Box Bento Metrics
  const openCount =
    summary?.byStatus?.open ?? summary?.byStatus?.OPEN ?? summary?.open ?? 0;

  const inProgressCount =
    summary?.byStatus?.in_progress ?? summary?.byStatus?.IN_PROGRESS ?? summary?.inProgress ?? 0;

  const resolvedWatchCount =
    summary?.byStatus?.resolved ?? summary?.byStatus?.RESOLVED ?? summary?.resolved ?? 0;

  const closedCount =
    summary?.byStatus?.closed ?? summary?.byStatus?.CLOSED ?? summary?.closed ?? 0;

  const tabs = useMemo<FilterTab<StatusKey>[]>(() => {
    const s = summaryQuery.data as any;
    const order: StatusKey[] = ['all', 'open', 'in_progress', 'resolved', 'closed'];
    return order.map((k) => {
      let count: number | undefined;
      if (s) {
        if (k === 'all') {
          count = s.total ?? (openCount + inProgressCount + resolvedWatchCount + closedCount);
        } else if (s.byStatus) {
          count = s.byStatus[k] ?? s.byStatus[String(k).toUpperCase()];
        }
      }
      const tabKey = String(k).toLowerCase();
      const defaultLabel = k === 'all' ? 'Tất cả' : (TICKET_STATUS[k]?.label ?? k);
      return {
        key: k,
        label: t(`tabs.${tabKey}`, defaultLabel),
        count,
      };
    });
  }, [summaryQuery.data, openCount, inProgressCount, resolvedWatchCount, closedCount, t]);

  const categoryOptions = useMemo(() => {
    let cats: TicketCategory[] = Object.keys(TICKET_CATEGORY) as TicketCategory[];
    if (admin && workstream === 'platform') {
      cats = ['PAYMENT', 'ACCOUNT', 'OTHER'];
    } else if (admin && workstream === 'station') {
      cats = ['CHARGING_ISSUE', 'BOOKING'];
    }
    return [
      { value: 'all', label: t('category.all', 'Tất cả danh mục') },
      ...cats.map((c) => ({
        value: c,
        label: t(`category.${c}`, TICKET_CATEGORY[c] ?? c),
      })),
    ];
  }, [admin, workstream, t]);

  const stationOptions = useMemo(() => {
    const defaultLabel = admin
      ? t('filters.allStationsAdmin', 'Tất cả trạm hệ thống')
      : t('filters.allStationsOwner', 'Tất cả trạm của tôi');
    const raw = stationsQuery.data;
    const list: any[] = Array.isArray(raw)
      ? raw
      : Array.isArray((raw as any)?.items)
      ? (raw as any).items
      : Array.isArray((raw as any)?.data)
      ? (raw as any).data
      : [];
    return [
      { value: 'all', label: defaultLabel },
      ...list.map((s: any) => ({
        value: s.id,
        label: s.name || s.stationName || s.id,
      })),
    ];
  }, [stationsQuery.data, admin, t]);

  const displayedItems = useMemo(() => {
    let items = Array.isArray(data?.items) ? data.items : [];
    if (admin && workstream === 'platform') {
      items = items.filter(
        (t) => t.category === 'PAYMENT' || t.category === 'ACCOUNT' || t.category === 'OTHER' || !t.stationId,
      );
    } else if (admin && workstream === 'station') {
      items = items.filter(
        (t) => t.category === 'CHARGING_ISSUE' || t.category === 'BOOKING' || Boolean(t.stationId),
      );
    }
    if (category !== 'all') {
      items = items.filter((t) => String(t.category).toUpperCase() === String(category).toUpperCase());
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter(
        (t) =>
          t.ticketCode?.toLowerCase().includes(q) ||
          t.subject?.toLowerCase().includes(q) ||
          t.title?.toLowerCase().includes(q) ||
          t.driverName?.toLowerCase().includes(q) ||
          t.reporterName?.toLowerCase().includes(q) ||
          t.stationName?.toLowerCase().includes(q),
      );
    }
    return items;
  }, [data?.items, admin, workstream, category, search]);

  const openDetail = (tk: Ticket) => navigate(tk.id);

  return (
    <>
      <PageHeader title={t('title')} subtitle={admin ? t('subtitleAdmin') : t('subtitle')} />

      {/* BKG-052 4-Box Asymmetric Bento Metric Header (Clean Single-Bezel) */}
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {/* Box 1: OPEN (Unassigned / Pending Claim) */}
        <Card className="rounded-2xl border border-line bg-surface p-4 shadow-2xs hover:border-line-2 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-muted">
                {t('kpi.unassigned', 'Chờ tiếp nhận')}
              </div>
              <div className="mt-1 text-2xl font-bold tracking-tight text-amber-500 font-mono">
                {summaryQuery.isLoading ? '—' : openCount}
              </div>
              <div className="mt-0.5 text-[10.5px] text-faint">
                {admin
                  ? t('kpi.unassignedHelpAdmin', 'Phiếu sự cố chờ phân công hoặc tiếp nhận')
                  : t('kpi.unassignedHelp', 'Nhân viên trạm có thể tiếp nhận')}
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-500">
              <IconAlertCircle size={20} strokeWidth={2.2} />
            </div>
          </div>
        </Card>

        {/* Box 2: IN_PROGRESS (Active SLA) */}
        <Card className="rounded-2xl border border-line bg-surface p-4 shadow-2xs hover:border-line-2 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-muted">
                {t('kpi.inProgress', 'Đang xử lý')}
              </div>
              <div className="mt-1 text-2xl font-bold tracking-tight text-brand font-mono">
                {summaryQuery.isLoading ? '—' : inProgressCount}
              </div>
              <div className="mt-0.5 text-[10.5px] text-faint">
                {admin
                  ? t('kpi.inProgressHelpAdmin', 'Đang có chuyên viên hoặc trạm xử lý')
                  : t('kpi.inProgressHelp', 'Đang có nhân viên xử lý')}
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand-deep">
              <IconUsers size={20} strokeWidth={2} />
            </div>
          </div>
        </Card>

        {/* Box 3: RESOLVED (10-Day Auto-Close Watch) */}
        <Card className="rounded-2xl border border-line bg-surface p-4 shadow-2xs hover:border-line-2 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-muted">
                {admin ? t('kpi.resolvingWatchAdmin', 'Chờ tài xế phản hồi') : t('kpi.resolvingWatch', 'Chờ tài xế (10 ngày)')}
              </div>
              <div className="mt-1 text-2xl font-bold tracking-tight text-emerald-500 font-mono">
                {summaryQuery.isLoading ? '—' : resolvedWatchCount}
              </div>
              <div className="mt-0.5 text-[10.5px] text-faint">
                {admin
                  ? t('kpi.resolvingWatchHelpAdmin', 'Tự động đóng theo chính sách nếu không phản hồi')
                  : t('kpi.resolvingWatchHelp', 'Tự động đóng sau 10 ngày')}
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-500">
              <IconClock size={20} strokeWidth={2.2} />
            </div>
          </div>
        </Card>

        {/* Box 4: CLOSED (Terminal Completed) */}
        <Card className="rounded-2xl border border-line bg-surface p-4 shadow-2xs hover:border-line-2 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-muted">
                {t('kpi.completed', 'Đã hoàn tất')}
              </div>
              <div className="mt-1 text-2xl font-bold tracking-tight text-ink font-mono">
                {summaryQuery.isLoading ? '—' : closedCount}
              </div>
              <div className="mt-0.5 text-[10.5px] text-faint">
                {t('kpi.completedHelp', 'Đã hoàn thành và đóng')}
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-2 text-muted">
              <IconCheckCircle size={20} strokeWidth={2} />
            </div>
          </div>
        </Card>
      </div>

      {/* Admin Workstream Separation (BKG-052 / Platform vs Station Scope) */}
      {admin && (
        <div className="mb-3.5 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setWorkstream('all');
                resetTo(() => setCategory('all'));
              }}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-[12.5px] font-semibold transition-all ${
                workstream === 'all'
                  ? 'bg-surface text-ink border border-line shadow-2xs font-bold'
                  : 'text-muted hover:text-ink hover:bg-surface-2'
              }`}
            >
              <span>🌐 {t('workstream.all', 'Toàn bộ hệ thống')}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setWorkstream('platform');
                resetTo(() => setCategory('all'));
              }}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-[12.5px] font-semibold transition-all ${
                workstream === 'platform'
                  ? 'bg-brand-soft text-brand-deep border border-brand-line shadow-2xs font-bold'
                  : 'text-muted hover:text-ink hover:bg-surface-2'
              }`}
            >
              <span>🛡️ {t('workstream.platform', 'Sự cố Nền tảng & Thanh toán')}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setWorkstream('station');
                resetTo(() => setCategory('all'));
              }}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-[12.5px] font-semibold transition-all ${
                workstream === 'station'
                  ? 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/30 shadow-2xs font-bold'
                  : 'text-muted hover:text-ink hover:bg-surface-2'
              }`}
            >
              <span>⚡ {t('workstream.station', 'Giám sát Sự cố Trạm')}</span>
            </button>
          </div>

          {workstream === 'platform' && (
            <div className="flex items-start gap-2 rounded-xl border border-brand-line/60 bg-brand-soft/30 p-2.5 text-[11.5px] text-brand-deep">
              <span className="font-bold">ℹ️</span>
              <span>{t('workstream.platformHelp', 'Admin trực tiếp tiếp nhận và xử lý các sự cố liên quan đến ví tiền, nạp cọc, giao dịch thanh toán và tài khoản tài xế.')}</span>
            </div>
          )}
          {workstream === 'station' && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 p-2.5 text-[11.5px] text-amber-900 dark:text-amber-200">
              <span className="font-bold">ℹ️</span>
              <span>{t('workstream.stationHelp', 'Chủ trạm & Kỹ thuật viên trạm chịu trách nhiệm trực tiếp tại trụ sạc. Admin thực hiện giám sát SLA, kết luận kỹ thuật (BR-TKT-05) và thẩm định bồi hoàn cọc.')}</span>
            </div>
          )}
        </div>
      )}

      {/* Filter toolbar */}
      <div className="mb-3.5 flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <SearchInput
          value={search}
          onChange={(v) => resetTo(() => setSearch(v))}
          placeholder={t('searchPlaceholder', 'Tìm theo mã vé, tiêu đề hoặc tên tài xế...')}
          className="flex-1"
        />

        {(!admin || workstream !== 'platform') && (
          <Select
            value={stationId}
            onChange={(v) => resetTo(() => setStationId(v as string))}
            options={stationOptions}
            className="sm:w-[220px]"
          />
        )}

        <Select
          value={category}
          onChange={(v) => resetTo(() => setCategory(v as CategoryKey))}
          options={categoryOptions}
          className="sm:w-[180px]"
        />
      </div>

      {/* Status tabs */}
      <div className="mb-3.5">
        <FilterTabs tabs={tabs} active={status} onChange={(k) => resetTo(() => setStatus(k))} />
      </div>

      {/* Ticket List Card */}
      <Card className="overflow-hidden rounded-2xl">
        {listQuery.isLoading || !data ? (
          <div className="p-4">
            <Skeleton className="mb-2 h-9 w-full" />
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="mb-2 h-11 w-full" />
            ))}
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <TicketTable rows={displayedItems} onOpen={openDetail} />
            </div>
            <div className="p-3 md:hidden">
              <TicketCards rows={displayedItems} onOpen={openDetail} />
            </div>
            <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPage={setPage} />
          </>
        )}
      </Card>
    </>
  );
}
