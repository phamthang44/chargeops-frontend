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
};

const NAV: (ShellNavItem & { title: string })[] = [
  { key: 'dashboard', label: 'Tổng quan', icon: <IconGrid size={17} />, title: 'Tổng quan' },
  { key: 'approvals', label: 'Duyệt trạm', icon: <IconClipboardCheck size={17} />, title: 'Duyệt trạm' },
  { key: 'provisioning', label: 'Cấp trụ sạc', icon: <IconPlusCircle size={17} />, title: 'Cấp trụ sạc' },
  { key: 'bookings', label: 'Đặt chỗ', icon: <IconCalendar size={17} />, title: 'Đặt chỗ toàn nền tảng' },
  { key: 'transactions', label: 'Giao dịch', icon: <IconCard size={17} />, title: 'Giao dịch' },
  { key: 'licenses', label: 'Giấy phép', icon: <IconShield size={17} />, title: 'Giấy phép' },
  { key: 'users', label: 'Người dùng', icon: <IconUsers size={17} />, title: 'Người dùng' },
  { key: 'analytics', label: 'Phân tích', icon: <IconBarChart size={17} />, title: 'Phân tích' },
  { key: 'kb', label: 'Kho chính sách', icon: <IconBook size={17} />, title: 'Kho chính sách' },
];

// Admin console sees platform-wide (unscoped) data.
const services = createServices({ ownerView: false });

/** Platform admin console, mounted at `/admin`. */
export function AdminConsole({ base }: { base: string }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const activeKey = location.pathname.split('/')[2] || 'dashboard';

  return (
    <ApiProvider services={services}>
      <AppShell
        nav={NAV}
        activeKey={activeKey}
        onNavigate={(key) => navigate(`${base}/${key}`)}
        accent="brand"
        rolePill={{ label: 'QUẢN TRỊ VIÊN', bg: '#16171a', fg: '#ffffff' }}
        userInitials={user?.initials ?? '··'}
        searchPlaceholder="Tìm đặt chỗ, trụ, trạm, chủ trạm…"
      >
        <Routes>
          <Route index element={<Navigate to={`${base}/dashboard`} replace />} />
          {NAV.map((n) => {
            const Page = PAGES[n.key];
            return (
              <Route
                key={n.key}
                path={n.key}
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
