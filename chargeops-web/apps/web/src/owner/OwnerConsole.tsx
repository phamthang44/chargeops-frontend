import { useMemo, type ComponentType } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  ApiProvider,
  createServices,
  useApi,
  resolveNotificationI18n,
  type OwnerDashboard as OwnerDashboardData,
  type StaffDashboard as StaffDashboardData,
  type Station,
  type AppNotification,
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
  IconBook,
  NotificationBell,
  type NotificationItem,
  type ShellNavItem,
} from '@chargeops/ui';
import { Dashboard } from './pages/Dashboard';
import { Stations } from './pages/Stations';
import { Bookings } from './pages/Bookings';
import { Chargers } from './pages/Chargers';
import {
  useNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
} from '../shared/notifications/useNotifications';
import { Pricing } from './pages/Pricing';
import { License } from './pages/License';
import { Assistant } from './pages/Assistant';
import { LegalPolicies } from '../shared/legal/LegalPolicies';
import { Revenue } from './pages/Revenue';
import { Staff } from './pages/Staff';
import { NotificationsShowcase } from './pages/NotificationsShowcase';
import { OwnerNotifications } from './pages/OwnerNotifications';
import { Dashboard as StaffDashboard } from '../staff/pages/Dashboard';
import { TicketsRoute } from '../shared/tickets/TicketsRoute';
import { SettingsPage } from '../shared/settings/SettingsPage';
import { useUserProfile } from '../shared/profile/useUserProfile';
import { HeaderSearch } from '../shared/search/HeaderSearch';
import { makeGlobalLoad, type GlobalSearchRoutes } from '../shared/search/makeGlobalLoad';
import { PlatformSwitcher } from '../shared/nav/PlatformSwitcher';

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
  legal: () => (
    <LegalPolicies audience="OWNER" defaultSlug="station-owner-license-agreement" queryKeyPrefix="owner" />
  ),
  staff: Staff,
  notifications: OwnerNotifications,
  'notifications-showcase': NotificationsShowcase,
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
  { key: 'legal', icon: <IconBook size={17} /> },
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
  const { avatarUrl } = useUserProfile();
  const { stations, selectedStationId, setSelectedStationId, currentStation } = useOwnerStation();

  const searchLoad = useMemo(() => {
    const routes: GlobalSearchRoutes = {
      TICKET: (tk) => navigate(`${base}/tickets/${tk.id}`),
      CHARGER: () => navigate(`${base}/chargers`),
      BOOKING: () => navigate(`${base}/bookings`),
      LICENSE: () => navigate(`${base}/license`),
      LEGAL_DOCUMENT: () => navigate(`${base}/legal`),
    };
    // Staff subset has no stations route — drop the group instead of a dead row.
    if (!reduced) {
      routes.STATION = (s) => {
        setSelectedStationId(s.id);
        navigate(`${base}/stations?stationId=${s.id}`);
      };
    }
    return makeGlobalLoad(api.search, routes);
  }, [api, base, navigate, reduced, setSelectedStationId]);

  // Same queryKey/queryFn the Dashboard page itself uses — react-query dedupes, no extra network call after first mount.
  const dashboardQuery = useQuery<OwnerDashboardData | StaffDashboardData>({
    queryKey: reduced ? ['dashboard', 'staff'] : ['dashboard', 'owner'],
    queryFn: () => (reduced ? api.dashboard.staff() : api.dashboard.owner()),
  });

  const notifContext = reduced ? 'staff' : 'owner';
  const notifParams = useMemo(
    () => ({
      context: notifContext,
      size: 5,
    }),
    [notifContext],
  );
  const { items: serverNotifications = [] } = useNotifications(notifParams);
  const { data: serverUnreadCount } = useUnreadCount({
    context: notifContext,
  });
  const mutationScope = useMemo(
    () => ({ context: notifContext }),
    [notifContext],
  );
  const markAsRead = useMarkAsRead(mutationScope);
  const markAllAsRead = useMarkAllAsRead(mutationScope);
  const deleteNotif = useDeleteNotification(mutationScope);

  const notificationItems = useMemo<NotificationItem[]>(() => {
    // 1. Defensively extract notifications array regardless of envelope shape
    const notifArray: AppNotification[] = Array.isArray(serverNotifications)
      ? serverNotifications
      : Array.isArray((serverNotifications as any)?.items)
        ? (serverNotifications as any).items
        : Array.isArray((serverNotifications as any)?.data)
          ? (serverNotifications as any).data
          : [];

    const items: NotificationItem[] = notifArray.map((n) => {
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
        } else if (n.target?.type === 'OPEN_BOOKING' && n.target.bookingId) {
          navigate(`${base}/bookings?bookingId=${n.target.bookingId}`);
        } else if (n.target?.type === 'OPEN_TICKET' && n.target.ticketId) {
          navigate(`${base}/tickets/${n.target.ticketId}`);
        } else if (n.target?.type === 'OPEN_REFUND') {
          navigate(`${base}/revenue`);
        } else if (n.category === 'booking') {
          navigate(`${base}/bookings`);
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
  }, [serverNotifications, base, navigate, t]);

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
      stations={
        reduced
          ? undefined
          : stations.map((s) => ({
              id: s.id,
              name: s.name,
              stationCode: s.stationCode,
              city: s.city || s.provinceName,
              status: s.status,
            }))
      }
      selectedStationId={reduced ? undefined : selectedStationId}
      onSelectStation={reduced ? undefined : setSelectedStationId}
      userName={user?.name ?? '···'}
      userEmail={user?.email}
      userAvatarUrl={avatarUrl}
      search={<HeaderSearch load={searchLoad} accent="owner" />}
      platformSwitcher={<PlatformSwitcher />}
      notifications={
        <NotificationBell
          items={notificationItems}
          unreadCount={serverUnreadCount}
          emptyLabel={t('notifications.empty')}
          onOpenCenter={() => navigate(`${base}/notifications`)}
          onMarkRead={(id) => {
            if (id === 'offline' || id === 'license') return;
            markAsRead.mutate(id);
          }}
          onMarkAllRead={() => markAllAsRead.mutate()}
          onDismiss={(id) => {
            if (id === 'offline' || id === 'license') return;
            deleteNotif.mutate(id);
          }}
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
      <OwnerStationProvider reduced={reduced}>
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
