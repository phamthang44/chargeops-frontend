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

/** Local backend fallback used when neither EXPO_PUBLIC_WS_URL nor EXPO_PUBLIC_API_BASE_URL is set. */
const DEV_FALLBACK_WS_URL = 'ws://localhost:8081/ws';

/**
 * Validates and normalizes a ws(s) endpoint: scheme must be ws/wss, no embedded
 * credentials, any trailing `/api/v1` segment is stripped and the path always
 * ends with `/ws` (never `/api/v1/ws`).
 */
function normalizeWsUrl(rawUrl: string): string {
  const match = /^(wss?):\/\/([^/?#]+)([^?#]*)(?:[?#].*)?$/i.exec(rawUrl.trim());
  if (!match) {
    throw new Error(`Invalid WebSocket URL "${rawUrl}". Expected ws:// or wss://<host>[/path].`);
  }
  const scheme = match[1].toLowerCase() as 'ws' | 'wss';
  const authority = match[2];
  if (authority.includes('@')) {
    throw new Error(`Invalid WebSocket URL "${rawUrl}". Embedded credentials are not allowed.`);
  }
  let pathname = match[3] || '/';
  pathname = pathname.replace(/^\/api\/v1(?=\/|$)/, '').replace(/\/+$/, '');
  if (!pathname) {
    pathname = '/ws';
  } else if (!pathname.endsWith('/ws')) {
    pathname = `${pathname}/ws`;
  }
  return `${scheme}://${authority}${pathname}`;
}

/**
 * Derives a ws(s) endpoint from EXPO_PUBLIC_API_BASE_URL (http -> ws, https -> wss).
 * Returns null when the variable is missing or malformed.
 */
function deriveWsUrlFromApiBase(): string | null {
  const apiBase = (process.env.EXPO_PUBLIC_API_BASE_URL ?? '').trim();
  if (!apiBase) return null;
  const match = /^(https?):\/\/([^/?#]+)([^?#]*)$/i.exec(apiBase);
  if (!match) return null;
  const scheme = match[1].toLowerCase() === 'https' ? 'wss' : 'ws';
  return `${scheme}://${match[2]}${match[3]}`;
}

/**
 * Resolves the STOMP endpoint for the hardware-change path.
 *
 * Priority: EXPO_PUBLIC_WS_URL > derive from EXPO_PUBLIC_API_BASE_URL > local dev
 * fallback (ws://localhost:8081/ws). On native dev builds localhost is rewritten
 * to the Metro host via resolveDevUrl(); production URLs are never altered.
 * On Expo Web served over HTTPS the scheme is forced to wss.
 */
export function resolveWsUrl(): string {
  const explicit = (process.env.EXPO_PUBLIC_WS_URL ?? '').trim();
  const candidate = explicit || deriveWsUrlFromApiBase() || DEV_FALLBACK_WS_URL;
  let url = normalizeWsUrl(resolveDevUrl(candidate));
  if (
    Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    window.location?.protocol === 'https:' &&
    url.startsWith('ws://')
  ) {
    url = `wss://${url.slice('ws://'.length)}`;
  }
  if (__DEV__) {
    console.log('[networkHost] Resolved STOMP broker URL:', url);
  }
  return url;
}
