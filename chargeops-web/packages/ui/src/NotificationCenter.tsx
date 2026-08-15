import { useState, useMemo } from 'react';
import {
  NotificationItem,
  CategoryFilter,
} from './NotificationBell';
import {
  IconBell,
  IconBolt,
  IconAlertTriangle,
  IconLifebuoy,
  IconShield,
  IconSearch,
  IconCheck,
  IconX,
  IconArrowRight,
  IconClock,
  IconWrench,
  IconCheckCircle,
  IconRefreshCw,
} from './icons';

interface NotificationCenterProps {
  items: NotificationItem[];
  onMarkRead?: (id: string) => void;
  onMarkAllRead?: () => void;
  onDismiss?: (id: string) => void;
  onClearRead?: () => void;
  onSimulateNotification?: (type: 'overheat' | 'session' | 'ticket' | 'offline') => void;
}

export function NotificationCenter({
  items,
  onMarkRead,
  onMarkAllRead,
  onDismiss,
  onClearRead,
  onSimulateNotification,
}: NotificationCenterProps) {
  const [activeTab, setActiveTab] = useState<CategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<'all' | 'bad' | 'warn' | 'good' | 'neutral'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Statistics counters
  const stats = useMemo(() => {
    const total = items.length;
    const unread = items.filter((i) => !i.read).length;
    const critical = items.filter((i) => i.tone === 'bad').length;
    const warning = items.filter((i) => i.tone === 'warn').length;
    const sessions = items.filter((i) => i.category === 'session').length;
    const tickets = items.filter((i) => i.category === 'ticket').length;
    return { total, unread, critical, warning, sessions, tickets };
  }, [items]);

  // Filtering logic
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Category filter
      if (activeTab !== 'all') {
        const cat = item.category || (item.tone === 'bad' || item.tone === 'warn' ? 'alert' : 'system');
        if (cat !== activeTab) return false;
      }
      // Severity filter
      if (selectedSeverity !== 'all') {
        const tone = item.tone || 'neutral';
        if (tone !== selectedSeverity) return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchSub = item.subtitle?.toLowerCase().includes(q) ?? false;
        const matchStation = item.stationName?.toLowerCase().includes(q) ?? false;
        const matchCharger = item.chargerId?.toLowerCase().includes(q) ?? false;
        return matchTitle || matchSub || matchStation || matchCharger;
      }
      return true;
    });
  }, [items, activeTab, selectedSeverity, searchQuery]);

  return (
    <div className="space-y-6">
      {/* ===== HERO ANALYTICS BAR (Double-Bezel Architecture) ===== */}
      <div className="rounded-[24px] border border-line-2 bg-surface p-1.5 shadow-sm">
        <div className="rounded-[20px] bg-surface-2 p-5 border border-line/40">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <IconBell size={18} strokeWidth={2} />
                </span>
                <h1 className="text-xl font-extrabold tracking-tight text-ink">Trung tâm Thông báo ChargeOps</h1>
              </div>
              <p className="mt-1 text-[13px] font-medium text-muted">
                Hệ thống giám sát sự kiện thời gian thực, quản lý cảnh báo trạm sạc & phiên sạc tự động.
              </p>
            </div>

            {/* Simulation Controls for testing interactive modern notifications */}
            {onSimulateNotification && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold text-faint uppercase tracking-wider">Thử nghiệm phát sự kiện:</span>
                <button
                  type="button"
                  onClick={() => onSimulateNotification('overheat')}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-bad-soft border border-bad/20 px-2.5 py-1 text-[11.5px] font-bold text-bad-deep hover:brightness-95 transition-all"
                >
                  <IconAlertTriangle size={13} />
                  <span>🔥 Quá nhiệt</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSimulateNotification('session')}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-owner-soft border border-owner/20 px-2.5 py-1 text-[11.5px] font-bold text-owner-deep hover:brightness-95 transition-all"
                >
                  <IconBolt size={13} />
                  <span>⚡ Sạc xong</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSimulateNotification('ticket')}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-brand-soft border border-brand/20 px-2.5 py-1 text-[11.5px] font-bold text-brand hover:brightness-95 transition-all"
                >
                  <IconLifebuoy size={13} />
                  <span>🎟️ Vé hỗ trợ</span>
                </button>
              </div>
            )}
          </div>

          {/* Stats Cards Row */}
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="flex items-center gap-3.5 rounded-xl border border-line-2 bg-surface p-3.5 shadow-2xs">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-alert/10 text-alert">
                <IconBell size={18} />
              </div>
              <div>
                <span className="text-[11px] font-bold text-faint uppercase tracking-wider">Chưa đọc</span>
                <div className="text-lg font-black text-ink">{stats.unread} <span className="text-xs font-normal text-faint">/ {stats.total}</span></div>
              </div>
            </div>

            <div className="flex items-center gap-3.5 rounded-xl border border-bad/20 bg-bad-soft/30 p-3.5 shadow-2xs">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-bad/10 text-bad-deep">
                <IconAlertTriangle size={18} />
              </div>
              <div>
                <span className="text-[11px] font-bold text-bad-deep uppercase tracking-wider">Cảnh báo nghiêm trọng</span>
                <div className="text-lg font-black text-bad-deep">{stats.critical}</div>
              </div>
            </div>

            <div className="flex items-center gap-3.5 rounded-xl border border-owner/20 bg-owner-soft/30 p-3.5 shadow-2xs">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-owner/10 text-owner-deep">
                <IconBolt size={18} />
              </div>
              <div>
                <span className="text-[11px] font-bold text-owner-deep uppercase tracking-wider">Phiên sạc trực tuyến</span>
                <div className="text-lg font-black text-owner-deep">{stats.sessions}</div>
              </div>
            </div>

            <div className="flex items-center gap-3.5 rounded-xl border border-brand/20 bg-brand-soft/30 p-3.5 shadow-2xs">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                <IconLifebuoy size={18} />
              </div>
              <div>
                <span className="text-[11px] font-bold text-brand uppercase tracking-wider">Yêu cầu cần xử lý</span>
                <div className="text-lg font-black text-brand">{stats.tickets}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== CONTROLS TOOLBAR & TAB FILTERS ===== */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto rounded-xl border border-line-2 bg-surface p-1.5 shadow-2xs">
          {[
            { id: 'all', label: 'Tất cả thông báo', count: stats.total },
            { id: 'alert', label: 'Cảnh báo sự cố', count: stats.critical + stats.warning },
            { id: 'session', label: 'Phiên sạc EV', count: stats.sessions },
            { id: 'ticket', label: 'Vé & Hỗ trợ', count: stats.tickets },
          ].map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as CategoryFilter)}
                className={[
                  'flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-1.5 text-[12.5px] font-extrabold transition-all',
                  active
                    ? 'bg-ink text-surface shadow-xs'
                    : 'text-body hover:bg-chip hover:text-ink',
                ].join(' ')}
              >
                <span>{tab.label}</span>
                <span
                  className={[
                    'rounded-full px-1.5 py-0.5 font-mono text-[10px] font-extrabold',
                    active ? 'bg-surface/20 text-surface' : 'bg-line-3 text-ghost',
                  ].join(' ')}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Toolbar: Search + Actions */}
        <div className="flex items-center gap-2.5">
          {/* Search box */}
          <div className="relative min-w-[220px]">
            <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
            <input
              type="text"
              placeholder="Tìm kiếm nội dung thông báo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-line bg-surface py-1.5 pl-9 pr-7 text-[12px] font-medium text-ink placeholder:text-ghost focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15 transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-faint hover:text-ink"
              >
                <IconX size={13} />
              </button>
            )}
          </div>

          {/* Action dropdown or buttons */}
          {onMarkAllRead && (
            <button
              type="button"
              onClick={onMarkAllRead}
              className="inline-flex items-center gap-1.5 rounded-xl border border-line-2 bg-surface px-3 py-1.5 text-[12px] font-bold text-brand hover:bg-brand-soft/40 transition-colors shadow-2xs"
            >
              <IconCheck size={14} strokeWidth={2.5} />
              <span>Đánh dấu tất cả đã đọc</span>
            </button>
          )}

          {onClearRead && (
            <button
              type="button"
              onClick={onClearRead}
              className="inline-flex items-center gap-1.5 rounded-xl border border-line-2 bg-surface px-3 py-1.5 text-[12px] font-bold text-faint hover:text-bad-deep hover:bg-bad-soft/40 transition-colors shadow-2xs"
            >
              <IconX size={14} strokeWidth={2} />
              <span>Xóa đã đọc</span>
            </button>
          )}
        </div>
      </div>

      {/* ===== NOTIFICATIONS LIST (Modern Cards Double-Bezel) ===== */}
      {filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-line-2 bg-surface p-12 text-center shadow-xs">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-chip text-faint">
            <IconBell size={32} strokeWidth={1.4} />
          </div>
          <h3 className="mt-4 text-base font-bold text-ink">Không tìm thấy thông báo nào</h3>
          <p className="mt-1 text-[13px] text-muted">
            Không có kết quả tương ứng với bộ lọc danh mục hoặc từ khóa tìm kiếm của bạn.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const tone = item.tone ?? 'neutral';
            const isExpanded = expandedId === item.id;

            return (
              <div
                key={item.id}
                className={[
                  'group relative overflow-hidden rounded-2xl border transition-all duration-200 shadow-2xs',
                  item.read
                    ? 'border-line-2/70 bg-surface/70 hover:bg-surface hover:border-line-3'
                    : tone === 'bad'
                      ? 'border-bad/30 bg-bad-soft/20 hover:bg-bad-soft/40'
                      : tone === 'warn'
                        ? 'border-warn/30 bg-warn-soft/20 hover:bg-warn-soft/40'
                        : tone === 'good'
                          ? 'border-owner/30 bg-owner-soft/20 hover:bg-owner-soft/40'
                          : 'border-line-2 bg-surface hover:border-line-3',
                ].join(' ')}
              >
                {/* Left accent highlight bar */}
                {!item.read && (
                  <div
                    className={[
                      'absolute left-0 top-0 bottom-0 w-1.5',
                      tone === 'bad'
                        ? 'bg-bad animate-pulse'
                        : tone === 'warn'
                          ? 'bg-warn'
                          : tone === 'good'
                            ? 'bg-owner'
                            : 'bg-brand',
                    ].join(' ')}
                  />
                )}

                <div className="p-4 sm:p-5 pl-5 sm:pl-6">
                  <div className="flex items-start justify-between gap-4">
                    {/* Main content block */}
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      {/* Icon Container */}
                      <div
                        className={[
                          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold shadow-2xs',
                          tone === 'bad'
                            ? 'bg-bad/15 text-bad-deep'
                            : tone === 'warn'
                              ? 'bg-warn/15 text-warn-deep'
                              : tone === 'good'
                                ? 'bg-owner/15 text-owner-deep'
                                : 'bg-brand/10 text-brand',
                        ].join(' ')}
                      >
                        {item.category === 'session' ? (
                          <IconBolt size={20} />
                        ) : item.category === 'ticket' ? (
                          <IconLifebuoy size={20} />
                        ) : item.category === 'alert' || tone === 'bad' ? (
                          <IconAlertTriangle size={20} />
                        ) : (
                          <IconShield size={20} />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Header: Title + Badges + Time */}
                        <div className="flex flex-wrap items-center gap-2">
                          <h4
                            className={[
                              'text-[14px] font-extrabold tracking-tight',
                              item.read ? 'text-body' : 'text-ink',
                            ].join(' ')}
                          >
                            {item.title}
                          </h4>

                          {item.badge && (
                            <span className="rounded-md bg-chip px-2 py-0.5 font-mono text-[10px] font-bold text-muted border border-line-2">
                              {item.badge}
                            </span>
                          )}

                          {!item.read && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-alert/10 px-2 py-0.5 font-mono text-[9.5px] font-extrabold text-alert border border-alert/20">
                              <span className="h-1.5 w-1.5 rounded-full bg-alert animate-ping" />
                              MỚI
                            </span>
                          )}
                        </div>

                        {item.subtitle && (
                          <p className="mt-1 text-[12.5px] font-medium text-muted leading-relaxed">
                            {item.subtitle}
                          </p>
                        )}

                        {/* Telemetry Chips & Details */}
                        {(item.stationName || item.chargerId || item.metrics) && (
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            {item.stationName && (
                              <span className="inline-flex items-center gap-1 rounded-lg bg-surface border border-line-2 px-2.5 py-1 text-[11px] font-bold text-body shadow-2xs">
                                📍 {item.stationName}
                              </span>
                            )}
                            {item.chargerId && (
                              <span className="inline-flex items-center gap-1 rounded-lg bg-surface border border-line-2 px-2.5 py-1 font-mono text-[11px] font-bold text-muted shadow-2xs">
                                ⚡ {item.chargerId}
                              </span>
                            )}
                            {item.metrics?.powerKw && (
                              <span className="rounded-lg bg-owner-soft border border-owner/20 text-owner-deep px-2.5 py-1 font-mono text-[11px] font-extrabold shadow-2xs">
                                Công suất: {item.metrics.powerKw} kW
                              </span>
                            )}
                            {item.metrics?.temperature && (
                              <span className="rounded-lg bg-bad-soft border border-bad/20 text-bad-deep px-2.5 py-1 font-mono text-[11px] font-extrabold shadow-2xs">
                                Nhiệt độ: {item.metrics.temperature}
                              </span>
                            )}
                            {item.metrics?.amount && (
                              <span className="rounded-lg bg-owner-soft border border-owner/20 text-owner-deep px-2.5 py-1 font-mono text-[11px] font-black shadow-2xs">
                                Doanh thu: {item.metrics.amount}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Live Charging Progress Bar */}
                        {item.metrics?.progressPct !== undefined && (
                          <div className="mt-3.5 max-w-md rounded-xl border border-owner/20 bg-owner-soft/40 p-3">
                            <div className="flex items-center justify-between text-[11px] font-bold text-owner-deep">
                              <span>Tiến độ sạc xe điện</span>
                              <span className="font-mono">{item.metrics.progressPct}%</span>
                            </div>
                            <div className="mt-1.5 h-2 w-full rounded-full bg-owner/20 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-owner transition-all duration-700 shadow-xs"
                                style={{ width: `${item.metrics.progressPct}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Meta & Controls */}
                    <div className="flex flex-col items-end gap-3 shrink-0">
                      {item.time && (
                        <span className="flex items-center gap-1 font-mono text-[11px] font-medium text-ghost">
                          <IconClock size={12} />
                          {item.time}
                        </span>
                      )}

                      <div className="flex items-center gap-1.5">
                        {onMarkRead && !item.read && (
                          <button
                            type="button"
                            onClick={() => onMarkRead(item.id)}
                            title="Đánh dấu đã đọc"
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-line-2 bg-surface text-faint hover:text-owner-deep hover:bg-owner-soft transition-colors"
                          >
                            <IconCheck size={14} strokeWidth={2.5} />
                          </button>
                        )}

                        {onDismiss && (
                          <button
                            type="button"
                            onClick={() => onDismiss(item.id)}
                            title="Xóa thông báo"
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-line-2 bg-surface text-faint hover:text-bad-deep hover:bg-bad-soft transition-colors"
                          >
                            <IconX size={14} strokeWidth={2} />
                          </button>
                        )}
                      </div>

                      {/* Quick Action Button */}
                      {item.actionLabel && (
                        <button
                          type="button"
                          onClick={() => {
                            if (onMarkRead && !item.read) onMarkRead(item.id);
                            if (item.onAction) item.onAction();
                            else item.onSelect();
                          }}
                          className="mt-1 inline-flex items-center gap-2 rounded-xl bg-ink text-surface hover:bg-ink/90 px-3.5 py-1.5 text-[12px] font-extrabold transition-all shadow-xs group/btn active:scale-95"
                        >
                          <span>{item.actionLabel}</span>
                          <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-surface/20 text-surface group-hover/btn:translate-x-0.5 transition-transform">
                            <IconArrowRight size={11} strokeWidth={2.5} />
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
