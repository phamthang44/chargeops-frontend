import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthGate, AuthProvider, type Role } from '@chargeops/auth';
import { ToastProvider } from '@chargeops/ui';
import { RoleRouter } from './RoleRouter';

/**
 * ChargeOps operator console — one app, one origin, one Keycloak client.
 *
 * MOCK MODE (current): there is no portal picker. We stand in for a Keycloak
 * token by choosing a mock identity; `?as=admin|owner|staff|driver` in the URL
 * selects which set of realm roles the "token" carries (default: owner). This
 * is purely a demo affordance — in real mode the roles come from the decoded
 * access token via rolesFromRealm(realm_access.roles) and nothing is picked.
 */
const MOCK_USERS: Record<string, { name: string; email: string; roles: Role[] }> = {
  admin: { name: 'Quản trị hệ thống', email: 'admin@chargeops.vn', roles: ['platform_admin'] },
  owner: { name: 'Vũ Anh (EVGo Co.)', email: 'ops@evgo.vn', roles: ['station_owner'] },
  staff: { name: 'Nhân viên Trạm Hà Đông', email: 'staff@evgo.vn', roles: ['station_staff'] },
  driver: { name: 'Tài xế', email: 'driver@chargeops.vn', roles: ['driver'] },
};

function pickMockUser() {
  const as = new URLSearchParams(window.location.search).get('as');
  return MOCK_USERS[as ?? ''] ?? MOCK_USERS.owner;
}

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } },
});

export function App() {
  return (
    <AuthProvider mockUser={pickMockUser()}>
      <AuthGate>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <BrowserRouter>
              <RoleRouter />
            </BrowserRouter>
          </ToastProvider>
        </QueryClientProvider>
      </AuthGate>
    </AuthProvider>
  );
}
