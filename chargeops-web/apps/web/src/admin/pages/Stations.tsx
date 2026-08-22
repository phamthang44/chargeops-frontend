import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Card,
  EmptyState,
  FilterTabs,
  IconAlertTriangle,
  IconBolt,
  IconCheck,
  IconClock,
  IconInfo,
  IconPin,
  IconPlusCircle,
  IconRefreshCw,
  IconSearch,
  IconShield,
  MetricCard,
  MoreMenu,
  PageHeader,
  Pagination,
  SearchInput,
  Select,
  Skeleton,
  StatusPill,
  useToast,
  type FilterTab,
  type MoreMenuItem,
} from '@chargeops/ui';
import {
  formatDateVn,
  useApi,
  type AdminStationListItem,
  type StationStatus,
} from '@chargeops/api';
import { StationDetailDrawer } from '../features/stations/StationDetailDrawer';
import { StationActionModal, type StationActionType } from '../features/stations/StationActionModal';
import { StationProvisioningWorkspace } from '../features/stations/StationProvisioningWorkspace';
import { getApiErrorMessage } from '../../i18n';

type FilterKey = 'all' | 'ACTIVE' | 'PENDING_APPROVAL' | 'SUSPENDED' | 'REJECTED';

const PAGE_SIZE = 8;
const GRID_COLS = '120px 1.8fr 1.3fr 100px 125px 115px 95px 135px';

const STATUS_META: Record<
  string,
  { label: string; tone: 'good' | 'warn' | 'bad' | 'neutral' }
> = {
  ACTIVE: { label: 'Hoạt động', tone: 'good' },
  active: { label: 'Hoạt động', tone: 'good' },
  PENDING_APPROVAL: { label: 'Chờ duyệt', tone: 'warn' },
  pending: { label: 'Chờ duyệt', tone: 'warn' },
  SUSPENDED: { label: 'Tạm ngưng', tone: 'warn' },
  suspended: { label: 'Tạm ngưng', tone: 'warn' },
  REJECTED: { label: 'Từ chối', tone: 'bad' },
  rejected: { label: 'Từ chối', tone: 'bad' },
  WITHDRAWN: { label: 'Đã rút', tone: 'neutral' },
  withdrawn: { label: 'Đã rút', tone: 'neutral' },
};

