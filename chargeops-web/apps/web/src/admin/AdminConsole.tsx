import { useTranslation } from 'react-i18next';
import { useMemo, type ComponentType } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ApiProvider, createServices } from '@chargeops/api';
import { useAuth } from '@chargeops/auth';
import {
  AppShell,
  ComingSoon,
  IconBarChart,
  IconBook,
  IconCalendar,
  IconCard,
  IconClipboardCheck,
  IconGrid,
  IconLifebuoy,
  IconPlusCircle,
  IconShield,
  IconUsers,
  NotificationBell,
  type NotificationItem,
  type ShellNavItem,
} from '@chargeops/ui';
import { Dashboard } from './pages/Dashboard';
import { Approvals } from './pages/Approvals';
import { Provisioning } from './pages/Provisioning';
import { Users } from './pages/Users';
import { Licenses } from './pages/Licenses';
import { Analytics } from './pages/Analytics';
import { PolicyKB } from './pages/PolicyKB';
import { Bookings } from './pages/Bookings';
import { Transactions } from './pages/Transactions';
import { TicketsRoute } from '../shared/tickets/TicketsRoute';
import { SettingsPage } from '../shared/settings/SettingsPage';
import { HeaderSearch, type Searcher } from '../shared/search/HeaderSearch';

/** Screens with a real implementation (others fall back to ComingSoon). */
const PAGES: Record<string, ComponentType> = {
  dashboard: Dashboard,
  approvals: Approvals,
  provisioning: Provisioning,
  bookings: Bookings,
  transactions: Transactions,
  licenses: Licenses,
  users: Users,
  analytics: Analytics,
  kb: PolicyKB,
  tickets: () => <TicketsRoute admin />,
};

// Admin console sees platform-wide (unscoped) data.
const services = createServices({ ownerView: false });

/** Platform admin console, mounted at `/admin`. */
export function AdminConsole({ base }: { base: string }) {
  const { t } = useTranslation('admin');
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const activeKey = location.pathname.split('/')[2] || 'dashboard';

  const NAV: (ShellNavItem & { title: string })[] = [
    { key: 'dashboard', label: t('console.nav.dashboard.label'), icon: <IconGrid size={17} />, title: t('console.nav.dashboard.title') },
    { key: 'approvals', label: t('console.nav.approvals.label'), icon: <IconClipboardCheck size={17} />, title: t('console.nav.approvals.title') },
    { key: 'provisioning', label: t('console.nav.provisioning.label'), icon: <IconPlusCircle size={17} />, title: t('console.nav.provisioning.title') },
    { key: 'bookings', label: t('console.nav.bookings.label'), icon: <IconCalendar size={17} />, title: t('console.nav.bookings.title') },
    { key: 'tickets', label: t('console.nav.tickets.label'), icon: <IconLifebuoy size={17} />, title: t('console.nav.tickets.title') },
    { key: 'transactions', label: t('console.nav.transactions.label'), icon: <IconCard size={17} />, title: t('console.nav.transactions.title') },
    { key: 'licenses', label: t('console.nav.licenses.label'), icon: <IconShield size={17} />, title: t('console.nav.licenses.title') },
    { key: 'users', label: t('console.nav.users.label'), icon: <IconUsers size={17} />, title: t('console.nav.users.title') },
    { key: 'analytics', label: t('console.nav.analytics.label'), icon: <IconBarChart size={17} />, title: t('console.nav.analytics.title') },
    { key: 'kb', label: t('console.nav.kb.label'), icon: <IconBook size={17} />, title: t('console.nav.kb.title') },
  ];

  const searchers = useMemo<Searcher[]>(
    () => [
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
            subtitle: b.stationName,
            onSelect: () => navigate(`${base}/bookings`),
          }));
        },
      },
      {
        label: t('search.groups.users'),
        run: async (q) => {
          const rows = await services.users.list({ search: q });
          return rows.slice(0, 5).map((u) => ({
            id: u.id,
            title: u.name,
            subtitle: u.email,
            onSelect: () => navigate(`${base}/users`),
          }));
        },
      },
    ],
    [base, navigate, t],
  );

  // Same queryKey/queryFn the admin Dashboard page uses — react-query dedupes, no extra network call after first mount.
  const dashboardQuery = useQuery({ queryKey: ['dashboard', 'admin'], queryFn: () => services.dashboard.admin() });

  const notificationItems = useMemo<NotificationItem[]>(() => {
    const q = dashboardQuery.data?.actionQueue;
    if (!q) return [];
    const items: NotificationItem[] = [];
    if (q.pendingStations > 0) {
      items.push({
        id: 'approvals',
        title: t('notifications.pendingStations', { count: q.pendingStations }),
        tone: 'warn',
        onSelect: () => navigate(`${base}/approvals`),
      });
    }
    if (q.expiringLicenses > 0) {
      items.push({
        id: 'expiring',
        title: t('notifications.expiringLicenses', { count: q.expiringLicenses, days: q.expiringDaysMin }),
        tone: 'warn',
        onSelect: () => navigate(`${base}/licenses`),
      });
    }
    if (q.expiredLicenses > 0) {
      items.push({
        id: 'expired',
        title: t('notifications.expiredLicenses', { count: q.expiredLicenses }),
        tone: 'bad',
        onSelect: () => navigate(`${base}/licenses`),
      });
    }
    if (q.reportedFaults > 0) {
      items.push({
        id: 'faults',
        title: t('notifications.reportedFaults', { count: q.reportedFaults }),
        tone: 'bad',
        onSelect: () => navigate(`${base}/provisioning`),
      });
    }
    return items;
  }, [dashboardQuery.data, base, navigate, t]);

  return (
    <ApiProvider services={services}>
      <AppShell
        nav={NAV}
        activeKey={activeKey}
        onNavigate={(key) => navigate(`${base}/${key}`)}
        accent="brand"
        rolePill={{ label: t('console.role'), bg: 'var(--color-solid)', fg: 'var(--color-solid-fg)' }}
        userName={user?.name ?? '···'}
        userEmail={user?.email}
        search={<HeaderSearch searchers={searchers} placeholder={t('console.searchPlaceholder')} />}
        notifications={<NotificationBell items={notificationItems} emptyLabel={t('notifications.empty')} />}
        onSettings={() => navigate(`${base}/settings`)}
        onLogout={logout}
      >
        <Routes>
          <Route index element={<Navigate to={`${base}/dashboard`} replace />} />
          {NAV.map((n) => {
            const Page = PAGES[n.key];
            return (
              <Route
                key={n.key}
                path={`${n.key}/*`}
                element={Page ? <Page /> : <ComingSoon title={n.title} />}
              />
            );
          })}
          {/* Settings lives behind the header avatar menu, not the sidebar. */}
          <Route path="settings" element={<SettingsPage accent="brand" />} />
          <Route path="*" element={<Navigate to={`${base}/dashboard`} replace />} />
        </Routes>
      </AppShell>
    </ApiProvider>
  );
}
