import type { ComponentType } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiProvider, createServices } from '@chargeops/api';
import { AuthGate, AuthProvider, RequireRole, useAuth } from '@chargeops/auth';
import {
  AppShell,
  ComingSoon,
  IconCalendar,
  IconBolt,
  IconCard,
  IconChat,
  IconGrid,
  IconPin,
  IconShield,
  IconTag,
  ToastProvider,
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
};

const PORTAL_URL = import.meta.env.VITE_PORTAL_URL ?? 'http://localhost:5170';

const NAV: (ShellNavItem & { title: string; subtitle: string })[] = [
  { key: 'dashboard', label: 'Tổng quan', icon: <IconGrid size={17} />, title: 'Tổng quan', subtitle: 'Hiệu suất trạm của bạn hôm nay.' },
  { key: 'bookings', label: 'Đặt chỗ', icon: <IconCalendar size={17} />, title: 'Đặt chỗ', subtitle: 'Theo dõi và xử lý các lượt đặt chỗ tại trạm.' },
  { key: 'chargers', label: 'Trụ sạc', icon: <IconBolt size={17} />, title: 'Trụ sạc', subtitle: 'Tên hiển thị, trạng thái và QR check-in của từng trụ.' },
  { key: 'pricing', label: 'Giá & giờ hoạt động', icon: <IconTag size={17} />, title: 'Giá & giờ hoạt động', subtitle: 'Giá gốc, khung giờ TOU và giờ mở cửa.' },
  { key: 'stations', label: 'Trạm của tôi', icon: <IconPin size={17} />, title: 'Trạm của tôi', subtitle: 'Đăng ký trạm mới và theo dõi trạng thái duyệt.' },
  { key: 'revenue', label: 'Doanh thu', icon: <IconCard size={17} />, title: 'Doanh thu', subtitle: 'Giao dịch, hoàn tiền và doanh thu ròng.' },
  { key: 'license', label: 'Giấy phép', icon: <IconShield size={17} />, title: 'Giấy phép', subtitle: 'Trạng thái giấy phép vận hành của bạn.' },
  { key: 'assistant', label: 'Trợ lý chính sách', icon: <IconChat size={17} />, title: 'Trợ lý chính sách', subtitle: 'Tra cứu quy định hủy, check-in, thanh toán.' },
];

function Shell() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const activeKey = location.pathname.split('/')[1] || 'dashboard';
  const active = NAV.find((n) => n.key === activeKey) ?? NAV[0];

  return (
    <AppShell
      nav={NAV}
      activeKey={activeKey}
      onNavigate={(key) => navigate(`/${key}`)}
      accent="owner"
      rolePill={{ label: 'CHỦ TRẠM', bg: '#eafaf1', fg: '#0c7a3e' }}
      station="Trạm Hà Đông"
      userInitials={user?.initials ?? '··'}
      onBrand={() => {
        window.location.href = PORTAL_URL;
      }}
    >
      <Routes>
        <Route index element={<Navigate to="/dashboard" replace />} />
        {NAV.map((n) => {
          const Page = PAGES[n.key];
          return (
            <Route
              key={n.key}
              path={`/${n.key}`}
              element={Page ? <Page /> : <ComingSoon title={n.title} />}
            />
          );
        })}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AppShell>
  );
}

// Data layer: mock services today (VITE_USE_MOCKS defaults true); flipping the
// env var routes every call to the real REST API — no UI change.
const services = createServices({ ownerView: true });
const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } },
});

export function App() {
  return (
    <AuthProvider
      mockUser={{ name: 'Vũ Anh (EVGo Co.)', email: 'ops@evgo.vn', roles: ['station_owner'] }}
    >
      <AuthGate>
        <RequireRole role="station_owner">
          <ApiProvider services={services}>
            <QueryClientProvider client={queryClient}>
              <ToastProvider>
                <BrowserRouter>
                  <Shell />
                </BrowserRouter>
              </ToastProvider>
            </QueryClientProvider>
          </ApiProvider>
        </RequireRole>
      </AuthGate>
    </AuthProvider>
  );
}
