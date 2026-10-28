"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslation } from "@/lib/i18n";

/**
 * Interactive preview of the real ChargeOps Operator Web Console (Giá & giờ hoạt động).
 * Features real screenshots in both Light and Dark modes with instant switching.
 */
export function OwnerConsolePreview() {
  const { t } = useTranslation();
  const [theme, setTheme] = useState<"light" | "dark">("dark");

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
            {t.owner.consoleStationContext}
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
            aria-label={t.owner.lightMode}
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all cursor-pointer ${
              theme === "light"
                ? "bg-white text-ink-strong shadow-sm ring-1 ring-black/5"
                : "text-ink-muted hover:text-ink-strong"
            }`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-3.5 w-3.5 text-amber-500">
              <circle cx="12" cy="12" r="4" />
              <path strokeLinecap="round" d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41m14.14-14.14l-1.41 1.41" />
            </svg>
            <span>{t.owner.lightMode}</span>
          </button>
          <button
            type="button"
            onClick={() => setTheme("dark")}
            aria-label={t.owner.darkMode}
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all cursor-pointer ${
              theme === "dark"
                ? "bg-[#23242B] text-white shadow-sm ring-1 ring-white/15"
                : "text-ink-muted hover:text-ink-strong"
            }`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-3.5 w-3.5 text-sky-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
            </svg>
            <span>{t.owner.darkMode}</span>
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
