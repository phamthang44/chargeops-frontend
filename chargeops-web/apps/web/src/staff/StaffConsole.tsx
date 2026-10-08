import { useMemo } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ApiProvider, createServices, useApi, resolveNotificationI18n } from '@chargeops/api';
import { useAuth } from '@chargeops/auth';
import {
  AppShell,
  IconBolt,
  IconBook,
  IconCalendar,
  IconGrid,
  IconLifebuoy,
  NotificationBell,
  type NotificationItem,
  type ShellNavItem,
} from '@chargeops/ui';
import { StaffStationProvider, useStaffStation } from './context/StaffStationContext';
import { Dashboard } from './pages/Dashboard';
import { StaffChargers } from './pages/StaffChargers';
import { StaffBookings } from './pages/StaffBookings';
import { StaffNotifications } from './pages/StaffNotifications';
import { TicketsRoute } from '../shared/tickets/TicketsRoute';
import { SettingsPage } from '../shared/settings/SettingsPage';
import { useUserProfile } from '../shared/profile/useUserProfile';
import { PlatformSwitcher } from '../shared/nav/PlatformSwitcher';
import { HeaderSearch } from '../shared/search/HeaderSearch';
import { makeGlobalLoad } from '../shared/search/makeGlobalLoad';
import { LegalPolicies } from '../shared/legal/LegalPolicies';
import {
  useNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
  useDismissNotification,
} from '../shared/notifications/useNotifications';
import { formatRelativeTime } from '../shared/notifications/formatRelativeTime';

const NAV_ICONS: Record<string, React.ReactNode> = {
  dashboard: <IconGrid size={17} />,
  chargers: <IconBolt size={17} />,
  bookings: <IconCalendar size={17} />,
  tickets: <IconLifebuoy size={17} />,
  legal: <IconBook size={17} />,
};

/**
 * Staff operations console (FR17 / Ops-05): four operational screens + notifications + legal.
 */
export function StaffConsole({ base }: { base: string }) {
  const { getToken } = useAuth();
  const { t } = useTranslation('staff');
  const services = useMemo(() => createServices({ ownerView: true, getToken }), [getToken]);
  const location = useLocation();

  const nav: (ShellNavItem & { title: string; subtitle: string })[] = ['dashboard', 'chargers', 'bookings', 'tickets', 'legal'].map(
    (key) => ({
      key,
      icon: NAV_ICONS[key],
      label: t(`console.nav.${key}.label`),
      title: t(`console.nav.${key}.title`),
      subtitle: t(`console.nav.${key}.subtitle`),
    }),
  );

  const activeKey = location.pathname.split('/')[2] || 'dashboard';

  return (
    <ApiProvider services={services}>
      <StaffStationProvider>
        <StaffConsoleContent base={base} nav={nav} activeKey={activeKey} />
      </StaffStationProvider>
    </ApiProvider>
  );
}

function StaffConsoleContent({
  base,
  nav,
  activeKey,
}: {
  base: string;
  nav: (ShellNavItem & { title: string; subtitle: string })[];
  activeKey: string;
}) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t } = useTranslation('staff');
  const { t: tUi } = useTranslation('ui');
  const api = useApi();
  const { avatarUrl } = useUserProfile();
  const { currentStation } = useStaffStation();

  const notifParams = useMemo(
    () => ({
      context: 'staff',
      stationId: currentStation?.id,
      size: 5,
    }),
    [currentStation?.id],
  );
  const { items: serverNotifications = [] } = useNotifications(notifParams);
  const { data: serverUnreadCount } = useUnreadCount({
    context: 'staff',
    stationId: currentStation?.id,
  });
  const mutationScope = useMemo(
    () => ({ context: 'staff', stationId: currentStation?.id }),
    [currentStation?.id],
  );
  const markAsRead = useMarkAsRead(mutationScope);
  const markAllAsRead = useMarkAllAsRead(mutationScope);
  const deleteNotif = useDismissNotification(mutationScope);

  const notificationItems = useMemo<NotificationItem[]>(() => {
    return serverNotifications.map((n) => {
      const displayTime = n.time || formatRelativeTime(n.createdAt, t);

      const navigateToTarget = () => {
        if (n.primaryAction?.actionUrl) {
          navigate(`${base}${n.primaryAction.actionUrl}`);
        } else if (n.target?.type === 'OPEN_BOOKING' && n.target.bookingId) {
          navigate(`${base}/bookings`);
        } else if (n.target?.type === 'OPEN_TICKET' && n.target.ticketId) {
          navigate(`${base}/tickets/${n.target.ticketId}`);
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
  }, [serverNotifications, base, navigate, t]);

  const searchLoad = useMemo(
    () =>
      makeGlobalLoad(api.search, {
        TICKET: (tk) => navigate(`${base}/tickets/${tk.id}`),
        CHARGER: () => navigate(`${base}/chargers`),
        BOOKING: () => navigate(`${base}/bookings`),
        LEGAL_DOCUMENT: () => navigate(`${base}/legal`),
      }),
    [api, base, navigate],
  );

  return (
    <AppShell
      nav={nav}
      activeKey={activeKey}
      onNavigate={(key) => navigate(`${base}/${key}`)}
      accent="owner"
      rolePill={{ label: t('console.role.staff'), bg: 'var(--color-chip)', fg: 'var(--color-muted)' }}
      station={
        currentStation ? `${currentStation.name} (${currentStation.stationCode || currentStation.id})` : undefined
      }
      userName={user?.name ?? '···'}
      userEmail={user?.email}
      userAvatarUrl={avatarUrl}
      search={<HeaderSearch load={searchLoad} accent="owner" />}
      platformSwitcher={<PlatformSwitcher />}
      notifications={
        <NotificationBell
          items={notificationItems}
          unreadCount={serverUnreadCount}
          categories={['all', 'ticket', 'account']}
          emptyLabel={t('notifications.empty', { defaultValue: 'Không có thông báo mới' })}
          onOpenCenter={() => navigate(`${base}/notifications`)}
          onMarkRead={(id) => markAsRead.mutate(id)}
          onMarkAllRead={() => markAllAsRead.mutate()}
          onDismiss={(id) => deleteNotif.mutate(id)}
        />
      }
      onSettings={() => navigate(`${base}/settings`)}
      onLogout={logout}
    >
      <Routes>
        <Route index element={<Navigate to={`${base}/dashboard`} replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="chargers/*" element={<StaffChargers />} />
        <Route path="bookings/*" element={<StaffBookings />} />
        <Route path="tickets/*" element={<TicketsRoute role="staff" />} />
        <Route path="notifications" element={<StaffNotifications base={base} />} />
        <Route
          path="legal"
          element={<LegalPolicies queryKeyPrefix="staff" subtitle={tUi('legal.staffSubtitle')} />}
        />
        <Route path="settings" element={<SettingsPage accent="owner" />} />
        <Route path="*" element={<Navigate to={`${base}/dashboard`} replace />} />
      </Routes>
    </AppShell>
  );
}
