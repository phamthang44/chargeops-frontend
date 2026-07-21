import { useTranslation } from 'react-i18next';
import type { ComponentType } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
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
  const { user } = useAuth();
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

  return (
    <ApiProvider services={services}>
      <AppShell
        nav={NAV}
        activeKey={activeKey}
        onNavigate={(key) => navigate(`${base}/${key}`)}
        accent="brand"
        rolePill={{ label: t('console.role'), bg: '#16171a', fg: '#ffffff' }}
        userInitials={user?.initials ?? '··'}
        searchPlaceholder={t('console.searchPlaceholder')}
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
          <Route path="*" element={<Navigate to={`${base}/dashboard`} replace />} />
        </Routes>
      </AppShell>
    </ApiProvider>
  );
}
