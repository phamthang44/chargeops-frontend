import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

import type { AuthSession } from '@/types';
import {
  hasKeycloakAuthorizationResponse,
  logoutKeycloakSession,
  refreshKeycloakSession,
  startSilentWebAuthentication,
} from '@/services/keycloakAuthService';

interface AuthContextValue {
  session: AuthSession | null;
  initializing: boolean;
  signIn: (session: AuthSession) => void;
  signOut: () => Promise<void>;
  getAccessToken: () => string | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Holds the authenticated session in memory and drives protected routing.
 * Access, refresh and ID tokens never leave React memory. While the app is
 * running it rotates the refresh token directly with Keycloak. After a web
 * reload, Keycloak's own HttpOnly SSO cookie is used for a silent PKCE flow.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    let alive = true;

    async function bootstrapSession() {
      if (Platform.OS !== 'web' || hasKeycloakAuthorizationResponse()) {
        if (alive) setInitializing(false);
        return;
      }

      try {
        const redirectStarted = await startSilentWebAuthentication();
        if (alive && !redirectStarted) setInitializing(false);
      } catch {
        if (alive) {
          setSession(null);
          setInitializing(false);
        }
      }
    }

    void bootstrapSession();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!session || session.tokens.accessToken.startsWith('mock-') || !session.tokens.expiresAt) {
      return;
    }

    const refreshInMs = Math.max(1_000, session.tokens.expiresAt - Date.now() - 30_000);
    const timer = setTimeout(() => {
      void refreshKeycloakSession(session)
        .then(setSession)
        .catch(() => setSession(null));
    }, refreshInMs);
    return () => clearTimeout(timer);
  }, [session]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      initializing,
      signIn: setSession,
      signOut: async () => {
        const current = session;
        setSession(null);
        if (current && !current.tokens.accessToken.startsWith('mock-')) {
          try {
            await logoutKeycloakSession(current);
          } catch {
            // The in-memory session is already gone if provider logout is unavailable.
          }
        }
      },
      getAccessToken: () => session?.tokens.accessToken ?? null,
    }),
    [initializing, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Access the auth session and sign in/out actions. */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
