import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  getKeycloakClient,
  initialsOf,
  initializeKeycloak,
  isKeycloakEnabled,
  userFromKeycloak,
} from './keycloak-client';
import type { AuthContextValue, AuthProviderProps, AuthUser } from './types';

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}

export function AuthProvider({ mockUser, redirectMs = 650, children }: AuthProviderProps) {
  const realMode = isKeycloakEnabled();
  const keycloak = getKeycloakClient();
  const [authenticated, setAuthenticated] = useState(false);
  const [initializing, setInitializing] = useState(realMode);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!realMode || !keycloak) {
      const timer = window.setTimeout(() => {
        setUser({ ...mockUser, initials: initialsOf(mockUser.name) });
        setAuthenticated(true);
        setInitializing(false);
      }, redirectMs);

      return () => window.clearTimeout(timer);
    }

    let cancelled = false;
    setInitializing(true);
    setError(null);

    keycloak.onTokenExpired = () => {
      void keycloak.updateToken(70).catch((err) => {
        console.warn('Keycloak token update attempt in background:', err);
      });
    };

    // Proactive background heartbeat: refresh token if expires in under 70 seconds
    const refreshInterval = window.setInterval(() => {
      if (!cancelled && keycloak && keycloak.authenticated) {
        keycloak.updateToken(70).catch(() => {
          /* background silent refresh attempt */
        });
      }
    }, 15_000);

    // Multi-monitor & Tab-switch guard: immediately refresh token when user focuses or returns to the tab
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible' && !cancelled && keycloak && keycloak.authenticated) {
        keycloak.updateToken(70).catch(() => {
          /* silent background attempt */
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    void initializeKeycloak()
      .then((isAuthenticated) => {
        if (cancelled) return;
        setAuthenticated(isAuthenticated);
        setUser(isAuthenticated ? userFromKeycloak(keycloak) : null);
        setInitializing(false);
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        setError(reason instanceof Error ? reason.message : 'Unable to connect to Keycloak.');
        setAuthenticated(false);
        setInitializing(false);
      });

    return () => {
      cancelled = true;
      window.clearInterval(refreshInterval);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      keycloak.onTokenExpired = undefined;
    };
  }, [keycloak, mockUser, realMode, redirectMs]);

  const getToken = useCallback(async (): Promise<string | null> => {
    if (!realMode || !keycloak) return null;

    try {
      await keycloak.updateToken(30);
      return keycloak.token ?? null;
    } catch {
      // Non-destructive fallback: return cached token and avoid destroying active session/UI state
      return keycloak.token ?? null;
    }
  }, [keycloak, realMode]);

  const logout = useCallback(() => {
    if (realMode && keycloak) {
      void keycloak.logout({ redirectUri: window.location.origin });
      return;
    }

    window.location.reload();
  }, [keycloak, realMode]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      authenticated,
      initializing,
      error,
      hasRole: (role) => user?.roles.includes(role) ?? false,
      getToken,
      logout,
    }),
    [authenticated, error, getToken, initializing, logout, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
