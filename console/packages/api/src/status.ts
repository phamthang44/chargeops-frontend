/**
 * Presentation metadata for domain enums: Vietnamese label + a neutral tone
 * token consumed by @chargeops/ui's StatusPill. Shared so owner and admin
 * render every status identically.
 */
import type { BookingStatus, ChargerStatus, LicenseStatus, StationStatus, UserStatus } from './types';

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
