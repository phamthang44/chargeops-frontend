/**
 * Presentation metadata for domain enums: Vietnamese label + a neutral tone
 * token consumed by @chargeops/ui's StatusPill. Shared so owner and admin
 * render every status identically.
 */
import type {
  BookingStatus,
  ConnectorRuntimeStatus,
  LicenseStatus,
  ProvisioningStatus,
  StationOperatingState,
  StationStatus,
  TicketCategory,
  TicketStatus,
  UserStatus,
} from './types';

export type Tone = 'good' | 'warn' | 'bad' | 'brand' | 'neutral' | 'ink';
export interface StatusMeta {
  label: string;
  tone: Tone;
}

export const BOOKING_STATUS: Record<BookingStatus, StatusMeta> = {
  pending: { label: 'Chờ thanh toán', tone: 'warn' },
  confirmed: { label: 'Đã xác nhận', tone: 'brand' },
  checkedin: { label: 'Đã check-in', tone: 'good' },
  charging: { label: 'Đang sạc', tone: 'good' },
  completed: { label: 'Hoàn tất', tone: 'neutral' },
  cancelled: { label: 'Đã hủy', tone: 'bad' },
};

/** Charge Point lifecycle (FR14) — admin owns PENDING_ACTIVATION / SUSPENDED; owner owns AVAILABLE / OFFLINE. */
export const CHARGE_POINT_STATUS: Record<ProvisioningStatus, StatusMeta> = {
  PENDING_ACTIVATION: { label: 'Chờ kích hoạt', tone: 'neutral' },
  ACTIVE: { label: 'Hoạt động', tone: 'good' },
  SUSPENDED: { label: 'Đình chỉ', tone: 'bad' },
};

/** Connector runtime status (FR07) — AVAILABLE<->IN_USE is system-driven; OFFLINE is owner/staff-toggled. */
export const CONNECTOR_STATUS: Record<ConnectorRuntimeStatus, StatusMeta> = {
  AVAILABLE: { label: 'Sẵn sàng', tone: 'good' },
  IN_USE: { label: 'Đang sạc', tone: 'brand' },
  OFFLINE: { label: 'Offline', tone: 'bad' },
};

export const STATION_STATUS: Record<StationStatus, StatusMeta> = {
  active: { label: 'Đã kích hoạt', tone: 'good' },
  pending: { label: 'Chờ duyệt', tone: 'warn' },
  rejected: { label: 'Bị từ chối', tone: 'bad' },
  suspended: { label: 'Tạm ngưng', tone: 'bad' },
  withdrawn: { label: 'Đã rút hồ sơ', tone: 'bad' },
  ACTIVE: { label: 'Đã kích hoạt', tone: 'good' },
  PENDING_APPROVAL: { label: 'Chờ duyệt', tone: 'warn' },
  REJECTED: { label: 'Bị từ chối', tone: 'bad' },
  SUSPENDED: { label: 'Tạm ngưng', tone: 'bad' },
  WITHDRAWN: { label: 'Đã rút hồ sơ', tone: 'bad' },
};

export const LICENSE_STATUS: Record<LicenseStatus, StatusMeta> = {
  ACTIVE: { label: 'Đang hoạt động', tone: 'good' },
  PENDING: { label: 'Chờ hiệu lực', tone: 'brand' },
  SUSPENDED: { label: 'Tạm ngưng', tone: 'warn' },
  CANCELLED: { label: 'Đã hủy', tone: 'bad' },
  EXPIRED: { label: 'Đã hết hạn', tone: 'neutral' },
  active: { label: 'Đang hoạt động', tone: 'good' },
  expiring: { label: 'Sắp hết hạn', tone: 'warn' },
  expired: { label: 'Đã hết hạn', tone: 'bad' },
};

export const USER_STATUS: Record<UserStatus, StatusMeta> = {
  active: { label: 'Hoạt động', tone: 'good' },
  suspended: { label: 'Tạm khóa', tone: 'bad' },
};

