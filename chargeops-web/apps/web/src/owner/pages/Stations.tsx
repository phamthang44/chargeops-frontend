import { useTranslation } from 'react-i18next';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useApi, type Station } from '@chargeops/api';
import {
  Button,
  Card,
  EmptyState,
  FilterTabs,
  IconPlusCircle,
  PageHeader,
  SearchInput,
  Skeleton,
  type FilterTab,
} from '@chargeops/ui';
import { StationSummary } from '../features/stations/StationSummary';
import { StationCard } from '../features/stations/StationCard';
import { StationDetailDrawer } from '../features/stations/StationDetailDrawer';
import { RegisterStationModal } from '../features/stations/RegisterStationModal';
import { useOwnerStation } from '../context/OwnerStationContext';

type StatusFilterKey = 'all' | 'ACTIVE' | 'PENDING_APPROVAL' | 'SUSPENDED' | 'REJECTED';

/** FR12 — owner's stations with registration, status filters, and detail hub. */
export function Stations() {
  const { t } = useTranslation('owner');
  const api = useApi();
  const [searchParams, setSearchParams] = useSearchParams();
  const { selectedStationId, setSelectedStationId } = useOwnerStation();

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilterKey>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['stations', 'mine'],
    queryFn: () => api.stations.mine(),
  });

  const stationList: Station[] = useMemo(() => {
    if (Array.isArray(data)) return data;
    return (data as { items?: Station[] } | undefined)?.items ?? [];
  }, [data]);

  // Handle URL query parameter ?stationId=... to auto-open station detail
  const stationIdParam = searchParams.get('stationId');
  useEffect(() => {
    if (stationIdParam && stationList.length > 0) {
      const match = stationList.find((s) => s.id === stationIdParam);
      if (match) {
        setSelectedStation(match);
      }
    }
  }, [stationIdParam, stationList]);

  // Filter tabs with accurate count badges
  const filterTabs = useMemo<FilterTab<StatusFilterKey>[]>(() => {
    const counts = {
      all: stationList.length,
      ACTIVE: stationList.filter((s) => s.status === 'ACTIVE' || s.status === 'active').length,
      PENDING_APPROVAL: stationList.filter(
        (s) => s.status === 'PENDING_APPROVAL' || s.status === 'pending',
      ).length,
      SUSPENDED: stationList.filter(
        (s) => s.status === 'SUSPENDED' || s.status === 'suspended',
      ).length,
      REJECTED: stationList.filter((s) => s.status === 'REJECTED' || s.status === 'rejected').length,
    };

    return [
      { key: 'all', label: t('stations.filters.all', { defaultValue: 'Tất cả' }), count: counts.all },
      { key: 'ACTIVE', label: t('stations.filters.active', { defaultValue: 'Đang hoạt động' }), count: counts.ACTIVE },
      {
        key: 'PENDING_APPROVAL',
        label: t('stations.filters.pending', { defaultValue: 'Chờ duyệt' }),
        count: counts.PENDING_APPROVAL,
      },
      {
        key: 'SUSPENDED',
        label: t('stations.filters.suspended', { defaultValue: 'Tạm ngưng' }),
        count: counts.SUSPENDED,
      },
      {
        key: 'REJECTED',
        label: t('stations.filters.rejected', { defaultValue: 'Bị từ chối' }),
        count: counts.REJECTED,
      },
    ];
  }, [stationList, t]);

  // Filtered station list based on active tab and search query
  const filteredStations = useMemo(() => {
    return stationList.filter((station) => {
      // Status filter
      if (statusFilter !== 'all') {
        const normStatus = station.status.toUpperCase();
        if (normStatus !== statusFilter && !(statusFilter === 'ACTIVE' && normStatus === 'ACTIVE')) {
          if (statusFilter === 'PENDING_APPROVAL' && normStatus !== 'PENDING') return false;
          if (statusFilter === 'SUSPENDED' && normStatus !== 'SUSPENDED') return false;
          if (statusFilter === 'REJECTED' && normStatus !== 'REJECTED') return false;
          if (statusFilter === 'ACTIVE' && normStatus !== 'ACTIVE') return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = station.name?.toLowerCase().includes(q);
        const matchCode = station.stationCode?.toLowerCase().includes(q);
        const matchAddress =
          station.address?.toLowerCase().includes(q) ||
          station.addressLine?.toLowerCase().includes(q) ||
          station.provinceName?.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchAddress) return false;
      }

      return true;
    });
  }, [stationList, statusFilter, searchQuery]);

  const handleCloseDrawer = () => {
    setSelectedStation(null);
    if (searchParams.has('stationId')) {
      searchParams.delete('stationId');
      setSearchParams(searchParams);
    }
  };

  return (
    <>
      <PageHeader
        title={t('stations.title')}
        subtitle={t('stations.subtitle')}
        action={
          <Button
            accent="owner"
            icon={<IconPlusCircle size={16} strokeWidth={2} />}
            onClick={() => setModalOpen(true)}
          >
            {t('stations.registerBtn')}
          </Button>
        }
      />

      {error ? (
        <Card className="border-bad-border bg-bad-soft p-5 text-[13px] font-medium text-bad-deep">
          {t('stations.loadError', { message: (error as Error).message })}
        </Card>
      ) : isLoading || !data ? (
        <StationsSkeleton />
      ) : (
        <>
          {/* Top KPI Metrics Strip */}
          <StationSummary stations={stationList} />

          {/* Search and Status Filters Toolbar */}
          <div className="mb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <FilterTabs<StatusFilterKey>
              tabs={filterTabs}
              active={statusFilter}
              onChange={setStatusFilter}
            />

            <div className="w-full sm:w-[260px]">
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder={t('stations.searchPlaceholder', { defaultValue: 'Tìm theo tên, mã trạm, địa chỉ…' })}
              />
            </div>
          </div>

          {/* Station Cards Grid */}
          {filteredStations.length === 0 ? (
            <Card className="p-8 flex flex-col items-center">
              <EmptyState
                title={t('stations.emptyTitle', { defaultValue: 'Không tìm thấy trạm nào' })}
                description={
                  searchQuery
                    ? t('stations.emptySearch', { defaultValue: 'Không có trạm nào khớp với từ khóa tìm kiếm.' })
                    : t('stations.emptyFilter', { defaultValue: 'Không có trạm nào ở trạng thái đã chọn.' })
                }
              />
              <div className="mt-2">
                {searchQuery || statusFilter !== 'all' ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('all');
                    }}
                  >
                    Xóa bộ lọc
                  </Button>
                ) : (
                  <Button accent="owner" size="sm" onClick={() => setModalOpen(true)}>
                    {t('stations.registerBtn')}
                  </Button>
                )}
              </div>
            </Card>
          ) : (
            <div className="grid gap-[13px] md:grid-cols-2">
              {filteredStations.map((st) => (
                <StationCard
                  key={st.id}
                  station={st}
                  isActiveContext={st.id === selectedStationId}
                  onSelectStation={(id) => setSelectedStationId(id)}
                  onOpenDetail={(targetStation) => setSelectedStation(targetStation)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Registration Modal */}
      <RegisterStationModal open={modalOpen} onClose={() => setModalOpen(false)} />

      {/* Station Detail Drawer */}
      <StationDetailDrawer
        open={Boolean(selectedStation)}
        station={selectedStation}
        onClose={handleCloseDrawer}
        isActiveInContext={selectedStation?.id === selectedStationId}
        onSelectActive={(id) => setSelectedStationId(id)}
      />
    </>
  );
}

function StationsSkeleton() {
  return (
    <>
      <div className="mb-3.5 grid grid-cols-2 gap-[11px] md:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-[76px] rounded-[11px]" />
        ))}
      </div>
      <div className="mb-4 flex justify-between gap-3">
        <Skeleton className="h-[38px] w-[320px] rounded-ctl" />
        <Skeleton className="h-[38px] w-[240px] rounded-ctl" />
      </div>
      <div className="grid gap-[13px] md:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-[210px] rounded-card" />
        ))}
      </div>
    </>
  );
}
