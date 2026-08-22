import React from 'react';
import type { Connector, Station } from '@chargeops/api';
import type { SimulatorScreenState } from './PhysicalKioskScreen';

export interface SimulatorLogItem {
  id: string;
  time: string;
  type: 'info' | 'success' | 'warn' | 'error';
  message: string;
}

export interface SimulatorControlPanelProps {
  stations: Station[];
  selectedStationId: string;
  onSelectStation: (stationId: string) => void;
  connectors: Connector[];
  selectedConnectorId: string;
  onSelectConnector: (connectorId: string) => void;
  challengeToken: string | null;
  remainingSeconds: number;
  autoRefresh: boolean;
  onToggleAutoRefresh: (val: boolean) => void;
  onRefreshChallenge: () => void;
  screenState: SimulatorScreenState;
  onStateChange: (state: SimulatorScreenState) => void;
  logs: SimulatorLogItem[];
  onClearLogs: () => void;
  onSimulateDriverScan: () => void;
}

export function SimulatorControlPanel({
  stations,
  selectedStationId,
  onSelectStation,
  connectors,
  selectedConnectorId,
  onSelectConnector,
  challengeToken,
  remainingSeconds,
  autoRefresh,
  onToggleAutoRefresh,
  onRefreshChallenge,
  screenState,
  onStateChange,
  logs,
  onClearLogs,
  onSimulateDriverScan,
}: SimulatorControlPanelProps) {
  const [copied, setCopied] = React.useState(false);

  const copyToken = () => {
    if (!challengeToken) return;
    navigator.clipboard.writeText(challengeToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex w-full flex-col gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 antialiased">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-800">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500 text-white text-xs">
              ⚙️
            </span>
            Bảng Điều Khiển Simulator (Testing Sandbox)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Giả lập các hành vi phần cứng, kích hoạt sự kiện và kiểm thử quy trình Dynamic QR Check-in.
          </p>
        </div>
      </div>

      {/* Grid Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Column 1: Station & Connector Picker */}
        <div className="flex flex-col gap-3.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            1. Chọn Điểm Sạc & Súng Sạc
          </h3>
          
          {/* Station Selector */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Trạm sạc:
            </label>
            <select
              value={selectedStationId}
              onChange={(e) => onSelectStation(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-emerald-500 focus:outline-none"
            >
              {stations.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.status})
                </option>
              ))}
            </select>
          </div>

          {/* Connector Selector */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Súng sạc (Connector):
            </label>
            <select
              value={selectedConnectorId}
              onChange={(e) => onSelectConnector(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-emerald-500 focus:outline-none"
            >
              {connectors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.connectorCode || c.id} · {c.name || c.connectorType} ({c.powerKw} kW - {c.runtimeStatus})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Column 2: Challenge Token Management */}
        <div className="flex flex-col gap-3.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            2. Dynamic QR Challenge Token
          </h3>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-800/50">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">Mã Token:</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {remainingSeconds}s còn lại
              </span>
            </div>
            
            <div className="mt-1.5 break-all rounded-lg border border-slate-200 bg-white p-2.5 font-mono text-[11px] text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
              {challengeToken || 'Đang tạo...'}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={copyToken}
                className="flex-1 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-white transition-all active:scale-95 text-center cursor-pointer"
              >
                {copied ? '✓ Đã sao chép' : '📋 Copy Token'}
              </button>
              <button
                type="button"
                onClick={onRefreshChallenge}
                className="rounded-xl bg-emerald-500 hover:bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-all active:scale-95 cursor-pointer"
              >
                🔄 Đổi mã
              </button>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-2.5 dark:border-slate-700 text-xs">
              <span className="text-slate-600 dark:text-slate-400">Tự động đổi sau 60s:</span>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => onToggleAutoRefresh(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="h-5 w-9 rounded-full bg-slate-300 peer-checked:bg-emerald-500 peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full dark:bg-slate-700" />
              </label>
            </div>
          </div>
        </div>

        {/* Column 3: Hardware State Overrides */}
        <div className="flex flex-col gap-3.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            3. Trạng Thái Trụ Sạc
          </h3>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onStateChange('AVAILABLE')}
              className={`rounded-xl border p-2.5 text-left text-xs font-bold transition-all cursor-pointer ${
                screenState === 'AVAILABLE'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              🟢 Sẵn sàng (QR)
            </button>

            <button
              type="button"
              onClick={() => onStateChange('CHECKED_IN')}
              className={`rounded-xl border p-2.5 text-left text-xs font-bold transition-all cursor-pointer ${
                screenState === 'CHECKED_IN'
                  ? 'border-cyan-500 bg-cyan-50 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-400'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              🔵 Đã Check-in
            </button>

            <button
              type="button"
              onClick={() => onStateChange('CHARGING')}
              className={`rounded-xl border p-2.5 text-left text-xs font-bold transition-all cursor-pointer ${
                screenState === 'CHARGING'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              ⚡ Đang sạc
            </button>

            <button
              type="button"
              onClick={() => onStateChange('COMPLETED')}
              className={`rounded-xl border p-2.5 text-left text-xs font-bold transition-all cursor-pointer ${
                screenState === 'COMPLETED'
                  ? 'border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              🏁 Hoàn tất
            </button>

            <button
              type="button"
              onClick={() => onStateChange('FAULTED')}
              className={`rounded-xl border p-2.5 text-left text-xs font-bold transition-all cursor-pointer ${
                screenState === 'FAULTED'
                  ? 'border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              🔴 Báo lỗi (Fault)
            </button>

            <button
              type="button"
              onClick={() => onStateChange('OFFLINE')}
              className={`rounded-xl border p-2.5 text-left text-xs font-bold transition-all cursor-pointer ${
                screenState === 'OFFLINE'
                  ? 'border-slate-500 bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-white'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              ⚪ Ngoại tuyến
            </button>
          </div>

          {/* Simulate Driver Check-in shortcut */}
          <button
            type="button"
            onClick={onSimulateDriverScan}
            className="mt-1 w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-500/20 hover:from-emerald-500 hover:to-teal-500 transition-all active:scale-95 text-center flex items-center justify-center gap-2 cursor-pointer"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14" />
              <path d="M12 5l7 7-7 7" />
            </svg>
            Giả lập Tài xế Quét Mã Check-in
          </button>
        </div>

      </div>

      {/* Activity Log Feed */}
      <div className="border-t border-slate-200 pt-4 dark:border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Nhật Ký Sự Kiện Simulator (Event Log)
          </span>
          <button
            type="button"
            onClick={onClearLogs}
            className="text-[11px] font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
          >
            Xóa nhật ký
          </button>
        </div>

        <div className="h-32 overflow-y-auto rounded-xl border border-slate-200 bg-slate-950 p-3 font-mono text-[11px] text-slate-300 space-y-1.5">
          {logs.length === 0 ? (
            <div className="text-slate-600 italic">Chưa có sự kiện nào được ghi nhận.</div>
          ) : (
            logs.map((log) => {
              let textCol = 'text-slate-300';
              if (log.type === 'success') textCol = 'text-emerald-400 font-semibold';
              if (log.type === 'warn') textCol = 'text-amber-400';
              if (log.type === 'error') textCol = 'text-rose-400';

              return (
                <div key={log.id} className="flex items-start gap-2">
                  <span className="text-slate-500 shrink-0">[{log.time}]</span>
                  <span className={textCol}>{log.message}</span>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
}
