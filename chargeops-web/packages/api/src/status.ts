/**
 * Presentation metadata for domain enums: Vietnamese label + a neutral tone
 * token consumed by @chargeops/ui's StatusPill. Shared so owner and admin
 * render every status identically.
 */
import type {
  BookingStatus,
  ChargerStatus,
  LicenseStatus,
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

export const CHARGER_STATUS: Record<ChargerStatus, StatusMeta> = {
  available: { label: 'Sẵn sàng', tone: 'good' },
  maintenance: { label: 'Bảo trì', tone: 'warn' },
  offline: { label: 'Offline', tone: 'bad' },
  unclaimed: { label: 'Chưa gán', tone: 'neutral' },
};

export const STATION_STATUS: Record<StationStatus, StatusMeta> = {
  active: { label: 'Hoạt động', tone: 'good' },
  pending: { label: 'Chờ duyệt', tone: 'warn' },
  rejected: { label: 'Bị từ chối', tone: 'bad' },
};

export const LICENSE_STATUS: Record<LicenseStatus, StatusMeta> = {
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
  payment: 'Thanh toán',
  booking: 'Đặt chỗ',
  connector_fault: 'Trụ hỏng',
  account: 'Tài khoản',
  other: 'Khác',
};

/** Role badge colours (mono chips) — CSS var references so dark mode repaints them via inline style. */
export const USER_ROLE_BADGE: Record<'DRIVER' | 'OWNER' | 'ADMIN', { bg: string; fg: string }> = {
  DRIVER: { bg: 'var(--color-chip)', fg: 'var(--color-body)' },
  OWNER: { bg: 'var(--color-owner-soft)', fg: 'var(--color-owner-deep)' },
  ADMIN: { bg: 'var(--color-solid)', fg: 'var(--color-solid-fg)' },
};
