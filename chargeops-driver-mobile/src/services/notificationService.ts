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

function getDefaultNotificationText(key: string, params: Record<string, any>, isEn: boolean): string {
  const code = params.code ? String(params.code) : '';
  switch (key) {
    case 'notification.ticket.created.title':
      return isEn
        ? `New support ticket ${code}`.trim()
        : `Phiếu hỗ trợ mới ${code}`.trim();
    case 'notification.ticket.created.body':
      return isEn
        ? `Support ticket ${code}${params.category ? ` (category: ${params.category})` : ''} has been created. Please review and process.`
        : `Đã ghi nhận phiếu hỗ trợ ${code}${params.category ? ` (danh mục: ${params.category})` : ''}. Vui lòng kiểm tra và xử lý.`;
    case 'notification.ticket.resolved.title':
      return isEn
        ? `Ticket ${code} has been resolved`.trim()
        : `Phiếu hỗ trợ ${code} đã được giải quyết`.trim();
    case 'notification.ticket.resolved.body':
      return isEn
        ? `Resolution outcome: "${params.result || ''}". Please confirm or report back before ${params.autoCloseAt || ''}.`
        : `Kết quả xử lý: "${params.result || ''}". Vui lòng xác nhận hoặc báo lại trước ${params.autoCloseAt || ''}.`;
    case 'notification.ticket.assigned.title':
      return isEn
        ? `Ticket ${code} assigned`.trim()
        : `Phiếu hỗ trợ ${code} đã được phân công`.trim();
    case 'notification.ticket.assigned.body': {
      const assignee = params.assignee ? String(params.assignee) : '';
      const by = params.assigner ? String(params.assigner) : '';
      return isEn
        ? `Ticket ${code}${params.station ? ` at station ${params.station}` : ''}${assignee ? ` has been assigned to ${assignee}` : ' has been assigned for resolution'}${by ? ` (by ${by})` : ''}.`
        : `Phiếu hỗ trợ ${code}${params.station ? ` tại trạm ${params.station}` : ''}${assignee ? ` đã được phân công cho ${assignee}` : ' đã được phân công xử lý'}${by ? ` (bởi ${by})` : ''}.`;
    }
    case 'notification.ticket.escalated.title':
      return isEn
        ? `Escalated case for ticket ${code}`.trim()
        : `Yêu cầu khiếu nại ca ${code}`.trim();
    case 'notification.ticket.escalated.body':
      return isEn
        ? `Escalation review requested for ticket ${code} requires Admin evaluation.`
        : `Ca khiếu nại cho Phiếu hỗ trợ ${code} cần Admin xem xét.`;
    case 'notification.booking.confirmed.title':
      return isEn ? 'Booking confirmed' : 'Đặt chỗ đã được xác nhận';
    case 'notification.booking.cancelled.title':
      return isEn ? 'Booking cancelled' : 'Đặt chỗ đã bị hủy';
    case 'notification.booking.no_show.title':
      return isEn ? 'Booking ended due to no-show' : 'Đặt chỗ đã kết thúc do không check-in';
    case 'notification.booking.completed.title':
      return isEn ? 'Booking completed' : 'Đặt chỗ đã hoàn thành';
    case 'notification.booking.reminder.title':
      return isEn ? 'Upcoming booking reminder' : 'Sắp đến giờ đặt chỗ';
    case 'notification.booking.state_message':
      return isEn
        ? `Booking ${code}. Please open booking to view current status.`
        : `Booking ${code}. Vui lòng mở đặt chỗ để xem trạng thái hiện hành.`;
    case 'notification.refund.pending.title':
      return isEn ? 'Refund obligation pending' : 'Nghĩa vụ hoàn tiền đang chờ xử lý';
    case 'notification.refund.pending.body':
      return isEn
        ? `Booking ${code}. Refund obligation is held; funds are not yet considered refunded.`
        : `Booking ${code}. Nghĩa vụ hoàn tiền vẫn được giữ; chưa thể coi tiền đã được hoàn.`;
    case 'notification.refund.attempt_failed.title':
      return isEn ? 'Refund attempt unsuccessful' : 'Lần thực hiện hoàn tiền chưa thành công';
    case 'notification.refund.attempt_failed.body':
      return isEn
        ? `Booking ${code}. Refund obligation is held; funds are not yet considered refunded.`
        : `Booking ${code}. Nghĩa vụ hoàn tiền vẫn được giữ; chưa thể coi tiền đã được hoàn.`;
    case 'notification.refund.succeeded.title':
      return isEn ? 'Refund succeeded in Simulator' : 'Hoàn tiền đã thành công trong Simulator';
    case 'notification.refund.succeeded.body':
      return isEn
        ? `Booking ${code}. Simulator recorded refund success; this is not a real banking transaction.`
        : `Booking ${code}. Simulator đã ghi nhận hoàn tiền thành công; đây không phải giao dịch ngân hàng thật.`;
    default:
      return key;
  }
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

  const isEn =
    typeof t === 'function' && ((t as any)?.lng?.startsWith('en') || (t as any)?.language?.startsWith('en'));

  const pipeIdx = rawText.indexOf('|');
  if (pipeIdx === -1) {
    const fallback = getDefaultNotificationText(rawText, {}, isEn);
    if (typeof t !== 'function') return fallback;
    const resolved = t(rawText, { defaultValue: fallback });
    return !resolved || resolved === rawText ? fallback : resolved;
  }

  const key = rawText.substring(0, pipeIdx);
  const payload = rawText.substring(pipeIdx + 1);
  let params: Record<string, any> = {};
  try {
    params = JSON.parse(payload);
  } catch {
    // If not valid JSON, fallback to raw key
  }

  if (params.category && typeof params.category === 'string') {
    const rawCategory = params.category.toUpperCase();
    const categoryLabelsVi: Record<string, string> = {
      CHARGING_ISSUE: 'Sự cố sạc',
      BOOKING: 'Đặt chỗ',
      PAYMENT: 'Thanh toán',
      ACCOUNT: 'Tài khoản',
      OTHER: 'Khác',
      HARDWARE: 'Thiết bị phần cứng',
      SYSTEM: 'Hệ thống',
    };
    const categoryLabelsEn: Record<string, string> = {
      CHARGING_ISSUE: 'Charging Issue',
      BOOKING: 'Booking',
      PAYMENT: 'Payment',
      ACCOUNT: 'Account',
      OTHER: 'Other',
      HARDWARE: 'Hardware',
      SYSTEM: 'System',
    };
    params.category = isEn
      ? (categoryLabelsEn[rawCategory] ?? params.category)
      : (categoryLabelsVi[rawCategory] ?? params.category);
  }

  if (params.autoCloseAt && typeof params.autoCloseAt === 'string') {
    const d = new Date(params.autoCloseAt);
    if (!isNaN(d.getTime())) {
      if (isEn) {
        const time = d.toLocaleTimeString('en-US', {
          timeZone: 'Asia/Ho_Chi_Minh',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });
        const date = d.toLocaleDateString('en-GB', {
          timeZone: 'Asia/Ho_Chi_Minh',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
        params.autoCloseAt = `${time} on ${date}`;
      } else {
        const time = d.toLocaleTimeString('vi-VN', {
          timeZone: 'Asia/Ho_Chi_Minh',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });
        const date = d.toLocaleDateString('vi-VN', {
          timeZone: 'Asia/Ho_Chi_Minh',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
        params.autoCloseAt = `${time} ngày ${date}`;
      }
    }
  }

  const fallback = getDefaultNotificationText(key, params, isEn);
  if (typeof t !== 'function') return fallback;
  const resolved = t(key, { ...params, defaultValue: fallback });
  return !resolved || resolved === key ? fallback : resolved;
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
    referenceId: '00000000-0000-4000-8000-000000000201', // same booking as the confirmed/reminder seeds
    category: 'finance',
    eventType: 'REFUND_SUCCEEDED',
    target: { type: 'OPEN_BOOKING', bookingId: '00000000-0000-4000-8000-000000000201' },
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
