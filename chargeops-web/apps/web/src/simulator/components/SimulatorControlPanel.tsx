import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Connector, Station } from '@chargeops/api';
import type { SimulatorScreenState } from './PhysicalKioskScreen';
import { IconBolt, IconCheck, IconChevronDown, IconSearch, IconX } from '@chargeops/ui';

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

function normalizeSearch(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

/**
 * Dropdown chọn Trạm sạc cao cấp với tìm kiếm tiếng Việt và bộ lọc.
 */
function StationPickerDropdown({
  stations,
  selectedStationId,
  onSelectStation,
}: {
  stations: Station[];
  selectedStationId: string;
  onSelectStation: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [filterActiveOnly, setFilterActiveOnly] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = stations.find((s) => s.id === selectedStationId) || stations[0];

  useEffect(() => {
    if (!open) {
      setQuery('');
      setFilterActiveOnly(false);
      return;
    }
    setTimeout(() => inputRef.current?.focus(), 50);
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDocClick);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const filtered = useMemo(() => {
    let list = stations;
    if (filterActiveOnly) {
      list = list.filter((s) => s.status?.toUpperCase() === 'ACTIVE');
    }
    if (!query.trim()) return list;
    const q = normalizeSearch(query.trim());
    return list.filter((s) => {
      const nameMatch = normalizeSearch(s.name || '').includes(q);
      const codeMatch = normalizeSearch(s.stationCode || '').includes(q);
      const addrMatch = normalizeSearch(s.address || '').includes(q);
      const idMatch = s.id.toLowerCase().includes(q);
      return nameMatch || codeMatch || addrMatch || idMatch;
    });
  }, [stations, query, filterActiveOnly]);

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={stations.length === 0}
        className="flex w-full cursor-pointer items-center justify-between gap-2.5 rounded-xl border border-slate-300 bg-slate-50/80 p-2.5 text-left transition-all hover:border-emerald-500/50 hover:bg-white focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800/80 dark:hover:border-emerald-500/50 dark:hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
            <IconBolt size={14} strokeWidth={2.2} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-bold text-slate-900 dark:text-white">
              {selected?.name || (stations.length === 0 ? 'Đang tải danh sách trạm...' : 'Chọn trạm sạc...')}
            </div>
            <div className="truncate text-[10.5px] text-slate-500 dark:text-slate-400">
              {selected?.address || (selected?.stationCode ? `Mã: ${selected.stationCode}` : 'Trạm sạc ChargeOps')}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {selected && (
            <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[9.5px] font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              {selected.status?.toUpperCase() || 'ACTIVE'}
            </span>
          )}
          <IconChevronDown
            size={13}
            strokeWidth={2.4}
            className={`text-slate-400 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute left-0 top-full z-50 mt-1.5 max-h-96 w-full min-w-[320px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900"
        >
          {/* Search box & Quick Filter */}
          <div className="border-b border-slate-100 p-2.5 space-y-2 dark:border-slate-800">
            <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800">
              <IconSearch size={13} strokeWidth={2.2} className="text-slate-400 shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm theo tên, địa chỉ, mã trạm, UUID..."
                className="w-full border-none bg-transparent text-xs text-slate-800 outline-none placeholder:text-slate-400 dark:text-white"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <IconX size={11} strokeWidth={2.4} />
                </button>
              )}
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setFilterActiveOnly(false)}
                  className={`rounded-md px-2 py-0.5 text-[10.5px] font-semibold transition ${
                    !filterActiveOnly
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  Tất cả ({stations.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterActiveOnly(true)}
                  className={`rounded-md px-2 py-0.5 text-[10.5px] font-semibold transition ${
                    filterActiveOnly
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  Đang hoạt động
                </button>
              </div>
              <span className="text-[10px] text-slate-400">
                Tìm thấy: {filtered.length} trạm
              </span>
            </div>
          </div>

          {/* Options list */}
          <div className="max-h-64 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                Không tìm thấy trạm sạc nào phù hợp
              </div>
            ) : (
              filtered.map((s) => {
                const isSelected = s.id === selectedStationId;
                return (
                  <button
                    key={s.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onSelectStation(s.id);
                      setOpen(false);
                    }}
                    className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left transition-all ${
                      isSelected
                        ? 'bg-emerald-50 text-emerald-900 font-semibold dark:bg-emerald-950/50 dark:text-emerald-200'
                        : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-xs font-semibold">{s.name}</span>
                        <span className="rounded bg-slate-100 px-1 py-0.2 text-[9px] font-mono text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                          {s.stationCode || 'ST'}
                        </span>
                      </div>
                      <div className="truncate text-[10.5px] text-slate-500 dark:text-slate-400">
                        {s.address || 'Hệ thống trạm sạc ChargeOps'}
                      </div>
                    </div>
                    {isSelected && (
                      <IconCheck size={14} strokeWidth={2.4} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Dropdown chọn Súng sạc (Connector) có tìm kiếm và bộ lọc theo chuẩn sạc & công suất.
 */
function ConnectorPickerDropdown({
  connectors,
  selectedConnectorId,
  onSelectConnector,
}: {
  connectors: Connector[];
  selectedConnectorId: string;
  onSelectConnector: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'AVAILABLE' | 'CCS2' | 'TYPE2'>('ALL');
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = connectors.find((c) => c.id === selectedConnectorId) || connectors[0];

  useEffect(() => {
    if (!open) {
      setQuery('');
      setTypeFilter('ALL');
      return;
    }
    setTimeout(() => inputRef.current?.focus(), 50);
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDocClick);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const filtered = useMemo(() => {
    let list = connectors;
    if (typeFilter === 'AVAILABLE') {
      list = list.filter((c) => c.runtimeStatus === 'AVAILABLE');
    } else if (typeFilter === 'CCS2') {
      list = list.filter((c) => c.connectorType?.toUpperCase() === 'CCS2');
    } else if (typeFilter === 'TYPE2') {
      list = list.filter((c) => c.connectorType?.toUpperCase().includes('TYPE2'));
    }

    if (!query.trim()) return list;
    const q = normalizeSearch(query.trim());
    return list.filter((c) => {
      const nameMatch = normalizeSearch(c.name || '').includes(q);
      const codeMatch = normalizeSearch(c.connectorCode || '').includes(q);
      const typeMatch = normalizeSearch(c.connectorType || '').includes(q);
      const kwMatch = String(c.powerKw || '').includes(q);
      const statusMatch = normalizeSearch(c.runtimeStatus || '').includes(q);
      const idMatch = c.id.toLowerCase().includes(q);
      return nameMatch || codeMatch || typeMatch || kwMatch || statusMatch || idMatch;
    });
  }, [connectors, query, typeFilter]);

  const isAvailable = selected?.runtimeStatus === 'AVAILABLE';

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={connectors.length === 0}
        className="flex w-full cursor-pointer items-center justify-between gap-2.5 rounded-xl border border-slate-300 bg-slate-50/80 p-2.5 text-left transition-all hover:border-emerald-500/50 hover:bg-white focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800/80 dark:hover:border-emerald-500/50 dark:hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400 text-xs font-bold">
            ⚡
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 truncate text-xs font-bold text-slate-900 dark:text-white">
              <span>{selected?.name || (connectors.length === 0 ? 'Trạm chưa có cổng sạc' : 'Chọn súng sạc...')}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10.5px] text-slate-500 dark:text-slate-400">
              {selected && (
                <>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{selected.powerKw} kW</span>
                  <span>·</span>
                  <span>{selected.connectorType}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {selected && (
            <span
              className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9.5px] font-semibold ${
                isAvailable
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${isAvailable ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              {selected.runtimeStatus}
            </span>
          )}
          <IconChevronDown
            size={13}
            strokeWidth={2.4}
            className={`text-slate-400 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute left-0 top-full z-50 mt-1.5 max-h-96 w-full min-w-[320px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900"
        >
          {/* Search box & Quick Filter */}
          <div className="border-b border-slate-100 p-2.5 space-y-2 dark:border-slate-800">
            <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800">
              <IconSearch size={13} strokeWidth={2.2} className="text-slate-400 shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm theo mã súng, chuẩn (CCS2), công suất, UUID..."
                className="w-full border-none bg-transparent text-xs text-slate-800 outline-none placeholder:text-slate-400 dark:text-white"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <IconX size={11} strokeWidth={2.4} />
                </button>
              )}
            </div>

            {/* Quick Filter Chips */}
            <div className="flex flex-wrap items-center justify-between gap-1 text-[11px]">
              <div className="flex flex-wrap items-center gap-1">
                <button
                  type="button"
                  onClick={() => setTypeFilter('ALL')}
                  className={`rounded-md px-2 py-0.5 text-[10px] font-semibold transition ${
                    typeFilter === 'ALL'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  Tất cả ({connectors.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTypeFilter('AVAILABLE')}
                  className={`rounded-md px-2 py-0.5 text-[10px] font-semibold transition ${
                    typeFilter === 'AVAILABLE'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  ⚡ Sẵn sàng
                </button>
                <button
                  type="button"
                  onClick={() => setTypeFilter('CCS2')}
                  className={`rounded-md px-2 py-0.5 text-[10px] font-semibold transition ${
                    typeFilter === 'CCS2'
                      ? 'bg-sky-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  CCS2
                </button>
                <button
                  type="button"
                  onClick={() => setTypeFilter('TYPE2')}
                  className={`rounded-md px-2 py-0.5 text-[10px] font-semibold transition ${
                    typeFilter === 'TYPE2'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  Type 2
                </button>
              </div>
              <span className="text-[10px] text-slate-400">
                {filtered.length} súng
              </span>
            </div>
          </div>

          {/* Connectors list */}
          <div className="max-h-64 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                Không tìm thấy súng sạc nào phù hợp
              </div>
            ) : (
              filtered.map((c) => {
                const isSelected = c.id === selectedConnectorId;
                const cAvailable = c.runtimeStatus === 'AVAILABLE';
                return (
                  <button
                    key={c.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onSelectConnector(c.id);
                      setOpen(false);
                    }}
                    className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left transition-all ${
                      isSelected
                        ? 'bg-emerald-50 text-emerald-900 font-semibold dark:bg-emerald-950/50 dark:text-emerald-200'
                        : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-xs font-semibold">
                          {c.name || `Cổng ${c.connectorCode}`}
                        </span>
                        <span className="rounded bg-sky-100 px-1 py-0.2 text-[9px] font-bold text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                          {c.connectorType}
                        </span>
                        <span className="rounded bg-slate-100 px-1 py-0.2 text-[9px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {c.powerKw} kW
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                        <span className="inline-flex items-center gap-1">
                          <span className={`h-1.5 w-1.5 rounded-full ${cAvailable ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          {c.runtimeStatus}
                        </span>
                        <span>·</span>
                        <span className="font-mono text-[9.5px] opacity-70">
                          ID: {c.id.length > 14 ? `${c.id.slice(0, 8)}...` : c.id}
                        </span>
                      </div>
                    </div>
                    {isSelected && (
                      <IconCheck size={14} strokeWidth={2.4} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
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
  const [copied, setCopied] = useState(false);

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
            <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Trạm sạc:
            </label>
            <StationPickerDropdown
              stations={stations}
              selectedStationId={selectedStationId}
              onSelectStation={onSelectStation}
            />
          </div>

          {/* Connector Selector */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Súng sạc (Connector):
            </label>
            <ConnectorPickerDropdown
              connectors={connectors}
              selectedConnectorId={selectedConnectorId}
              onSelectConnector={onSelectConnector}
            />
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
