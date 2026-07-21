/**
 * @chargeops/auth — authentication for the console apps.
 *
 * MOCK MODE (current): simulates the Keycloak Authorization Code + PKCE
 * round-trip — a short translated "authenticating via Keycloak SSO…" overlay
 * (see src/locales), then a fake token whose realm roles come from the app's
 * configured mock user.
 *
 * REAL MODE (later): replace the inside of AuthProvider with keycloak-js /
 * react-oidc-context against realm `chargeops`. The public API (useAuth,
 * AuthGate, RequireRole) is shaped after Keycloak's token model on purpose —
 * consumers won't change. The browser NEVER sees a password in either mode:
 * credentials are typed on Keycloak's own login page.
 */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Trans, useTranslation } from 'react-i18next';

export type Role = 'platform_admin' | 'station_owner' | 'station_staff' | 'driver';

/**
 * Keycloak realm roles → the app's canonical Role. In real mode, read
 * `realm_access.roles` off the decoded access token and map through this.
 * Unknown/extra realm roles are ignored.
 */
const REALM_ROLE_MAP: Record<string, Role> = {
  ADMIN: 'platform_admin',
  OWNER: 'station_owner',
  STATION_STAFF: 'station_staff',
  DRIVER: 'driver',
};

export function rolesFromRealm(realmRoles: string[]): Role[] {
  return realmRoles.map((r) => REALM_ROLE_MAP[r]).filter((r): r is Role => Boolean(r));
}

/**
 * Precedence ladder for post-login routing. A token may carry several roles
 * (an owner who is also staff, etc.) — route to the highest-privilege console.
 * The path is only a destination; access is still enforced by <RequireRole>
 * on the client and by the backend on every REST call.
 */
export function resolveHome(roles: Role[]): string {
  if (roles.includes('platform_admin')) return '/admin';
  if (roles.includes('station_owner')) return '/owner';
  if (roles.includes('station_staff')) return '/staff';
  return '/driver-notice'; // driver-only or no console role
}

export interface AuthUser {
  name: string;
  email: string;
  roles: Role[];
  initials: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  authenticated: boolean;
  hasRole: (role: Role) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

export interface AuthProviderProps {
  /** Mock identity issued after the simulated SSO redirect. */
  mockUser: { name: string; email: string; roles: Role[] };
  /** Simulated redirect duration in ms. */
  redirectMs?: number;
  children: ReactNode;
}

export function AuthProvider({ mockUser, redirectMs = 650, children }: AuthProviderProps) {
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    // Simulated Keycloak bounce: browser "leaves" for the SSO page and returns
    // with a code that is exchanged for tokens.
    const t = setTimeout(() => setAuthenticated(true), redirectMs);
    return () => clearTimeout(t);
  }, [redirectMs]);

  const value = useMemo<AuthContextValue>(() => {
    const user: AuthUser | null = authenticated
      ? { ...mockUser, initials: initialsOf(mockUser.name) }
      : null;
    return {
      user,
      authenticated,
      hasRole: (role) => user?.roles.includes(role) ?? false,
      logout: () => {
        // Real mode: keycloak.logout() — ends the SSO session and redirects.
        window.location.reload();
      },
    };
  }, [authenticated, mockUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Full-screen dark overlay shown during the (simulated) Keycloak redirect. */
export function SsoRedirectOverlay() {
  const { t } = useTranslation('auth');
  return (
    <div
      className="fixed inset-0 z-90 flex flex-col items-center justify-center gap-[22px] bg-night"
      style={{ animation: 'fadeIn .2s ease' }}
    >
      <div className="flex items-center gap-[11px]">
        <span className="inline-flex h-[26px] w-[26px] items-center justify-center rounded-[7px] bg-brand">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="13 2 4 14 11 14 10 22 20 9 13 9 13 2" />
          </svg>
        </span>
        <span className="text-[20px] font-bold tracking-[-0.01em] text-white">ChargeOps</span>
      </div>
      <div
        className="h-[34px] w-[34px] rounded-full border-[3px] border-white/15 border-t-brand"
        style={{ animation: 'spin360 .8s linear infinite' }}
      />
      <div className="text-[13px] font-medium text-[#8b8f99]">{t('sso.redirecting')}</div>
    </div>
  );
}

/** Renders the SSO overlay until the session is established. */
export function AuthGate({ children }: { children: ReactNode }) {
  const { authenticated } = useAuth();
  if (!authenticated) return <SsoRedirectOverlay />;
  return <>{children}</>;
}

/** Role guard — mirrors what the backend enforces on every REST call. */
export function RequireRole({ role, children }: { role: Role; children: ReactNode }) {
  const { t } = useTranslation('auth');
  const { hasRole, user } = useAuth();
  if (!hasRole(role)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-canvas p-8 text-center">
        <div className="text-[17px] font-bold">{t('requireRole.title')}</div>
        <div className="max-w-[420px] text-[13px] text-muted">
          <Trans
            t={t}
            i18nKey="requireRole.body"
            values={{ email: user?.email ?? '—', role }}
            components={{ bold: <b /> }}
          />
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
