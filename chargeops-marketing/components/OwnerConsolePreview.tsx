import { BoltIcon, CheckIcon } from "@/components/Icons";

/**
 * Pixel-perfect simulated preview of the ChargeOps Operator Web Console.
 * Directly mirrors the real apps/web Owner Console (Dashboard + ToU Pricing + Chargers).
 */
export function OwnerConsolePreview() {
  return (
    <div className="flex min-h-[460px] flex-col bg-white text-ink-strong antialiased select-none sm:flex-row">
      {/* Sidebar */}
      <aside className="w-full border-r border-line bg-surface-alt/70 p-4 sm:w-56 sm:shrink-0">
        <div className="flex items-center gap-2.5 px-2 py-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-white shadow-sm font-bold text-sm">
            ⚡
          </div>
          <div>
            <p className="text-xs font-bold text-ink-strong">ChargeOps Console</p>
            <p className="text-[10px] text-ink-muted">Chủ trạm EVGo</p>
          </div>
        </div>

        {/* Station select widget */}
        <div className="mt-4 rounded-xl border border-line bg-white p-2.5 shadow-sm">
          <p className="text-[10px] font-medium uppercase tracking-wider text-ink-muted">Trạm hiện tại</p>
          <p className="mt-0.5 truncate text-xs font-bold text-ink-strong">Vincom Đồng Khởi</p>
          <div className="mt-1 flex items-center gap-1.5 text-[10px] text-primary-dark font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            <span>8/8 Trụ hoạt động</span>
          </div>
        </div>

        {/* Sidebar Nav */}
        <nav className="mt-4 space-y-1 text-xs font-medium">
          {[
            { name: "Tổng quan", icon: "📊", active: false },
            { name: "Quản lý trụ sạc", icon: "🔌", active: false },
            { name: "Biểu giá ToU", icon: "💰", active: true },
            { name: "Lịch đặt chỗ", icon: "📅", active: false },
            { name: "Báo cáo doanh thu", icon: "📈", active: false },
            { name: "Giấy phép trạm", icon: "📜", active: false },
          ].map((item) => (
            <div
              key={item.name}
              className={`flex items-center gap-2.5 rounded-xl px-3 py-2 transition ${
                item.active
                  ? "bg-primary-soft text-primary-dark font-bold shadow-sm ring-1 ring-primary/20"
                  : "text-ink-body hover:bg-surface-alt"
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.name}</span>
            </div>
          ))}
        </nav>
      </aside>

      {/* Main Console Content */}
      <div className="flex-1 p-5 sm:p-6 overflow-hidden">
        {/* Header bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
          <div>
            <h3 className="text-base font-bold text-ink-strong sm:text-lg">
              Biểu giá theo thời gian (Time-of-Use)
            </h3>
            <p className="text-xs text-ink-muted">
              Tự động điều chỉnh đơn giá điện theo khung giờ cao điểm và thấp điểm
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-pill bg-primary-soft px-2.5 py-1 text-[11px] font-semibold text-primary-dark">
              <CheckIcon className="h-3 w-3" /> Đang áp dụng
            </span>
          </div>
        </div>

        {/* KPI stat mini cards */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-line bg-surface-alt p-3">
            <p className="text-[10px] text-ink-muted">Doanh thu hôm nay</p>
            <p className="mt-1 text-sm font-bold text-ink-strong sm:text-base">24.850.000đ</p>
            <p className="mt-0.5 text-[10px] font-semibold text-primary-dark">+14.2% so với hôm qua</p>
          </div>
          <div className="rounded-xl border border-line bg-surface-alt p-3">
            <p className="text-[10px] text-ink-muted">Tỉ lệ lấp đầy</p>
            <p className="mt-1 text-sm font-bold text-ink-strong sm:text-base">82.4%</p>
            <p className="mt-0.5 text-[10px] font-semibold text-primary-dark">+6.5% giờ cao điểm</p>
          </div>
          <div className="rounded-xl border border-line bg-surface-alt p-3">
            <p className="text-[10px] text-ink-muted">Lượt đặt trước</p>
            <p className="mt-1 text-sm font-bold text-ink-strong sm:text-base">38 lượt</p>
            <p className="mt-0.5 text-[10px] font-semibold text-primary-dark">0% no-show (đã thanh toán)</p>
          </div>
          <div className="rounded-xl border border-line bg-surface-alt p-3">
            <p className="text-[10px] text-ink-muted">Giá trung bình</p>
            <p className="mt-1 text-sm font-bold text-ink-strong sm:text-base">3.920đ</p>
            <p className="mt-0.5 text-[10px] text-ink-muted">/kWh tiêu thụ</p>
          </div>
        </div>

        {/* ToU Schedule Matrix Table */}
        <div className="mt-5 rounded-xl border border-line overflow-hidden">
          <div className="bg-surface-alt px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-ink-muted border-b border-line flex justify-between items-center">
            <span>Cấu hình khung giờ & Đơn giá</span>
            <span className="text-[10px] font-normal text-primary-dark font-semibold">Tự động kích hoạt</span>
          </div>

          <div className="divide-y divide-line text-xs">
            {/* Peak Hour */}
            <div className="flex items-center justify-between p-3 bg-warning/5">
              <div className="flex items-center gap-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-warning/15 text-warning font-bold text-[10px]">
                  🔥
                </span>
                <div>
                  <p className="font-bold text-ink-strong">Giờ cao điểm chiều tối</p>
                  <p className="text-[11px] text-ink-muted">17:00 – 20:00 (Hàng ngày)</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-warning text-sm">4.500đ/kWh</p>
                <span className="text-[10px] font-medium text-warning">+17% giá gốc</span>
              </div>
            </div>

            {/* Standard Hour */}
            <div className="flex items-center justify-between p-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary-soft text-primary-dark font-bold text-[10px]">
                  ⚡
                </span>
                <div>
                  <p className="font-bold text-ink-strong">Giờ tiêu chuẩn</p>
                  <p className="text-[11px] text-ink-muted">09:00 – 17:00 (Hàng ngày)</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-ink-strong text-sm">3.850đ/kWh</p>
                <span className="text-[10px] text-ink-muted">Giá tiêu chuẩn</span>
              </div>
            </div>

            {/* Off-peak Hour */}
            <div className="flex items-center justify-between p-3 bg-surface-alt/50">
              <div className="flex items-center gap-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-info/10 text-info font-bold text-[10px]">
                  🌙
                </span>
                <div>
                  <p className="font-bold text-ink-strong">Giờ thấp điểm đêm</p>
                  <p className="text-[11px] text-ink-muted">22:00 – 06:00 sáng hôm sau</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-info text-sm">3.200đ/kWh</p>
                <span className="text-[10px] font-semibold text-info">-17% ưu đãi sạc đêm</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Chargers Monitor Bar */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-surface-alt p-3 text-[11px]">
          <div className="flex items-center gap-2">
            <BoltIcon className="h-4 w-4 text-primary" />
            <span className="font-semibold text-ink-strong">Trạng thái trụ thực tế:</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-white px-2 py-0.5 font-medium text-ink-body shadow-sm border border-line">
              DC-01 (120kW): <strong className="text-primary-dark">Đang sạc 72%</strong>
            </span>
            <span className="rounded-md bg-white px-2 py-0.5 font-medium text-ink-body shadow-sm border border-line">
              DC-02 (60kW): <strong className="text-warning">Đã giữ chỗ 14:00</strong>
            </span>
            <span className="rounded-md bg-white px-2 py-0.5 font-medium text-ink-body shadow-sm border border-line">
              AC-01 (22kW): <strong className="text-primary-dark">Sẵn sàng</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
