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
  url = "https://console.chargeops.online/owner/pricing",
  title = "ChargeOps Operator Console — Quản trị trạm sạc",
  className,
}: BrowserFrameProps) {
  return (
    <div className={`double-bezel shadow-2xl ${className ?? ""}`}>
      <div className="relative overflow-hidden rounded-[calc(2rem-0.375rem)] border border-black/[0.06] bg-white shadow-sm">
        {/* Window Titlebar */}
        <div className="flex items-center justify-between border-b border-black/[0.06] bg-[#FAFBFB] px-4 py-3 backdrop-blur">
          {/* macOS Traffic Lights */}
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#FF5F56] shadow-sm ring-1 ring-black/10" />
            <span className="h-3 w-3 rounded-full bg-[#FFBD2E] shadow-sm ring-1 ring-black/10" />
            <span className="h-3 w-3 rounded-full bg-[#27C93F] shadow-sm ring-1 ring-black/10" />
          </div>

          {/* Address Bar */}
          <div className="mx-2 flex max-w-sm flex-1 items-center justify-center gap-2 rounded-lg border border-black/5 bg-white px-3.5 py-1 text-[11px] font-medium text-ink-muted shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] sm:max-w-md">
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
            <span className="truncate font-mono text-[10.5px] text-ink-strong">{url}</span>
          </div>

          {/* Right Tab Status Indicator */}
          <div className="flex items-center gap-1.5 opacity-70">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="hidden text-[10px] font-semibold uppercase tracking-wider text-ink-muted sm:inline">
              LIVE
            </span>
          </div>
        </div>

        {/* Screen Content Container */}
        <div className="relative overflow-hidden bg-surface-alt">{children}</div>
      </div>
    </div>
  );
}
