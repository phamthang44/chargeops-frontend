"use client";

import { useState } from "react";
import { BatteryIcon, BoltIcon, ShieldCheckIcon } from "./Icons";

export function LiveChargingTelemetry() {
  const [soc, setSoc] = useState<number>(68);

  // Dynamic calculations based on state
  const powerKw = soc > 80 ? 45 : soc > 60 ? 128 : 160;
  const currentA = Math.round((powerKw * 1000) / 400);
  const remainingMin = Math.max(2, Math.round(((85 - soc) * 0.45)));
  const estimatedCost = Math.round(soc * 520 * 3.85);

  return (
    <div className="flex flex-col h-full justify-between">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="pill bg-primary-soft text-primary-dark font-bold">
            <BatteryIcon className="h-3.5 w-3.5" /> Màn hình minh họa
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-dark bg-primary-soft/60 px-3 py-0.5 rounded-full">
            <ShieldCheckIcon className="h-3.5 w-3.5" /> Dữ liệu mô phỏng
          </span>
        </div>

        <h3 className="mt-4 text-2xl sm:text-3xl font-extrabold tracking-tight text-ink-heading">
          Minh họa thông tin một phiên sạc
        </h3>
        <p className="mt-2 text-sm text-ink-body max-w-xl leading-relaxed">
          Các chỉ số bên dưới chỉ để minh họa giao diện. Dữ liệu phiên sạc thực tế phụ thuộc vào thiết bị và kết nối tại trạm.
        </p>
      </div>

      {/* Interactive Telemetry Cockpit */}
      <div className="mt-8 rounded-2xl border border-black/[0.06] bg-surface-alt/80 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            <span className="text-xs font-bold text-ink-heading uppercase tracking-wider font-mono">
              PHIÊN SẠC · DỮ LIỆU MINH HỌA
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-ink-muted">Mô phỏng mức pin:</span>
            <input
              type="range"
              min="20"
              max="95"
              value={soc}
              onChange={(e) => setSoc(Number(e.target.value))}
              className="h-1.5 w-24 accent-emerald-500 cursor-pointer"
              aria-label="Kéo thanh điều chỉnh pin mô phỏng"
            />
          </div>
        </div>

        {/* Dynamic Battery Bar */}
        <div className="relative">
          <div className="flex items-baseline justify-between text-xs font-bold text-ink-heading mb-1.5">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-mono font-extrabold text-ink-heading">{soc}%</span>
              <span className="text-ink-muted font-normal text-xs">Dung lượng hiện tại</span>
            </div>
            <div className="flex items-center gap-1.5 text-primary-dark font-mono text-sm">
              <BoltIcon className="h-4 w-4 animate-bounce text-primary" />
              <span>{powerKw} kW DC</span>
            </div>
          </div>

          <div className="h-3.5 w-full rounded-full bg-black/[0.06] overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-brand-gradient shadow-glow-emerald transition-all duration-300 relative"
              style={{ width: `${soc}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Telemetry Sensor Metrics */}
        <div className="mt-4 pt-3.5 border-t border-black/[0.05] grid grid-cols-2 sm:grid-cols-4 gap-3 text-center sm:text-left">
          <div className="rounded-xl bg-white p-2.5 border border-black/5">
            <p className="text-[10px] text-ink-muted uppercase font-bold tracking-wider">Điện áp nạp</p>
            <p className="font-mono text-sm font-bold text-ink-heading mt-0.5">398 V</p>
          </div>
          <div className="rounded-xl bg-white p-2.5 border border-black/5">
            <p className="text-[10px] text-ink-muted uppercase font-bold tracking-wider">Dòng điện</p>
            <p className="font-mono text-sm font-bold text-ink-heading mt-0.5">{currentA} A</p>
          </div>
          <div className="rounded-xl bg-white p-2.5 border border-black/5">
            <p className="text-[10px] text-ink-muted uppercase font-bold tracking-wider">Thời gian còn</p>
            <p className="font-mono text-sm font-bold text-primary-dark mt-0.5">~{remainingMin} phút</p>
          </div>
          <div className="rounded-xl bg-white p-2.5 border border-black/5">
            <p className="text-[10px] text-ink-muted uppercase font-bold tracking-wider">Chi phí tạm tính</p>
            <p className="font-mono text-sm font-bold text-ink-heading mt-0.5">
              {estimatedCost.toLocaleString("vi-VN")} đ
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
