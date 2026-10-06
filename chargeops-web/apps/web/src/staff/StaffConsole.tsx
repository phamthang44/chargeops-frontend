import { useMemo } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ApiProvider, createServices, useApi } from '@chargeops/api';
import { useAuth } from '@chargeops/auth';
import {
  AppShell,
  IconBolt,
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
import { HeaderSearch, type Searcher } from '../shared/search/HeaderSearch';

const NAV_ICONS: Record<string, React.ReactNode> = {
  dashboard: <IconGrid size={17} />,
  chargers: <IconBolt size={17} />,
  bookings: <IconCalendar size={17} />,
  tickets: <IconLifebuoy size={17} />,
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

  const nav: (ShellNavItem & { title: string; subtitle: string })[] = ['dashboard', 'chargers', 'bookings', 'tickets'].map(
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
  const api = useApi();
  const { avatarUrl } = useUserProfile();
  const { currentStation } = useStaffStation();

  const searchers = useMemo<Searcher[]>(() => {
    const stationId = currentStation?.id;
    return [
      {
        label: t('search.groups.tickets'),
        run: async (q) => {
          const res = await api.tickets.list({ search: q, pageSize: 5, role: 'staff' });
          return res.items.map((tk) => ({
            id: tk.id,
            title: `${tk.id} · ${tk.subject}`,
            subtitle: tk.stationName ?? undefined,
            onSelect: () => navigate(`${base}/tickets/${tk.id}`),
          }));
        },
      },
      {
        label: t('search.groups.chargers'),
        run: async (q) => {
          if (!stationId) return [];
          const cps = await api.staffOperations.listChargePoints(stationId);
          const ql = q.toLowerCase();
          return cps
            .filter(
              (c) =>
                c.name.toLowerCase().includes(ql) ||
                c.code.toLowerCase().includes(ql) ||
                c.id.toLowerCase().includes(ql),
            )
            .slice(0, 5)
            .map((c) => ({
              id: c.id,
              title: `${c.code || c.id} · ${c.name}`,
              subtitle: c.zoneLabel ? `${t('search.zonePrefix')}: ${c.zoneLabel}` : undefined,
              onSelect: () => navigate(`${base}/chargers`),
            }));
        },
      },
    ];
  }, [api, base, currentStation?.id, navigate, t]);

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
      search={<HeaderSearch searchers={searchers} accent="owner" />}
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
        <Route path="settings" element={<SettingsPage accent="owner" />} />
        <Route path="*" element={<Navigate to={`${base}/dashboard`} replace />} />
      </Routes>
    </AppShell>
  );
}
