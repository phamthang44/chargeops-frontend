import Constants from 'expo-constants';
import { NativeModules, Platform } from 'react-native';

/**
 * Detects the development machine's IP address currently serving the Metro bundle.
 * On Web: returns 'localhost'
 * On Native (iOS / Android in dev): extracts the host from Metro hostUri or scriptURL
 */
export function getDevServerHost(): string {
  if (Platform.OS === 'web') {
    return 'localhost';
  }

  // 1. Primary Expo SDK hostUri (e.g. "192.168.0.100:8082" or "100.81.52.73:8082")
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return host;
    }
  }

  // 2. Legacy / alternative manifest host
  const legacyHost =
    (Constants as unknown as { manifest2?: { extra?: { expoClient?: { hostUri?: string } } }; manifest?: { debuggerHost?: string } })
      .manifest2?.extra?.expoClient?.hostUri ||
    (Constants as unknown as { manifest?: { debuggerHost?: string } }).manifest?.debuggerHost;
  if (legacyHost) {
    const host = String(legacyHost).split(':')[0];
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return host;
    }
  }

  // 3. Native scriptURL fallback (iOS/Android native loader)
  const scriptURL: string | undefined = NativeModules.SourceCode?.scriptURL;
  if (scriptURL) {
    const match = scriptURL.match(/^https?:\/\/([^:/]+)/);
    if (match?.[1] && match[1] !== 'localhost' && match[1] !== '127.0.0.1') {
      return match[1];
    }
  }

  // 4. Default fallback
  return Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
}

/**
 * Resolves a service URL. If the URL contains 'localhost' or '127.0.0.1',
 * on physical native devices it replaces it with the machine's detected host IP.
 */
export function resolveDevUrl(rawUrl: string): string {
  if (!rawUrl || Platform.OS === 'web') {
    return rawUrl;
  }

  const host = getDevServerHost();
  if (!host || host === 'localhost' || host === '127.0.0.1') {
    return rawUrl;
  }

  return rawUrl
    .replace('://localhost', `://${host}`)
    .replace('://127.0.0.1', `://${host}`);
}
