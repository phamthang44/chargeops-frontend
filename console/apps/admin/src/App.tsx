import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiProvider, createServices } from '@chargeops/api';
import { AuthGate, AuthProvider, RequireRole, useAuth } from '@chargeops/auth';
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

const PORTAL_URL = import.meta.env.VITE_PORTAL_URL ?? 'http://localhost:5170';

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

function Shell() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const activeKey = location.pathname.split('/')[1] || 'dashboard';

  return (
    <AppShell
      nav={NAV}
      activeKey={activeKey}
      onNavigate={(key) => navigate(`/${key}`)}
      accent="brand"
      rolePill={{ label: 'QUẢN TRỊ VIÊN', bg: '#16171a', fg: '#ffffff' }}
      userInitials={user?.initials ?? '··'}
      searchPlaceholder="Tìm đặt chỗ, trụ, trạm, chủ trạm…"
      onBrand={() => {
        window.location.href = PORTAL_URL;
      }}
    >
      <Routes>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        {NAV.filter((n) => n.key !== 'dashboard').map((n) => (
          <Route key={n.key} path={`/${n.key}`} element={<ComingSoon title={n.title} />} />
        ))}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AppShell>
  );
}

// Data layer: mock services today; VITE_USE_MOCKS=false switches to the real
// REST API — no UI change. Admin console sees platform-wide (unscoped) data.
const services = createServices({ ownerView: false });
const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } },
});

export function App() {
  return (
    <AuthProvider
      mockUser={{ name: 'Quản trị hệ thống', email: 'admin@chargeops.vn', roles: ['platform_admin'] }}
    >
      <AuthGate>
        <RequireRole role="platform_admin">
          <ApiProvider services={services}>
            <QueryClientProvider client={queryClient}>
              <BrowserRouter>
                <Shell />
              </BrowserRouter>
            </QueryClientProvider>
          </ApiProvider>
        </RequireRole>
      </AuthGate>
    </AuthProvider>
  );
}
