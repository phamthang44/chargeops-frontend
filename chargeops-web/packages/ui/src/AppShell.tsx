import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { AvatarDropdown } from './AvatarDropdown';
import {
  IconBolt,
  IconCheck,
  IconChevronDown,
  IconMenu,
} from './icons';

export interface ShellNavItem {
  key: string;
  label: string;
  icon: ReactNode;
  /** Not built yet — rendered with a SOON badge, not clickable. */
  soon?: boolean;
}

export interface RolePill {
  label: string;
  bg: string;
  fg: string;
}

export interface StationOption {
  id: string;
  name: string;
  stationCode?: string;
  city?: string;
  status?: string;
}

export interface AppShellProps {
  nav: ShellNavItem[];
  activeKey: string;
  onNavigate: (key: string) => void;
  /** Active nav item colouring: indigo for admin, emerald for owner. */
  accent: 'brand' | 'owner';
  rolePill: RolePill;
  /** Current station chip in the top bar (owner console). */
  station?: string;
  stations?: StationOption[];
  selectedStationId?: string;
  onSelectStation?: (stationId: string) => void;
  /** Full name — the header Avatar derives its initials fallback from this. */
  userName: string;
  /** User's email address displayed in profile menu. */
  userEmail?: string;
  /** The whole search box (HeaderSearch) — console-specific, since what's searchable differs by role. */
  search: ReactNode;
  /** Optional platform/perspective switcher element in the top bar. */
  platformSwitcher?: ReactNode;
  /** The whole notification bell (NotificationBell) — console-specific data source. */
  notifications: ReactNode;
  /** Clicking the logo (e.g. back to the portal). */
  onBrand?: () => void;
  /** Settings menu item — navigates to the console's settings screen. */
  onSettings: () => void;
  onLogout: () => void;
  children: ReactNode;
}

const ACCENT = {
  brand: 'bg-brand-soft text-brand',
  owner: 'bg-owner-soft text-owner-deep',
};

