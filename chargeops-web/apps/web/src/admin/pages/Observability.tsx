import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader, IconRefreshCw, IconClock } from '@chargeops/ui';

const configuredGrafanaUrl = import.meta.env.VITE_GRAFANA_URL?.trim() || '/grafana/';
const grafanaBaseUrl = configuredGrafanaUrl.endsWith('/')
  ? configuredGrafanaUrl
  : `${configuredGrafanaUrl}/`;

type TimeRange = '15m' | '1h' | '6h' | '24h' | '7d';

const TIME_PRESETS: { label: string; value: TimeRange }[] = [
  { label: '15m', value: '15m' },
  { label: '1h', value: '1h' },
  { label: '6h', value: '6h' },
  { label: '24h', value: '24h' },
  { label: '7d', value: '7d' },
];

/**
 * Keycloak-protected Grafana Mission Control Dashboard
 * Embedded with high-end ergonomics: Quick Time Range, Live Pulse, and Fullscreen Mode.
 */
export function Observability() {
  const { t } = useTranslation('admin');
  const [timeRange, setTimeRange] = useState<TimeRange>('1h');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRotating, setIsRotating] = useState(false);

  const handleRefresh = useCallback(() => {
    setIsRotating(true);
    setRefreshKey((prev) => prev + 1);
    setTimeout(() => setIsRotating(false), 600);
  }, []);

  const buildUrl = (range: TimeRange) => {
    return `${grafanaBaseUrl}d/chargeops-overview/chargeops-overview?orgId=1&kiosk&from=now-${range}&to=now&refresh=10s`;
  };

  const currentDashboardUrl = buildUrl(timeRange);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title={t('console.nav.observability.title')}
          subtitle={t('console.nav.observability.subtitle')}
        />

        {/* Live Status Badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11.5px] font-semibold text-emerald-600 dark:text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
            <span>Gateway & Telemetry Online</span>
          </div>
        </div>
      </div>

      {/* Main Mission Control Shell (Double-Bezel Architecture) */}
      <div
        className={`transition-all duration-300 ${
          isFullscreen
            ? 'fixed inset-0 z-50 flex flex-col bg-[#0b0c10] p-4'
            : 'rounded-2xl border border-line-2 bg-surface shadow-xs'
        }`}
      >
        {/* Mission Control Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-2 bg-surface-raised/40 px-4 py-2.5 backdrop-blur-xs">
          {/* Left: Quick Time Presets */}
          <div className="flex items-center gap-1.5">
            <span className="flex items-center gap-1 text-[11px] font-medium text-faint">
              <IconClock size={14} className="text-faint" />
              <span>Phạm vi:</span>
            </span>
            <div className="flex items-center rounded-lg border border-line-2 bg-surface p-0.5 shadow-2xs">
              {TIME_PRESETS.map((preset) => {
                const isActive = timeRange === preset.value;
                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setTimeRange(preset.value)}
                    className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-all ${
                      isActive
                        ? 'bg-brand text-white shadow-2xs'
                        : 'text-faint hover:text-foreground hover:bg-surface-raised'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Actions (Refresh, Fullscreen, Open external) */}
          <div className="flex items-center gap-2">
            {/* Refresh Button */}
            <button
              type="button"
              onClick={handleRefresh}
              title="Làm mới bảng điều khiển"
              className="inline-flex items-center gap-1.5 rounded-lg border border-line-2 bg-surface px-2.5 py-1.5 text-[11.5px] font-medium text-foreground hover:bg-surface-raised transition-all active:scale-95"
            >
              <IconRefreshCw
                size={13}
                className={`transition-transform duration-500 ${isRotating ? 'rotate-180 text-brand' : ''}`}
              />
              <span className="hidden sm:inline">Làm mới</span>
            </button>

            {/* Fullscreen Toggle Button */}
            <button
              type="button"
              onClick={() => setIsFullscreen((prev) => !prev)}
              className="inline-flex items-center gap-1 rounded-lg border border-line-2 bg-surface px-2.5 py-1.5 text-[11.5px] font-medium text-foreground hover:bg-surface-raised transition-all active:scale-95"
            >
              {isFullscreen ? (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                  </svg>
                  <span>Thu nhỏ</span>
                </>
              ) : (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                  </svg>
                  <span>Toàn màn hình</span>
                </>
              )}
            </button>

            {/* Open in new tab link */}
            <a
              className="inline-flex items-center gap-1 rounded-lg border border-line-2 bg-surface px-2.5 py-1.5 text-[11.5px] font-medium text-brand hover:underline hover:bg-surface-raised transition-all"
              href={currentDashboardUrl}
              target="_blank"
              rel="noreferrer"
            >
              <span>{t('observability.openInNewTab')}</span>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          </div>
        </div>

        {/* Dashboard Iframe with Smooth OLED Dark Framing */}
        <div className={`relative w-full overflow-hidden bg-[#111217] ${isFullscreen ? 'flex-1' : 'rounded-b-2xl'}`}>
          <iframe
            key={refreshKey}
            className={`w-full border-0 transition-opacity duration-300 ${
              isFullscreen ? 'h-full' : 'h-[calc(100vh-215px)] min-h-[680px]'
            }`}
            src={currentDashboardUrl}
            title={t('observability.iframeTitle')}
            allow="fullscreen"
          />
        </div>
      </div>
    </div>
  );
}
