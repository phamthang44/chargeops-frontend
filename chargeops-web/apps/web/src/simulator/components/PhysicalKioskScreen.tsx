import React, { useEffect, useState } from 'react';
import { QrCodeRenderer } from '@chargeops/ui';
import type { Connector, Station } from '@chargeops/api';
import { RadialCountdown } from './RadialCountdown';

export type SimulatorScreenState =
  | 'AVAILABLE'
  | 'CHECKED_IN'
  | 'CHARGING'
  | 'COMPLETED'
  | 'FAULTED'
  | 'OFFLINE';

export interface PhysicalKioskScreenProps {
  /** Active Station details. */
  station: Station | null;
  /** Active Connector details. */
  connector: Connector | null;
  /** Current dynamic challenge token. */
  challengeToken: string | null;
  /** Seconds remaining until token expiry. */
  remainingSeconds: number;
  /** Loading state for token fetching. */
  loadingToken: boolean;
  /** Trigger manual token refresh. */
  onRefreshChallenge: () => void;
  /** Current screen operational state. */
  screenState: SimulatorScreenState;
  /** Change state handler. */
  onStateChange: (nextState: SimulatorScreenState) => void;
  /** Optional driver name / booking ID for checked-in or charging simulation. */
  driverName?: string;
  bookingCode?: string;
}

