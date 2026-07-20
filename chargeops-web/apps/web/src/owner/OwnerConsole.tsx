import type { ComponentType } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
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

/** Station staff reuse the owner shell but only see day-to-day operations. */
const STAFF_KEYS = new Set(['dashboard', 'bookings', 'chargers']);

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
  const nav = reduced ? NAV.filter((n) => STAFF_KEYS.has(n.key)) : NAV;
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
            ? { label: 'NHÂN VIÊN TRẠM', bg: '#eef1f6', fg: '#3a3f4a' }
            : { label: 'CHỦ TRẠM', bg: '#eafaf1', fg: '#0c7a3e' }
        }
        station="Trạm Hà Đông"
        userInitials={user?.initials ?? '··'}
      >
        <Routes>
          <Route index element={<Navigate to={`${base}/dashboard`} replace />} />
          {nav.map((n) => {
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