export const TICKET_STATUS: Record<TicketStatus, StatusMeta> = {
  open: { label: 'Đang mở', tone: 'warn' },
  in_progress: { label: 'Đang xử lý', tone: 'brand' },
  resolved: { label: 'Đã giải quyết', tone: 'good' },
  closed: { label: 'Đã đóng', tone: 'neutral' },
};

export const TICKET_CATEGORY: Record<TicketCategory, string> = {
  charging_issue: 'Sự cố sạc',
  booking: 'Đặt chỗ',
  payment: 'Thanh toán',
  account: 'Tài khoản',
  other: 'Khác',
};

/** Role badge colours (mono chips) — CSS var references so dark mode repaints them via inline style. */
export const USER_ROLE_BADGE: Record<'DRIVER' | 'OWNER' | 'ADMIN', { bg: string; fg: string }> = {
  DRIVER: { bg: 'var(--color-chip)', fg: 'var(--color-body)' },
  OWNER: { bg: 'var(--color-owner-soft)', fg: 'var(--color-owner-deep)' },
  ADMIN: { bg: 'var(--color-solid)', fg: 'var(--color-solid-fg)' },
};

/**
 * Driver Eligibility calculation per solution-license-station-active.md:
 * driverEligible(station, now) = station.status == ACTIVE && station has effectively active License at now.
 */
export function isStationDriverEligible(
  stationStatus: StationStatus | string | null | undefined,
  license?: {
    status?: LicenseStatus | string | null;
    startAt?: string | null;
    expiresAt?: string | null;
    daysLeft?: number;
  } | string | null,
  now = new Date(),
  hardwareInfo?: {
    totalChargers?: number;
    onlineChargers?: number;
    chargerCount?: number;
    onlineCount?: number;
    actualChargePointCount?: number;
    onlineChargePointCount?: number;
    onlineActualChargePointCount?: number;
  } | null,
): {
  isEligible: boolean;
  reason?:
    | 'STATION_NOT_ACTIVE'
    | 'LICENSE_MISSING'
    | 'LICENSE_EXPIRED'
    | 'LICENSE_SUSPENDED'
    | 'LICENSE_CANCELLED'
    | 'LICENSE_NOT_STARTED'
    | 'NO_ACTIVE_CHARGERS'
    | 'ALL_CHARGERS_OFFLINE';
  label: string;
  tone: Tone;
  details?: string;
} {
  const normStation = String(stationStatus || '').toUpperCase();
  const isStationActive = normStation === 'ACTIVE';

  if (!isStationActive) {
    return {
      isEligible: false,
      reason: 'STATION_NOT_ACTIVE',
      label: 'Chưa công khai',
      tone: 'neutral',
      details: 'Trạm chưa được duyệt hoặc đang ở trạng thái không hoạt động.',
    };
  }

  if (!license) {
    return {
      isEligible: false,
      reason: 'LICENSE_MISSING',
      label: 'Thiếu Giấy phép',
      tone: 'warn',
      details: 'Trạm chưa được ghi nhận gói License hợp lệ.',
    };
  }

  // Check hardware provision & online status if available
  const totalCount =
    hardwareInfo?.actualChargePointCount ??
    hardwareInfo?.totalChargers ??
    hardwareInfo?.chargerCount;

  const onlineCount =
    hardwareInfo?.onlineActualChargePointCount ??
    hardwareInfo?.onlineChargePointCount ??
    hardwareInfo?.onlineChargers ??
    hardwareInfo?.onlineCount;

  if (totalCount !== undefined && totalCount === 0) {
    return {
      isEligible: false,
      reason: 'NO_ACTIVE_CHARGERS',
      label: 'Chưa cấp trụ sạc',
      tone: 'neutral',
      details: 'Trạm đã duyệt nhưng chưa có trụ sạc hoặc súng sạc nào được kích hoạt.',
    };
  }

  if (totalCount !== undefined && totalCount > 0 && onlineCount !== undefined && onlineCount === 0) {
    return {
      isEligible: false,
      reason: 'ALL_CHARGERS_OFFLINE',
      label: 'Tạm ngưng sạc',
      tone: 'warn',
      details: 'Tất cả trụ sạc của trạm đang tạm dừng, chờ kích hoạt hoặc ngoại tuyến.',
    };
  }

  if (typeof license === 'string') {
    const isExpiredText = license.toLowerCase().includes('hết hạn') && !license.toLowerCase().includes('· hết hạn 202');
    if (isExpiredText) {
      return {
        isEligible: false,
        reason: 'LICENSE_EXPIRED',
        label: 'Tạm ẩn tìm kiếm',
        tone: 'warn',
        details: 'Gói License của trạm đã hết hạn.',
      };
    }
    return {
      isEligible: true,
      label: 'Hiển thị với tài xế',
      tone: 'good',
    };
  }

  const nowMs = now.getTime();
  const normLicenseStatus = String(license.status || 'ACTIVE').toUpperCase();

  if (normLicenseStatus === 'SUSPENDED') {
    return {
      isEligible: false,
      reason: 'LICENSE_SUSPENDED',
      label: 'Tạm ẩn tìm kiếm',
      tone: 'warn',
      details: 'Gói License đang bị tạm ngưng. Trạm tạm thời không hiển thị cho tài xế tìm kiếm.',
    };
  }

  if (normLicenseStatus === 'CANCELLED') {
    return {
      isEligible: false,
      reason: 'LICENSE_CANCELLED',
      label: 'License đã hủy',
      tone: 'bad',
      details: 'Gói License đã bị hủy bỏ.',
    };
  }

  if (normLicenseStatus === 'EXPIRED') {
    return {
      isEligible: false,
      reason: 'LICENSE_EXPIRED',
      label: 'Tạm ẩn tìm kiếm',
      tone: 'warn',
      details: 'Gói License đã hết hạn. Vui lòng gia hạn để tiếp tục đón khách.',
    };
  }

  if (license.startAt && new Date(license.startAt).getTime() > nowMs) {
    return {
      isEligible: false,
      reason: 'LICENSE_NOT_STARTED',
      label: 'Chờ hiệu lực',
      tone: 'neutral',
      details: 'Gói License chưa tới thời điểm bắt đầu hiệu lực.',
    };
  }

  if (license.expiresAt && new Date(license.expiresAt).getTime() <= nowMs) {
    return {
      isEligible: false,
      reason: 'LICENSE_EXPIRED',
      label: 'Tạm ẩn tìm kiếm',
      tone: 'warn',
      details: 'Gói License đã hết hạn hiệu lực.',
    };
  }

  return {
    isEligible: true,
    label: 'Hiển thị với tài xế',
    tone: 'good',
  };
}

