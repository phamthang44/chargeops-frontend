import { useTranslation } from 'react-i18next';
import { useMemo, type ComponentType } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ApiProvider, createServices, resolveNotificationI18n } from '@chargeops/api';
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
import { HeaderSearch, type GlobalSearchLoad } from '../shared/search/HeaderSearch';
import { makeGlobalLoad, type GlobalSearchRoutes } from '../shared/search/makeGlobalLoad';
import { PlatformSwitcher } from '../shared/nav/PlatformSwitcher';
import {
  useNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
} from '../shared/notifications/useNotifications';

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

function AdminConsoleContent({
  base,
  activeKey,
  NAV,
  load,
  services,
}: {
  base: string;
  activeKey: string;
  NAV: (ShellNavItem & { title: string })[];
  load: GlobalSearchLoad;
  services: any;
}) {
  const { t } = useTranslation('admin');
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const dashboardQuery = useQuery({ queryKey: ['dashboard', 'admin'], queryFn: () => services.dashboard.admin() });
  const profileQuery = useQuery({
    queryKey: ['user-profile', 'me'],
    queryFn: () => services.profile.get(),
    staleTime: 5 * 60 * 1000,
  });

  const { items: serverNotifs = [] } = useNotifications({ context: 'admin', size: 5 });
  const { data: serverUnreadCount } = useUnreadCount({ context: 'admin' });
  const markAsRead = useMarkAsRead({ context: 'admin' });
  const markAllAsRead = useMarkAllAsRead({ context: 'admin' });
  const deleteNotif = useDeleteNotification({ context: 'admin' });

  const notificationItems = useMemo<NotificationItem[]>(() => {
    // 1. Persisted notices from API
    const items: NotificationItem[] = serverNotifs.map((n) => {
      let displayTime = n.time;
      if (!displayTime && n.createdAt) {
        try {
          const diffMs = Date.now() - new Date(n.createdAt).getTime();
          const diffMins = Math.floor(diffMs / 60_000);
          if (diffMins < 1) displayTime = 'Vừa xong';
          else if (diffMins < 60) displayTime = `${diffMins} phút trước`;
          else {
            const diffHours = Math.floor(diffMins / 60);
            if (diffHours < 24) displayTime = `${diffHours} giờ trước`;
            else displayTime = `${Math.floor(diffHours / 24)} ngày trước`;
          }
        } catch {
          displayTime = undefined;
        }
      }

      const navigateToTarget = () => {
        if (n.primaryAction?.actionUrl) {
          navigate(`${base}${n.primaryAction.actionUrl}`);
        } else if (n.target?.type === 'OPEN_CASE' && n.target.escalationId) {
          navigate(`${base}/tickets?escalationId=${n.target.escalationId}`);
        } else if (n.target?.type === 'OPEN_TICKET' && n.target.ticketId) {
          navigate(`${base}/tickets/${n.target.ticketId}`);
        } else if (n.target?.type === 'OPEN_BOOKING' && n.target.bookingId) {
          navigate(`${base}/stations`);
        } else if (n.category === 'ticket') {
          navigate(`${base}/tickets`);
        } else {
          navigate(`${base}/notifications`);
        }
      };

      return {
        id: n.id,
        source: 'persisted',
        title: resolveNotificationI18n(n.title, t),
        subtitle: resolveNotificationI18n(n.subtitle, t),
        body: resolveNotificationI18n(n.body, t),
        time: displayTime,
        tone: n.tone ?? n.severity,
        read: n.read,
        category: n.category,
        stationName: n.stationName,
        chargerId: n.chargerId,
        badge: n.badge,
        actionLabel: n.actionLabel || n.primaryAction?.label,
        onSelect: navigateToTarget,
        onAction: navigateToTarget,
      };
    });

    return items;
  }, [serverNotifs, base, navigate, t]);

  return (
    <AppShell
      nav={NAV}
      activeKey={activeKey}
      onNavigate={(key) => navigate(`${base}/${key}`)}
      accent="brand"
      rolePill={{ label: t('console.role'), bg: 'var(--color-solid)', fg: 'var(--color-solid-fg)' }}
      userName={user?.name ?? '···'}
      userEmail={user?.email}
      userAvatarUrl={profileQuery.data?.avatarUrl}
      search={<HeaderSearch load={load} placeholder={t('console.searchPlaceholder')} />}
      platformSwitcher={<PlatformSwitcher />}
      notifications={
        <NotificationBell
          items={notificationItems}
          unreadCount={serverUnreadCount}
          emptyLabel={t('notifications.empty')}
          onOpenCenter={() => navigate(`${base}/notifications`)}
          onMarkRead={(id) => {
            if (id === 'approvals' || id === 'escalated-cases') return;
            markAsRead.mutate(id);
          }}
          onMarkAllRead={() => markAllAsRead.mutate()}
          onDismiss={(id) => {
            if (id === 'approvals' || id === 'escalated-cases') return;
            deleteNotif.mutate(id);
          }}
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
  );
}

// Admin console exposes platform operations and escalated station cases.
/** Platform admin console, mounted at `/admin`. */
export function AdminConsole({ base }: { base: string }) {
  const { t } = useTranslation('admin');
  const navigate = useNavigate();
  const location = useLocation();
  const { getToken } = useAuth();
  const services = useMemo(() => createServices({ ownerView: false, getToken }), [getToken]);
  const activeKey = location.pathname.split('/')[2] || 'dashboard';

  const NAV: (ShellNavItem & { title: string })[] = useMemo(
    () => [
      { key: 'dashboard', label: t('console.nav.dashboard.label'), icon: <IconGrid size={17} />, title: t('console.nav.dashboard.title') },
      { key: 'notifications', label: t('console.nav.notifications.label'), icon: <IconBell size={17} />, title: t('console.nav.notifications.title') },
      { key: 'stations', label: t('console.nav.stations.label'), icon: <IconPin size={17} />, title: t('console.nav.stations.title') },
      { key: 'approvals', label: t('console.nav.approvals.label'), icon: <IconClipboardCheck size={17} />, title: t('console.nav.approvals.title') },
      { key: 'tickets', label: t('console.nav.tickets.label'), icon: <IconLifebuoy size={17} />, title: t('console.nav.tickets.title') },
      { key: 'licenses', label: t('console.nav.licenses.label'), icon: <IconShield size={17} />, title: t('console.nav.licenses.title') },
      { key: 'users', label: t('console.nav.users.label'), icon: <IconUsers size={17} />, title: t('console.nav.users.title') },
      { key: 'observability', label: t('console.nav.observability.label'), icon: <IconWrench size={17} />, title: t('console.nav.observability.title') },
      { key: 'kb', label: t('console.nav.kb.label'), icon: <IconBook size={17} />, title: t('console.nav.kb.title') },
    ],
    [t],
  );

  const searchLoad = useMemo(() => {
    // Admin screens without a per-item detail route (stations, approvals,
    // licenses, legal docs) land on their list page instead of a dead row.
    const routes: GlobalSearchRoutes = {
      TICKET: (tk) => navigate(`${base}/tickets/${tk.id}`),
      STATION: () => navigate(`${base}/stations`),
      APPROVAL: () => navigate(`${base}/approvals`),
      LICENSE: () => navigate(`${base}/licenses`),
      USER: () => navigate(`${base}/users`),
      LEGAL_DOCUMENT: () => navigate(`${base}/kb`),
    };
    return makeGlobalLoad(services.search, routes);
  }, [base, navigate, services]);

  return (
    <ApiProvider services={services}>
      <AdminConsoleContent
        base={base}
        activeKey={activeKey}
        NAV={NAV}
        load={searchLoad}
        services={services}
      />
    </ApiProvider>
  );
}
