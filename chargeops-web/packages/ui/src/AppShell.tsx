import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Avatar } from './Avatar';
import { MoreMenu } from './MoreMenu';
import {
  IconBolt,
  IconChevronDown,
  IconLogout,
  IconMenu,
  IconSettings,
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

export interface AppShellProps {
  nav: ShellNavItem[];
  activeKey: string;
  onNavigate: (key: string) => void;
  /** Active nav item colouring: indigo for admin, emerald for owner. */
  accent: 'brand' | 'owner';
  rolePill: RolePill;
  /** Current station chip in the top bar (owner console). */
  station?: string;
  /** Full name — the header Avatar derives its initials fallback from this. */
  userName: string;
  /** The whole search box (HeaderSearch) — console-specific, since what's searchable differs by role. */
  search: ReactNode;
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

export function AppShell({
  nav,
  activeKey,
  onNavigate,
  accent,
  rolePill,
  station,
  userName,
  search,
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
          {station && (
            <>
              <div className="hidden h-[22px] w-px bg-line-2 sm:block" />
              <div className="hidden cursor-pointer items-center gap-2 rounded-ctl border border-line px-[11px] py-1.5 text-[13px] font-medium hover:bg-canvas sm:flex">
                <span className="h-[7px] w-[7px] rounded-[2px] bg-good" />
                {station}
                <IconChevronDown size={13} strokeWidth={2.2} className="text-faint" />
              </div>
            </>
          )}
        </div>
        <div className="flex items-center gap-2.5">
          {search}
          <span
            className="rounded-full px-[11px] py-[5px] text-[10.5px] font-bold tracking-[0.04em]"
            style={{ background: rolePill.bg, color: rolePill.fg }}
          >
            {rolePill.label}
          </span>
          {notifications}
          <MoreMenu
            items={[
              { key: 'settings', label: t('avatarMenu.settings'), icon: <IconSettings size={15} strokeWidth={2} />, onClick: onSettings },
              { key: 'logout', label: t('avatarMenu.logout'), icon: <IconLogout size={15} strokeWidth={2} />, onClick: onLogout, tone: 'danger' },
            ]}
            trigger={<Avatar name={userName} size="md" tone={accent === 'owner' ? 'owner' : 'brand'} />}
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
