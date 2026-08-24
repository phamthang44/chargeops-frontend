import { useMemo, type ComponentType } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  ApiProvider,
  createServices,
  formatTimeVn,
  useApi,
  type OwnerDashboard as OwnerDashboardData,
  type StaffDashboard as StaffDashboardData,
  type Station,
} from '@chargeops/api';
import { useAuth } from '@chargeops/auth';
import {
  AppShell,
  ComingSoon,
  IconCalendar,
  IconBell,
  IconBolt,
  IconCard,
  IconChat,
  IconGrid,
  IconLifebuoy,
  IconPin,
  IconShield,
  IconTag,
  IconUsers,
  NotificationBell,
  type NotificationItem,
  type ShellNavItem,
} from '@chargeops/ui';
import { Dashboard } from './pages/Dashboard';
import { Stations } from './pages/Stations';
import { Bookings } from './pages/Bookings';
import { Chargers } from './pages/Chargers';
import { Pricing } from './pages/Pricing';
import { License } from './pages/License';
import { Assistant } from './pages/Assistant';
import { Revenue } from './pages/Revenue';
import { Staff } from './pages/Staff';
import { NotificationsShowcase } from './pages/NotificationsShowcase';
import { Dashboard as StaffDashboard } from '../staff/pages/Dashboard';
import { TicketsRoute } from '../shared/tickets/TicketsRoute';
import { SettingsPage } from '../shared/settings/SettingsPage';
import { HeaderSearch, type Searcher } from '../shared/search/HeaderSearch';

/** Screens with a real implementation (others fall back to ComingSoon). */
const PAGES: Record<string, ComponentType> = {
  dashboard: Dashboard,
  stations: Stations,
  bookings: Bookings,
  chargers: Chargers,
  pricing: Pricing,
  revenue: Revenue,
  license: License,
  assistant: Assistant,
  staff: Staff,
  notifications: NotificationsShowcase,
  tickets: () => <TicketsRoute admin={false} />,
};

const NAV = [
  { key: 'dashboard', icon: <IconGrid size={17} /> },
  { key: 'notifications', icon: <IconBell size={17} /> },
  { key: 'bookings', icon: <IconCalendar size={17} /> },
  { key: 'chargers', icon: <IconBolt size={17} /> },
  { key: 'tickets', icon: <IconLifebuoy size={17} /> },
  { key: 'pricing', icon: <IconTag size={17} /> },
  { key: 'stations', icon: <IconPin size={17} /> },
  { key: 'staff', icon: <IconUsers size={17} /> },
  { key: 'revenue', icon: <IconCard size={17} /> },
  { key: 'license', icon: <IconShield size={17} /> },
  { key: 'assistant', icon: <IconChat size={17} /> },
];

/**
 * Station staff reuse the owner shell but only see day-to-day operations
 * (FR17 capability matrix). Anything absent here has no route generated either,
 * so a hand-typed /staff/staff URL falls through to the dashboard rather than
 * rendering an owner-only screen. This is UX convenience, not the security
 * boundary — BR-ACC-05 requires the server to enforce it independently.
 */
const STAFF_KEYS = new Set(['dashboard', 'bookings', 'chargers', 'tickets']);

// Owner and staff both see station-scoped data.
/**
 * Owner console, mounted at `base` (`/owner` or `/staff`). When `reduced`, the
 * menu is trimmed to the staff subset — owner-only pages have no route, so a
 * hand-typed URL falls through to the dashboard.
 */
import { OwnerStationProvider, useOwnerStation } from './context/OwnerStationContext';

