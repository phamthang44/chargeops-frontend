import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { TICKET_CATEGORY, TICKET_STATUS, useApi, type Ticket, type TicketCategory, type TicketStatus } from '@chargeops/api';
import { Card, FilterTabs, PageHeader, Pagination, SearchInput, Select, Skeleton, type FilterTab } from '@chargeops/ui';
import { TicketCards, TicketTable } from './TicketList';

const PAGE_SIZE = 10;
type StatusKey = TicketStatus | 'all';
type CategoryKey = TicketCategory | 'all';

export function TicketsPage({ admin = false }: { admin?: boolean }) {
  const { t } = useTranslation('tickets');
  const api = useApi();
  const navigate = useNavigate();

  const [status, setStatus] = useState<StatusKey>('all');
  const [category, setCategory] = useState<CategoryKey>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  const resetTo = (fn: () => void) => {
    setPage(0);
    fn();
  };

  const summaryQuery = useQuery({ queryKey: ['tickets', 'summary'], queryFn: () => api.tickets.summary() });
  const listQuery = useQuery({
    queryKey: ['tickets', 'list', { status, category, search, page }],
    queryFn: () => api.tickets.list({ status, category, search, page, pageSize: PAGE_SIZE }),
    placeholderData: keepPreviousData,
  });

  const tabs = useMemo<FilterTab<StatusKey>[]>(() => {
    const s = summaryQuery.data;
    const order: StatusKey[] = ['all', 'open', 'in_progress', 'resolved', 'closed'];
    return order.map((k) => ({
      key: k,
      label: k === 'all' ? t('tabs.all') : TICKET_STATUS[k].label,
      count: !s ? undefined : k === 'all' ? s.total : s.byStatus[k],
    }));
  }, [summaryQuery.data, t]);

  const categoryOptions = useMemo(
    () => [
      { value: 'all', label: t('category.all') },
      ...(Object.keys(TICKET_CATEGORY) as TicketCategory[]).map((c) => ({ value: c, label: TICKET_CATEGORY[c] })),
    ],
    [t],
  );

  const openDetail = (tk: Ticket) => navigate(tk.id);

  const data = listQuery.data;
  const total = data?.total ?? 0;

  return (
    <>
      <PageHeader title={t('title')} subtitle={admin ? t('subtitleAdmin') : t('subtitle')} />

      <div className="mb-3.5 flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <SearchInput
          value={search}
          onChange={(v) => resetTo(() => setSearch(v))}
          placeholder={t('searchPlaceholder')}
          className="flex-1"
        />
        <Select
          value={category}
          onChange={(v) => resetTo(() => setCategory(v as CategoryKey))}
          options={categoryOptions}
          className="sm:w-[220px]"
        />
      </div>

      <div className="mb-3.5">
        <FilterTabs tabs={tabs} active={status} onChange={(k) => resetTo(() => setStatus(k))} />
      </div>

      <Card className="overflow-hidden">
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
              <TicketTable rows={data.items} onOpen={openDetail} />
            </div>
            <div className="p-3 md:hidden">
              <TicketCards rows={data.items} onOpen={openDetail} />
            </div>
            <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPage={setPage} />
          </>
        )}
      </Card>
    </>
  );
}
