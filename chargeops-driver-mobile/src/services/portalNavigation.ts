import { Linking, Platform } from 'react-native';

const DEFAULT_OWNER_PORTAL_URL = 'http://localhost:5173';

/** Build an explicit owner route so the operator portal never falls back to its highest-role home. */
export function getOwnerPortalUrl(): string {
  const configuredUrl =
    process.env.EXPO_PUBLIC_OWNER_PORTAL_URL?.trim() || DEFAULT_OWNER_PORTAL_URL;
  const url = new URL(`${configuredUrl.replace(/\/+$/, '')}/owner`);

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('The owner portal URL must use HTTP or HTTPS.');
  }

  return url.toString();
}

/**
 * Expo Web keeps the driver session alive in its current tab. Native opens the
 * system browser, where the owner web client establishes its own Keycloak SSO session.
 */
export async function openOwnerPortal(): Promise<void> {
  const url = getOwnerPortalUrl();

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const ownerWindow = window.open(url, '_blank');
    if (ownerWindow) {
      ownerWindow.opener = null;
      return;
    }

    window.location.assign(url);
    return;
  }

  const supported = await Linking.canOpenURL(url);
  if (!supported) {
    throw new Error('No browser is available to open the owner portal.');
  }

  await Linking.openURL(url);
}
