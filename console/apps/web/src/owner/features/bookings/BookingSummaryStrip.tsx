import { formatVndCompact, type BookingSummary } from '@chargeops/api';
import { MetricCard } from '@chargeops/ui';

/** Five-metric strip above the bookings table. */
export function BookingSummaryStrip({ summary }: { summary: BookingSummary }) {
  const active = summary.byStatus.confirmed + summary.byStatus.checkedin + summary.byStatus.charging;
  return (
    <div className="mb-3.5 grid grid-cols-2 gap-[11px] md:grid-cols-3 xl:grid-cols-5">
      <MetricCard label="TỔNG LƯỢT ĐẶT" value={String(summary.total)} accent="#5b54e8" />
      <MetricCard label="ĐANG HOẠT ĐỘNG" value={String(active)} sub="xác nhận · sạc" accent="#12a150" />
      <MetricCard label="HOÀN TẤT" value={String(summary.byStatus.completed)} accent="#16171a" />
      <MetricCard label="ĐÃ HỦY" value={String(summary.byStatus.cancelled)} accent="#c0392b" />
      <MetricCard label="TỔNG THU" value={formatVndCompact(summary.grossVnd)} sub="trừ hoàn tiền sau" accent="#0d8a5a" />
    </div>
  );
}
