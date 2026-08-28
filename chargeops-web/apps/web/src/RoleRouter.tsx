import { useMemo } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { RequireRole, SsoRedirectOverlay, useAuth } from '@chargeops/auth';
import { OwnerConsole } from './owner/OwnerConsole';
import { AdminConsole } from './admin/AdminConsole';
import { DriverNotice } from './DriverNotice';
import { SimulatorPage } from './simulator/SimulatorPage';
import { RequireStaffAssignment, useStaffContext } from './staff/RequireStaffAssignment';

/**
 * Authentication and routing decision tree:
 *   ADMIN                     → /admin
 *   OWNER                     → /owner
 *   Active staff context      → /staff
 *   Remaining (driver-only)   → /driver-notice
 */
export function RoleRouter() {
  const { user } = useAuth();
  const isOwner = user?.roles.includes('station_owner');
  const isAdmin = user?.roles.includes('platform_admin');
  const staffQ = useStaffContext();

  const home = useMemo(() => {
    if (isAdmin) return '/admin';
    if (isOwner) return '/owner';
    if (staffQ.isLoading) return null;
    if (staffQ.data?.staff && staffQ.data?.assignmentStatus === 'ACTIVE') return '/staff';
    return '/driver-notice';
  }, [isAdmin, isOwner, staffQ.data, staffQ.isLoading]);

  if (home === null) {
    return <SsoRedirectOverlay />;
  }

  return (
    <Routes>
      <Route path="/simulator" element={<SimulatorPage />} />
      <Route path="/simulator/:connectorId" element={<SimulatorPage />} />
      <Route
        path="/admin/*"
        element={
          <RequireRole role="platform_admin">
            <AdminConsole base="/admin" />
          </RequireRole>
        }
      />
      <Route
        path="/owner/*"
        element={
          <RequireRole role="station_owner">
            <OwnerConsole base="/owner" />
          </RequireRole>
        }
      />
      <Route
        path="/staff/*"
        element={
          <RequireStaffAssignment>
            <OwnerConsole base="/staff" reduced />
          </RequireStaffAssignment>
        }
      />
      <Route path="/driver-notice" element={<DriverNotice />} />
      <Route path="/" element={<Navigate to={home} replace />} />
      <Route path="*" element={<Navigate to={home} replace />} />
    </Routes>
  );
}

