import * as SecureStore from 'expo-secure-store';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import type { AuthSession } from '@/types';

const SESSION_KEY = 'chargeops.driver.authSession';

interface AuthContextValue {
  session: AuthSession | null;
  initializing: boolean;
  signIn: (session: AuthSession) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Holds the authenticated session in memory and drives protected routing.
 * Skeleton scope: in-memory only. LATER: persist tokens via expo-secure-store
 * and add refresh-token rotation.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    let alive = true;

    async function restoreSession() {
      try {
        const stored = await SecureStore.getItemAsync(SESSION_KEY);
        if (alive && stored) setSession(JSON.parse(stored) as AuthSession);
      } finally {
        if (alive) setInitializing(false);
      }
    }

    void restoreSession();
    return () => {
      alive = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      initializing,
      signIn: (next) => {
        setSession(next);
        void SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(next));
      },
      signOut: () => {
        setSession(null);
        void SecureStore.deleteItemAsync(SESSION_KEY);
      },
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
