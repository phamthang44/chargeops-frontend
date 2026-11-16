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
  /** "dark" for the dark sub-pages (default); "light" for the light home page. */
  tone?: "dark" | "light";
}

/* Class sets per tone. Only colour, border, shadow and type change; layout is shared. */
const TONES = {
  dark: {
    font: "",
    trigger:
      "border-white/15 bg-[#0E1512]/90 text-white/85 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.85)] hover:border-white/30 hover:bg-[#121A16] hover:text-white",
    triggerOpen: "border-emerald-500/50 bg-[#0E1512] text-white shadow-glow-emerald ring-1 ring-emerald-500/40",
    triggerSize: "gap-2 px-3 py-1.5 text-xs",
    globe: "text-emerald-400",
    chevron: "text-white/40 group-hover:text-white/70",
    chevronOpen: "text-emerald-400",
    frame:
      "rounded-2xl bg-[#0A0F0D]/95 border border-white/15 backdrop-blur-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95),0_0_35px_rgba(16,185,129,0.12)]",
    drawer: "border-white/10 bg-[#0E1512]/90",
    pill: "bg-white/5 border-white/10 text-emerald-400",
    divider: "border-white/10",
    headIcon: "rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 shadow-glow-emerald",
    title: "font-extrabold text-white",
    subtitle: "text-white/50",
    close: "bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 hover:text-white",
    label: "text-white/40",
    option: "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06] text-white/70 hover:text-white",
    optionActive: "border-emerald-500/60 bg-[#121A16] shadow-glow-emerald ring-1 ring-emerald-500/30",
    flagWrap: "bg-black/40 border border-white/10",
    name: "text-white",
    badgeVi: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400",
    badgeEn: "bg-cyan-500/15 border-cyan-500/30 text-cyan-400",
    region: "text-white/50",
    check: "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 shadow-glow-emerald",
    radio: "border-white/20 group-hover:border-white/40",
    panel: "bg-white/[0.03] border border-white/5",
    panelTitle: "text-white/60",
    panelKey: "text-white/40",
    panelVal: "text-white/90",
    panelAccent: "text-emerald-400",
    foot: "text-white/45",
    dot: "bg-emerald-400",
  },
  light: {
    font: "font-display",
    trigger:
      "border-hm-ink/10 bg-white/90 text-hm-ink shadow-[0_14px_34px_-14px_rgba(11,43,36,0.45)] backdrop-blur-xl hover:border-hm-brand/30 hover:bg-hm-mint",
    triggerOpen: "border-hm-brand/50 bg-white text-hm-ink ring-1 ring-hm-brand/30 shadow-[0_14px_34px_-14px_rgba(11,43,36,0.45)]",
    triggerSize: "h-11 gap-2 px-4 text-[13px]",
    globe: "text-hm-deep",
    chevron: "text-hm-body/50 group-hover:text-hm-ink",
    chevronOpen: "text-hm-deep",
    frame: "rounded-[20px] rounded-tr-[40px] bg-white border border-hm-ink/10 shadow-[0_30px_70px_-24px_rgba(11,43,36,0.45)]",
    drawer: "border-hm-ink/10 bg-white",
    pill: "border-hm-brand/30 bg-hm-mint text-hm-deep",
    divider: "border-hm-ink/10",
    headIcon: "rounded-full bg-hm-mint text-hm-deep",
    title: "font-bold text-hm-ink",
    subtitle: "text-hm-body",
    close: "bg-hm-paper hover:bg-hm-mint border border-hm-ink/10 text-hm-body hover:text-hm-ink",
    label: "text-hm-body/70",
    option: "border-hm-ink/10 bg-white hover:border-hm-ink/20 hover:bg-hm-paper text-hm-body hover:text-hm-ink",
    optionActive: "border-hm-brand bg-hm-mint/60 ring-1 ring-hm-brand/25",
    flagWrap: "bg-white border border-hm-ink/10",
    name: "text-hm-ink",
    badgeVi: "bg-hm-mint border-hm-brand/30 text-hm-deep",
    badgeEn: "bg-hm-mist border-hm-ink/10 text-hm-ink2",
    region: "text-hm-body",
    check: "bg-hm-brand text-white",
    radio: "border-hm-ink/25 group-hover:border-hm-ink/45",
    panel: "bg-hm-paper border border-hm-ink/5",
    panelTitle: "text-hm-body",
    panelKey: "text-hm-body/70",
    panelVal: "text-hm-ink",
    panelAccent: "text-hm-deep",
    foot: "text-hm-body/80",
    dot: "bg-hm-brand",
  },
} as const;