function StationSelector({
  stationName,
  stations,
  selectedStationId,
  onSelectStation,
}: {
  stationName?: string;
  stations: StationOption[];
  selectedStationId?: string;
  onSelectStation: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!stations.length && !stationName) return null;

  return (
    <div ref={ref} className="relative hidden sm:block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex cursor-pointer items-center gap-2 rounded-ctl border border-line bg-surface px-[11px] py-1.5 text-[13px] font-medium text-ink transition hover:border-line-hover hover:bg-canvas focus:ring-2 focus:ring-owner/15"
      >
        <span className="h-[7px] w-[7px] shrink-0 rounded-[2px] bg-good" />
        <span className="max-w-[170px] truncate">{stationName || 'Chọn trạm'}</span>
        {stations.length > 1 && (
          <IconChevronDown
            size={13}
            strokeWidth={2.2}
            className={`shrink-0 text-faint transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
          />
        )}
      </button>

      {open && stations.length > 0 && (
        <div
          role="listbox"
          className="absolute left-0 top-full z-50 mt-1.5 min-w-[260px] max-w-[340px] overflow-y-auto rounded-[11px] border border-line-2 bg-surface py-1.5 shadow-[0_10px_30px_rgba(16,17,26,.12)]"
        >
          <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.05em] text-faint">
            Trạm sạc của bạn
          </div>
          {stations.map((s) => {
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
                className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[12.5px] transition ${
                  isSelected ? 'bg-owner-soft text-owner-deep font-semibold' : 'text-body hover:bg-chip'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate">{s.name}</div>
                  <div className="truncate font-mono text-[10.5px] text-faint">
                    {s.stationCode || s.id} {s.city ? `· ${s.city}` : ''}
                  </div>
                </div>
                {isSelected && <IconCheck size={14} strokeWidth={2.4} className="shrink-0 text-owner" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function AppShell({
  nav,
  activeKey,
  onNavigate,
  accent,
  rolePill,
  station,
  stations,
  selectedStationId,
  onSelectStation,
  userName,
  userEmail,
  search,
  platformSwitcher,
  notifications,
  onBrand,
  onSettings,
  onLogout,
  children,
}: AppShellProps) {
  const { t } = useTranslation('ui');
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const navList = (mobile: boolean) => (
    <>
      {nav.map((it) => {
        const active = it.key === activeKey;
        return (
          <div
            key={it.key}
            title={it.label}
            onClick={() => {
              if (it.soon) return;
              onNavigate(it.key);
              setDrawerOpen(false);
            }}
            className={[
              'mb-0.5 flex items-center gap-[11px] rounded-ctl px-2.5',
              mobile ? 'py-[11px] text-[14px]' : 'py-[9px] text-[13.5px]',
              it.soon ? 'cursor-default' : 'cursor-pointer',
              active
                ? `${ACCENT[accent]} font-semibold`
                : 'font-medium text-body hover:bg-chip',
            ].join(' ')}
          >
            <span className="flex w-[18px] shrink-0 items-center justify-center">{it.icon}</span>
            {(mobile || !collapsed) && (
              <span className="flex-1 overflow-hidden whitespace-nowrap">{it.label}</span>
            )}
            {(mobile || !collapsed) && it.soon && (
              <span className="rounded-[5px] bg-line-3 px-[5px] py-0.5 font-mono text-[8.5px] font-semibold text-ghost">
                SOON
              </span>
            )}
          </div>
        );
      })}
    </>
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden" style={{ animation: 'fadeIn .25s ease' }}>
      {/* ===== TOP BAR ===== */}
      <div className="z-20 flex h-14 shrink-0 items-center justify-between border-b border-line-2 bg-surface px-5 md:px-7">
        <div className="flex min-w-0 items-center gap-[13px]">
          <button
            onClick={() => setDrawerOpen((v) => !v)}
            className="flex h-[34px] w-[34px] cursor-pointer items-center justify-center rounded-ctl border border-line md:hidden"
            aria-label={t('menu')}
          >
            <IconMenu size={18} strokeWidth={2} className="text-body" />
          </button>
          <div
            onClick={onBrand}
            title={t('brand.switchPortal')}
            className={`flex items-center gap-2 ${onBrand ? 'cursor-pointer' : ''}`}
          >
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-[7px] bg-brand">
              <IconBolt size={14} strokeWidth={2.2} className="text-white" />
            </span>
            <span className="text-[15px] font-bold tracking-[-0.01em]">ChargeOps</span>
          </div>
          {(station || (stations && stations.length > 0)) && (
            <>
              <div className="hidden h-[22px] w-px bg-line-2 sm:block" />
              {stations && onSelectStation ? (
                <StationSelector
                  stationName={station}
                  stations={stations}
                  selectedStationId={selectedStationId}
                  onSelectStation={onSelectStation}
                />
              ) : (
                <div className="hidden cursor-pointer items-center gap-2 rounded-ctl border border-line px-[11px] py-1.5 text-[13px] font-medium hover:bg-canvas sm:flex">
                  <span className="h-[7px] w-[7px] rounded-[2px] bg-good" />
                  {station}
                </div>
              )}
            </>
          )}
        </div>
        <div className="flex items-center gap-2.5">
          {search}
          {platformSwitcher}
          <span
            className="rounded-full px-[11px] py-[5px] text-[10.5px] font-bold tracking-[0.04em]"
            style={{ background: rolePill.bg, color: rolePill.fg }}
          >
            {rolePill.label}
          </span>
          {notifications}
          <AvatarDropdown
            userName={userName}
            userEmail={userEmail}
            rolePill={rolePill}
            accent={accent}
            onSettings={onSettings}
            onLogout={onLogout}
          />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ===== DESKTOP SIDEBAR ===== */}
        <div
          className="hidden shrink-0 flex-col border-r border-line-2 bg-surface-2 px-2.5 py-3 transition-[width] duration-150 md:flex"
          style={{ width: collapsed ? 62 : 228 }}
        >
          {navList(false)}
          <div
            onClick={() => setCollapsed((v) => !v)}
            className="mt-auto flex cursor-pointer items-center gap-2.5 rounded-ctl px-2.5 py-[9px] text-[12.5px] font-medium text-faint hover:bg-chip"
          >
            <span className="w-[18px] shrink-0 text-center font-mono text-[13px] font-semibold">
              {collapsed ? '»' : '«'}
            </span>
            {!collapsed && <span>{t('sidebar.collapse')}</span>}
          </div>
        </div>

        {/* ===== MOBILE DRAWER ===== */}
        {drawerOpen && (
          <>
            <div
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-x-0 bottom-0 top-14 z-30 bg-night/35 md:hidden"
              style={{ animation: 'fadeIn .15s ease' }}
            />
            <div
              className="fixed bottom-0 left-0 top-14 z-31 flex w-[264px] flex-col border-r border-line-2 bg-surface px-2.5 py-3 md:hidden"
              style={{ animation: 'slideIn .2s ease' }}
            >
              {navList(true)}
            </div>
          </>
        )}

        {/* ===== MAIN ===== */}
        <div className="flex-1 overflow-y-auto bg-canvas">
          <div className="mx-auto max-w-[1240px] p-4 md:p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
