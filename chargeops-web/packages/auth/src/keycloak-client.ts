import Keycloak, { type KeycloakInstance } from 'keycloak-js';
import { rolesFromRealm } from './roles';
import type { AuthUser } from './types';

const KEYCLOAK_ENABLED = import.meta.env.VITE_KEYCLOAK_ENABLED === 'true';

let keycloakClient: KeycloakInstance | null = null;
let keycloakInitPromise: Promise<boolean> | null = null;

function keycloakConfig(): { url: string; realm: string; clientId: string } {
  return {
    url: import.meta.env.VITE_KEYCLOAK_URL ?? 'http://localhost:8080',
    realm: import.meta.env.VITE_KEYCLOAK_REALM ?? 'chargeops',
    clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID ?? 'chargeops-web',
  };
}

function keycloakLocale(): 'vi' | 'en' {
  return window.localStorage.getItem('chargeops.lang') === 'en' ? 'en' : 'vi';
}

export function isKeycloakEnabled(): boolean {
  return KEYCLOAK_ENABLED;
}

export function getKeycloakClient(): KeycloakInstance | null {
  if (!KEYCLOAK_ENABLED) return null;
  keycloakClient ??= new Keycloak(keycloakConfig());
  return keycloakClient;
}

/**
 * Keycloak forbids calling init() more than once on the same instance.
 * Keeping both the client and its init promise at module scope also makes
 * development mode safe when React StrictMode re-runs effects.
 */
export function initializeKeycloak(): Promise<boolean> {
  const client = getKeycloakClient();
  if (!client) return Promise.resolve(false);

  keycloakInitPromise ??= client.init({
    onLoad: 'login-required',
    pkceMethod: 'S256',
    checkLoginIframe: false,
    redirectUri: window.location.href,
    locale: keycloakLocale(),
  });

  return keycloakInitPromise;
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

export function userFromKeycloak(client: KeycloakInstance): AuthUser {
  const parsed = client.tokenParsed ?? {};
  const name = String(parsed.name ?? parsed.preferred_username ?? parsed.email ?? 'ChargeOps user');
  const email = String(parsed.email ?? parsed.preferred_username ?? '');
  const realmRoles = Array.isArray(parsed.realm_access?.roles) ? parsed.realm_access.roles : [];

  return {
    name,
    email,
    roles: rolesFromRealm(realmRoles),
    initials: initialsOf(name),
  };
}