export function LanguageSwitcher({
  className = "",
  variant = "floating",
  direction,
  tone = "dark",
}: LanguageSwitcherProps) {
  const { locale, setLocale } = useLocale();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const T = TONES[tone];

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

  const options: {
    code: Locale;
    flag: (cls: string) => React.ReactNode;
    name: string;
    badge: string;
    badgeClass: string;
    region: string;
  }[] = [
    {
      code: "vi",
      flag: (cls) => <VietnamFlag className={cls} />,
      name: t.languageSetup.viName,
      badge: t.languageSetup.viBadge,
      badgeClass: T.badgeVi,
      region: t.languageSetup.viRegion,
    },
    {
      code: "en",
      flag: (cls) => <GlobalFlag className={cls} />,
      name: t.languageSetup.enName,
      badge: t.languageSetup.enBadge,
      badgeClass: T.badgeEn,
      region: t.languageSetup.enRegion,
    },
  ];

  /* =========================================================================
     1. DRAWER VARIANT (Inlined for Mobile Navigation Drawer)
     ========================================================================= */
  if (variant === "drawer") {
    return (
      <div className={`w-full rounded-2xl border p-3.5 ${T.drawer} ${T.font} ${className}`}>
        {/* Drawer Header */}
        <div className={`mb-3 flex items-center justify-between gap-2 border-b pb-2.5 ${T.divider}`}>
          <div className="flex min-w-0 items-center gap-2">
            <div className={`flex h-7 w-7 shrink-0 items-center justify-center ${T.headIcon}`}>
              <GlobeIcon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <span className={`block truncate text-xs ${T.title}`}>{t.languageSetup.menuTitle}</span>
              <span className={`block truncate text-[10px] ${T.subtitle}`}>{t.languageSetup.languagesLabel}</span>
            </div>
          </div>
          <span
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${T.pill}`}
          >
            <span className={`h-1.5 w-1.5 animate-pulse rounded-full ${T.dot}`} />
            {isVi ? "VI" : "EN"}
            {isVi ? <VietnamFlag className="h-2.5 w-4" /> : <GlobalFlag className="h-2.5 w-4" />}
          </span>
        </div>

        {/* 2 Language Option Cards */}
        <div className="grid grid-cols-2 gap-2">
          {options.map((o) => {
            const active = locale === o.code;
            return (
              <button
                key={o.code}
                type="button"
                onClick={() => handleSelect(o.code)}
                aria-pressed={active}
                className={`relative min-w-0 cursor-pointer rounded-xl border p-2.5 text-left transition-all duration-200 ${
                  active ? T.optionActive : T.option
                }`}
              >
                <div className="mb-1.5 flex items-center justify-between">
                  {o.flag("h-4 w-6")}
                  {active && (
                    <span className={`flex h-4 w-4 items-center justify-center rounded-full ${T.check}`}>
                      <CheckIcon className="h-2.5 w-2.5" />
                    </span>
                  )}
                </div>
                <span className={`block truncate text-xs font-bold ${T.name}`}>{o.name}</span>
                <span className={`line-clamp-1 block text-[10px] ${T.region}`}>{o.badge}</span>
              </button>
            );
          })}
        </div>

        {/* Sync notice */}
        <p className={`mt-2 text-center text-[10px] ${T.foot}`}>{t.languageSetup.syncNotice}</p>
      </div>
    );
  }

  /* =========================================================================
     2. FLOATING / FOOTER / POPOVER VARIANTS
     ========================================================================= */

  // Container styling based on variant
  const containerClasses =
    variant === "floating"
      ? `fixed bottom-6 left-6 z-40 hidden sm:block ${T.font} ${className}`
      : `relative inline-block ${T.font} ${className}`;

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
          className={`group flex cursor-pointer items-center whitespace-nowrap rounded-full border font-semibold backdrop-blur-md transition-all duration-300 ${T.triggerSize} ${
            isOpen ? T.triggerOpen : T.trigger
          }`}
        >
          <span className={`transition-transform group-hover:scale-110 ${T.globe}`}>
            <GlobeIcon className="h-3.5 w-3.5" />
          </span>

          {isVi ? <VietnamFlag className="h-3.5 w-5" /> : <GlobalFlag className="h-3.5 w-5" />}

          <span className="font-bold tracking-wide">{isVi ? "VI" : "EN"}</span>

          <span
            className={`transition-transform duration-300 ${isOpen ? `rotate-180 ${T.chevronOpen}` : `rotate-0 ${T.chevron}`}`}
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
            <div className={`w-full space-y-4 p-4 ${T.frame}`}>
              {/* Popover Header */}
              <div className={`flex items-center justify-between gap-3 border-b pb-3 ${T.divider}`}>
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center ${T.headIcon}`}>
                    <GlobeIcon className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className={`truncate text-sm tracking-tight ${T.title}`}>{t.languageSetup.menuTitle}</h4>
                    <p className={`line-clamp-1 text-[11px] ${T.subtitle}`}>{t.languageSetup.menuSubtitle}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label={t.languageSetup.closeMenu}
                  className={`flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-xs transition-colors ${T.close}`}
                >
                  ✕
                </button>
              </div>

              {/* Language Selection Radio Cards */}
              <div>
                <span className={`mb-2 block px-1 text-[10px] font-bold uppercase tracking-wider ${T.label}`}>
                  {t.languageSetup.languagesLabel}
                </span>

                <div className="space-y-2">
                  {options.map((o) => {
                    const active = locale === o.code;
                    return (
                      <button
                        key={o.code}
                        type="button"
                        onClick={() => handleSelect(o.code)}
                        aria-pressed={active}
                        className={`group relative flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl border p-3 text-left transition-all duration-200 ${
                          active ? T.optionActive : T.option
                        }`}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className={`flex shrink-0 items-center justify-center rounded-lg p-1 ${T.flagWrap}`}>
                            {o.flag("h-5 w-7.5")}
                          </div>
                          <div className="min-w-0">
                            <div className="flex min-w-0 items-center gap-1.5">
                              <span className={`truncate text-sm font-bold ${T.name}`}>{o.name}</span>
                              <span
                                className={`shrink-0 whitespace-nowrap rounded border px-1.5 py-px text-[9px] font-bold ${o.badgeClass}`}
                              >
                                {o.badge}
                              </span>
                            </div>
                            <span className={`block truncate text-xs ${T.region}`}>{o.region}</span>
                          </div>
                        </div>

                        {active ? (
                          <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${T.check}`}>
                            <CheckIcon className="h-3.5 w-3.5" />
                          </div>
                        ) : (
                          <div className={`h-4 w-4 shrink-0 rounded-full border transition-colors ${T.radio}`} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Regional Context Panel */}
              <div className={`space-y-2 rounded-xl p-3 text-[11px] ${T.panel}`}>
                <span className={`block text-[10px] font-bold uppercase tracking-wider ${T.panelTitle}`}>
                  {t.languageSetup.regionalContextTitle}
                </span>
                <div className="flex items-center justify-between gap-3">
                  <span className={T.panelKey}>{t.languageSetup.networkRegion}</span>
                  <span className={`text-right font-semibold ${T.panelVal}`}>{isVi ? "Toàn quốc (VN)" : "Nationwide (VN)"}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className={T.panelKey}>{t.languageSetup.currency}</span>
                  <span className={`text-right font-mono font-semibold ${T.panelAccent}`}>VND (₫) · PayOS / QR</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className={T.panelKey}>{t.languageSetup.timezone}</span>
                  <span className={`text-right font-mono font-semibold ${T.panelVal}`}>ICT (UTC+07:00)</span>
                </div>
              </div>

              {/* Popover Footer Notice */}
              <div className={`flex items-center gap-2 pt-1 text-[10.5px] ${T.foot}`}>
                <span className={`h-1.5 w-1.5 shrink-0 animate-pulse rounded-full ${T.dot}`} />
                <span>{t.languageSetup.syncNotice}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
