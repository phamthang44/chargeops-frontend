import { Card } from './Card';

export interface TrendChartProps {
  title: string;
  /** Axis end labels, e.g. ["18/06", "28/06"]. */
  axis: [string, string];
  legend?: { label: string; colorClass: string }[];
}

/**
 * Dual-series area/line chart (revenue + bookings) — static SVG lifted from the
 * dashboard design. Becomes data-driven once the REST API exists.
 */
export function TrendChart({ title, axis, legend = [] }: TrendChartProps) {
  return (
    <Card className="p-4">
      <div className="mb-3.5 flex items-center justify-between">
        <div className="text-[14px] font-semibold">{title}</div>
        <div className="flex gap-3.5 text-[11px] font-medium text-muted">
          {legend.map((l) => (
            <span key={l.label} className="flex items-center gap-[5px]">
              <span className={`h-[9px] w-[9px] rounded-[3px] ${l.colorClass}`} />
              {l.label}
            </span>
          ))}
        </div>
      </div>
      <svg viewBox="0 0 600 180" className="block h-auto w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="trend-a" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#5b54e8" stopOpacity=".22" />
            <stop offset="1" stopColor="#5b54e8" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1="0" y1="45" x2="600" y2="45" stroke="#eef0f2" />
        <line x1="0" y1="90" x2="600" y2="90" stroke="#eef0f2" />
        <line x1="0" y1="135" x2="600" y2="135" stroke="#eef0f2" />
        <path
          d="M10,140 L55,124 L100,130 L145,104 L190,112 L235,86 L280,96 L325,70 L370,82 L415,58 L460,70 L505,46 L550,56 L590,40 L590,180 L10,180 Z"
          fill="url(#trend-a)"
        />
        <polyline
          points="10,140 55,124 100,130 145,104 190,112 235,86 280,96 325,70 370,82 415,58 460,70 505,46 550,56 590,40"
          fill="none"
          stroke="#5b54e8"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <polyline
          points="10,158 55,150 100,154 145,140 190,146 235,132 280,138 325,120 370,128 415,112 460,120 505,104 550,112 590,100"
          fill="none"
          stroke="#c8c5f6"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="mt-2 flex justify-between font-mono text-[10px] font-medium text-ghost">
        <span>{axis[0]}</span>
        <span>{axis[1]}</span>
      </div>
    </Card>
  );
}
