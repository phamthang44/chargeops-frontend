import { useMemo } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { RequireRole, SsoRedirectOverlay, useAuth } from '@chargeops/auth';
import { OwnerConsole } from './owner/OwnerConsole';
import { AdminConsole } from './admin/AdminConsole';
import { DriverNotice } from './DriverNotice';
import { SimulatorPage } from './simulator/SimulatorPage';
import { RequireStaffAssignment } from './staff/RequireStaffAssignment';
import { StaffConsole } from './staff/StaffConsole';

/**
 * Authentication and routing decision tree (by realm role):
 *   platform_admin            → /admin
 *   station_owner             → /owner
 *   staff                     → /staff (RequireStaffAssignment verifies the
 *                               ACTIVE assignment and activates a pending
 *                               invitation when needed)
 *   remaining (driver-only)   → /driver-notice
 */
export function RoleRouter() {
  const { user } = useAuth();
  const isOwner = user?.roles.includes('station_owner');
  const isAdmin = user?.roles.includes('platform_admin');
  const isStaff = user?.roles.includes('staff');

  const home = useMemo(() => {
    if (isAdmin) return '/admin';
    if (isOwner) return '/owner';
    if (isStaff) return '/staff';
    return '/driver-notice';
  }, [isAdmin, isOwner, isStaff]);

  if (!user) {
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
          <RequireRole roles={['station_owner', 'platform_admin']}>
            <OwnerConsole base="/owner" />
          </RequireRole>
        }
      />
      <Route
        path="/staff/*"
        element={
          <RequireStaffAssignment>
            <StaffConsole base="/staff" />
          </RequireStaffAssignment>
        }
      />
      <Route path="/driver-notice" element={<DriverNotice />} />
      <Route path="/" element={<Navigate to={home} replace />} />
      <Route path="*" element={<Navigate to={home} replace />} />
    </Routes>
  );
}

