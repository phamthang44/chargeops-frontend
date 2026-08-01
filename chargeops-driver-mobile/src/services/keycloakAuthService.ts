import type { DiscoveryDocument, TokenResponse } from 'expo-auth-session';

import type { AuthSession as AppAuthSession, User } from '@/types';

const DRIVER_ROLE = 'DRIVER';

export const keycloakConfig = {
  issuerUrl: process.env.EXPO_PUBLIC_KEYCLOAK_ISSUER_URL ?? 'http://localhost:8080/realms/chargeops',
  clientId: process.env.EXPO_PUBLIC_KEYCLOAK_DRIVER_CLIENT_ID ?? 'chargeops-driver-mobile',
  redirectScheme: process.env.EXPO_PUBLIC_KEYCLOAK_REDIRECT_SCHEME ?? 'chargeops',
  redirectPath: 'auth/callback',
};

interface KeycloakUserInfo {
  sub?: string;
  name?: string;
  preferred_username?: string;
  email?: string;
  phone_number?: string;
}

interface JwtPayload extends KeycloakUserInfo {
  realm_access?: {
    roles?: string[];
  };
}

function decodeJwtPayload(token?: string): JwtPayload | null {
  if (!token) return null;
  const [, payload] = token.split('.');
  if (!payload || typeof globalThis.atob !== 'function') return null;

  try {
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
    const binary = globalThis.atob(padded);
    const json = decodeURIComponent(
      Array.from(binary)
        .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join(''),
    );
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

async function fetchUserInfo(discovery: DiscoveryDocument, accessToken: string): Promise<KeycloakUserInfo> {
  if (!discovery.userInfoEndpoint) return {};

  const res = await fetch(discovery.userInfoEndpoint, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return {};
  return (await res.json()) as KeycloakUserInfo;
}

function buildDriverUser(payload: JwtPayload | null, userInfo: KeycloakUserInfo): User {
  const id = userInfo.sub ?? payload?.sub ?? 'keycloak-driver';
  const email = userInfo.email ?? payload?.email ?? `${id}@chargeops.local`;
  const name =
    userInfo.name ??
    payload?.name ??
    userInfo.preferred_username ??
    payload?.preferred_username ??
    email;

  return {
    id,
    name,
    email,
    phone: userInfo.phone_number ?? payload?.phone_number ?? '',
    role: DRIVER_ROLE,
    status: 'ACTIVE',
  };
}

export async function createSessionFromKeycloakToken(
  tokenResponse: TokenResponse,
  discovery: DiscoveryDocument,
): Promise<AppAuthSession> {
  const accessToken = tokenResponse.accessToken;
  if (!accessToken) {
    throw new Error('Keycloak did not return an access token.');
  }

  const payload = decodeJwtPayload(accessToken);
  const roles = payload?.realm_access?.roles ?? [];
  if (roles.length > 0 && !roles.includes(DRIVER_ROLE)) {
    throw new Error('Tài khoản này chưa có quyền DRIVER trong Keycloak.');
  }

  const userInfo = await fetchUserInfo(discovery, accessToken);
  return {
    user: buildDriverUser(payload, userInfo),
    tokens: {
      accessToken,
      refreshToken: tokenResponse.refreshToken ?? '',
    },
  };
}
