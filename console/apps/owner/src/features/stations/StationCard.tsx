import { STATION_STATUS, type Station } from '@chargeops/api';
import { Card, IconClock, StatusPill } from '@chargeops/ui';

/** One station card — active shows stats; pending/rejected show a status note. */
export function StationCard({ station }: { station: Station }) {
  const meta = STATION_STATUS[station.status];
  return (
    <Card className="p-[17px]">
      <div className="mb-3 flex items-start justify-between gap-2.5">
        <div>
          <div className="text-[16px] font-bold">{station.name}</div>
          <div className="mt-0.5 font-mono text-[12px] text-faint">
            {station.id} · {station.city}
          </div>
        </div>
        <StatusPill tone={meta.tone} label={meta.label} />
      </div>

      {station.status === 'active' && (
        <div className="mb-[13px] grid grid-cols-3 gap-[9px]">
          <MiniStat label="ĐẶT HÔM NAY" value={String(station.bookingsToday)} />
          <MiniStat label="TRỤ ONLINE" value={`${station.onlineCount}/${station.chargerCount}`} />
          <MiniStat label="SỬ DỤNG" value={`${station.utilizationPct}%`} />
        </div>
      )}

      <div className="flex flex-col gap-2 text-[12.5px] font-medium text-body">
        <div className="flex justify-between border-b border-hairline pb-[7px]">
          <span className="text-faint">Địa chỉ</span>
          <span className="text-right">{station.address}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-faint">Giấy phép</span>
          <span>{station.licenseSummary ?? '—'}</span>
        </div>
      </div>

      {station.status === 'rejected' && station.rejectionReason && (
        <div className="mt-3 flex gap-2 rounded-[9px] border border-bad-border bg-bad-soft px-3 py-2.5 text-[11.5px] leading-[1.5] font-medium text-bad-deep">
          <span>
            <b className="font-semibold">Lý do từ chối:</b> {station.rejectionReason}
          </span>
        </div>
      )}
      {station.status === 'pending' && (
        <div className="mt-3 flex items-center gap-2 rounded-[9px] border border-warn-border bg-warn-soft px-3 py-2.5 text-[11.5px] leading-[1.5] font-medium text-warn-deep">
          <IconClock size={15} className="shrink-0" />
          <span>Hồ sơ đang chờ quản trị viên xét duyệt. Trạm chưa hiển thị cho tài xế.</span>
        </div>
      )}
    </Card>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[9px] border border-line-3 p-2.5">
      <div className="font-mono text-[9px] font-semibold text-faint">{label}</div>
      <div className="mt-[3px] text-[17px] font-bold">{value}</div>
    </div>
  );
}
