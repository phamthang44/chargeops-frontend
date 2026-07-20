export interface ProgressBarProps {
  /** 0–100. */
  value: number;
  color: string;
  className?: string;
}

/** Thin utilization/percentage bar. */
export function ProgressBar({ value, color, className = '' }: ProgressBarProps) {
  return (
    <span className={`block h-[6px] overflow-hidden rounded-[4px] bg-line-3 ${className}`}>
      <span
        className="block h-[6px] rounded-[4px]"
        style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color }}
      />
    </span>
  );
}
