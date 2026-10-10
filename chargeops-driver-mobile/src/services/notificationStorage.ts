import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import type { AppNotification } from './notificationService';

const KEY_PREFIX = 'chargeops_driver_';

function getNotifKey(userId?: string | null): string {
  const safeId = userId ? userId.trim() : 'default';
  return `${KEY_PREFIX}notifs_${safeId}`;
}

function getUnreadKey(userId?: string | null): string {
  const safeId = userId ? userId.trim() : 'default';
  return `${KEY_PREFIX}unread_${safeId}`;
}

async function readItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        return window.localStorage.getItem(key);
      } catch {
        return null;
      }
    }
    return null;
  }

  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function writeItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(key, value);
      } catch {
        // ignore quota/security errors
      }
    }
    return;
  }

  try {
    await SecureStore.setItemAsync(key, value);
  } catch {
    // ignore secure store write failures
  }
}

async function removeItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem(key);
      } catch {
        // ignore
      }
    }
    return;
  }

  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    // ignore
  }
}

/**
 * Loads cached notifications for the given user (or default session).
 */
export async function loadCachedNotifications(userId?: string | null): Promise<AppNotification[]> {
  try {
    const raw = await readItem(getNotifKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Saves notifications list to local persistent storage.
 */
export async function saveCachedNotifications(
  userId: string | null | undefined,
  list: AppNotification[],
): Promise<void> {
  try {
    await writeItem(getNotifKey(userId), JSON.stringify(list));
  } catch {
    // ignore
  }
}

/**
 * Loads cached unread count for the given user.
 */
export async function loadCachedUnreadCount(userId?: string | null): Promise<number> {
  try {
    const raw = await readItem(getUnreadKey(userId));
    if (raw === null || raw === undefined) return 0;
    const num = Number(raw);
    return Number.isFinite(num) && num >= 0 ? num : 0;
  } catch {
    return 0;
  }
}

/**
 * Saves unread count to local persistent storage.
 */
export async function saveCachedUnreadCount(
  userId: string | null | undefined,
  count: number,
): Promise<void> {
  try {
    const safeCount = Math.max(0, Number(count) || 0);
    await writeItem(getUnreadKey(userId), String(safeCount));
  } catch {
    // ignore
  }
}

/**
 * Clears cached notifications and unread count.
 */
export async function clearCachedNotifications(userId?: string | null): Promise<void> {
  await removeItem(getNotifKey(userId));
  await removeItem(getUnreadKey(userId));
}