export const OPERATING_STATE_META: Record<StationOperatingState, StatusMeta> = {
  OPEN: { label: 'Đang mở', tone: 'good' },
  CLOSED_BY_SCHEDULE: { label: 'Đóng theo lịch', tone: 'warn' },
  SCHEDULE_NOT_CONFIGURED: { label: 'Chưa cấu hình lịch', tone: 'neutral' },
};

/**
 * Resolves granular operatingState for station:
 * - Direct backend operatingState (if present)
 * - OPEN if openNow is true or open24Hours is true
 * - CLOSED_BY_SCHEDULE if active schedule exists but currently closed
 * - SCHEDULE_NOT_CONFIGURED if no schedule has been configured yet
 */
export function resolveOperatingState(
  station?: {
    operatingState?: StationOperatingState;
    openNow?: boolean;
    open24Hours?: boolean;
    scheduleStatus?: string;
  } | null,
): StationOperatingState {
  if (!station) return 'SCHEDULE_NOT_CONFIGURED';
  if (station.operatingState) return station.operatingState;
  if (station.openNow === true) return 'OPEN';
  if (station.scheduleStatus === 'ACTIVE') {
    return station.openNow ? 'OPEN' : 'CLOSED_BY_SCHEDULE';
  }
  if (station.open24Hours) return 'OPEN';
  return 'SCHEDULE_NOT_CONFIGURED';
}
