import { useQuery } from '@tanstack/react-query';
import { formatVndCompact, useApi, type AdminDashboard } from '@chargeops/api';
import { Card, KpiCard, PageHeader, SidePanel, Skeleton, TrendChart } from '@chargeops/ui';

/** Admin dashboard — platform-wide; data from the service layer (mock now, REST later). */
export function Dashboard() {
  const api = useApi();
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard', 'admin'],
    queryFn: () => api.dashboard.admin(),
  });

  return (
    <>
      <PageHeader
        title="Tổng quan nền tảng"
        subtitle="Toàn bộ trạm, đặt chỗ và doanh thu · Thứ Bảy, 28/06/2026"
      />
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

function DashboardBody({ data }: { data: AdminDashboard }) {
  const { kpis, actionQueue, topStations } = data;
  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-[13px] xl:grid-cols-4">
        <KpiCard
          label="TRẠM HOẠT ĐỘNG"
          value={String(kpis.activeStations)}
          delta={`+${kpis.stationsDeltaWeek} trong tuần này`}
          deltaClass="text-good"
        />
        <KpiCard
          label="CHỜ DUYỆT"
          value={String(kpis.pendingApprovals)}
          delta={`${kpis.newApprovalsToday} hồ sơ mới hôm nay`}
          deltaClass="text-warn"
        />
        <KpiCard
          label="ĐẶT CHỖ HÔM NAY"
          value={String(kpis.bookingsToday)}
          delta={`+${kpis.bookingsDeltaPct}% so với hôm qua`}
          deltaClass="text-good"
        />
        <KpiCard
          label="DOANH THU THÁNG 6"
          value={formatVndCompact(kpis.revenueMonthVnd).replace('tr', '')}
          suffix="tr"
          delta={`+${kpis.revenueDeltaPct}% so với tháng 5`}
          deltaClass="text-good"
        />
      </div>

      <div className="grid gap-[13px] lg:grid-cols-[1fr_340px]">
        <TrendChart
          title="Đặt chỗ & doanh thu toàn nền tảng · 14 ngày"
          axis={['15/06', '28/06']}
          legend={[
            { label: 'Doanh thu', colorClass: 'bg-brand' },
            { label: 'Đặt chỗ', colorClass: 'bg-brand-tint' },
          ]}
        />
        <div className="flex flex-col gap-[13px]">
          <SidePanel
            title="Cần xử lý"
            tone="warn"
            link="Duyệt trạm →"
            rows={[
              { label: 'Hồ sơ trạm chờ duyệt', value: String(actionQueue.pendingStations), dotClass: 'bg-warn', valueClass: 'text-warn' },
              { label: 'Giấy phép sắp hết hạn', value: `${actionQueue.expiringLicenses} · ${actionQueue.expiringDaysMin} ngày`, dotClass: 'bg-warn', valueClass: 'text-warn' },
              { label: 'Giấy phép đã hết hạn', value: String(actionQueue.expiredLicenses), dotClass: 'bg-bad', valueClass: 'text-bad' },
              { label: 'Trụ lỗi được báo cáo', value: String(actionQueue.reportedFaults), dotClass: 'bg-bad', valueClass: 'text-bad' },
            ]}
          />
          <SidePanel
            title="Doanh thu theo trạm · T6"
            link="Phân tích →"
            rows={topStations.map((s, i) => ({
              label: s.name,
              value: formatVndCompact(s.revenueVnd),
              dotClass: i < 2 ? 'bg-brand' : 'bg-brand-tint',
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
      <div className="mb-4 grid grid-cols-2 gap-[13px] xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-[104px] rounded-card" />
        ))}
      </div>
      <div className="grid gap-[13px] lg:grid-cols-[1fr_340px]">
        <Skeleton className="h-[260px] rounded-card" />
        <div className="flex flex-col gap-[13px]">
          <Skeleton className="h-[160px] rounded-card" />
          <Skeleton className="h-[150px] rounded-card" />
        </div>
      </div>
    </>
  );
}
