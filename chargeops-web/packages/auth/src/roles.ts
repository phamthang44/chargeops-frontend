import type { Role } from './types';

const REALM_ROLE_MAP: Record<string, Role> = {
  ADMIN: 'platform_admin',
  OWNER: 'station_owner',
  DRIVER: 'driver',
  STAFF: 'staff',
};

export function rolesFromRealm(realmRoles: string[]): Role[] {
  return [
    ...new Set(
      realmRoles
        .map((role) => REALM_ROLE_MAP[role.toUpperCase()])
        .filter((role): role is Role => Boolean(role)),
    ),
  ];
}

export function resolveHome(roles: Role[]): string {
  if (roles.includes('platform_admin')) return '/admin';
  if (roles.includes('station_owner')) return '/owner';
  // STAFF realm role alone lands on the operations console; RequireStaffAssignment
  // then verifies the ACTIVE assignment (and activates a pending invitation).
  if (roles.includes('staff')) return '/staff';
  return '/driver-notice';
}