export function PhysicalKioskScreen({
  station,
  connector,
  challengeToken,
  remainingSeconds,
  loadingToken,
  onRefreshChallenge,
  screenState,
  onStateChange,
  driverName = 'Nguyễn Văn Tài',
  bookingCode = 'BK-2026-9812',
}: PhysicalKioskScreenProps) {
  // Live clock
  const [timeStr, setTimeStr] = useState(() => new Date().toLocaleTimeString('vi-VN'));
  const [copied, setCopied] = useState(false);

  // Live charging simulation telemetry
  const [chargingSeconds, setChargingSeconds] = useState(0);
  const [soc, setSoc] = useState(32); // Battery State of Charge %
  const [currentPower, setCurrentPower] = useState(connector?.powerKw || 120);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeStr(new Date().toLocaleTimeString('vi-VN'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Charging telemetry ticker
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (screenState === 'CHARGING') {
      interval = setInterval(() => {
        setChargingSeconds((s) => s + 1);
        setSoc((prevSoc) => {
          if (prevSoc >= 100) return 100;
          return prevSoc + 0.15; // Increments over time
        });
        // Slight natural power oscillation
        const base = connector?.powerKw || 120;
        const jitter = (Math.random() - 0.5) * 4;
        setCurrentPower(Math.max(10, Math.min(base, Number((base - 2 + jitter).toFixed(1)))));
      }, 1000);
    } else {
      setChargingSeconds(0);
      setSoc(32);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [screenState, connector?.powerKw]);

  const deliveredKwh = Number(((chargingSeconds * (currentPower / 3600))).toFixed(2));
  const estimatedCostVnd = Math.round(deliveredKwh * 3850);

  const copyToken = () => {
    if (!challengeToken) return;
    navigator.clipboard.writeText(challengeToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const powerKw = connector?.powerKw || 120;
  const connectorType = connector?.connectorType || 'CCS2';
  const connectorId = connector?.connectorCode || connector?.id || 'CCS2-01';
  const stationName = station?.name || 'Trạm Sạc ChargeOps Central';
  const addressLine = station?.addressLine || station?.address || 'Hà Nội, Việt Nam';

  return (
    <div className="relative mx-auto flex w-full max-w-[1020px] flex-col overflow-hidden rounded-[2.2rem] border border-white/15 bg-gradient-to-b from-[#0a0f14] via-[#05090c] to-[#020507] p-2.5 shadow-[0_25px_70px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.15)] text-white select-none antialiased">
      {/* Machined Outer Frame Bezel */}
      <div className="relative flex flex-col overflow-hidden rounded-[1.8rem] border border-white/10 bg-[#070b0e] p-6 sm:p-8 backdrop-blur-2xl">
        
        {/* Subtle Ambient Background Mesh Orbs */}
        <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />

        {/* 1. Kiosk Top Bar */}
        <header className="relative z-10 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-[0_0_20px_rgba(16,185,129,0.4)]">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="13 2 4 14 11 14 10 22 20 9 13 9 13 2" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-white">ChargeOps</span>
                <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10.5px] font-semibold tracking-wider text-emerald-400 uppercase">
                  Terminal 4.0
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">{stationName}</p>
            </div>
          </div>

          {/* Center Hardware Pill */}
          <div className="hidden md:flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-md">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Súng sạc: <strong className="font-mono text-white">{connectorId}</strong></span>
            </div>
            <span className="text-white/20">|</span>
            <span className="text-xs font-semibold text-emerald-400">{connectorType} · {powerKw} kW</span>
          </div>

          {/* Right Clock & Diagnostic */}
          <div className="flex items-center gap-4 text-right">
            <div>
              <div className="font-mono text-base font-bold text-slate-200 tabular-nums">{timeStr}</div>
              <div className="flex items-center justify-end gap-1.5 text-[11px] text-slate-400 font-medium">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>4G LTE · 32°C</span>
              </div>
            </div>
          </div>
        </header>

        {/* 2. Main Screen Area Based on Simulator ScreenState */}
        <main className="relative z-10 my-6 flex min-h-[460px] flex-col items-center justify-center">
          
          {/* STATE: AVAILABLE / READY (Dynamic QR Challenge Display) */}
          {screenState === 'AVAILABLE' && (
            <div className="flex w-full flex-col items-center gap-7 py-2">
              
              {/* Header Directive */}
              <div className="text-center max-w-xl mx-auto">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Sẵn sàng phục vụ · Dynamic QR Check-in
                </div>
                <h1 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight">
                  Quét mã QR để Check-in & Bắt đầu Sạc
                </h1>
                <p className="mt-1.5 text-sm text-slate-400 leading-relaxed">
                  Mã QR bảo mật sinh động theo thời gian thực, tự động đổi sau mỗi 60 giây.
                </p>
              </div>

              {/* Central Dynamic QR Code Stage */}
              <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12 w-full max-w-2xl mx-auto">
                
                {/* Left: QR Display Frame with Sci-fi Targeting Brackets */}
                <div className="relative group">
                  {/* Subtle Glow aura */}
                  <div className="absolute -inset-2 rounded-[2rem] bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 opacity-75 blur-xl group-hover:opacity-100 transition-opacity duration-700" />
                  
                  {/* Outer Frame */}
                  <div className="relative flex flex-col items-center rounded-2xl border border-white/20 bg-slate-900/90 p-5 shadow-2xl backdrop-blur-xl">
                    
                    {/* Targeting Corner Brackets */}
                    <div className="absolute -top-1.5 -left-1.5 h-5 w-5 border-t-2 border-l-2 border-emerald-400 rounded-tl-lg" />
                    <div className="absolute -top-1.5 -right-1.5 h-5 w-5 border-t-2 border-r-2 border-emerald-400 rounded-tr-lg" />
                    <div className="absolute -bottom-1.5 -left-1.5 h-5 w-5 border-b-2 border-l-2 border-emerald-400 rounded-bl-lg" />
                    <div className="absolute -bottom-1.5 -right-1.5 h-5 w-5 border-b-2 border-r-2 border-emerald-400 rounded-br-lg" />

                    {/* QR Code Container */}
                    <div className="relative flex h-[210px] w-[210px] items-center justify-center rounded-xl bg-white p-3 shadow-inner">
                      {loadingToken ? (
                        <div className="flex flex-col items-center gap-2 text-slate-700">
                          <div className="h-8 w-8 animate-spin rounded-full border-3 border-slate-300 border-t-emerald-500" />
                          <span className="text-xs font-medium">Đang tạo mã mới...</span>
                        </div>
                      ) : challengeToken ? (
                        <QrCodeRenderer
                          value={challengeToken}
                          size={186}
                          fgColor="#0A0F14"
                          bgColor="#FFFFFF"
                          quietZone={1}
                          centerBadge={
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="13 2 4 14 11 14 10 22 20 9 13 9 13 2" />
                              </svg>
                            </div>
                          }
                        />
                      ) : (
                        <div className="text-center text-xs text-slate-500 font-medium">Chưa có mã QR</div>
                      )}
                    </div>

                    {/* Hardware Connector Label underneath QR */}
                    <div className="mt-3 flex items-center justify-between w-full px-1">
                      <span className="font-mono text-xs font-bold tracking-wider text-emerald-400">
                        {connectorId}
                      </span>
                      <span className="text-[11.5px] font-medium text-slate-400">
                        {connectorType} · {powerKw} kW
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Radial Countdown & Quick Actions */}
                <div className="flex flex-col items-center lg:items-start gap-4">
                  <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md w-full sm:w-auto">
                    <RadialCountdown
                      totalSeconds={60}
                      remainingSeconds={remainingSeconds}
                      size={88}
                      strokeWidth={6}
                      onRefresh={onRefreshChallenge}
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-white">Thời gian hiệu lực</span>
                      <span className="text-xs text-slate-400 leading-snug">Tự động làm mới khi hết hạn</span>
                      <button
                        type="button"
                        onClick={onRefreshChallenge}
                        className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="23 4 23 10 17 10" />
                          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                        </svg>
                        Làm mới mã ngay
                      </button>
                    </div>
                  </div>

                  {/* Token Inspector & Copy Button (Helpful for test environment) */}
                  <div className="flex flex-col gap-1.5 w-full max-w-[280px]">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Challenge Token (Mã bảo mật):</span>
                      {copied && <span className="text-emerald-400 font-bold">Đã sao chép!</span>}
                    </div>
                    <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs font-mono text-slate-300">
                      <span className="truncate flex-1">
                        {challengeToken || 'Đang tạo token...'}
                      </span>
                      <button
                        type="button"
                        onClick={copyToken}
                        className="rounded-md bg-white/10 px-2 py-0.5 text-[11px] font-sans font-medium text-white hover:bg-white/20 transition-all cursor-pointer"
                        title="Sao chép để dán vào driver test"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>

              </div>

              {/* 3 Step Visual Guidance Cards */}
              <div className="grid w-full grid-cols-1 md:grid-cols-3 gap-3.5 pt-3">
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 backdrop-blur-sm">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 font-bold text-sm">
                    1
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Quét mã QR</h4>
                    <p className="text-[11px] text-slate-400">Dùng app ChargeOps quét mã</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 backdrop-blur-sm">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 font-bold text-sm">
                    2
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Cắm súng sạc</h4>
                    <p className="text-[11px] text-slate-400">Rút súng và cắm chặt vào xe</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 backdrop-blur-sm">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400 font-bold text-sm">
                    3
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Tự động sạc</h4>
                    <p className="text-[11px] text-slate-400">Theo dõi thông số trên màn hình</p>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* STATE: CHECKED_IN (Driver Checked In Successfully) */}
          {screenState === 'CHECKED_IN' && (
            <div className="flex w-full flex-col items-center justify-center gap-6 py-6 text-center animate-fadeIn">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 border-2 border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.4)]">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>

              <div>
                <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                  Check-in hợp lệ · Driver Verified
                </span>
                <h2 className="mt-3 text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  Xin chào, {driverName}!
                </h2>
                <p className="mt-1 font-mono text-xs text-slate-400">
                  Mã đặt chỗ: <span className="text-white font-semibold">{bookingCode}</span> · Súng: <span className="text-emerald-400">{connectorId}</span>
                </p>
              </div>

              <div className="max-w-[480px] rounded-2xl border border-white/15 bg-white/5 p-6 backdrop-blur-md">
                <div className="flex items-center justify-center gap-3 text-emerald-400 font-semibold text-sm">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                  </svg>
                  Vui lòng cắm súng sạc vào cổng sạc của xe
                </div>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                  Sau khi cắm súng sạc, hệ thống sẽ tự động bắt đầu cấp nguồn sau 5 giây.
                </p>

                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => onStateChange('CHARGING')}
                    className="rounded-full bg-emerald-500 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-400 transition-all active:scale-95 cursor-pointer"
                  >
                    ⚡ Giả lập: Đã cắm súng sạc (Bắt đầu sạc)
                  </button>
                  <button
                    type="button"
                    onClick={() => onStateChange('AVAILABLE')}
                    className="rounded-full bg-white/10 px-4 py-2.5 text-xs font-medium text-slate-300 hover:bg-white/20 transition-all cursor-pointer"
                  >
                    Hủy & Về màn hình chờ
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STATE: CHARGING (Live Fast Charging Dashboard) */}
          {screenState === 'CHARGING' && (
            <div className="flex w-full flex-col gap-6 py-2 animate-fadeIn">
              
              {/* Charging Status Strip */}
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-3">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs font-bold tracking-wide text-emerald-400 uppercase">
                    Đang sạc nhanh DC · {connectorType}
                  </span>
                </div>
                <div className="font-mono text-xs text-slate-300">
                  Tài xế: <strong className="text-white font-sans">{driverName}</strong> ({bookingCode})
                </div>
              </div>

              {/* Main Telemetry Gauges */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                
                {/* 1. Large Power Output Gauge */}
                <div className="md:col-span-2 flex flex-col justify-between rounded-2xl border border-white/10 bg-slate-900/80 p-6 backdrop-blur-xl">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Công suất tức thời (Power)
                    </span>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="font-mono text-5xl font-bold tracking-tight text-emerald-400 tabular-nums">
                        {currentPower}
                      </span>
                      <span className="text-lg font-bold text-slate-300">kW</span>
                    </div>
                  </div>

                  {/* Animated Wave / Power pulse bar */}
                  <div className="mt-4 flex items-center gap-1.5 h-10 w-full overflow-hidden rounded-xl bg-black/40 px-3">
                    {Array.from({ length: 24 }).map((_, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-full bg-emerald-500/80 transition-all duration-300"
                        style={{
                          height: `${Math.max(20, Math.sin((chargingSeconds + i) * 0.5) * 80 + 20)}%`,
                          opacity: 0.4 + (i / 24) * 0.6,
                        }}
                      />
                    ))}
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span>Điện áp: 418 V</span>
                    <span>Dòng điện: {Math.round((currentPower * 1000) / 418)} A</span>
                  </div>
                </div>

                {/* 2. Battery State of Charge (SoC) */}
                <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-slate-900/80 p-6 text-center backdrop-blur-xl">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Mức pin xe (SoC)
                  </span>
                  <div className="relative my-3 flex h-28 w-28 items-center justify-center">
                    <svg width="110" height="110" className="transform -rotate-90">
                      <circle cx="55" cy="55" r="45" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                      <circle
                        cx="55"
                        cy="55"
                        r="45"
                        fill="none"
                        stroke="#10B981"
                        strokeWidth="8"
                        strokeDasharray={2 * Math.PI * 45}
                        strokeDashoffset={2 * Math.PI * 45 * (1 - Math.min(1, soc / 100))}
                        strokeLinecap="round"
                        className="transition-all duration-500"
                      />
                    </svg>
                    <span className="absolute font-mono text-2xl font-bold text-white tabular-nums">
                      {Math.round(soc)}%
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">Mục tiêu: 80%</span>
                </div>

                {/* 3. Energy & Duration Stats */}
                <div className="flex flex-col justify-between rounded-2xl border border-white/10 bg-slate-900/80 p-6 backdrop-blur-xl">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Điện năng tiêu thụ
                    </span>
                    <div className="mt-1 font-mono text-2xl font-bold text-white tabular-nums">
                      {deliveredKwh} <span className="text-xs text-slate-400 font-sans font-normal">kWh</span>
                    </div>
                  </div>

                  <div className="mt-3 border-t border-white/10 pt-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Thời gian đã sạc
                    </span>
                    <div className="mt-1 font-mono text-xl font-bold text-cyan-400 tabular-nums">
                      {Math.floor(chargingSeconds / 60)
                        .toString()
                        .padStart(2, '0')}
                      :
                      {(chargingSeconds % 60).toString().padStart(2, '0')}
                    </div>
                  </div>

                  <div className="mt-3 border-t border-white/10 pt-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Tạm tính
                    </span>
                    <div className="mt-1 font-mono text-base font-bold text-emerald-400 tabular-nums">
                      {estimatedCostVnd.toLocaleString('vi-VN')} đ
                    </div>
                  </div>
                </div>

              </div>

              {/* Stop Charging Button */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => onStateChange('COMPLETED')}
                  className="rounded-full bg-rose-600/90 hover:bg-rose-500 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-rose-600/30 transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="4" y="4" width="16" height="16" rx="2" />
                  </svg>
                  Kết thúc phiên sạc
                </button>
              </div>

            </div>
          )}

          {/* STATE: COMPLETED (Session Summary Receipt) */}
          {screenState === 'COMPLETED' && (
            <div className="flex w-full flex-col items-center justify-center gap-6 py-6 text-center animate-fadeIn">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/20 border-2 border-cyan-400 text-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.4)]">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Phiên Sạc Hoàn Tất</h2>
                <p className="text-xs text-slate-400 mt-1">Cảm ơn bạn đã sử dụng dịch vụ sạc ChargeOps!</p>
              </div>

              {/* Receipt Summary Card */}
              <div className="w-full max-w-[420px] rounded-2xl border border-white/15 bg-white/5 p-6 backdrop-blur-md text-left">
                <div className="space-y-3 font-mono text-xs">
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span className="text-slate-400 font-sans">Mã đặt chỗ:</span>
                    <span className="text-white font-bold">{bookingCode}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span className="text-slate-400 font-sans">Tổng điện năng:</span>
                    <span className="text-emerald-400 font-bold tabular-nums">{deliveredKwh || 18.5} kWh</span>
                  </div>
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span className="text-slate-400 font-sans">Thời gian sạc:</span>
                    <span className="text-white font-bold tabular-nums">{Math.max(1, Math.floor(chargingSeconds / 60))} phút</span>
                  </div>
                  <div className="flex justify-between pt-1 text-sm">
                    <span className="text-slate-300 font-sans font-bold">Tổng thanh toán:</span>
                    <span className="text-emerald-400 font-bold tabular-nums">{(estimatedCostVnd || 71225).toLocaleString('vi-VN')} đ</span>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-3">
                  <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-300 text-center font-medium">
                    ⚠️ Vui lòng rút súng sạc và gác lại đúng vị trí trên trụ sạc.
                  </div>
                  <button
                    type="button"
                    onClick={() => onStateChange('AVAILABLE')}
                    className="w-full rounded-full bg-emerald-500 py-3 text-xs font-bold text-white hover:bg-emerald-400 transition-all active:scale-95 shadow-lg shadow-emerald-500/25 cursor-pointer"
                  >
                    Hoàn tất & Về màn hình chờ
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STATE: FAULTED / OFFLINE (Maintenance & Out of Order Screen) */}
          {(screenState === 'FAULTED' || screenState === 'OFFLINE') && (
            <div className="flex w-full flex-col items-center justify-center gap-6 py-12 text-center animate-fadeIn">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-rose-500/20 border-2 border-rose-500 text-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.4)]">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>

              <div>
                <span className="rounded-full bg-rose-500/15 border border-rose-500/30 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-rose-400">
                  {screenState === 'FAULTED' ? 'Trụ sạc báo lỗi (Faulted)' : 'Tạm ngưng hoạt động (Offline)'}
                </span>
                <h2 className="mt-3 text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  Cổng sạc tạm thời không khả dụng
                </h2>
                <p className="mt-1.5 text-xs text-slate-400 max-w-[480px] leading-relaxed">
                  {screenState === 'FAULTED'
                    ? 'Phát hiện sự cố kỹ thuật tại đầu nối CCS2. Kỹ thuật viên đang xử lý.'
                    : 'Cổng sạc đang trong lịch bảo trì định kỳ của trạm.'}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-slate-300 font-mono">
                Hotline hỗ trợ 24/7: <strong className="text-white font-sans">1900 6868</strong>
              </div>

              <button
                type="button"
                onClick={() => onStateChange('AVAILABLE')}
                className="mt-2 rounded-full bg-white/10 hover:bg-white/20 px-6 py-2.5 text-xs font-medium text-white transition-all cursor-pointer"
              >
                Khôi phục trạng thái sẵn sàng
              </button>
            </div>
          )}

        </main>

        {/* 3. Kiosk Bottom Footer */}
        <footer className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">Địa chỉ trạm:</span>
            <span>{addressLine}</span>
          </div>
          <div className="flex items-center gap-3">
            <span>Phiên bản FW: 2.4.0-release</span>
            <span className="text-white/20">·</span>
            <span>Trạng thái: <strong className="text-emerald-400">Trực tuyến</strong></span>
          </div>
        </footer>

      </div>
    </div>
  );
}
