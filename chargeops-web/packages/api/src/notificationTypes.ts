export type NotificationCategory = 'session' | 'alert' | 'ticket' | 'system' | 'billing';
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
  body?: string;
  createdAt: string; // ISO-8601 string
  time?: string;
  read: boolean;
  category: NotificationCategory;
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

export interface NotificationListParams {
  unreadOnly?: boolean;
  category?: string;
}
