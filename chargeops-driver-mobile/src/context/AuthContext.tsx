import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Platform } from 'react-native';

import type {
  AuthSession,
  UpdateUserProfileRequest,
  UserProfile,
} from '@/types';
import {
  hasKeycloakAuthorizationResponse,
  logoutKeycloakSession,
  refreshKeycloakSession,
  startSilentWebAuthentication,
} from '@/services/keycloakAuthService';
import {
  getCurrentProfile,
  updateCurrentProfile,
} from '@/services/profileService';
import { setStationApiTokenProvider } from '@/services/stationService';

export type ProfileStatus = 'idle' | 'loading' | 'ready' | 'error';

interface AuthContextValue {
  session: AuthSession | null;
  initializing: boolean;
  profile: UserProfile | null;
  profileStatus: ProfileStatus;
  profileError: Error | null;
  signIn: (session: AuthSession) => void;
  signOut: () => Promise<void>;
  getAccessToken: () => string | null;
  retryProfile: () => Promise<void>;
  completeProfile: (request: UpdateUserProfileRequest) => Promise<UserProfile>;
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
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileStatus, setProfileStatus] = useState<ProfileStatus>('idle');
  const [profileError, setProfileError] = useState<Error | null>(null);

  useEffect(() => {
    setStationApiTokenProvider(() => session?.tokens.accessToken ?? null);
    return () => {
      setStationApiTokenProvider(() => null);
    };
  }, [session]);

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

  useEffect(() => {
    let active = true;

    if (!session) {
      setProfile(null);
      setProfileStatus('idle');
      setProfileError(null);
      return;
    }

    if (session.tokens.accessToken.startsWith('mock-')) {
      setProfile(profileFromMockSession(session));
      setProfileStatus('ready');
      setProfileError(null);
      return;
    }

    setProfile(null);
    setProfileStatus('loading');
    setProfileError(null);
    void getCurrentProfile(session.tokens.accessToken)
      .then((loadedProfile) => {
        if (!active) return;
        setProfile(loadedProfile);
        setSession((current) => syncSessionWithProfile(current, loadedProfile));
        setProfileStatus('ready');
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setProfileError(toError(reason));
        setProfileStatus('error');
      });

    return () => {
      active = false;
    };
  }, [session?.user.id]);

  const retryProfile = useCallback(async () => {
    if (!session) return;

    if (session.tokens.accessToken.startsWith('mock-')) {
      setProfile(profileFromMockSession(session));
      setProfileStatus('ready');
      setProfileError(null);
      return;
    }

    setProfileStatus('loading');
    setProfileError(null);
    try {
      const loadedProfile = await getCurrentProfile(session.tokens.accessToken);
      setProfile(loadedProfile);
      setSession((current) => syncSessionWithProfile(current, loadedProfile));
      setProfileStatus('ready');
    } catch (reason: unknown) {
      setProfileError(toError(reason));
      setProfileStatus('error');
    }
  }, [session]);

  const completeProfile = useCallback(
    async (request: UpdateUserProfileRequest): Promise<UserProfile> => {
      if (!session) {
        throw new Error('Authentication is required to update the profile.');
      }

      const updatedProfile = session.tokens.accessToken.startsWith('mock-')
        ? {
            ...profileFromMockSession(session),
            displayName: request.displayName,
            phone: request.phone,
            profileCompleted: true,
          }
        : await updateCurrentProfile(session.tokens.accessToken, request);

      setProfile(updatedProfile);
      setProfileStatus('ready');
      setProfileError(null);
      setSession((current) => syncSessionWithProfile(current, updatedProfile));
      return updatedProfile;
    },
    [session],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      initializing,
      profile,
      profileStatus,
      profileError,
      signIn: (nextSession) => {
        setProfile(null);
        setProfileStatus('idle');
        setProfileError(null);
        setSession(nextSession);
      },
      signOut: async () => {
        const current = session;
        setProfile(null);
        setProfileStatus('idle');
        setProfileError(null);
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
      retryProfile,
      completeProfile,
    }),
    [
      completeProfile,
      initializing,
      profile,
      profileError,
      profileStatus,
      retryProfile,
      session,
    ],
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

function profileFromMockSession(session: AuthSession): UserProfile {
  return {
    id: session.user.id,
    keycloakId: session.user.id,
    email: session.user.email,
    displayName: session.user.name || null,
    phone: session.user.phone || null,
    status: session.user.status,
    profileCompleted: Boolean(session.user.name.trim() && session.user.phone.trim()),
  };
}

function toError(reason: unknown): Error {
  return reason instanceof Error ? reason : new Error('Unable to load the current profile.');
}

function syncSessionWithProfile(
  session: AuthSession | null,
  profile: UserProfile,
): AuthSession | null {
  if (!session) return null;
  return {
    ...session,
    user: {
      ...session.user,
      name: profile.displayName ?? session.user.name,
      email: profile.email,
      phone: profile.phone ?? '',
      status: profile.status,
    },
  };
}
