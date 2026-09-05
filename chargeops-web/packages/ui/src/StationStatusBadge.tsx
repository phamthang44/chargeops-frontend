import type { StationOperatingState } from './StationOperatingBadge';

export type StationBadgeTone = 'good' | 'warn' | 'bad' | 'neutral' | 'brand' | 'ink';

export interface StationEligibilityInfo {
  isEligible: boolean;
  reason?: string;
  label?: string;
  tone?: StationBadgeTone | string;
  details?: string;
}

export interface StationStatusBadgeProps {
  status?: string | null;
  operatingState?: StationOperatingState | string | null;
  eligibility?: StationEligibilityInfo | null;
  className?: string;
  variant?: 'detailed' | 'compact';
  showDot?: boolean;
}

interface ResolvedBadgeConfig {
  label: string;
  tone: StationBadgeTone;
  pulse?: boolean;
  tooltip: string;
}

const TONE_CLASSES: Record<
  StationBadgeTone,
  {
    pill: string;
    dot: string;
    ping?: string;
  }
> = {
  good: {
    pill: 'bg-good-soft/80 text-good-deep border-good-border/60',
    dot: 'bg-good',
    ping: 'bg-good',
  },
  warn: {
    pill: 'bg-warn-soft/80 text-warn-deep border-warn-border/60',
    dot: 'bg-warn',
  },
  bad: {
    pill: 'bg-bad-soft/80 text-bad-deep border-bad-border/60',
    dot: 'bg-bad',
  },
  neutral: {
    pill: 'bg-surface-2 text-muted border-line-3',
    dot: 'bg-faint',
  },
  brand: {
    pill: 'bg-brand-soft/80 text-brand border-brand-line',
    dot: 'bg-brand',
  },
  ink: {
    pill: 'bg-solid text-solid-fg border-line',
    dot: 'bg-solid-fg',
  },
};

/**
 * Resolves unified single badge representation for station:
 * Prioritizes lifecycle status for inactive stations,
 * detects blocker constraints (License, Hardware provision) for active stations,
 * and reflects operating schedule state when healthy and driver-eligible.
 */