export function Stations() {
  const { t } = useTranslation('admin');
  const api = useApi();
  const qc = useQueryClient();
  const toast = useToast();
  const navigate = useNavigate();

  const [filter, setFilter] = useState<FilterKey>('all');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedProvince, setSelectedProvince] = useState<string>('all');
  const [page, setPage] = useState(0);

  // Drilldown Provisioning Workspace state
  const [provisioningStation, setProvisioningStation] = useState<AdminStationListItem | null>(null);

  // Drawer & Modal states
  const [selectedStation, setSelectedStation] = useState<AdminStationListItem | null>(null);
  const [actionState, setActionState] = useState<{ type: StationActionType; station: AdminStationListItem } | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch provinces for filter
  const { data: provinces } = useQuery({
    queryKey: ['location', 'provinces'],
    queryFn: () => api.location.getProvinces(),
  });

  const provinceOptions = useMemo(() => {
    const opts = [{ value: 'all', label: 'Tất cả Tỉnh / Thành' }];
    if (provinces) {
      provinces.forEach((p) => opts.push({ value: p.code, label: p.name || p.fullName }));
    }
    return opts;
  }, [provinces]);

  const handleFilterChange = (newFilter: FilterKey) => {
    setFilter(newFilter);
    setPage(0);
  };

  // Main paginated query for stations
  const { data: pageData, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['admin', 'stations', 'list', { filter, search: debouncedSearch, province: selectedProvince, page, pageSize: PAGE_SIZE }],
    queryFn: () =>
      api.stations.adminList({
        status: filter === 'all' ? undefined : filter,
        search: debouncedSearch || undefined,
        provinceCode: selectedProvince === 'all' ? undefined : selectedProvince,
        pageNo: page + 1,
        pageSize: PAGE_SIZE,
      }),
    placeholderData: keepPreviousData,
  });

  // Action mutation: Suspend / Reactivate
  const executeAction = useMutation({
    mutationFn: async (reason: string) => {
      if (!actionState) return;
      const { type, station } = actionState;
      if (type === 'suspend') {
        return api.stations.suspend(station.id, reason);
      }
      if (type === 'reactivate') {
        return api.stations.reactivate(station.id, reason);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'stations'] });
      toast(
        actionState?.type === 'suspend'
          ? 'Đã tạm ngưng vận hành trạm sạc thành công.'
          : 'Đã kích hoạt lại trạm sạc thành công.',
        'success',
      );
      setActionState(null);
    },
    onError: (e) => {
      qc.invalidateQueries({ queryKey: ['admin', 'stations'] });
      toast(getApiErrorMessage(e), 'error');
      setActionState(null);
    },
  });

  const rows = pageData?.items ?? [];
  const total = pageData?.total ?? 0;

  const activeCount = rows.filter((s) => String(s.status).toUpperCase() === 'ACTIVE').length;
  const suspendedCount = rows.filter((s) => String(s.status).toUpperCase() === 'SUSPENDED').length;
  const pendingCount = rows.filter((s) => String(s.status).toUpperCase() === 'PENDING_APPROVAL').length;

  const tabs = useMemo<FilterTab<FilterKey>[]>(() => {
    return [
      { key: 'all', label: 'Tất cả', count: filter === 'all' ? total : undefined },
      { key: 'ACTIVE', label: 'Đang hoạt động', count: filter === 'ACTIVE' ? total : undefined },
      { key: 'PENDING_APPROVAL', label: 'Chờ duyệt', count: filter === 'PENDING_APPROVAL' ? total : undefined },
      { key: 'SUSPENDED', label: 'Tạm ngưng', count: filter === 'SUSPENDED' ? total : undefined },
      { key: 'REJECTED', label: 'Từ chối', count: filter === 'REJECTED' ? total : undefined },
    ];
  }, [filter, total]);

  // If currently in drilldown provisioning workspace for a station
  if (provisioningStation) {
    return (
      <StationProvisioningWorkspace
        station={provisioningStation}
        onBack={() => setProvisioningStation(null)}
        onManageLicense={() => navigate('/admin/licenses')}
      />
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        {/* Page Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <PageHeader
            title="Quản lý Trạm & Trụ Sạc"
            subtitle="Trung tâm giám sát danh mục trạm sạc, cấp hạ tầng trụ & súng sạc (FR14), theo dõi giấy phép và can thiệp vận hành."
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-1.5"
          >
            <IconRefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
            <span>Làm mới</span>
          </Button>
        </div>

        {error ? (
          <Card className="border-bad-border bg-bad-soft p-5 text-[13px] font-medium text-bad-deep">
            {(error as Error).message}
          </Card>
        ) : (
          <>
            {/* Top KPI Metric Cards */}
            <div className="grid grid-cols-2 gap-[13px] xl:grid-cols-4">
              <MetricCard
                label="Tổng số trạm sạc"
                value={String(total)}
                accent="#5b54e8"
              />
              <MetricCard
                label="Đang vận hành"
                value={String(activeCount)}
                accent="#0d8a5a"
              />
              <MetricCard
                label="Tạm ngưng / Sự cố"
                value={String(suspendedCount)}
                accent="#9a6b16"
              />
              <MetricCard
                label="Hồ sơ chờ duyệt"
                value={String(pendingCount)}
                accent="#6366f1"
              />
            </div>

            {/* Filter Tabs & Search Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <FilterTabs<FilterKey>
                tabs={tabs}
                active={filter}
                onChange={handleFilterChange}
                accent="brand"
              />

              <div className="flex flex-wrap items-center gap-2.5">
                <div className="w-[180px]">
                  <Select
                    value={selectedProvince}
                    options={provinceOptions}
                    onChange={(val) => {
                      setSelectedProvince(val);
                      setPage(0);
                    }}
                  />
                </div>

                <div className="w-[260px]">
                  <SearchInput
                    value={searchInput}
                    onChange={setSearchInput}
                    placeholder="Tìm kiếm mã trạm, tên, chủ trạm..."
                  />
                </div>
              </div>
            </div>

            {/* Stations Data Table */}
            <Card className="overflow-hidden border-line-2 bg-surface">
              <div className="overflow-x-auto">
                <div className="min-w-[980px]">
                  {/* Table Header */}
                  <div
                    className="grid bg-surface-2 px-4 py-[11px] text-[10px] font-semibold uppercase tracking-[0.07em] text-faint"
                    style={{ gridTemplateColumns: GRID_COLS }}
                  >
                    <span>MÃ TRẠM</span>
                    <span>TÊN TRẠM & ĐỊA CHỈ</span>
                    <span>CHỦ SỞ HỮU (CPO)</span>
                    <span>QUY HOẠCH TRỤ</span>
                    <span>GIẤY PHÉP</span>
                    <span>TRẠNG THÁI</span>
                    <span>NGÀY TẠO</span>
                    <span className="text-right">THAO TÁC</span>
                  </div>

                  {isLoading ? (
                    <div className="flex flex-col gap-2 p-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full rounded-[8px]" />
                      ))}
                    </div>
                  ) : rows.length === 0 ? (
                    <EmptyState
                      title="Không có trạm sạc nào"
                      description={
                        debouncedSearch || selectedProvince !== 'all' || filter !== 'all'
                          ? 'Không tìm thấy kết quả phù hợp với điều kiện lọc hiện tại.'
                          : 'Hệ thống chưa ghi nhận trạm sạc nào.'
                      }
                      className="py-12"
                    />
                  ) : (
                    rows.map((s) => (
                      <StationRow
                        key={s.id}
                        station={s}
                        onSelect={() => setSelectedStation(s)}
                        onProvision={() => setProvisioningStation(s)}
                        onSuspend={() => setActionState({ type: 'suspend', station: s })}
                        onReactivate={() => setActionState({ type: 'reactivate', station: s })}
                      />
                    ))
                  )}
                </div>
              </div>

              {/* Bottom Pagination */}
              {total > 0 && (
                <Pagination
                  page={page}
                  pageSize={PAGE_SIZE}
                  total={total}
                  onPage={(newPage) => setPage(newPage)}
                />
              )}
            </Card>
          </>
        )}
      </div>

      {/* 360° Station Detail Drawer */}
      <StationDetailDrawer
        open={Boolean(selectedStation)}
        stationId={selectedStation?.id ?? null}
        initialData={selectedStation}
        onClose={() => setSelectedStation(null)}
        onSuspend={(st) => {
          setSelectedStation(null);
          setActionState({ type: 'suspend', station: st as AdminStationListItem });
        }}
        onReactivate={(st) => {
          setSelectedStation(null);
          setActionState({ type: 'reactivate', station: st as AdminStationListItem });
        }}
        onManageLicense={(stId) => {
          setSelectedStation(null);
          navigate('/admin/licenses');
        }}
        onManageProvisioning={(stId) => {
          const target = rows.find((r) => r.id === stId) || selectedStation;
          setSelectedStation(null);
          if (target) {
            setProvisioningStation(target);
          }
        }}
      />

      {/* Action Modal (Suspend / Reactivate) */}
      <StationActionModal
        open={Boolean(actionState)}
        type={actionState?.type ?? null}
        station={actionState?.station ?? null}
        onClose={() => setActionState(null)}
        onConfirm={(reason) => executeAction.mutateAsync(reason)}
        loading={executeAction.isPending}
      />
    </>
  );
}

