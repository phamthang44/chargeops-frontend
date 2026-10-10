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
  | 'station'
  | (string & {});

export type NotificationAudience = 'PERSONAL' | 'DRIVER' | 'OWNER' | 'STAFF' | 'ADMIN';

export type NotificationEventType =
  | 'LEGACY_QUARANTINED'
  | 'TICKET_RESOLVED'
  | 'TICKET_ASSIGNED'
  | 'TICKET_CLOSED'
  | 'TICKET_REOPENED'
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
  | 'STATION_SUBMITTED'
  | 'STATION_APPROVED'
  | 'STATION_REJECTED'
  | 'STATION_CHANGES_REQUESTED'
  | (string & {});

export type NotificationActionType =
  | 'NONE'
  | 'OPEN_BOOKING'
  | 'OPEN_TICKET'
  | 'OPEN_REFUND'
  | 'OPEN_CASE'
  | 'OPEN_STATION'
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
    case 'notification.ticket.closed.title':
      return isEn
        ? `Ticket ${code} closed`.trim()
        : `Phiếu hỗ trợ ${code} đã đóng`.trim();
    case 'notification.ticket.closed.body':
      return isEn
        ? `Ticket ${code} has been closed.${params.reason ? ` Note: ${params.reason}` : ''}`
        : `Phiếu hỗ trợ ${code} đã được xác nhận đóng.${params.reason ? ` Ghi chú: ${params.reason}` : ''}`;
    case 'notification.ticket.reopened.title':
      return isEn
        ? `Ticket ${code} reopened`.trim()
        : `Phiếu hỗ trợ ${code} được mở lại`.trim();
    case 'notification.ticket.reopened.body':
      return isEn
        ? `Ticket ${code} has been reopened for further action.${params.reason ? ` Reason: ${params.reason}` : ''}`
        : `Phiếu hỗ trợ ${code} đã được mở lại để tiếp tục giải quyết.${params.reason ? ` Lý do: ${params.reason}` : ''}`;
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
    case 'notification.station.submitted.title': {
      const stationName = params.stationName ? String(params.stationName) : '';
      return isEn
        ? `New station pending review: ${stationName}`.trim()
        : `Hồ sơ trạm sạc mới cần duyệt: ${stationName}`.trim();
    }
    case 'notification.station.submitted.body': {
      const ownerName = params.ownerName ? String(params.ownerName) : '';
      const stationName = params.stationName ? String(params.stationName) : '';
      const stationCode = params.stationCode ? String(params.stationCode) : '';
      return isEn
        ? `Owner ${ownerName} submitted station ${stationName} (${stationCode}) for moderation review.`
        : `Chủ trạm ${ownerName} vừa gửi hồ sơ trạm ${stationName} (${stationCode}). Vui lòng thẩm định vị trí và pháp lý.`;
    }
    case 'notification.station.approved.title': {
      const stationName = params.stationName ? String(params.stationName) : '';
      return isEn
        ? `Station ${stationName} has been approved!`.trim()
        : `Trạm sạc ${stationName} đã được phê duyệt!`.trim();
    }
    case 'notification.station.approved.body': {
      const stationName = params.stationName ? String(params.stationName) : '';
      return isEn
        ? `Station ${stationName} passed verification and is now ready for operations.`
        : `Hồ sơ trạm sạc ${stationName} đã vượt qua thẩm định và sẵn sàng kích hoạt các trụ sạc vận hành.`;
    }
    case 'notification.station.rejected.title': {
      const stationName = params.stationName ? String(params.stationName) : '';
      return isEn
        ? `Station ${stationName} registration rejected`.trim()
        : `Hồ sơ trạm sạc ${stationName} bị từ chối`.trim();
    }
    case 'notification.station.rejected.body': {
      const stationName = params.stationName ? String(params.stationName) : '';
      const reason = params.reason ? String(params.reason) : '';
      return isEn
        ? `Station ${stationName} was rejected. Reason: ${reason}`
        : `Hồ sơ trạm ${stationName} không đủ điều kiện phê duyệt. Lý do: ${reason}`;
    }
    case 'notification.station.changes_requested.title': {
      const stationName = params.stationName ? String(params.stationName) : '';
      return isEn
        ? `Action required: Update station ${stationName}`.trim()
        : `Yêu cầu bổ sung hồ sơ trạm ${stationName}`.trim();
    }
    case 'notification.station.changes_requested.body': {
      const stationName = params.stationName ? String(params.stationName) : '';
      const reason = params.reason ? String(params.reason) : '';
      return isEn
        ? `Admin requested profile updates for station ${stationName}: ${reason}`
        : `Quản trị viên yêu cầu cập nhật thông tin cho trạm ${stationName}: ${reason}`;
    }
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
    (typeof t === 'function' && ((t as any)?.lng?.startsWith('en') || (t as any)?.language?.startsWith('en'))) ||
    (typeof window !== 'undefined' && localStorage.getItem('chargeops.lang') === 'en');

  const pipeIdx = rawText.indexOf('|');
  if (pipeIdx === -1) {
    const fallback = getDefaultNotificationText(rawText, {}, isEn);
    if (typeof t !== 'function') return fallback;
    const resolved = t(rawText, { ns: 'common', defaultValue: fallback });
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
  const resolved = t(key, { ns: 'common', ...params, defaultValue: fallback });
  return !resolved || resolved === key ? fallback : resolved;
}
