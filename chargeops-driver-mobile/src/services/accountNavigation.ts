import { Linking, Platform } from 'react-native';

import i18n from '@/i18n';
import { keycloakConfig } from '@/services/keycloakAuthService';

/** Build the Keycloak Account Console URL for the configured realm. */
export function getKeycloakAccountUrl(): string {
  const configuredUrl = process.env.EXPO_PUBLIC_KEYCLOAK_ACCOUNT_URL?.trim();
  const accountUrl = configuredUrl || `${keycloakConfig.issuerUrl.replace(/\/+$/, '')}/account`;
  const url = new URL(accountUrl);

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('The Keycloak account URL must use HTTP or HTTPS.');
  }

  return url.toString();
}

/** Open the custom ChargeOps security landing page instead of Keycloak Personal Info. */
export function getKeycloakSecurityUrl(): string {
  const url = new URL(getKeycloakAccountUrl());
  const locale = i18n.resolvedLanguage?.toLowerCase().startsWith('en') ? 'en' : 'vi';

  url.pathname = `${url.pathname.replace(/\/+$/, '')}/security`;
  url.searchParams.set('kc_locale', locale);
  url.hash = '';
  return url.toString();
}

/** Open Keycloak rather than handling passwords, MFA, or active sessions in ChargeOps. */
export async function openKeycloakAccountManagement(): Promise<void> {
  await openExternalAccountUrl(getKeycloakAccountUrl());
}

/** Open password and authenticator management directly in Keycloak Account Security. */
export async function openKeycloakSecuritySettings(): Promise<void> {
  await openExternalAccountUrl(getKeycloakSecurityUrl());
}

async function openExternalAccountUrl(url: string): Promise<void> {

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const accountWindow = window.open(url, '_blank');
    if (accountWindow) {
      accountWindow.opener = null;
      return;
    }

    window.location.assign(url);
    return;
  }

  const supported = await Linking.canOpenURL(url);
  if (!supported) {
    throw new Error('No browser is available to open Keycloak Account Console.');
  }

  await Linking.openURL(url);
}
