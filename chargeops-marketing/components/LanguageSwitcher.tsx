"use client";

import { useState, useRef, useEffect, useId } from "react";
import { motion, AnimatePresence } from "motion/react";
import { SPRINGS } from "@/lib/motionTokens";
import { useLocale, useTranslation, type Locale } from "@/lib/i18n";
import { GlobeIcon, ChevronDownIcon, CheckIcon } from "@/components/Icons";

/* =========================================================================
   MATHEMATICALLY EXACT & AESTHETICALLY REFINED VECTOR FLAGS (Ratio 3:2)
   ========================================================================= */

/**
 * National Flag of Vietnam (Quốc kỳ Việt Nam)
 * Built to official geometric constitutional standards:
 * - 3:2 aspect ratio (30 x 20)
 * - Official deep red background (#DA251D)
 * - Exact golden-ratio pentagram star centered at (15, 10), R=6, r=2.292 (#FFFF00)
 * - Satin light sheen and anti-aliased hairline bezel
 */
export function VietnamFlag({ className = "h-4 w-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 30 20"
      className={`${className} shrink-0 rounded-[3px] shadow-sm overflow-hidden`}
      aria-hidden="true"
    >
      {/* Official Red Background */}
      <rect width="30" height="20" fill="#DA251D" />

      {/* Official Golden Five-Pointed Star */}
      <polygon
        points="15,4 16.347,8.146 20.706,8.146 17.18,10.708 18.527,14.854 15,12.292 11.473,14.854 12.82,10.708 9.294,8.146 13.653,8.146"
        fill="#FFFF00"
      />
    </svg>
  );
}

/**
 * Global / English Flag (US/UK International Standard)
 * - 3:2 aspect ratio (30 x 20)
 * - 13 crisp stripes & star field
 */
export function GlobalFlag({ className = "h-4 w-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 30 20"
      className={`${className} shrink-0 rounded-[3px] shadow-sm overflow-hidden`}
      aria-hidden="true"
    >
      {/* 13 Stripes */}
      <rect width="30" height="20" fill="#B22234" />
      <rect y="1.54" width="30" height="1.54" fill="#FFFFFF" />
      <rect y="4.62" width="30" height="1.54" fill="#FFFFFF" />
      <rect y="7.69" width="30" height="1.54" fill="#FFFFFF" />
      <rect y="10.77" width="30" height="1.54" fill="#FFFFFF" />
      <rect y="13.85" width="30" height="1.54" fill="#FFFFFF" />
      <rect y="16.92" width="30" height="1.54" fill="#FFFFFF" />

      {/* Blue Canton */}
      <rect width="12" height="10.77" fill="#3C3B6E" />

      {/* Symmetrical Star Dots */}
      <circle cx="2.4" cy="2" r="0.65" fill="#FFFFFF" />
      <circle cx="4.8" cy="2" r="0.65" fill="#FFFFFF" />
      <circle cx="7.2" cy="2" r="0.65" fill="#FFFFFF" />
      <circle cx="9.6" cy="2" r="0.65" fill="#FFFFFF" />
      <circle cx="3.6" cy="4" r="0.65" fill="#FFFFFF" />
      <circle cx="6" cy="4" r="0.65" fill="#FFFFFF" />
      <circle cx="8.4" cy="4" r="0.65" fill="#FFFFFF" />
      <circle cx="2.4" cy="6" r="0.65" fill="#FFFFFF" />
      <circle cx="4.8" cy="6" r="0.65" fill="#FFFFFF" />
      <circle cx="7.2" cy="6" r="0.65" fill="#FFFFFF" />
      <circle cx="9.6" cy="6" r="0.65" fill="#FFFFFF" />
      <circle cx="3.6" cy="8" r="0.65" fill="#FFFFFF" />
      <circle cx="6" cy="8" r="0.65" fill="#FFFFFF" />
      <circle cx="8.4" cy="8" r="0.65" fill="#FFFFFF" />
    </svg>
  );
}

