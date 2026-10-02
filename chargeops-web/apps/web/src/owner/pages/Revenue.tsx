import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@chargeops/api';
import {
  Button,
  IconCard,
  IconLifebuoy,
  IconRefreshCw,
  PageHeader,
  SegmentedControl,
  type Segment,
} from '@chargeops/ui';
import { FinanceLedgerTab } from '../features/revenue/FinanceLedgerTab';
import { OwnerRefundsTab } from '../features/revenue/OwnerRefundsTab';

type TabKey = 'ledger' | 'refunds';

export function Revenue() {
  const { t } = useTranslation('owner');
  const api = useApi();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const currentTab = (searchParams.get('tab') as TabKey) || 'ledger';

  // Dedicated summary for refund action alerts
  const refundsSummary = useQuery({
    queryKey: ['ownerRefunds', 'summary'],
    queryFn: () => api.ownerRefunds.summary(),
    refetchInterval: 30000,
  });

  const actionRequiredCount = refundsSummary.data?.requiresOwnerActionCount ?? 0;

  const handleTabChange = (key: TabKey) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('tab', key);
        return next;
      },
      { replace: true },
    );
  };

  const handleQuickRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['ownerFinance'] }),
      queryClient.invalidateQueries({ queryKey: ['ownerRefunds'] }),
    ]);
    setIsRefreshing(false);
  };

  const segments: Segment<TabKey>[] = [
    {
      key: 'ledger',
      label: (
        <span className="flex items-center gap-1.5 font-medium">
          <IconCard size={15} />
          {t('revenue.tabs.ledger', 'Sổ đối chiếu thu - hoàn')}
        </span>
      ),
    },
    {
      key: 'refunds',
      label: (
        <span className="flex items-center gap-2 font-medium">
          <IconLifebuoy size={15} />
          <span>{t('revenue.tabs.refunds', 'Quản lý hoàn tiền')}</span>
          {actionRequiredCount > 0 && (
            <span className="rounded-full bg-rose-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-rose-500">
              {actionRequiredCount}
            </span>
          )}
        </span>
      ),
    },
  ];

  return (
    <>
      {/* Top Header & Quick Refresh */}
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <PageHeader
          title={t('revenue.title', 'Tài chính & Hoàn tiền')}
          subtitle={t(
            'revenue.subtitle',
            'Sổ đối chiếu doanh thu và xử lý hoàn tiền trạm sạc.',
          )}
        />
        <Button
          variant="secondary"
          size="sm"
          onClick={handleQuickRefresh}
          disabled={isRefreshing}
          className="flex h-[34px] items-center gap-1.5"
        >
          <IconRefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
          <span className="text-[12px]">{t('revenue.refreshBtn', 'Làm mới')}</span>
        </Button>
      </div>

      {/* Segmented Tab Switcher */}
      <div className="mb-4">
        <SegmentedControl
          segments={segments}
          active={currentTab}
          onChange={handleTabChange}
          accent="owner"
        />
      </div>

      {/* Tab Content */}
      {currentTab === 'ledger' ? <FinanceLedgerTab /> : <OwnerRefundsTab />}
    </>
  );
}