export function resolveStationBadgeConfig(
  status?: string | null,
  eligibility?: StationEligibilityInfo | null,
  operatingState?: StationOperatingState | string | null,
  variant: 'detailed' | 'compact' = 'detailed',
): ResolvedBadgeConfig {
  const normStatus = String(status || '').toUpperCase();
  const isActive = normStatus === 'ACTIVE';

  // 1. Inactive Lifecycle Status
  if (!isActive) {
    if (normStatus === 'PENDING' || normStatus === 'PENDING_APPROVAL') {
      return {
        label: 'Chờ duyệt',
        tone: 'warn',
        tooltip: 'Hồ sơ trạm đang chờ Quản trị viên ChargeOps kiểm duyệt.',
      };
    }
    if (normStatus === 'REJECTED') {
      return {
        label: 'Bị từ chối',
        tone: 'bad',
        tooltip: 'Hồ sơ đăng ký trạm đã bị từ chối duyệt.',
      };
    }
    if (normStatus === 'SUSPENDED') {
      return {
        label: 'Tạm ngưng',
        tone: 'bad',
        tooltip: 'Trạm đang bị đình chỉ hoạt động bởi quản trị hệ thống.',
      };
    }
    if (normStatus === 'WITHDRAWN') {
      return {
        label: 'Đã rút hồ sơ',
        tone: 'neutral',
        tooltip: 'Hồ sơ trạm sạc đã được chủ trạm rút lại.',
      };
    }
    return {
      label: status || 'Chưa duyệt',
      tone: 'neutral',
      tooltip: `Trạng thái trạm: ${status}`,
    };
  }

  // 2. Active Station with Eligibility Blocker (Missing License, Hardware Offline, etc.)
  if (eligibility && !eligibility.isEligible) {
    const reason = eligibility.reason;
    if (reason === 'LICENSE_MISSING') {
      return {
        label: 'Thiếu Giấy phép',
        tone: 'warn',
        tooltip: 'Trạm chưa có gói License hợp lệ nên đang tạm ẩn khỏi tìm kiếm của tài xế.',
      };
    }
    if (reason === 'LICENSE_EXPIRED') {
      return {
        label: 'License hết hạn',
        tone: 'bad',
        tooltip: 'Gói License của trạm đã hết hạn hiệu lực. Vui lòng gia hạn để đón khách trở lại.',
      };
    }
    if (reason === 'LICENSE_SUSPENDED') {
      return {
        label: 'License tạm ngưng',
        tone: 'warn',
        tooltip: 'Gói License của trạm đang bị tạm ngưng.',
      };
    }
    if (reason === 'LICENSE_CANCELLED') {
      return {
        label: 'License đã hủy',
        tone: 'bad',
        tooltip: 'Gói License của trạm đã bị hủy bỏ.',
      };
    }
    if (reason === 'LICENSE_NOT_STARTED') {
      return {
        label: 'License chờ hiệu lực',
        tone: 'neutral',
        tooltip: 'Gói License của trạm chưa tới ngày bắt đầu hiệu lực.',
      };
    }
    if (reason === 'NO_ACTIVE_CHARGERS') {
      return {
        label: 'Chưa cấp trụ sạc',
        tone: 'neutral',
        tooltip: 'Trạm chưa có trụ sạc hoặc súng sạc nào được kích hoạt.',
      };
    }
    if (reason === 'ALL_CHARGERS_OFFLINE') {
      return {
        label: 'Tất cả trụ Offline',
        tone: 'warn',
        tooltip: 'Tất cả trụ sạc của trạm đang tạm dừng, chờ kích hoạt hoặc mất kết nối.',
      };
    }

    const resolvedTone: StationBadgeTone =
      eligibility.tone && eligibility.tone in TONE_CLASSES
        ? (eligibility.tone as StationBadgeTone)
        : 'warn';

    return {
      label: eligibility.label || 'Tạm ẩn tìm kiếm',
      tone: resolvedTone,
      tooltip: eligibility.details || 'Trạm tạm thời chưa đủ điều kiện nhận đón tài xế.',
    };
  }

  // 3. Active Station, Healthy & Eligible -> Operating Schedule State
  const normOperatingState = String(operatingState || '').toUpperCase();

  if (normOperatingState === 'PAUSED_BY_OWNER') {
    return {
      label: 'Tạm ngừng đón khách',
      tone: 'bad',
      pulse: false,
      tooltip: 'Chủ trạm đang chủ động tạm dừng tiếp nhận đặt chỗ mới.',
    };
  }

  if (normOperatingState === 'MAINTENANCE') {
    return {
      label: 'Đang bảo trì',
      tone: 'warn',
      pulse: false,
      tooltip: 'Trạm đang trong quá trình bảo trì kỹ thuật.',
    };
  }

  if (normOperatingState === 'UNAVAILABLE_BY_PLATFORM') {
    return {
      label: 'Không khả dụng',
      tone: 'neutral',
      pulse: false,
      tooltip: 'Trạm chưa đủ điều kiện hiển thị trên nền tảng.',
    };
  }

  if (normOperatingState === 'OPEN') {
    return {
      label: variant === 'compact' ? 'Đang mở' : 'Đang mở · Đón khách',
      tone: 'good',
      pulse: true,
      tooltip: 'Trạm đang trong giờ hoạt động và hiển thị sẵn sàng đón tài xế trên ứng dụng di động.',
    };
  }

  if (normOperatingState === 'CLOSED_BY_SCHEDULE') {
    return {
      label: 'Ngoài giờ hoạt động',
      tone: 'warn',
      tooltip: 'Trạm đang ngoài khung giờ hoạt động theo lịch đã cài đặt (vẫn đủ điều kiện hiển thị trên app).',
    };
  }

  if (normOperatingState === 'SCHEDULE_NOT_CONFIGURED') {
    return {
      label: 'Chưa cấu hình lịch',
      tone: 'neutral',
      tooltip: 'Trạm chưa thiết lập khung giờ hoạt động cụ thể.',
    };
  }

  return {
    label: 'Đang hoạt động',
    tone: 'good',
    pulse: false,
    tooltip: 'Trạm đang hoạt động bình thường trên hệ thống.',
  };
}

/**
 * Premium unified status badge for station cards and drawers.
 * Compact, cohesive, zero-wrap footprint.
 */
export function StationStatusBadge({
  status,
  operatingState,
  eligibility,
  className = '',
  variant = 'detailed',
  showDot = true,
}: StationStatusBadgeProps) {
  const config = resolveStationBadgeConfig(status, eligibility, operatingState, variant);
  const toneCfg = TONE_CLASSES[config.tone] || TONE_CLASSES.neutral;

  return (
    <span
      title={config.tooltip}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold leading-normal shrink-0 select-none whitespace-nowrap shadow-xs transition-colors hover:brightness-105 cursor-default ${toneCfg.pill} ${className}`}
    >
      {showDot && (
        <span className="relative flex h-1.5 w-1.5 shrink-0 items-center justify-center">
          {config.pulse && (
            <span
              className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 duration-1000 ${toneCfg.ping || toneCfg.dot}`}
            />
          )}
          <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${toneCfg.dot}`} />
        </span>
      )}
      <span>{config.label}</span>
    </span>
  );
}
