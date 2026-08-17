import { IconCheckCircle, IconClock, IconInfo, IconShieldAlert } from './icons';

export interface DriverEligibilityBadgeProps {
  isEligible: boolean;
  label?: string;
  tone?: 'good' | 'warn' | 'bad' | 'neutral';
  className?: string;
}

export function DriverEligibilityBadge({
  isEligible,
  label,
  tone = isEligible ? 'good' : 'warn',
  className = '',
}: DriverEligibilityBadgeProps) {
  const displayLabel = label || (isEligible ? 'Đang nhận khách' : 'Tạm ẩn tìm kiếm');

  if (isEligible) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full bg-good-soft px-2.5 py-0.5 text-[11px] font-semibold text-good-deep border border-good-border/50 ${className}`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-good animate-pulse" />
        <span>{displayLabel}</span>
      </span>
    );
  }

  if (tone === 'bad') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full bg-bad-soft px-2.5 py-0.5 text-[11px] font-semibold text-bad-deep border border-bad-border/50 ${className}`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-bad" />
        <span>{displayLabel}</span>
      </span>
    );
  }

  if (tone === 'warn') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full bg-warn-soft px-2.5 py-0.5 text-[11px] font-semibold text-warn-deep border border-warn-border/50 ${className}`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-warn" />
        <span>{displayLabel}</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-0.5 text-[11px] font-semibold text-muted border border-line-3 ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-faint" />
      <span>{displayLabel}</span>
    </span>
  );
}

export interface DriverEligibilityBannerProps {
  isEligible: boolean;
  reason?: string;
  details?: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export function DriverEligibilityBanner({
  isEligible,
  reason,
  details,
  actionText,
  onAction,
  className = '',
}: DriverEligibilityBannerProps) {
  if (isEligible) return null;

  const isExpired = reason === 'LICENSE_EXPIRED';
  const isSuspended = reason === 'LICENSE_SUSPENDED';

  const defaultDetails = isSuspended
    ? 'Trạm đang tạm ngưng nhận đặt chỗ mới do License bị tạm ngưng. Các phiên sạc đã xác nhận trước đó vẫn hoàn thành bình thường.'
    : isExpired
      ? 'Trạm sạc đang tạm ẩn khỏi ứng dụng tài xế do gói Giấy phép (License) đã hết hạn. Các phiên sạc đang chạy vẫn tiếp tục bình thường.'
      : details || 'Trạm sạc hiện chưa đủ điều kiện hiển thị nhận đặt chỗ từ tài xế.';

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-[10px] border border-warn-border bg-warn-soft/50 p-3 text-[12px] leading-relaxed text-warn-deep shadow-xs ${className}`}
    >
      <div className="flex items-start gap-2.5">
        <IconShieldAlert size={18} className="mt-0.5 shrink-0 text-warn" />
        <div>
          <div className="font-bold text-ink">
            {isSuspended
              ? 'Trạm đang tạm ngưng đón khách mới'
              : isExpired
                ? 'Trạm đang tạm ẩn khỏi bản đồ tìm kiếm'
                : 'Trạm chưa mở đón khách'}
          </div>
          <div className="mt-0.5 text-muted">{defaultDetails}</div>
        </div>
      </div>

      {actionText && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="shrink-0 rounded-[7px] bg-warn-pill px-3 py-1.5 text-[11.5px] font-bold text-warn-deep hover:bg-warn/20 transition-colors self-start sm:self-center"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
