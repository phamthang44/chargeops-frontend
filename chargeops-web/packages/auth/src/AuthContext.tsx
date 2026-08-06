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
      void keycloak.updateToken(30).catch(() => {
        if (cancelled) return;
        setError('The Keycloak session expired. Please sign in again.');
        setAuthenticated(false);
      });
    };

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
      keycloak.onTokenExpired = undefined;
    };
  }, [keycloak, mockUser, realMode, redirectMs]);

  const getToken = useCallback(async (): Promise<string | null> => {
    if (!realMode || !keycloak || !authenticated) return null;

    try {
      await keycloak.updateToken(30);
      return keycloak.token ?? null;
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : 'Unable to refresh the Keycloak token.');
      setAuthenticated(false);
      return null;
    }
  }, [authenticated, keycloak, realMode]);

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
