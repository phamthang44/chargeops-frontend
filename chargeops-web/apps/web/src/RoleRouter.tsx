import { Navigate, Route, Routes } from 'react-router-dom';
import { RequireRole, resolveHome, useAuth } from '@chargeops/auth';
import { OwnerConsole } from './owner/OwnerConsole';
import { AdminConsole } from './admin/AdminConsole';
import { DriverNotice } from './DriverNotice';

/**
 * The whole point of the single-app design: after Keycloak issues a token, the
 * signed roles — not any user choice — decide where you land.
 *
 *   /            → redirect to the highest-privilege console for this token
 *   /admin/*     → platform_admin only
 *   /owner/*     → station_owner only
 *   /staff/*     → station_staff only (owner shell, reduced menu)
 *   /driver-notice → driver-only tokens
 *
 * Typing `/admin` without the ADMIN role does NOT grant access: <RequireRole>
 * renders the "no access" screen, and the backend rejects every admin API call
 * the token isn't entitled to. The URL is a destination, not a permission.
 */
export function RoleRouter() {
  const { user } = useAuth();
  const home = resolveHome(user?.roles ?? []);

  return (
    <Routes>
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
          <RequireRole role="station_staff">
            <OwnerConsole base="/staff" reduced />
          </RequireRole>
        }
      />
      <Route path="/driver-notice" element={<DriverNotice />} />
      <Route path="/" element={<Navigate to={home} replace />} />
      <Route path="*" element={<Navigate to={home} replace />} />
    </Routes>
  );
}