function OwnerConsoleContent({
  base,
  reduced,
  nav,
  activeKey,
}: {
  base: string;
  reduced: boolean;
  nav: (ShellNavItem & { title: string; subtitle: string })[];
  activeKey: string;
}) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t } = useTranslation('owner');
  const api = useApi();
  const { stations, selectedStationId, setSelectedStationId, currentStation } = useOwnerStation();

  const searchers = useMemo<Searcher[]>(() => {
    const list: Searcher[] = [
      {
        label: t('search.groups.tickets'),
        run: async (q) => {
          const res = await api.tickets.list({ search: q, pageSize: 5 });
          return res.items.map((tk) => ({
            id: tk.id,
            title: `${tk.id} · ${tk.subject}`,
            subtitle: tk.stationName ?? undefined,
            onSelect: () => navigate(`${base}/tickets/${tk.id}`),
          }));
        },
      },
      {
        label: t('search.groups.bookings'),
        run: async (q) => {
          const res = await api.bookings.list({ search: q, pageSize: 5 });
          return res.items.map((b) => ({
            id: b.id,
            title: `${b.id} · ${b.driverName}`,
            subtitle: `${b.connectorId} · ${formatTimeVn(b.startAt)}`,
            onSelect: () => navigate(`${base}/bookings`),
          }));
        },
      },
      {
        label: t('search.groups.chargers'),
        run: async (q) => {
          if (!selectedStationId) return [];
          const cps = await api.chargePoints.list(selectedStationId);
          const ql = q.toLowerCase();
          return cps
            .filter(
              (c) =>
                c.name.toLowerCase().includes(ql) ||
                (c.chargePointCode && c.chargePointCode.toLowerCase().includes(ql)) ||
                c.id.toLowerCase().includes(ql),
            )
            .slice(0, 5)
            .map((c) => ({
              id: c.id,
              title: `${c.chargePointCode || c.id} · ${c.name}`,
              subtitle: c.zoneLabel ? `Khu vực: ${c.zoneLabel}` : undefined,
              onSelect: () => navigate(`${base}/chargers`),
            }));
        },
      },
    ];
    if (!reduced) {
      list.push({
        label: t('search.groups.stations'),
        run: async (q) => {
          const ql = q.toLowerCase();
          return stations
            .filter(
              (s) =>
                s.name.toLowerCase().includes(ql) ||
                (s.stationCode && s.stationCode.toLowerCase().includes(ql)) ||
                s.id.toLowerCase().includes(ql),
            )
            .slice(0, 5)
            .map((s) => ({
              id: s.id,
              title: `${s.name} (${s.stationCode || s.id})`,
              subtitle:
                s.address ||
                [s.addressLine, s.wardName, s.provinceName].filter(Boolean).join(', ') ||
                undefined,
              onSelect: () => {
                setSelectedStationId(s.id);
                navigate(`${base}/stations?stationId=${s.id}`);
              },
            }));
        },
      });
    }
    return list;
  }, [api, base, navigate, reduced, selectedStationId, setSelectedStationId, stations, t]);

  // Same queryKey/queryFn the Dashboard page itself uses — react-query dedupes, no extra network call after first mount.
  const dashboardQuery = useQuery<OwnerDashboardData | StaffDashboardData>({
    queryKey: reduced ? ['dashboard', 'staff'] : ['dashboard', 'owner'],
    queryFn: () => (reduced ? api.dashboard.staff() : api.dashboard.owner()),
  });

  const notificationItems = useMemo<NotificationItem[]>(() => {
    if (!dashboardQuery.data) return [];
    const items: NotificationItem[] = [];
    if (reduced) {
      const d = dashboardQuery.data as StaffDashboardData;
      if (d.kpis.offlineChargerNote) {
        items.push({
          id: 'offline',
          title: d.kpis.offlineChargerNote,
          tone: 'bad',
          onSelect: () => navigate(`${base}/chargers`),
        });
      }
      if (d.kpis.openTickets > 0) {
        items.push({
          id: 'tickets',
          title: t('notifications.openTickets', { count: d.kpis.openTickets }),
          tone: 'warn',
          onSelect: () => navigate(`${base}/tickets`),
        });
      }
    } else {
      const d = dashboardQuery.data as OwnerDashboardData;
      const licStatus = String(d.license.status).toUpperCase();
      const days = d.license.daysLeft ?? 0;
      const isExpiring = d.license.expiringSoon || (licStatus === 'ACTIVE' && days <= 30);
      const isExpired = licStatus === 'EXPIRED';
      const isSuspended = licStatus === 'SUSPENDED';

      if (isExpired) {
        items.push({
          id: 'license',
          title: t('notifications.license.expired', { defaultValue: 'Giấy phép vận hành đã hết hạn' }),
          tone: 'bad',
          onSelect: () => navigate(`${base}/license`),
        });
      } else if (isExpiring) {
        items.push({
          id: 'license',
          title: t('notifications.license.expiring', {
            days,
            defaultValue: `Giấy phép sắp hết hạn · còn ${days} ngày`,
          }),
          tone: 'warn',
          onSelect: () => navigate(`${base}/license`),
        });
      } else if (isSuspended) {
        items.push({
          id: 'license',
          title: t('notifications.license.suspended', { defaultValue: 'Giấy phép vận hành đang tạm ngưng' }),
          tone: 'warn',
          onSelect: () => navigate(`${base}/license`),
        });
      }

      if (d.kpis.offlineChargerNote) {
        items.push({
          id: 'offline',
          title: d.kpis.offlineChargerNote,
          tone: 'bad',
          onSelect: () => navigate(`${base}/chargers`),
        });
      }
    }
    return items;
  }, [dashboardQuery.data, reduced, base, navigate, t]);

  return (
    <AppShell
      nav={nav}
      activeKey={activeKey}
      onNavigate={(key) => navigate(`${base}/${key}`)}
      accent="owner"
      rolePill={
        reduced
          ? { label: t('console.role.staff'), bg: 'var(--color-chip)', fg: 'var(--color-muted)' }
          : { label: t('console.role.owner'), bg: 'var(--color-owner-soft)', fg: 'var(--color-owner-deep)' }
      }
      station={currentStation ? `${currentStation.name} (${currentStation.stationCode || currentStation.id})` : undefined}
      stations={stations.map((s) => ({
        id: s.id,
        name: s.name,
        stationCode: s.stationCode,
        city: s.city || s.provinceName,
        status: s.status,
      }))}
      selectedStationId={selectedStationId}
      onSelectStation={setSelectedStationId}
      userName={user?.name ?? '···'}
      userEmail={user?.email}
      search={<HeaderSearch searchers={searchers} accent="owner" />}
      notifications={
        <NotificationBell
          items={notificationItems}
          emptyLabel={t('notifications.empty')}
          onOpenCenter={() => navigate(`${base}/notifications`)}
        />
      }
      onSettings={() => navigate(`${base}/settings`)}
      onLogout={logout}
    >
      <Routes>
        <Route index element={<Navigate to={`${base}/dashboard`} replace />} />
        {nav.map((n) => {
          const Page = n.key === 'dashboard' && reduced ? StaffDashboard : PAGES[n.key];
          return (
            <Route
              key={n.key}
              path={`${n.key}/*`}
              element={Page ? <Page /> : <ComingSoon title={n.title} />}
            />
          );
        })}
        {/* Settings lives behind the header avatar menu, not the sidebar. */}
        <Route path="settings" element={<SettingsPage accent="owner" />} />
        <Route path="*" element={<Navigate to={`${base}/dashboard`} replace />} />
      </Routes>
    </AppShell>
  );
}

