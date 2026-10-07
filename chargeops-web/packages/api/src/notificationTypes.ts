export type NotificationCategory =
  | 'support'
  | 'booking'
  | 'finance'
  | 'account'
  | 'system'
  | 'ticket'
  | 'alert'
  | 'session'
  | 'billing'
  | (string & {});

export type NotificationAudience = 'PERSONAL' | 'DRIVER' | 'OWNER' | 'STAFF' | 'ADMIN';

export type NotificationEventType =
  | 'LEGACY_QUARANTINED'
  | 'TICKET_RESOLVED'
  | 'TICKET_ASSIGNED'
  | 'CASE_ESCALATED'
  | 'BOOKING_CONFIRMED'
  | 'BOOKING_CANCELLED'
  | 'BOOKING_NO_SHOW'
  | 'BOOKING_COMPLETED'
  | 'BOOKING_REMINDER'
  | 'RESPONSIBILITY_DECIDED'
  | 'REFUND_PENDING'
  | 'REFUND_ATTEMPT_FAILED'
  | 'REFUND_SUCCEEDED'
  | 'ACCOUNT_NOTICE'
  | (string & {});

export type NotificationActionType =
  | 'NONE'
  | 'OPEN_BOOKING'
  | 'OPEN_TICKET'
  | 'OPEN_REFUND'
  | 'OPEN_CASE'
  | (string & {});

export interface NotificationTarget {
  type: NotificationActionType;
  bookingId?: string | null;
  ticketId?: string | null;
  stationId?: string | null;
  escalationId?: string | null;
  refundId?: string | null;
}

export type NotificationSeverity = 'good' | 'warn' | 'bad' | 'neutral';

export interface NotificationAction {
  label: string;
  actionUrl?: string;
  actionType?: 'link' | 'api_call';
  variant?: 'default' | 'outline' | 'destructive';
}

export interface AppNotification {
  id: string;
  title: string;
  subtitle?: string;
  body: string;
  createdAt: string; // ISO-8601 string
  time?: string;
  read: boolean;
  readAt?: string | null;
  category: NotificationCategory;
  audience?: NotificationAudience;
  eventType?: NotificationEventType;
  target?: NotificationTarget;
  actionUrl?: string | null;
  dismissedAt?: string | null;
  expiresAt?: string | null;
  source?: 'persisted' | 'derived';

  // Rich telemetry & UI backward-compatibility fields
  severity?: NotificationSeverity;
  tone?: NotificationSeverity;
  referenceId?: string | null;
  stationName?: string;
  chargerId?: string;
  metrics?: {
    powerKw?: number;
    progressPct?: number;
    amount?: string;
    temperature?: string;
    voltage?: string;
  };
  actionLabel?: string;
  badge?: string;
  primaryAction?: NotificationAction;
  secondaryAction?: NotificationAction;
}

export interface NotificationPageMeta {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNextPage: boolean;
}

export interface NotificationPageResponse {
  data: AppNotification[];
  meta: NotificationPageMeta;
}

export interface NotificationListParams {
  page?: number;
  size?: number;
  unread?: boolean;
  unreadOnly?: boolean;
  category?: string;
  context?: 'personal' | 'driver' | 'owner' | 'staff' | 'admin' | string;
  stationId?: string;
}

export interface NotificationUnreadCountParams {
  context?: string;
  category?: string;
  stationId?: string;
}

export interface NotificationMutationParams {
  context?: string;
  category?: string;
  stationId?: string;
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
    return t(rawText, { ns: 'common', defaultValue: rawText });
  }

  const key = rawText.substring(0, pipeIdx);
  const payload = rawText.substring(pipeIdx + 1);
  let params: Record<string, any> = {};
  try {
    params = JSON.parse(payload);
  } catch {
    // If not valid JSON, fallback to raw key
  }

  return t(key, { ns: 'common', ...params, defaultValue: key });
}
