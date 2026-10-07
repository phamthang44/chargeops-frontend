/**
 * Notification service — driver mobile implementation.
 *
 * Connects with backend #57 contract:
 * - GET /api/v1/notifications?context=driver&size=50
 * - GET /api/v1/notifications/unread-count?context=driver
 * - PATCH /api/v1/notifications/:id/read?context=driver
 * - PATCH /api/v1/notifications/read-all?context=driver
 * - PATCH /api/v1/notifications/:id/dismiss?context=driver
 */

import { apiBaseUrl, isMockMode, resolveAccessToken } from './stationService';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type NotificationType =
  | 'charging'
  | 'booking'
  | 'wallet'
  | 'promo'
  | 'ticket'
  | 'finance'
  | 'system';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  referenceId: string | null;

  // #57 typed contract context
  category?: string;
  audience?: string;
  eventType?: string;
  target?: {
    type?: string;
    bookingId?: string | null;
    ticketId?: string | null;
    stationId?: string | null;
    escalationId?: string | null;
    refundId?: string | null;
  };
  actionUrl?: string | null;
}

/**
 * Resolves a notification text string that may be an i18n key or key|{"param":"value"} JSON payload.
 * If rawText does not start with "notification.", it returns rawText unchanged.
 */
export function resolveNotificationI18n(
  rawText: string | undefined | null,
  t: (key: string, options?: any) => string,
): string {
  if (!rawText) return '';
  if (!rawText.startsWith('notification.')) return rawText;

  const pipeIdx = rawText.indexOf('|');
  if (pipeIdx === -1) {
    return t(rawText, { defaultValue: rawText });
  }

  const key = rawText.substring(0, pipeIdx);
  const payload = rawText.substring(pipeIdx + 1);
  let params: Record<string, any> = {};
  try {
    params = JSON.parse(payload);
  } catch {
    // If not valid JSON, fallback to raw key
  }

  return t(key, { ...params, defaultValue: key });
}

/* ------------------------------------------------------------------ */
/*  Clean business seed data (compliant with BKG-066 / #58)           */
/* ------------------------------------------------------------------ */

const INITIAL_DRIVER_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-drv-1',
    type: 'booking',
    title: 'notification.booking.confirmed.title',
    body: 'notification.booking.state_message|{"code":"BKG-HN-8821"}',
    createdAt: new Date(Date.now() - 10 * 60_000).toISOString(),
    read: false,
    referenceId: '00000000-0000-4000-8000-000000000201',
    category: 'booking',
    eventType: 'BOOKING_CONFIRMED',
  },
  {
    id: 'notif-drv-2',
    type: 'booking',
    title: 'notification.booking.reminder.title',
    body: 'notification.booking.state_message|{"code":"BKG-HN-8821"}',
    createdAt: new Date(Date.now() - 25 * 60_000).toISOString(),
    read: false,
    referenceId: '00000000-0000-4000-8000-000000000201',
    category: 'booking',
    eventType: 'BOOKING_REMINDER',
  },
  {
    id: 'notif-drv-3',
    type: 'finance',
    title: 'notification.refund.succeeded.title',
    body: 'notification.refund.succeeded.body|{"code":"BKG-HN-8821"}',
    createdAt: new Date(Date.now() - 2 * 3600_000).toISOString(),
    read: true,
    referenceId: null,
    category: 'finance',
    eventType: 'REFUND_SUCCEEDED',
  },
  {
    id: 'notif-drv-4',
    type: 'ticket',
    title: 'notification.ticket.resolved.title|{"code":"TK-1002"}',
    body: 'notification.ticket.resolved.body|{"code":"TK-1002","result":"Đã kiểm tra và xử lý thành công","autoCloseAt":"10 ngày"}',
    createdAt: new Date(Date.now() - 24 * 3600_000).toISOString(),
    read: true,
    referenceId: '00000000-0000-4000-8000-000000000401',
    category: 'ticket',
    eventType: 'TICKET_RESOLVED',
  },
];

/* ------------------------------------------------------------------ */
/*  In-memory store & Identity isolation                              */
/* ------------------------------------------------------------------ */

let notificationsList = [...INITIAL_DRIVER_NOTIFICATIONS];
let lastLoadedIdentity: string | null = null;

/**
 * Reset local store when user logs out or switches accounts to prevent cache leaks.
 */
