"use client";

import { useState } from "react";
import Image from "next/image";

/**
 * Interactive preview of the real ChargeOps Operator Web Console (Giá & giờ hoạt động).
 * Features real screenshots in both Light and Dark modes with instant switching.
 */
export function OwnerConsolePreview() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  return (
    <div
      className={`relative w-full overflow-hidden transition-colors duration-300 ${
        theme === "dark" ? "bg-[#17181D]" : "bg-[#FAFBFB]"
      }`}
    >
      {/* Station context & Theme Switcher control bar */}
      <div
        className={`flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2.5 text-xs transition-colors duration-300 ${
          theme === "dark"
            ? "border-white/10 bg-[#121316] text-white/80"
            : "border-black/[0.06] bg-white text-ink-muted"
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse shrink-0" />
          <span
            className={`truncate text-[11px] font-semibold ${
              theme === "dark" ? "text-white/90" : "text-ink-strong"
            }`}
          >
            Trạm Trần Thị Do (ST-1202) · Giá & giờ hoạt động
          </span>
        </div>

        {/* Light / Dark Mode Toggle */}
        <div
          className={`flex items-center gap-1 rounded-full p-0.5 ring-1 transition-colors duration-300 ${
            theme === "dark" ? "bg-white/[0.06] ring-white/10" : "bg-black/[0.04] ring-black/5"
          }`}
        >
          <button
            type="button"
            onClick={() => setTheme("light")}
            aria-label="Xem giao diện sáng"
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all cursor-pointer ${
              theme === "light"
                ? "bg-white text-ink-strong shadow-sm ring-1 ring-black/5"
                : "text-ink-muted hover:text-ink-strong"
            }`}
          >
            <span>☀️</span>
            <span>Sáng</span>
          </button>
          <button
            type="button"
            onClick={() => setTheme("dark")}
            aria-label="Xem giao diện tối"
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all cursor-pointer ${
              theme === "dark"
                ? "bg-[#23242B] text-white shadow-sm ring-1 ring-white/15"
                : "text-ink-muted hover:text-ink-strong"
            }`}
          >
            <span>🌙</span>
            <span>Tối</span>
          </button>
        </div>
      </div>

      {/* Screenshot display with instant cross-fade */}
      <div className="relative aspect-[909/912] w-full select-none overflow-hidden bg-black/[0.02]">
        {/* Light Screenshot */}
        <Image
          src="/screens/owner-pricing-light.png"
          alt="Giao diện cấu hình giá và giờ hoạt động trạm sạc ChargeOps Console (Giao diện sáng)"
          width={909}
          height={912}
          priority
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
            theme === "light" ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
          }`}
        />
        {/* Dark Screenshot */}
        <Image
          src="/screens/owner-pricing-dark.png"
          alt="Giao diện cấu hình giá và giờ hoạt động trạm sạc ChargeOps Console (Giao diện tối)"
          width={909}
          height={912}
          priority
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
            theme === "dark" ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
          }`}
        />
      </div>
    </div>
  );
}
