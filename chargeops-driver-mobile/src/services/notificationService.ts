/**
 * Notification service — mock implementation.
 *
 * BACKEND INTEGRATION GUIDE:
 * Each exported function mirrors a REST endpoint.  When you wire the real API
 * simply replace the body of each function with an HTTP call.
 *
 *   getNotifications()          →  GET    /api/notifications
 *   markAllNotificationsAsRead()→  PATCH  /api/notifications/read-all
 *   markNotificationAsRead(id)  →  PATCH  /api/notifications/:id/read
 *   deleteNotification(id)      →  DELETE /api/notifications/:id
 *   clearAllNotifications()     →  DELETE /api/notifications
 *
 * The `AppNotification` interface is the canonical contract between the
 * frontend and backend. Extend it here when adding new fields.
 */

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

/**
 * Notification type determines the icon/color and,
 * most importantly, which screen the user navigates to when tapping.
 */
export type NotificationType = 'charging' | 'booking' | 'wallet' | 'promo';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  /**
   * An ID that links this notification to a domain object (e.g. a bookingId,
   * a sessionId, a transactionId, etc.).  The UI uses `type` + `referenceId`
   * to determine the target screen.
   *
   * Set to `null` for notifications that are purely informational (e.g. promos)
   * and don't deep-link anywhere.
   *
   * BACKEND NOTE: This field maps directly to the backend's `reference_id`.
   */
  referenceId: string | null;
}

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */

const MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n1',
    type: 'charging',
    title: 'Phiên sạc đã hoàn tất ⚡',
    body: 'Trụ sạc VinFast DC-120kW tại Landmark 81 đã sạc xong (80% - 38.4 kWh). Tổng chi phí: 115,200 đ.',
    createdAt: new Date(Date.now() - 6 * 60_000).toISOString(),
    read: false,
    referenceId: 'bk-001',
  },
  {
    id: 'n2',
    type: 'booking',
    title: 'Sắp đến giờ sạc',
    body: 'Lịch đặt chỗ tại Trạm ECharge Quận 7 (Trụ AC-01) sẽ bắt đầu sau 15 phút nữa. Hãy di chuyển đến trạm để check-in!',
    createdAt: new Date(Date.now() - 28 * 60_000).toISOString(),
    read: false,
    referenceId: 'bk-002',
  },
  {
    id: 'n3',
    type: 'wallet',
    title: 'Nạp tiền vào ví thành công',
    body: 'Tài khoản ví ChargeOps Pay đã được nạp +200,000 đ từ ví MoMo. Số dư hiện tại: 450,000 đ.',
    createdAt: new Date(Date.now() - 3 * 3600_000).toISOString(),
    read: true,
    referenceId: null,
  },
  {
    id: 'n4',
    type: 'promo',
    title: 'Ưu đãi giờ thấp điểm: Giảm 20% 🎁',
    body: 'Giảm ngay 20% đơn giá kWh cho tất cả các phiên sạc DC Fast từ 22:00 đến 06:00 sáng hôm nay.',
    createdAt: new Date(Date.now() - 24 * 3600_000).toISOString(),
    read: true,
    referenceId: null,
  },
];

/* ------------------------------------------------------------------ */
/*  In-memory store (replaced by API calls in production)              */
/* ------------------------------------------------------------------ */

let notificationsList = [...MOCK_NOTIFICATIONS];

/* ------------------------------------------------------------------ */
/*  Service functions                                                  */
/* ------------------------------------------------------------------ */

/** Fetch all notifications for the current driver. */
export async function getNotifications(): Promise<AppNotification[]> {
  // TODO: Replace with  GET /api/notifications
  return new Promise((resolve) => {
    setTimeout(() => resolve([...notificationsList]), 100);
  });
}

/**
 * How many notifications are unread — drives the red badge on the bell.
 * LATER: GET /api/notifications/unread-count (a count, not the whole list).
 */
export async function getUnreadCount(): Promise<number> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(notificationsList.filter((n) => !n.read).length), 100);
  });
}

/** Mark every notification as read. */
export async function markAllNotificationsAsRead(): Promise<AppNotification[]> {
  // TODO: Replace with  PATCH /api/notifications/read-all
  notificationsList = notificationsList.map((n) => ({ ...n, read: true }));
  return new Promise((resolve) => resolve([...notificationsList]));
}

/** Mark a single notification as read. */
export async function markNotificationAsRead(id: string): Promise<AppNotification[]> {
  // TODO: Replace with  PATCH /api/notifications/:id/read
  notificationsList = notificationsList.map((n) => (n.id === id ? { ...n, read: true } : n));
  return new Promise((resolve) => resolve([...notificationsList]));
}

/** Delete a single notification (swipe-to-remove). */
export async function deleteNotification(id: string): Promise<AppNotification[]> {
  // TODO: Replace with  DELETE /api/notifications/:id
  notificationsList = notificationsList.filter((n) => n.id !== id);
  return new Promise((resolve) => resolve([...notificationsList]));
}

/** Remove every notification from the list (the driver chose "clear all"). */
export async function clearAllNotifications(): Promise<AppNotification[]> {
  // TODO: Replace with  DELETE /api/notifications
  notificationsList = [];
  return new Promise((resolve) => resolve([]));
}