export function resetNotificationStore(newIdentityId?: string | null) {
  notificationsList = [...INITIAL_DRIVER_NOTIFICATIONS];
  lastLoadedIdentity = newIdentityId ?? null;
}

function mapBackendToAppNotification(raw: any): AppNotification {
  const eventType = String(raw.eventType ?? '');
  const category = String(raw.category ?? '');

  let type: NotificationType = 'system';
  if (eventType.includes('BOOKING') || category === 'booking') {
    type = 'booking';
  } else if (eventType.includes('REFUND') || category === 'finance') {
    type = 'finance';
  } else if (eventType.includes('TICKET') || category === 'ticket' || category === 'support') {
    type = 'ticket';
  } else if (category === 'session') {
    type = 'charging';
  }

  const referenceId =
    raw.target?.bookingId ??
    raw.target?.ticketId ??
    raw.target?.refundId ??
    raw.referenceId ??
    null;

  return {
    id: String(raw.id),
    type,
    title: raw.title ?? '',
    body: raw.body ?? '',
    createdAt: raw.createdAt ? String(raw.createdAt) : new Date().toISOString(),
    read: Boolean(raw.read || raw.readAt),
    referenceId,
    category,
    audience: raw.audience,
    eventType: raw.eventType,
    target: raw.target,
    actionUrl: raw.actionUrl,
  };
}

/* ------------------------------------------------------------------ */
/*  Service functions                                                  */
/* ------------------------------------------------------------------ */

/** Fetch all notifications for the current driver. */
export async function getNotifications(): Promise<AppNotification[]> {
  const token = resolveAccessToken();
  if (!isMockMode() && token) {
    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/notifications?context=driver&size=50`, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const json = await res.json();
        const rawItems = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
        notificationsList = rawItems.map(mapBackendToAppNotification);
        return [...notificationsList];
      }
    } catch {
      // Fallback to local memory list on network disconnect
    }
  }

  return new Promise((resolve) => {
    setTimeout(() => resolve([...notificationsList]), 80);
  });
}

/** How many notifications are unread — drives the badge on the bell. */
export async function getUnreadCount(): Promise<number> {
  const token = resolveAccessToken();
  if (!isMockMode() && token) {
    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/notifications/unread-count?context=driver`, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const json = await res.json();
        const count = Number(json?.data?.count ?? json?.count ?? 0);
        return count;
      }
    } catch {
      // Fallback to local count on network error
    }
  }

  return new Promise((resolve) => {
    setTimeout(() => resolve(notificationsList.filter((n) => !n.read).length), 80);
  });
}

/** Mark every notification as read. */
export async function markAllNotificationsAsRead(): Promise<AppNotification[]> {
  const token = resolveAccessToken();
  if (!isMockMode() && token) {
    try {
      await fetch(`${apiBaseUrl}/api/v1/notifications/read-all?context=driver`, {
        method: 'PATCH',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
    } catch {
      // Ignore network errors on background mutations
    }
  }

  notificationsList = notificationsList.map((n) => ({ ...n, read: true }));
  return new Promise((resolve) => resolve([...notificationsList]));
}

/** Mark a single notification as read. */
export async function markNotificationAsRead(id: string): Promise<AppNotification[]> {
  const token = resolveAccessToken();
  if (!isMockMode() && token) {
    try {
      await fetch(`${apiBaseUrl}/api/v1/notifications/${id}/read?context=driver`, {
        method: 'PATCH',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
    } catch {
      // Ignore network errors on background mutations
    }
  }

  notificationsList = notificationsList.map((n) => (n.id === id ? { ...n, read: true } : n));
  return new Promise((resolve) => resolve([...notificationsList]));
}

/** Dismiss/delete a single notification. */
export async function deleteNotification(id: string): Promise<AppNotification[]> {
  const token = resolveAccessToken();
  if (!isMockMode() && token) {
    try {
      await fetch(`${apiBaseUrl}/api/v1/notifications/${id}/dismiss?context=driver`, {
        method: 'PATCH',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
    } catch {
      // Ignore network errors on background mutations
    }
  }

  notificationsList = notificationsList.filter((n) => n.id !== id);
  return new Promise((resolve) => resolve([...notificationsList]));
}

/** Remove every notification from the list. */
export async function clearAllNotifications(): Promise<AppNotification[]> {
  await markAllNotificationsAsRead();
  notificationsList = [];
  return new Promise((resolve) => resolve([]));
}
