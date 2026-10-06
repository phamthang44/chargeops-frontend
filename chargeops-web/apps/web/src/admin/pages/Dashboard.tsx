import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '@chargeops/api';
import { MetricCard, PageHeader, Skeleton } from '@chargeops/ui';
import { ApiErrorState } from '../../shared/components/ApiErrorState';
import { ResourceRetryButton, ResourceStateCard } from '../../shared/components/ResourceStateCard';

/** Platform operations only. Owner booking and finance data stay in their own scope. */
export function Dashboard() {
  const { t } = useTranslation('admin');
  const api = useApi();
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['dashboard', 'admin'],
    queryFn: () => api.dashboard.admin(),
    refetchInterval: 30000,
  });

  return (
    <>
      <PageHeader title={t('console.nav.dashboard.title')} subtitle={t('console.nav.dashboard.subtitle')} />
      {error ? (
        <ApiErrorState
          error={error}
          eyebrow={t('console.nav.dashboard.title')}
          title={t('dashboard.error', { defaultValue: 'Không thể tải dữ liệu tổng quan' })}
          missingEyebrow={t('console.nav.dashboard.title')}
          missingTitle={t('dashboard.missingTitle', { defaultValue: 'Dashboard chưa được kết nối dữ liệu' })}
          missingDescription={t('dashboard.missingDescription', {
            defaultValue: 'Endpoint tổng quan nền tảng (admin/dashboard) chưa được triển khai nên chưa có số liệu.',
          })}
          onRetry={() => refetch()}
          isRetrying={isFetching}
        />
      ) : isLoading ? (
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-[104px] rounded-card" />)}
        </div>
      ) : !data ? (
        <ResourceStateCard
          tone="brand"
          eyebrow={t('console.nav.dashboard.title')}
          title={t('dashboard.missingTitle', { defaultValue: 'Dashboard chưa được kết nối dữ liệu' })}
          description={t('dashboard.missingDescription', {
            defaultValue: 'Endpoint tổng quan nền tảng (admin/dashboard) chưa được triển khai nên chưa có số liệu.',
          })}
          action={<ResourceRetryButton onClick={() => refetch()} isRetrying={isFetching} />}
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <MetricCard label={t('dashboard.kpi.activeStations')} value={String(data.activeStations)} accent="#5b54e8" />
          <MetricCard label={t('dashboard.kpi.pendingApprovals')} value={String(data.pendingApprovals)} accent="#9a6b16" />
          <MetricCard label={t('dashboard.ops.platformOpenTickets', { defaultValue: 'Ticket nền tảng đang mở' })}
            value={String(data.platformOpenTickets)} accent="#0d8a5a" />
          <MetricCard label={t('dashboard.ops.escalatedOpenCases', { defaultValue: 'Case trạm cần xem xét' })}
            value={String(data.escalatedOpenCases)} accent="#c0392b" />
        </div>
      )}
    </>
  );
}
