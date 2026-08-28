import {
  AuthRequest,
  exchangeCodeAsync,
  fetchDiscoveryAsync,
  makeRedirectUri,
  Prompt,
  refreshAsync,
  ResponseType,
  type DiscoveryDocument,
  type TokenResponse,
} from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import type { AuthSession as AppAuthSession, GrantedRole, User } from '@/types';

const DRIVER_ROLE = 'DRIVER';
const CHARGEOPS_ROLES = new Set<GrantedRole>(['DRIVER', 'OWNER', 'ADMIN']);
const WEB_AUTH_TRANSACTION_KEY = 'chargeops.keycloak.webAuthTransaction';

export const keycloakConfig = {
  issuerUrl: process.env.EXPO_PUBLIC_KEYCLOAK_ISSUER_URL ?? 'http://localhost:8080/realms/chargeops',
  clientId: process.env.EXPO_PUBLIC_KEYCLOAK_DRIVER_CLIENT_ID ?? 'chargeops-driver-mobile',
  redirectScheme: process.env.EXPO_PUBLIC_KEYCLOAK_REDIRECT_SCHEME ?? 'chargeops',
  redirectPath: 'auth/callback',
};

export type WebAuthMode = 'interactive' | 'silent';

export interface WebAuthTransaction {
  state: string;
  codeVerifier: string;
  mode: WebAuthMode;
}

export function getKeycloakRedirectUri(): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return window.location.origin;
  }

  return makeRedirectUri({
    scheme: keycloakConfig.redirectScheme,
    path: keycloakConfig.redirectPath,
  });
}

export function hasKeycloakAuthorizationResponse(): boolean {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.has('code') || params.has('error');
}

export function storeWebAuthTransaction(
  state: string,
  codeVerifier: string,
  mode: WebAuthMode,
): void {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  const transaction: WebAuthTransaction = { state, codeVerifier, mode };
  window.sessionStorage.setItem(WEB_AUTH_TRANSACTION_KEY, JSON.stringify(transaction));
}

export function consumeWebAuthTransaction(): WebAuthTransaction | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  const raw = window.sessionStorage.getItem(WEB_AUTH_TRANSACTION_KEY);
  window.sessionStorage.removeItem(WEB_AUTH_TRANSACTION_KEY);
  if (!raw) return null;

  try {
    const value = JSON.parse(raw) as Partial<WebAuthTransaction>;
    if (
      typeof value.state !== 'string' ||
      typeof value.codeVerifier !== 'string' ||
      (value.mode !== 'interactive' && value.mode !== 'silent')
    ) {
      return null;
    }
    return value as WebAuthTransaction;
  } catch {
    return null;
  }
}

/**
 * After a web reload, ask Keycloak for a new authorization code without UI.
 * Keycloak's own HttpOnly SSO cookie decides whether this succeeds.
 */
export async function startSilentWebAuthentication(): Promise<boolean> {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return false;

  const discovery = await fetchDiscoveryAsync(keycloakConfig.issuerUrl);
  const redirectUri = getKeycloakRedirectUri();
  const request = new AuthRequest({
    clientId: keycloakConfig.clientId,
    redirectUri,
    responseType: ResponseType.Code,
    scopes: ['openid', 'profile', 'email'],
    prompt: Prompt.None,
    usePKCE: true,
  });
  const authorizationUrl = await request.makeAuthUrlAsync(discovery);
  if (!request.codeVerifier) {
    throw new Error('Keycloak silent authentication could not create a PKCE verifier.');
  }

  storeWebAuthTransaction(request.state, request.codeVerifier, 'silent');
  window.location.assign(authorizationUrl);
  return true;
}

interface KeycloakUserInfo {
  sub?: string;
  name?: string;
  preferred_username?: string;
  email?: string;
  phone_number?: string;
}

interface JwtPayload extends KeycloakUserInfo {
  exp?: number;
  realm_access?: {
    roles?: string[];
  };
}

function grantedRolesFromRealm(realmRoles: string[]): GrantedRole[] {
  return [
    ...new Set(
      realmRoles
        .map((role) => role.toUpperCase())
        .filter((role): role is GrantedRole => CHARGEOPS_ROLES.has(role as GrantedRole)),
    ),
  ];
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

  const response = await fetch(discovery.userInfoEndpoint, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) return {};
  return (await response.json()) as KeycloakUserInfo;
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

export async function exchangeKeycloakAuthorizationCode(
  code: string,
  codeVerifier: string,
  redirectUri: string,
  discovery: DiscoveryDocument,
): Promise<TokenResponse> {
  return exchangeCodeAsync(
    {
      clientId: keycloakConfig.clientId,
      code,
      redirectUri,
      extraParams: { code_verifier: codeVerifier },
    },
    discovery,
  );
}

export async function createSessionFromKeycloakToken(
  tokenResponse: TokenResponse,
  discovery: DiscoveryDocument,
  previousSession?: AppAuthSession,
): Promise<AppAuthSession> {
  const accessToken = tokenResponse.accessToken;
  if (!accessToken) {
    throw new Error('Dịch vụ đăng nhập chưa trả về phiên xác thực hợp lệ.');
  }

  const payload = decodeJwtPayload(accessToken);
  const grantedRoles = grantedRolesFromRealm(payload?.realm_access?.roles ?? []);
  if (!grantedRoles.includes(DRIVER_ROLE)) {
    throw new Error('Tài khoản này chưa được cấp quyền tài xế trên hệ thống ChargeOps.');
  }

  const refreshToken = tokenResponse.refreshToken ?? previousSession?.tokens.refreshToken;
  if (!refreshToken) {
    throw new Error('Keycloak chưa cấp refresh token cho phiên đăng nhập này.');
  }

  const userInfo = await fetchUserInfo(discovery, accessToken);
  const expiresAt =
    tokenResponse.expiresIn && tokenResponse.expiresIn > 0
      ? Date.now() + tokenResponse.expiresIn * 1_000
      : payload?.exp
        ? payload.exp * 1_000
        : undefined;

  return {
    user: buildDriverUser(payload, userInfo),
    grantedRoles,
    tokens: {
      accessToken,
      refreshToken,
      idToken: tokenResponse.idToken ?? previousSession?.tokens.idToken,
      expiresAt,
    },
  };
}

/** Rotate the in-memory refresh token directly against Keycloak. */
export async function refreshKeycloakSession(session: AppAuthSession): Promise<AppAuthSession> {
  const discovery = await fetchDiscoveryAsync(keycloakConfig.issuerUrl);
  const tokenResponse = await refreshAsync(
    {
      clientId: keycloakConfig.clientId,
      refreshToken: session.tokens.refreshToken,
    },
    discovery,
  );
  return createSessionFromKeycloakToken(tokenResponse, discovery, session);
}

/** End the provider SSO session; all application tokens are already only in RAM. */
export async function logoutKeycloakSession(session: AppAuthSession): Promise<void> {
  const discovery = await fetchDiscoveryAsync(keycloakConfig.issuerUrl);
  if (!discovery.endSessionEndpoint) return;

  const redirectUri = getKeycloakRedirectUri();
  const url = new URL(discovery.endSessionEndpoint);
  if (session.tokens.idToken) {
    url.searchParams.set('id_token_hint', session.tokens.idToken);
  } else {
    url.searchParams.set('client_id', keycloakConfig.clientId);
  }
  url.searchParams.set('post_logout_redirect_uri', redirectUri);

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.location.assign(url.toString());
    return;
  }

  await WebBrowser.openAuthSessionAsync(url.toString(), redirectUri);
}
