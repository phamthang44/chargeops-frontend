import type { ReactNode } from 'react';

export type Role = 'platform_admin' | 'station_owner' | 'driver' | 'staff';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  roles: Role[];
  initials: string;
  avatarUrl?: string | null;
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
  mockUser: { id?: string; name: string; email: string; roles: Role[] };
  /** Simulated redirect duration in mock mode. */
  redirectMs?: number;
  children: ReactNode;
}