function StationRow({
  station: s,
  onSelect,
  onProvision,
  onSuspend,
  onReactivate,
}: {
  station: AdminStationListItem;
  onSelect: () => void;
  onProvision: () => void;
  onSuspend: () => void;
  onReactivate: () => void;
}) {
  const navigate = useNavigate();
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  const st = String(s.status).toUpperCase();
  const meta = STATUS_META[st] || { label: st, tone: 'neutral' as const };
  const lic = s.licenseSummary;
  const isYear = lic && String(lic.plan).toUpperCase() === 'YEARLY';
  const isActive = st === 'ACTIVE';
  const isSuspended = st === 'SUSPENDED';

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const code = s.stationCode || s.id;
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast('Đã sao chép mã trạm', 'success');
    setTimeout(() => setCopied(false), 1500);
  };

  const menuItems = useMemo<MoreMenuItem[]>(() => {
    const items: MoreMenuItem[] = [
      {
        key: 'detail',
        label: 'Xem chi tiết 360°',
        icon: <IconInfo size={14} />,
        onClick: onSelect,
      },
      {
        key: 'provision',
        label: 'Cấp & Cấu hình trụ (FR14)',
        icon: <IconBolt size={14} />,
        onClick: onProvision,
      },
      {
        key: 'licenses',
        label: 'Xem giấy phép License',
        icon: <IconShield size={14} />,
        onClick: () => navigate('/admin/licenses'),
      },
    ];

    if (isActive) {
      items.push({
        key: 'suspend',
        label: 'Tạm ngưng vận hành trạm',
        icon: <IconAlertTriangle size={14} />,
        onClick: onSuspend,
        tone: 'danger',
      });
    }

    if (isSuspended) {
      items.push({
        key: 'reactivate',
        label: 'Kích hoạt lại trạm sạc',
        icon: <IconCheck size={14} />,
        onClick: onReactivate,
      });
    }

    return items;
  }, [isActive, isSuspended, onSelect, onProvision, onSuspend, onReactivate, navigate]);

  return (
    <div
      onClick={onSelect}
      className="grid items-center border-t border-hairline px-4 py-3 text-[12.5px] transition hover:bg-surface-2 cursor-pointer font-medium"
      style={{ gridTemplateColumns: GRID_COLS }}
    >
      {/* Mã trạm */}
      <div className="flex items-center gap-1.5 min-w-0 pr-2">
        <span className="font-mono text-[11.5px] font-bold text-brand truncate">
          {s.stationCode || s.id}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-faint hover:bg-chip hover:text-ink transition"
          title="Sao chép mã"
        >
          {copied ? <IconCheck size={12} className="text-good" /> : <span className="text-[11px] font-mono">⧉</span>}
        </button>
      </div>

      {/* Tên trạm & Địa chỉ */}
      <div className="flex flex-col gap-0.5 min-w-0 pr-3">
        <span
          className="font-bold text-ink hover:text-brand truncate"
          title={s.name}
        >
          {s.name}
        </span>
        <div className="flex items-center gap-1 text-[11px] text-muted truncate">
          <IconPin size={11} className="shrink-0 text-faint" />
          <span className="truncate">{s.addressLine || s.wardName || '—'}</span>
        </div>
      </div>

      {/* Chủ sở hữu */}
      <div className="flex flex-col gap-0.5 min-w-0 pr-2">
        <span className="font-semibold text-ink text-[12px] truncate">
          {s.ownerDisplayName || 'Chủ trạm'}
        </span>
        <span className="font-mono text-[10.5px] text-faint truncate">
          {s.ownerEmail || '—'}
        </span>
      </div>

      {/* Quy hoạch trụ */}
      <div className="flex flex-col">
        <span className="font-bold text-ink text-[12px]">
          {s.plannedChargePointCount ?? 0} Trụ
        </span>
        <span className="text-[10.5px] text-faint">
          Quy hoạch duyệt
        </span>
      </div>

      {/* Giấy phép */}
      <div className="flex flex-col gap-0.5">
        {lic ? (
          <>
            <div className="flex items-center">
              <span className="rounded bg-brand-soft px-1.5 py-0.2 text-[10px] font-bold text-brand">
                {isYear ? 'Gói Năm' : 'Gói Tháng'}
              </span>
            </div>
            <span className="text-[10px] text-muted truncate">
              Đến {lic.expiresAt ? formatDateVn(lic.expiresAt) : '—'}
            </span>
          </>
        ) : (
          <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-faint border border-line-2 w-fit">
            Chưa cấp
          </span>
        )}
      </div>

      {/* Trạng thái */}
      <div>
        <StatusPill tone={meta.tone} label={meta.label} />
      </div>

      {/* Ngày tạo */}
      <div className="text-[11px] text-faint font-mono">
        {s.createdAt ? formatDateVn(s.createdAt) : '—'}
      </div>

      {/* Thao tác: Professional Button + MoreMenu Kebab */}
      <div
        className="flex items-center justify-end gap-1.5"
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          size="sm"
          variant="secondary"
          onClick={onProvision}
          className="h-[28px] px-2 text-[11.5px] flex items-center gap-1 hover:border-brand"
        >
          <IconBolt size={12} className="text-brand" />
          <span>Cấp trụ</span>
        </Button>

        <MoreMenu items={menuItems} align="right" />
      </div>
    </div>
  );
}
