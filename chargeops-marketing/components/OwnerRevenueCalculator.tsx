"use client";

import { useState } from "react";
import { BoltIcon, ChartBarIcon, CheckIcon, SlidersIcon } from "./Icons";

export function OwnerRevenueCalculator() {
  const [chargersCount, setChargersCount] = useState<number>(4);
  const [sessionsPerDay, setSessionsPerDay] = useState<number>(6);
  const [marginPerKwh, setMarginPerKwh] = useState<number>(900); // 900 VND / kWh margin

  // Calculations:
  // Average EV session consumes ~35 kWh
  const avgKwhPerSession = 35;
  const monthlySessions = chargersCount * sessionsPerDay * 30;
  const monthlyKwh = monthlySessions * avgKwhPerSession;
  const grossProfitMonthly = monthlyKwh * marginPerKwh;
  const licenseFee = 500000; // Reference monthly fee per station

  return (
    <div className="double-bezel-dark w-full mt-10">
      <div className="double-bezel-dark-inner relative overflow-hidden bg-gradient-to-b from-[#111915] via-[#0D1411] to-[#080C0A] p-6 sm:p-8 text-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/20 text-primary-light ring-1 ring-primary/40">
              <ChartBarIcon className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xs font-bold text-primary-light uppercase tracking-wider">Mô phỏng hiệu quả đầu tư</p>
              <h3 className="text-lg font-bold text-white">Ước tính doanh thu &amp; Lợi nhuận trạm sạc</h3>
            </div>
          </div>
          <span className="pill bg-white/10 text-white/80 text-[11px] font-mono">
            <SlidersIcon className="h-3 w-3" /> Tương tác thời gian thực
          </span>
        </div>

        <div className="mt-6 grid gap-8 lg:grid-cols-12 items-center">
          {/* Sliders Area (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Slider 1: Chargers Count */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-2">
                <span className="text-white/80">Số lượng trụ sạc tại trạm:</span>
                <span className="font-mono text-primary-light text-sm font-bold">{chargersCount} trụ</span>
              </div>
              <input
                type="range"
                min="2"
                max="16"
                step="1"
                value={chargersCount}
                onChange={(e) => setChargersCount(Number(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-lg accent-emerald-400 cursor-pointer"
                aria-label="Điều chỉnh số trụ sạc"
              />
              <div className="flex justify-between text-[10px] text-white/40 mt-1">
                <span>2 trụ (Mini Hub)</span>
                <span>8 trụ (Trạm trung tâm)</span>
                <span>16 trụ (Mega Station)</span>
              </div>
            </div>

            {/* Slider 2: Daily Sessions */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-2">
                <span className="text-white/80">Số lượt sạc trung bình / trụ / ngày:</span>
                <span className="font-mono text-primary-light text-sm font-bold">{sessionsPerDay} lượt / ngày</span>
              </div>
              <input
                type="range"
                min="2"
                max="14"
                step="1"
                value={sessionsPerDay}
                onChange={(e) => setSessionsPerDay(Number(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-lg accent-emerald-400 cursor-pointer"
                aria-label="Điều chỉnh số lượt sạc trung bình"
              />
              <div className="flex justify-between text-[10px] text-white/40 mt-1">
                <span>2 lượt</span>
              <span>6 lượt (giả định)</span>
              <span>14 lượt (giả định)</span>
              </div>
            </div>

            {/* Slider 3: Margin per kWh */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-2">
                <span className="text-white/80">Chênh lệch giá bán điện (Lợi nhuận gộp):</span>
                <span className="font-mono text-primary-light text-sm font-bold">
                  +{marginPerKwh.toLocaleString("vi-VN")} đ / kWh
                </span>
              </div>
              <input
                type="range"
                min="500"
                max="1800"
                step="50"
                value={marginPerKwh}
                onChange={(e) => setMarginPerKwh(Number(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-lg accent-emerald-400 cursor-pointer"
                aria-label="Điều chỉnh biên độ lợi nhuận kWh"
              />
              <div className="flex justify-between text-[10px] text-white/40 mt-1">
                <span>500 đ (Giá hữu nghị)</span>
                <span>900 đ (giả định)</span>
                <span>1.800 đ (giả định)</span>
              </div>
            </div>
          </div>

          {/* Results Summary Box (5 cols) */}
          <div className="lg:col-span-5 rounded-2xl border border-white/15 bg-white/5 p-5 backdrop-blur-xl flex flex-col justify-between">
            <div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-white/60">Lợi nhuận gộp ước tính / tháng</p>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-mono font-extrabold text-white text-gradient">
                  {Math.round(grossProfitMonthly / 1000000).toLocaleString("vi-VN")}
                </span>
                <span className="text-lg font-bold text-white">triệu đồng</span>
              </div>
              <p className="mt-1 text-[11px] text-white/60">
                Kịch bản giả định: ~{Math.round(monthlyKwh).toLocaleString("vi-VN")} kWh / tháng
              </p>
            </div>

            <div className="mt-5 space-y-2.5 border-t border-white/10 pt-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-white/70">Tổng số phiên sạc:</span>
                <span className="font-mono font-bold text-white">{monthlySessions} phiên/tháng</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/70">Phí License phần mềm ChargeOps:</span>
                <span className="font-mono text-white/90">500.000 đ/tháng / trạm (tham khảo)</span>
              </div>
            </div>

            <div className="mt-5">
              <a
                href="mailto:phamthang3564@gmail.com?subject=Tư vấn tích hợp trạm sạc vào mạng lưới ChargeOps"
                className="btn-island-primary w-full justify-between text-xs py-2 pl-4 pr-1.5"
              >
                <span>Tư vấn kết nối trạm ngay</span>
                <span className="btn-icon-bubble !h-7 !w-7">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="h-3.5 w-3.5">
                    <path d="M7 17L17 7M17 7H7M17 7V17" />
                  </svg>
                </span>
              </a>
            </div>
          </div>
        </div>
        <p className="mt-4 text-[11px] leading-relaxed text-white/55">
          Đây là phép tính minh họa dựa trên các giả định bạn chọn, không phải cam kết doanh thu hay lợi nhuận. Kết quả thực tế phụ thuộc vào giá bán, sản lượng, chi phí điện và vận hành của từng trạm.
        </p>
      </div>
    </div>
  );
}
