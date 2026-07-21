import type { ComponentType } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ApiProvider, createServices } from '@chargeops/api';
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
  const { user } = useAuth();
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

  return (
    <ApiProvider services={services}>
      <AppShell
        nav={nav}
        activeKey={activeKey}
        onNavigate={(key) => navigate(`${base}/${key}`)}
        accent="owner"
        rolePill={
          reduced
            ? { label: t('console.role.staff'), bg: '#eef1f6', fg: '#3a3f4a' }
            : { label: t('console.role.owner'), bg: '#eafaf1', fg: '#0c7a3e' }
        }
        station="Trạm Hà Đông"
        userInitials={user?.initials ?? '··'}
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
          <Route path="*" element={<Navigate to={`${base}/dashboard`} replace />} />
        </Routes>
      </AppShell>
    </ApiProvider>
  );
}