/**
 * Owner console, mounted at `base` (`/owner` or `/staff`). When `reduced`, the
 * menu is trimmed to the staff subset — owner-only pages have no route, so a
 * hand-typed URL falls through to the dashboard.
 */
export function OwnerConsole({ base, reduced = false }: { base: string; reduced?: boolean }) {
  const location = useLocation();
  const { getToken } = useAuth();
  const { t } = useTranslation('owner');
  const services = useMemo(() => createServices({ ownerView: true, getToken }), [getToken]);

  const items = reduced ? NAV.filter((n) => STAFF_KEYS.has(n.key)) : NAV;
  const nav: (ShellNavItem & { title: string; subtitle: string })[] = items.map((item) => ({
    key: item.key,
    icon: item.icon,
    label: t(`console.nav.${item.key}.label`),
    title: t(`console.nav.${item.key}.title`),
    subtitle: t(`console.nav.${item.key}.subtitle`),
  }));

  const activeKey = location.pathname.split('/')[2] || 'dashboard';

  return (
    <ApiProvider services={services}>
      <OwnerStationProvider>
        <OwnerConsoleContent
          base={base}
          reduced={reduced}
          nav={nav}
          activeKey={activeKey}
        />
      </OwnerStationProvider>
    </ApiProvider>
  );
}
