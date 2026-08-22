import React from 'react';

export interface RadialCountdownProps {
  /** Total duration in seconds (e.g. 60). */
  totalSeconds: number;
  /** Current remaining seconds. */
  remainingSeconds: number;
  /** Size in pixels. Default 120. */
  size?: number;
  /** Stroke thickness. Default 8. */
  strokeWidth?: number;
  /** Custom class names. */
  className?: string;
  /** Action triggered when clicking countdown. */
  onRefresh?: () => void;
}

export function RadialCountdown({
  totalSeconds = 60,
  remainingSeconds,
  size = 110,
  strokeWidth = 7,
  className = '',
  onRefresh,
}: RadialCountdownProps) {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(1, remainingSeconds / totalSeconds));
  const strokeDashoffset = circumference * (1 - progress);

  // Dynamic color tone based on urgency
  let strokeColor = '#10B981'; // Emerald (>20s)
  let glowColor = 'rgba(16, 185, 129, 0.35)';
  let isExpiring = false;

  if (remainingSeconds <= 10) {
    strokeColor = '#EF4444'; // Red (<10s)
    glowColor = 'rgba(239, 68, 68, 0.45)';
    isExpiring = true;
  } else if (remainingSeconds <= 25) {
    strokeColor = '#F59E0B'; // Amber (10-25s)
    glowColor = 'rgba(245, 158, 11, 0.35)';
  }

  return (
    <div
      className={`relative inline-flex flex-col items-center justify-center select-none antialiased ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        className={`transform -rotate-90 transition-all duration-300 ${
          isExpiring ? 'animate-pulse' : ''
        }`}
        style={{ filter: `drop-shadow(0 0 8px ${glowColor})` }}
      >
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.12)"
          strokeWidth={strokeWidth}
        />
        {/* Animated progress ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease',
          }}
        />
      </svg>

      {/* Center content */}
      <button
        type="button"
        onClick={onRefresh}
        title={onRefresh ? 'Nhấn để làm mới mã QR ngay' : undefined}
        className="absolute inset-0 flex flex-col items-center justify-center rounded-full transition-transform active:scale-95 focus:outline-none cursor-pointer group"
      >
        <span
          className="font-mono text-2xl font-bold leading-none tracking-tight tabular-nums transition-colors"
          style={{ color: strokeColor }}
        >
          {Math.ceil(remainingSeconds)}s
        </span>
        <span className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 group-hover:text-slate-200 transition-colors">
          {remainingSeconds <= 0 ? 'Hết hạn' : 'Hiệu lực'}
        </span>
      </button>
    </div>
  );
}
