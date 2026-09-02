export type StationOperatingState =
  | 'OPEN'
  | 'CLOSED_BY_SCHEDULE'
  | 'SCHEDULE_NOT_CONFIGURED';

export interface StationOperatingBadgeProps {
  state?: StationOperatingState | string | null;
  className?: string;
}

const STATE_CONFIG: Record<
  StationOperatingState,
  { label: string; bg: string; text: string; dot: string; pulse?: boolean }
> = {
  OPEN: {
    label: 'Đang mở',
    bg: 'bg-good-soft border-good-border/50',
    text: 'text-good-deep',
    dot: 'bg-good',
    pulse: true,
  },
  CLOSED_BY_SCHEDULE: {
    label: 'Đóng theo lịch',
    bg: 'bg-warn-soft border-warn-border/50',
    text: 'text-warn-deep',
    dot: 'bg-warn',
  },
  SCHEDULE_NOT_CONFIGURED: {
    label: 'Chưa cấu hình lịch',
    bg: 'bg-surface-2 border-line-3',
    text: 'text-muted',
    dot: 'bg-faint',
  },
};

export function StationOperatingBadge({
  state = 'SCHEDULE_NOT_CONFIGURED',
  className = '',
}: StationOperatingBadgeProps) {
  const normState: StationOperatingState =
    state === 'OPEN' || state === 'CLOSED_BY_SCHEDULE'
      ? state
      : 'SCHEDULE_NOT_CONFIGURED';

  const cfg = STATE_CONFIG[normState];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${cfg.bg} ${cfg.text} ${className}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${cfg.dot} ${cfg.pulse ? 'animate-pulse' : ''}`}
      />
      <span>{cfg.label}</span>
    </span>
  );
}
