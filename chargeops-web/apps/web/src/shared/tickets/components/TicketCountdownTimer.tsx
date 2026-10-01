import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconClock } from '@chargeops/ui';

interface TicketCountdownTimerProps {
  autoCloseAt?: string | null;
  resolvedAt?: string | null;
  className?: string;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
  isExpired: boolean;
  progressPercent: number; // 0 to 100 elapsed
}

const TOTAL_10_DAYS_SECONDS = 10 * 24 * 60 * 60; // 864,000s

function computeRemaining(autoCloseAtStr?: string | null, resolvedAtStr?: string | null): TimeRemaining {
  if (!autoCloseAtStr) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, totalSeconds: 0, isExpired: false, progressPercent: 0 };
  }

  const target = new Date(autoCloseAtStr).getTime();
  const now = Date.now();
  const diff = target - now;

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, totalSeconds: 0, isExpired: true, progressPercent: 100 };
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  // Calculate elapsed percentage
  let progressPercent = 0;
  if (resolvedAtStr) {
    const start = new Date(resolvedAtStr).getTime();
    const elapsed = now - start;
    const totalDuration = target - start;
    if (totalDuration > 0) {
      progressPercent = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
    }
  } else {
    progressPercent = Math.min(100, Math.max(0, ((TOTAL_10_DAYS_SECONDS - totalSeconds) / TOTAL_10_DAYS_SECONDS) * 100));
  }

  return { days, hours, minutes, seconds, totalSeconds, isExpired: false, progressPercent };
}

export function TicketCountdownTimer({ autoCloseAt, resolvedAt, className = '' }: TicketCountdownTimerProps) {
  const { t } = useTranslation('tickets');
  const [timeLeft, setTimeLeft] = useState<TimeRemaining>(() => computeRemaining(autoCloseAt, resolvedAt));

  useEffect(() => {
    setTimeLeft(computeRemaining(autoCloseAt, resolvedAt));
    const interval = setInterval(() => {
      setTimeLeft(computeRemaining(autoCloseAt, resolvedAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [autoCloseAt, resolvedAt]);

  if (!autoCloseAt) return null;

  if (timeLeft.isExpired) {
    return (
      <div
        className={`inline-flex items-center gap-2 rounded-full border border-bad-border bg-bad-soft px-3 py-1 text-[11.5px] font-semibold text-bad-deep ${className}`}
      >
        <IconClock size={13} strokeWidth={2.2} className="animate-spin text-bad" />
        <span>{t('countdown.expired', 'Đã quá hạn 10 ngày (Chờ Scheduler tự đóng)')}</span>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/10 px-3.5 py-1 text-amber-500 shadow-sm backdrop-blur-sm ${className}`}
    >
      <IconClock size={14} strokeWidth={2.2} className="shrink-0 text-amber-500 animate-pulse" />
      <div className="flex items-center gap-1.5 text-[11.5px] font-medium text-amber-900 dark:text-amber-100">
        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
          {t('countdown.autoClosePrefix', 'Tự đóng sau:')}
        </span>
        <span className="font-mono font-bold tracking-tight text-amber-500">
          {timeLeft.days > 0 && `${timeLeft.days}d `}
          {String(timeLeft.hours).padStart(2, '0')}h : {String(timeLeft.minutes).padStart(2, '0')}m : {String(timeLeft.seconds).padStart(2, '0')}s
        </span>
      </div>

      {/* Micro progress pill */}
      <div className="hidden h-1.5 w-12 overflow-hidden rounded-full bg-amber-500/20 sm:block">
        <div
          className="h-full bg-amber-500 transition-all duration-1000"
          style={{ width: `${timeLeft.progressPercent}%` }}
        />
      </div>
    </div>
  );
}