interface LanguageSwitcherProps {
  className?: string;
  variant?: "floating" | "footer" | "drawer" | "popover";
  direction?: "up" | "down";
}

export function LanguageSwitcher({
  className = "",
  variant = "floating",
  direction,
}: LanguageSwitcherProps) {
  const { locale, setLocale } = useLocale();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  // Floating & footer variants open upwards to avoid screen clipping
  const opensUpward = direction ? direction === "up" : variant === "floating" || variant === "footer";

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (nextLocale: Locale) => {
    setLocale(nextLocale);
    setIsOpen(false);
  };

  const isVi = locale === "vi";

  /* =========================================================================
     1. DRAWER VARIANT (Inlined for Mobile Navigation Drawer)
     ========================================================================= */
  if (variant === "drawer") {
    return (
      <div className={`w-full rounded-2xl border border-white/10 bg-[#0E1512]/90 p-3.5 ${className}`}>
        {/* Drawer Header */}
        <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <GlobeIcon className="h-4 w-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">
                {t.languageSetup.menuTitle}
              </span>
              <span className="text-[10px] text-white/50 block">
                {t.languageSetup.languagesLabel}
              </span>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-semibold text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {isVi ? "VI · 🇻🇳" : "EN · 🇺🇸"}
          </span>
        </div>

        {/* 2 Language Option Cards */}
        <div className="grid grid-cols-2 gap-2">
          {/* Vietnamese Button */}
          <button
            type="button"
            onClick={() => handleSelect("vi")}
            className={`cursor-pointer text-left p-2.5 rounded-xl border transition-all duration-200 relative ${
              isVi
                ? "border-emerald-500/50 bg-[#121A16] ring-1 ring-emerald-500/30 shadow-glow-emerald"
                : "border-white/10 bg-white/[0.03] hover:border-white/20 text-white/70"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <VietnamFlag className="h-4 w-6" />
              {isVi && (
                <span className="h-4 w-4 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <CheckIcon className="h-2.5 w-2.5" />
                </span>
              )}
            </div>
            <span className="text-xs font-bold text-white block">
              {t.languageSetup.viName}
            </span>
            <span className="text-[10px] text-white/50 line-clamp-1 block">
              {t.languageSetup.viBadge}
            </span>
          </button>

          {/* English Button */}
          <button
            type="button"
            onClick={() => handleSelect("en")}
            className={`cursor-pointer text-left p-2.5 rounded-xl border transition-all duration-200 relative ${
              !isVi
                ? "border-emerald-500/50 bg-[#121A16] ring-1 ring-emerald-500/30 shadow-glow-emerald"
                : "border-white/10 bg-white/[0.03] hover:border-white/20 text-white/70"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <GlobalFlag className="h-4 w-6" />
              {!isVi && (
                <span className="h-4 w-4 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <CheckIcon className="h-2.5 w-2.5" />
                </span>
              )}
            </div>
            <span className="text-xs font-bold text-white block">
              {t.languageSetup.enName}
            </span>
            <span className="text-[10px] text-white/50 line-clamp-1 block">
              {t.languageSetup.enBadge}
            </span>
          </button>
        </div>

        {/* Sync notice */}
        <p className="mt-2 text-[10px] text-white/40 text-center">
          {t.languageSetup.syncNotice}
        </p>
      </div>
    );
  }

  /* =========================================================================
     2. FLOATING / FOOTER / POPOVER VARIANTS
     ========================================================================= */

  // Container styling based on variant
  const containerClasses =
    variant === "floating"
      ? `fixed bottom-6 left-6 z-40 hidden sm:block ${className}`
      : `relative inline-block ${className}`;

  // Popover positioning (upward vs downward)
  const popoverPositionClasses = opensUpward
    ? variant === "footer"
      ? "bottom-full mb-3 origin-bottom"
      : "bottom-full mb-3 left-0 origin-bottom-left"
    : "top-full mt-3 right-0 origin-top-right";
  const popoverStyle =
    variant === "footer"
      ? {
          left: "calc(50% - min(11rem, calc(50vw - 1rem)))",
          width: "min(22rem, calc(100vw - 2rem))",
        }
      : undefined;

  return (
    <div ref={containerRef} className={containerClasses}>
      {/* Trigger Button */}
      {variant === "footer" ? (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          aria-controls={menuId}
          aria-label={t.languageSetup.triggerButtonLabel}
          className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs text-white/70 hover:text-white hover:border-white/25 hover:bg-white/[0.08] transition-all cursor-pointer backdrop-blur-md"
        >
          <GlobeIcon className="h-3.5 w-3.5 text-emerald-400" />
          {isVi ? <VietnamFlag className="h-3.5 w-5" /> : <GlobalFlag className="h-3.5 w-5" />}
          <span className="font-semibold">{isVi ? "Tiếng Việt (VN)" : "English (US)"}</span>
          <ChevronDownIcon
            className={`h-3 w-3 text-white/40 group-hover:text-white transition-transform duration-300 ${
              isOpen ? "rotate-180 text-emerald-400" : "rotate-0"
            }`}
          />
        </button>
      ) : (
        /* Floating / Island Trigger */
        <motion.button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          transition={SPRINGS.haptic}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          aria-controls={menuId}
          aria-label={t.languageSetup.triggerButtonLabel}
          className={`group flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold backdrop-blur-md shadow-[0_8px_24px_-8px_rgba(0,0,0,0.85)] transition-all duration-300 cursor-pointer ${
            isOpen
              ? "border-emerald-500/50 bg-[#0E1512] text-white shadow-glow-emerald ring-1 ring-emerald-500/40"
              : "border-white/15 bg-[#0E1512]/90 text-white/85 hover:border-white/30 hover:bg-[#121A16] hover:text-white"
          }`}
        >
          <span className="text-emerald-400 group-hover:scale-110 transition-transform">
            <GlobeIcon className="h-3.5 w-3.5" />
          </span>

          {isVi ? <VietnamFlag className="h-3.5 w-5" /> : <GlobalFlag className="h-3.5 w-5" />}

          <span className="font-bold tracking-wide text-xs">
            {isVi ? "VI" : "EN"}
          </span>

          <span
            className={`text-white/40 group-hover:text-white/70 transition-transform duration-300 ${
              isOpen ? "rotate-180 text-emerald-400" : "rotate-0"
            }`}
          >
            <ChevronDownIcon className="h-3 w-3" />
          </span>
        </motion.button>
      )}

      {/* Floating Anchored Setup Menu Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id={menuId}
            role="dialog"
            aria-label={t.languageSetup.menuTitle}
            initial={{ opacity: 0, scale: 0.96, y: opensUpward ? 6 : -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: opensUpward ? 6 : -6 }}
            transition={SPRINGS.layout}
            style={popoverStyle}
            className={`absolute w-80 sm:w-88 max-w-[calc(100vw_-_2rem)] z-50 ${popoverPositionClasses}`}
          >
            {/* Popover Frame */}
            <div className="w-full rounded-2xl bg-[#0A0F0D]/95 border border-white/15 backdrop-blur-2xl p-4 space-y-4 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95),0_0_35px_rgba(16,185,129,0.12)]">
                {/* Popover Header */}
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shadow-glow-emerald">
                      <GlobeIcon className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-white tracking-tight">
                        {t.languageSetup.menuTitle}
                      </h4>
                      <p className="text-[11px] text-white/50 line-clamp-1">
                        {t.languageSetup.menuSubtitle}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    aria-label={t.languageSetup.closeMenu}
                    className="h-6 w-6 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors cursor-pointer text-xs"
                  >
                    ✕
                  </button>
                </div>

                {/* Language Selection Radio Cards */}
                <div>
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider block mb-2 px-1">
                    {t.languageSetup.languagesLabel}
                  </span>

                  <div className="space-y-2">
                    {/* Option 1: Vietnamese */}
                    <button
                      type="button"
                      onClick={() => handleSelect("vi")}
                      className={`w-full group cursor-pointer text-left p-3 rounded-xl border transition-all duration-200 relative flex items-center justify-between ${
                        isVi
                          ? "border-emerald-500/60 bg-[#121A16] shadow-glow-emerald ring-1 ring-emerald-500/30"
                          : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06] text-white/70 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-1 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center">
                          <VietnamFlag className="h-5 w-7.5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold text-white">
                              {t.languageSetup.viName}
                            </span>
                            <span className="px-1.5 py-0.2 rounded bg-emerald-500/15 border border-emerald-500/30 text-[9px] font-bold text-emerald-400">
                              {t.languageSetup.viBadge}
                            </span>
                          </div>
                          <span className="text-xs text-white/50 block">
                            {t.languageSetup.viRegion}
                          </span>
                        </div>
                      </div>

                      {isVi ? (
                        <div className="h-6 w-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-glow-emerald">
                          <CheckIcon className="h-3.5 w-3.5" />
                        </div>
                      ) : (
                        <div className="h-4 w-4 rounded-full border border-white/20 group-hover:border-white/40 transition-colors" />
                      )}
                    </button>

                    {/* Option 2: English */}
                    <button
                      type="button"
                      onClick={() => handleSelect("en")}
                      className={`w-full group cursor-pointer text-left p-3 rounded-xl border transition-all duration-200 relative flex items-center justify-between ${
                        !isVi
                          ? "border-emerald-500/60 bg-[#121A16] shadow-glow-emerald ring-1 ring-emerald-500/30"
                          : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06] text-white/70 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-1 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center">
                          <GlobalFlag className="h-5 w-7.5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold text-white">
                              {t.languageSetup.enName}
                            </span>
                            <span className="px-1.5 py-0.2 rounded bg-cyan-500/15 border border-cyan-500/30 text-[9px] font-bold text-cyan-400">
                              {t.languageSetup.enBadge}
                            </span>
                          </div>
                          <span className="text-xs text-white/50 block">
                            {t.languageSetup.enRegion}
                          </span>
                        </div>
                      </div>

                      {!isVi ? (
                        <div className="h-6 w-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-glow-emerald">
                          <CheckIcon className="h-3.5 w-3.5" />
                        </div>
                      ) : (
                        <div className="h-4 w-4 rounded-full border border-white/20 group-hover:border-white/40 transition-colors" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Regional Context Panel */}
                <div className="rounded-xl bg-white/[0.03] border border-white/5 p-3 space-y-2 text-[11px]">
                  <span className="font-bold text-white/60 tracking-wider uppercase text-[10px] block">
                    {t.languageSetup.regionalContextTitle}
                  </span>
                  <div className="flex items-center justify-between text-white/70">
                    <span className="text-white/40">{t.languageSetup.networkRegion}</span>
                    <span className="font-semibold text-white/90">
                      {isVi ? "Toàn quốc (VN)" : "Nationwide (VN)"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-white/70">
                    <span className="text-white/40">{t.languageSetup.currency}</span>
                    <span className="font-semibold text-emerald-400 font-mono">
                      VND (₫) · PayOS / QR
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-white/70">
                    <span className="text-white/40">{t.languageSetup.timezone}</span>
                    <span className="font-semibold text-white/90 font-mono">
                      ICT (UTC+07:00)
                    </span>
                  </div>
                </div>

                {/* Popover Footer Notice */}
                <div className="flex items-center gap-2 pt-1 text-[10.5px] text-white/45">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <span>{t.languageSetup.syncNotice}</span>
                </div>
              </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
