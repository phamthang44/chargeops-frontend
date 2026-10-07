import { useMemo } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ApiProvider, createServices, useApi } from '@chargeops/api';
import { useAuth } from '@chargeops/auth';
import {
  AppShell,
  IconBolt,
  IconBook,
  IconCalendar,
  IconGrid,
  IconLifebuoy,
  type ShellNavItem,
} from '@chargeops/ui';
import { StaffStationProvider, useStaffStation } from './context/StaffStationContext';
import { Dashboard } from './pages/Dashboard';
import { StaffChargers } from './pages/StaffChargers';
import { StaffBookings } from './pages/StaffBookings';
import { TicketsRoute } from '../shared/tickets/TicketsRoute';
import { SettingsPage } from '../shared/settings/SettingsPage';
import { useUserProfile } from '../shared/profile/useUserProfile';
import { PlatformSwitcher } from '../shared/nav/PlatformSwitcher';
import { HeaderSearch } from '../shared/search/HeaderSearch';
import { makeGlobalLoad } from '../shared/search/makeGlobalLoad';
import { LegalPolicies } from '../shared/legal/LegalPolicies';

const NAV_ICONS: Record<string, React.ReactNode> = {
  dashboard: <IconGrid size={17} />,
  chargers: <IconBolt size={17} />,
  bookings: <IconCalendar size={17} />,
  tickets: <IconLifebuoy size={17} />,
  legal: <IconBook size={17} />,
};

/**
 * Staff operations console (FR17 / Ops-05): exactly four screens — dashboard,
 * equipment, charging schedule and support tickets. Nothing owner-only exists
 * here, so a hand-typed URL falls back to the dashboard. This is UX
 * convenience, not the security boundary: BR-ACC-05 requires the server to
 * enforce the assignment independently (`@PreAuthorize("hasRole('STAFF')")`).
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
      notifications={null}
      onSettings={() => navigate(`${base}/settings`)}
      onLogout={logout}
    >
      <Routes>
        <Route index element={<Navigate to={`${base}/dashboard`} replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="chargers/*" element={<StaffChargers />} />
        <Route path="bookings/*" element={<StaffBookings />} />
        <Route path="tickets/*" element={<TicketsRoute role="staff" />} />
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
