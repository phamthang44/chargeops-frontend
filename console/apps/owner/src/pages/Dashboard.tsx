import { useQuery } from '@tanstack/react-query';
import { formatDateVn, formatVndCompact, useApi, type OwnerDashboard } from '@chargeops/api';
import {
  Card,
  IconShield,
  KpiCard,
  PageHeader,
  SidePanel,
  Skeleton,
  StatusPill,
  TrendChart,
  type SidePanelRow,
} from '@chargeops/ui';

/** Owner dashboard — data comes from the service layer (mock now, REST later). */
export function Dashboard() {
  const api = useApi();
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard', 'owner'],
    queryFn: () => api.dashboard.owner(),
  });

  return (
    <>
      <PageHeader title="Tổng quan" subtitle="Trạm Hà Đông · Thứ Bảy, 28/06/2026" />
      {error ? (
        <Card className="border-bad-border bg-bad-soft p-5 text-[13px] font-medium text-bad-deep">
          Không tải được dữ liệu tổng quan: {(error as Error).message}
        </Card>
      ) : isLoading || !data ? (
        <DashboardSkeleton />
      ) : (
        <DashboardBody data={data} />
      )}
    </>
  );
}

function DashboardBody({ data }: { data: OwnerDashboard }) {
  const { license, kpis, chargers, upcomingBookings } = data;

  const chargerRow = (c: OwnerDashboard['chargers'][number]): SidePanelRow =>
    c.status === 'available'
      ? { label: `${c.id} · ${c.name}`, value: `${c.utilizationPct}%`, dotClass: 'bg-good' }
      : c.status === 'maintenance'
        ? { label: `${c.id} · ${c.name}`, value: 'Bảo trì', dotClass: 'bg-warn', valueClass: 'text-warn' }
        : { label: `${c.id} · ${c.name}`, value: 'Offline', dotClass: 'bg-bad', valueClass: 'text-bad' };

  return (
    <>
      {/* License banner (BR-STA-01: expiry hides the station from drivers) */}
      <div className="mb-[18px] flex flex-wrap items-center justify-between gap-3.5 rounded-[11px] border border-warn-border bg-warn-soft px-4 py-[13px]">
        <div className="flex items-center gap-[11px]">
          <IconShield size={18} className="shrink-0 text-warn" />
          <span className="text-[13px] font-medium text-warn-deep">
            <b className="font-bold">
              Giấy phép: {license.status === 'active' ? 'ĐANG HOẠT ĐỘNG' : license.status === 'expiring' ? 'SẮP HẾT HẠN' : 'ĐÃ HẾT HẠN'}
            </b>{' '}
            · hết hạn {formatDateVn(license.expiryDate)} · còn {license.daysLeft} ngày
          </span>
        </div>
        <StatusPill tone="warn" label="Gia hạn sắp tới" />
      </div>

      {/* KPI row */}
      <div className="mb-4 grid grid-cols-2 gap-[13px] xl:grid-cols-4">
        <KpiCard
          label="ĐẶT CHỖ HÔM NAY"
          value={String(kpis.bookingsToday)}
          delta={`+${kpis.bookingsDelta} so với hôm qua`}
          deltaClass="text-good"
        />
        <KpiCard
          label="DOANH THU HÔM NAY"
          value={formatVndCompact(kpis.revenueTodayVnd).replace('tr', '')}
          suffix="tr"
          delta={`+${kpis.revenueDeltaPct}% so với hôm qua`}
          deltaClass="text-good"
        />
        <KpiCard
          label="TRỤ ONLINE"
          value={String(kpis.chargersOnline)}
          suffix={`/${kpis.chargersTotal}`}
          delta={kpis.offlineChargerNote ?? 'Tất cả trụ đang online'}
          deltaClass={kpis.offlineChargerNote ? 'text-bad' : 'text-good'}
        />
        <KpiCard
          label="SỬ DỤNG TRUNG BÌNH"
          value={String(kpis.avgUtilizationPct)}
          suffix="%"
          delta={`+${kpis.utilizationDeltaPts} điểm so với tuần trước`}
          deltaClass="text-good"
        />
      </div>

      {/* Chart + side panels */}
      <div className="grid gap-[13px] lg:grid-cols-[1fr_340px]">
        <TrendChart
          title="Doanh thu & đặt chỗ · 14 ngày"
          axis={['15/06', '28/06']}
          legend={[
            { label: 'Doanh thu', colorClass: 'bg-brand' },
            { label: 'Đặt chỗ', colorClass: 'bg-brand-tint' },
          ]}
        />
        <div className="flex flex-col gap-[13px]">
          <SidePanel title="Trụ sạc" link="Quản lý →" rows={chargers.map(chargerRow)} />
          <SidePanel
            title="Đặt chỗ sắp tới"
            link="Tất cả →"
            rows={upcomingBookings.map((b) => ({
              label: `${b.id} · ${b.startTime}`,
              value: b.driverName,
            }))}
          />
        </div>
      </div>
    </>
  );
}

function DashboardSkeleton() {
  return (
    <>
      <Skeleton className="mb-[18px] h-[52px] w-full rounded-[11px]" />
      <div className="mb-4 grid grid-cols-2 gap-[13px] xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-[104px] rounded-card" />
        ))}
      </div>
      <div className="grid gap-[13px] lg:grid-cols-[1fr_340px]">
        <Skeleton className="h-[260px] rounded-card" />
        <div className="flex flex-col gap-[13px]">
          <Skeleton className="h-[170px] rounded-card" />
          <Skeleton className="h-[150px] rounded-card" />
        </div>
      </div>
    </>
  );
}
