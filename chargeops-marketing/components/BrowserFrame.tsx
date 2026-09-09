import type { ReactNode } from "react";

interface BrowserFrameProps {
  children: ReactNode;
  url?: string;
  title?: string;
  className?: string;
}

/**
 * A polished macOS-style desktop browser window frame
 * for showcasing the ChargeOps Web Operator Console.
 */
export function BrowserFrame({
  children,
  url = "https://console.chargeops.vn/owner/pricing",
  title = "ChargeOps Operator Console — Quản trị trạm sạc",
  className,
}: BrowserFrameProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-line bg-white shadow-2xl transition duration-300 hover:shadow-glass ${
        className ?? ""
      }`}
    >
      {/* Window Titlebar */}
      <div className="flex items-center justify-between border-b border-line bg-surface-alt/90 px-4 py-3 backdrop-blur">
        {/* macOS Traffic Lights */}
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-[#FF5F56] shadow-sm ring-1 ring-black/10" />
          <span className="h-3 w-3 rounded-full bg-[#FFBD2E] shadow-sm ring-1 ring-black/10" />
          <span className="h-3 w-3 rounded-full bg-[#27C93F] shadow-sm ring-1 ring-black/10" />
        </div>

        {/* Address Bar */}
        <div className="mx-2 flex max-w-sm flex-1 items-center justify-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1 text-[11px] font-medium text-ink-muted shadow-sm sm:max-w-md">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="h-3 w-3 text-primary"
            aria-hidden="true"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span className="truncate text-ink-strong">{url}</span>
        </div>

        {/* Right Tab Tool Action Placeholder */}
        <div className="flex items-center gap-1.5 opacity-60">
          <span className="h-2 w-2 rounded-full bg-ink-muted/30" />
          <span className="hidden text-[10px] font-semibold text-ink-muted sm:inline">
            {title}
          </span>
        </div>
      </div>

      {/* Screen Content Container */}
      <div className="relative overflow-hidden bg-surface-alt">{children}</div>
    </div>
  );
}
