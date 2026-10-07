import { useTranslation } from 'react-i18next';
import { useMemo, type ComponentType } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ApiProvider, createServices } from '@chargeops/api';
import { useAuth } from '@chargeops/auth';
import {
  AppShell,
  ComingSoon,
  IconBell,
  IconBook,
  IconCard,
  IconClipboardCheck,
  IconGrid,
  IconLifebuoy,
  IconPin,
  IconPlusCircle,
  IconShield,
  IconUsers,
  IconWrench,
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
import { PolicyKB } from './pages/PolicyKB';
import { Observability } from './pages/Observability';
import { TicketsRoute } from '../shared/tickets/TicketsRoute';
import { SettingsPage } from '../shared/settings/SettingsPage';
import { HeaderSearch, type Searcher } from '../shared/search/HeaderSearch';
import { PlatformSwitcher } from '../shared/nav/PlatformSwitcher';

/** Screens with a real implementation (others fall back to ComingSoon). */
const PAGES: Record<string, ComponentType> = {
  dashboard: Dashboard,
  notifications: Notifications,
  stations: Stations,
  approvals: Approvals,
  provisioning: Provisioning,
  licenses: Licenses,
  users: Users,
  observability: Observability,
  kb: PolicyKB,
  tickets: () => <TicketsRoute admin />,
};

// Admin console exposes platform operations and escalated station cases.
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
    { key: 'tickets', label: t('console.nav.tickets.label'), icon: <IconLifebuoy size={17} />, title: t('console.nav.tickets.title') },
    { key: 'licenses', label: t('console.nav.licenses.label'), icon: <IconShield size={17} />, title: t('console.nav.licenses.title') },
    { key: 'users', label: t('console.nav.users.label'), icon: <IconUsers size={17} />, title: t('console.nav.users.title') },
    { key: 'observability', label: t('console.nav.observability.label'), icon: <IconWrench size={17} />, title: t('console.nav.observability.title') },
    { key: 'kb', label: t('console.nav.kb.label'), icon: <IconBook size={17} />, title: t('console.nav.kb.title') },
  ];

  const searchers = useMemo<Searcher[]>(
    () => [
      {
        label: t('search.groups.tickets'),
        icon: <IconLifebuoy size={14} strokeWidth={1.7} />,
        run: async (q) => {
          const res = await services.tickets.list({ search: q, pageSize: 5 });
          return res.items.map((tk) => ({
            id: tk.id,
            title: tk.subject,
            badge: tk.id.slice(0, 8),
            subtitle: tk.stationName ?? undefined,
            onSelect: () => navigate(`${base}/tickets/${tk.id}`),
          }));
        },
      },
      {
        label: t('search.groups.users'),
        icon: <IconUsers size={14} strokeWidth={1.7} />,
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
  const profileQuery = useQuery({
    queryKey: ['user-profile', 'me'],
    queryFn: () => services.profile.get(),
    staleTime: 5 * 60 * 1000,
  });

  const notificationItems = useMemo<NotificationItem[]>(() => {
    const q = dashboardQuery.data;
    if (!q) return [];
    const items: NotificationItem[] = [];
    if (q.pendingApprovals > 0) {
      items.push({
        id: 'approvals',
        title: t('notifications.pendingStations', { count: q.pendingApprovals }),
        subtitle: t('notifications.items.pendingStations.subtitle', { defaultValue: 'Có hồ sơ đăng ký trạm mới gửi lên cần xét duyệt.' }),
        tone: 'warn',
        category: 'system',
        badge: t('notifications.items.pendingStations.badge', { defaultValue: 'Chờ duyệt' }),
        actionLabel: t('notifications.items.pendingStations.action', { defaultValue: 'Duyệt trạm' }),
        onSelect: () => navigate(`${base}/approvals`),
        onAction: () => navigate(`${base}/approvals`),
      });
    }
    if (q.escalatedOpenCases > 0) {
      items.push({
        id: 'escalated-cases',
        title: t('dashboard.ops.escalatedOpenCases', { defaultValue: 'Case trạm cần xem xét' }) + `: ${q.escalatedOpenCases}`,
        subtitle: t('dashboard.ops.escalatedOpenCasesHint', { defaultValue: 'Driver hoặc Owner đã yêu cầu Admin xem xét hỗ trợ.' }),
        tone: 'bad',
        category: 'alert',
        badge: t('dashboard.ops.escalatedBadge', { defaultValue: 'Cần xem xét' }),
        actionLabel: t('dashboard.ops.openTickets', { defaultValue: 'Mở hỗ trợ' }),
        onSelect: () => navigate(`${base}/tickets`),
        onAction: () => navigate(`${base}/tickets`),
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
        userAvatarUrl={profileQuery.data?.avatarUrl}
        search={<HeaderSearch searchers={searchers} placeholder={t('console.searchPlaceholder')} />}
        platformSwitcher={<PlatformSwitcher />}
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
