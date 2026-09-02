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
  IconBell,
  IconBook,
  IconCalendar,
  IconCard,
  IconClipboardCheck,
  IconGrid,
  IconLifebuoy,
  IconPin,
  IconPlusCircle,
  IconShield,
  IconUsers,
  NotificationBell,
  type NotificationItem,
  type ShellNavItem,
} from '@chargeops/ui';
import { Dashboard } from './pages/Dashboard';
import { Notifications } from './pages/Notifications';
import { Stations } from './pages/Stations';
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
  notifications: Notifications,
  stations: Stations,
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
/** Platform admin console, mounted at `/admin`. */
export function AdminConsole({ base }: { base: string }) {
  const { t } = useTranslation('admin');
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, getToken } = useAuth();
  const services = useMemo(() => createServices({ ownerView: false, getToken }), [getToken]);
  const activeKey = location.pathname.split('/')[2] || 'dashboard';

  const NAV: (ShellNavItem & { title: string })[] = [
    { key: 'dashboard', label: t('console.nav.dashboard.label'), icon: <IconGrid size={17} />, title: t('console.nav.dashboard.title') },
    { key: 'notifications', label: t('console.nav.notifications.label'), icon: <IconBell size={17} />, title: t('console.nav.notifications.title') },
    { key: 'stations', label: t('console.nav.stations.label'), icon: <IconPin size={17} />, title: t('console.nav.stations.title') },
    { key: 'approvals', label: t('console.nav.approvals.label'), icon: <IconClipboardCheck size={17} />, title: t('console.nav.approvals.title') },
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
    [base, navigate, services, t],
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
        subtitle: t('notifications.items.pendingStations.subtitle', { defaultValue: 'Có hồ sơ đăng ký trạm mới gửi lên cần xét duyệt.' }),
        tone: 'warn',
        category: 'system',
        badge: t('notifications.items.pendingStations.badge', { defaultValue: 'Chờ duyệt' }),
        actionLabel: t('notifications.items.pendingStations.action', { defaultValue: 'Duyệt trạm' }),
        onSelect: () => navigate(`${base}/approvals`),
        onAction: () => navigate(`${base}/approvals`),
      });
    }
    if (q.expiringLicenses > 0) {
      items.push({
        id: 'expiring',
        title: t('notifications.expiringLicenses', { count: q.expiringLicenses, days: q.expiringDaysMin }),
        subtitle: t('notifications.items.expiringLicenses.subtitle', {
          days: q.expiringDaysMin,
          defaultValue: `Gói giấy phép trạm sẽ hết hạn trong ${q.expiringDaysMin} ngày tới.`,
        }),
        tone: 'warn',
        category: 'system',
        badge: t('notifications.items.expiringLicenses.badge', { defaultValue: 'Sắp hết hạn' }),
        actionLabel: t('notifications.items.expiringLicenses.action', { defaultValue: 'Xem giấy phép' }),
        onSelect: () => navigate(`${base}/licenses`),
        onAction: () => navigate(`${base}/licenses`),
      });
    }
    if (q.expiredLicenses > 0) {
      items.push({
        id: 'expired',
        title: t('notifications.expiredLicenses', { count: q.expiredLicenses }),
        subtitle: t('notifications.items.expiredLicenses.subtitle', { defaultValue: 'Giấy phép hoạt động trạm đã hết hạn sử dụng.' }),
        tone: 'bad',
        category: 'alert',
        badge: t('notifications.items.expiredLicenses.badge', { defaultValue: 'Hết hạn' }),
        actionLabel: t('notifications.items.expiredLicenses.action', { defaultValue: 'Xử lý ngay' }),
        onSelect: () => navigate(`${base}/licenses`),
        onAction: () => navigate(`${base}/licenses`),
      });
    }
    if (q.reportedFaults > 0) {
      items.push({
        id: 'faults',
        title: t('notifications.reportedFaults', { count: q.reportedFaults }),
        subtitle: t('notifications.items.reportedFaults.subtitle', { defaultValue: 'Trụ sạc báo lỗi phần cứng hoặc quá nhiệt kết nối.' }),
        tone: 'bad',
        category: 'alert',
        badge: t('notifications.items.reportedFaults.badge', { defaultValue: 'Sự cố trụ' }),
        actionLabel: t('notifications.items.reportedFaults.action', { defaultValue: 'Kiểm tra' }),
        onSelect: () => navigate(`${base}/provisioning`),
        onAction: () => navigate(`${base}/provisioning`),
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
