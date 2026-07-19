import { useQuery } from '@tanstack/react-query';
import { formatDateVn, formatVnd, LICENSE_STATUS, useApi, type License } from '@chargeops/api';
import { Card, IconClock, IconShield, PageHeader, Skeleton, StatusPill } from '@chargeops/ui';

const PLAN_LABEL = { yearly: 'Gói Năm (Yearly)', monthly: 'Gói Tháng (Monthly)' } as const;

/**
 * FR12 — owner license, status display only. Purchase/renewal happens
 * off-platform; the admin records status manually (BR-STA-01 on expiry).
 */
export function License() {
  const api = useApi();
  const { data, isLoading, error } = useQuery({
    queryKey: ['license', 'mine'],
    queryFn: () => api.licenses.mine(),
  });

  return (
    <>
      <PageHeader title="Giấy phép" subtitle="Trạng thái giấy phép vận hành của bạn." />
      {error ? (
        <Card className="border-bad-border bg-bad-soft p-5 text-[13px] font-medium text-bad-deep">
          Không tải được giấy phép: {(error as Error).message}
        </Card>
      ) : isLoading || !data ? (
        <div className="grid gap-[13px] md:grid-cols-2">
          <Skeleton className="h-[190px] rounded-card" />
          <Skeleton className="h-[190px] rounded-card" />
        </div>
      ) : (
        <Body license={data} />
      )}
    </>
  );
}

function Body({ license }: { license: License }) {
  const meta = LICENSE_STATUS[license.status];
  const priceLabel = `${formatVnd(license.priceVnd)} / ${license.plan === 'yearly' ? 'năm' : 'tháng'}`;

  return (
    <div className="grid gap-[13px] md:grid-cols-2">
      {/* license card */}
      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-[38px] w-[38px] items-center justify-center rounded-[10px] bg-brand-soft">
              <IconShield size={20} className="text-brand" />
            </span>
            <div>
              <div className="text-[16px] font-bold">{PLAN_LABEL[license.plan]}</div>
              <div className="text-[12px] font-medium text-muted">{priceLabel}</div>
            </div>
          </div>
          <StatusPill tone={meta.tone} label={meta.label} />
        </div>
        <div className="flex flex-col gap-2.5 text-[13px] font-medium text-body">
          <Row label="Bắt đầu" value={formatDateVn(license.startDate)} border />
          <Row label="Hết hạn" value={formatDateVn(license.expiryDate)} bold border />
          <Row label="Còn lại" value={`${license.daysLeft} ngày`} warn />
        </div>
      </Card>

      {/* notes */}
      <div className="flex flex-col gap-[13px]">
        <div className="flex gap-[9px] rounded-card border border-warn-border bg-warn-soft p-4">
          <IconClock size={17} className="mt-px shrink-0 text-warn" />
          <div className="text-[12.5px] leading-[1.55] font-medium text-warn-deep">
            <b className="font-semibold">Gia hạn sắp tới (còn {license.daysLeft} ngày).</b> Việc
            mua/gia hạn giấy phép được xử lý ngoài nền tảng; trạng thái sẽ được quản trị viên ghi nhận
            thủ công. Màn hình này chỉ hiển thị trạng thái.
          </div>
        </div>
        <Card className="p-4">
          <div className="mb-2 text-[13px] font-semibold">Khi giấy phép hết hạn</div>
          <div className="text-[12.5px] leading-[1.6] text-muted">
            Trạm và các trụ sẽ bị ẩn khỏi tìm kiếm của tài xế cho tới khi gia hạn (BR-STA-01). Các đặt
            chỗ đang hoạt động không bị ảnh hưởng.
          </div>
        </Card>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
  warn,
  border,
}: {
  label: string;
  value: string;
  bold?: boolean;
  warn?: boolean;
  border?: boolean;
}) {
  return (
    <div className={`flex justify-between ${border ? 'border-b border-hairline pb-[9px]' : ''}`}>
      <span className="text-faint">{label}</span>
      <span className={`${bold || warn ? 'font-semibold' : ''} ${warn ? 'text-warn' : ''}`}>{value}</span>
    </div>
  );
}
