import { useMemo, type ComponentType } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  ApiProvider,
  createServices,
  formatTimeVn,
  type OwnerDashboard as OwnerDashboardData,
  type StaffDashboard as StaffDashboardData,
} from '@chargeops/api';
import { useAuth } from '@chargeops/auth';
import {
  AppShell,
  ComingSoon,
  IconCalendar,
  IconBolt,
  IconCard,
  IconChat,
  IconGrid,
  IconLifebuoy,
  IconPin,
  IconShield,
  IconTag,
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
  tickets: () => <TicketsRoute admin={false} />,
};

const NAV = [
  { key: 'dashboard', icon: <IconGrid size={17} /> },
  { key: 'bookings', icon: <IconCalendar size={17} /> },
  { key: 'chargers', icon: <IconBolt size={17} /> },
  { key: 'tickets', icon: <IconLifebuoy size={17} /> },
  { key: 'pricing', icon: <IconTag size={17} /> },
  { key: 'stations', icon: <IconPin size={17} /> },
  { key: 'revenue', icon: <IconCard size={17} /> },
  { key: 'license', icon: <IconShield size={17} /> },
  { key: 'assistant', icon: <IconChat size={17} /> },
];

/** Station staff reuse the owner shell but only see day-to-day operations. */
const STAFF_KEYS = new Set(['dashboard', 'bookings', 'chargers', 'tickets']);

// Owner and staff both see station-scoped data.
const services = createServices({ ownerView: true });

/**
 * Owner console, mounted at `base` (`/owner` or `/staff`). When `reduced`, the
 * menu is trimmed to the staff subset — owner-only pages have no route, so a
 * hand-typed URL falls through to the dashboard.
 */
export function OwnerConsole({ base, reduced = false }: { base: string; reduced?: boolean }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { t } = useTranslation('owner');

  const items = reduced ? NAV.filter((n) => STAFF_KEYS.has(n.key)) : NAV;
  const nav: (ShellNavItem & { title: string; subtitle: string })[] = items.map((item) => ({
    key: item.key,
    icon: item.icon,
    label: t(`console.nav.${item.key}.label`),
    title: t(`console.nav.${item.key}.title`),
    subtitle: t(`console.nav.${item.key}.subtitle`),
  }));

  const activeKey = location.pathname.split('/')[2] || 'dashboard';

  const searchers = useMemo<Searcher[]>(() => {
    const list: Searcher[] = [
      {
        label: t('search.groups.tickets'),
        run: async (q) => {
          const res = await services.tickets.list({ search: q, pageSize: 5 });
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
          const res = await services.bookings.list({ search: q, pageSize: 5 });
          return res.items.map((b) => ({
            id: b.id,
            title: `${b.id} · ${b.driverName}`,
            subtitle: `${b.chargerId} · ${formatTimeVn(b.startAt)}`,
            onSelect: () => navigate(`${base}/bookings`),
          }));
        },
      },
      {
        label: t('search.groups.chargers'),
        run: async (q) => {
          const all = await services.chargers.list();
          const ql = q.toLowerCase();
          return all
            .filter((c) => c.name.toLowerCase().includes(ql) || c.id.toLowerCase().includes(ql))
            .slice(0, 5)
            .map((c) => ({ id: c.id, title: `${c.id} · ${c.name}`, onSelect: () => navigate(`${base}/chargers`) }));
        },
      },
    ];
    if (!reduced) {
      list.push({
        label: t('search.groups.stations'),
        run: async (q) => {
          const all = await services.stations.mine();
          const ql = q.toLowerCase();
          return all
            .filter((s) => s.name.toLowerCase().includes(ql))
            .slice(0, 5)
            .map((s) => ({ id: s.id, title: s.name, subtitle: s.address, onSelect: () => navigate(`${base}/stations`) }));
        },
      });
    }
    return list;
  }, [base, navigate, reduced, t]);

  // Same queryKey/queryFn the Dashboard page itself uses — react-query dedupes, no extra network call after first mount.
  const dashboardQuery = useQuery<OwnerDashboardData | StaffDashboardData>({
    queryKey: reduced ? ['dashboard', 'staff'] : ['dashboard', 'owner'],
    queryFn: () => (reduced ? services.dashboard.staff() : services.dashboard.owner()),
  });

  const notificationItems = useMemo<NotificationItem[]>(() => {
    if (!dashboardQuery.data) return [];
    const items: NotificationItem[] = [];
    if (reduced) {
      const d = dashboardQuery.data as StaffDashboardData;
      if (d.kpis.offlineChargerNote) {
        items.push({ id: 'offline', title: d.kpis.offlineChargerNote, tone: 'bad', onSelect: () => navigate(`${base}/chargers`) });
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
      if (d.license.status !== 'active') {
        items.push({
          id: 'license',
          title: t(`notifications.license.${d.license.status}`, { days: d.license.daysLeft }),
          tone: d.license.status === 'expired' ? 'bad' : 'warn',
          onSelect: () => navigate(`${base}/license`),
        });
      }
      if (d.kpis.offlineChargerNote) {
        items.push({ id: 'offline', title: d.kpis.offlineChargerNote, tone: 'bad', onSelect: () => navigate(`${base}/chargers`) });
      }
    }
    return items;
  }, [dashboardQuery.data, reduced, base, navigate, t]);

  return (
    <ApiProvider services={services}>
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
        station="Trạm Hà Đông"
        userName={user?.name ?? '···'}
        search={<HeaderSearch searchers={searchers} accent="owner" />}
        notifications={<NotificationBell items={notificationItems} emptyLabel={t('notifications.empty')} />}
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
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to={`${base}/dashboard`} replace />} />
        </Routes>
      </AppShell>
    </ApiProvider>
  );
}
