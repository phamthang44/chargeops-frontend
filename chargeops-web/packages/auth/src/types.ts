import type { ReactNode } from 'react';

export type Role = 'platform_admin' | 'station_owner' | 'station_staff' | 'driver';

export interface AuthUser {
  name: string;
  email: string;
  roles: Role[];
  initials: string;
}

export interface AuthContextValue {
  user: AuthUser | null;
  authenticated: boolean;
  initializing: boolean;
  error: string | null;
  hasRole: (role: Role) => boolean;
  getToken: () => Promise<string | null>;
  logout: () => void;
}

export interface AuthProviderProps {
  /** Mock identity used only when VITE_KEYCLOAK_ENABLED is not true. */
  mockUser: { name: string; email: string; roles: Role[] };
  /** Simulated redirect duration in mock mode. */
  redirectMs?: number;
  children: ReactNode;
}
