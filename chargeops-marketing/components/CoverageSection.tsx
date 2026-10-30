"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { CITIES, STATIONS } from "./stations";
import { BoltIcon, ACPlugIcon, MapPinIcon, CheckIcon, ShieldCheckIcon } from "./Icons";
import { Reveal } from "./Reveal";
import { useTranslation } from "@/lib/i18n";
import { EASINGS, SPRINGS } from "@/lib/motionTokens";

export function CoverageSection() {
  const { t, locale } = useTranslation();
  const shouldReduceMotion = useReducedMotion();
  const [city, setCity] = useState<(typeof CITIES)[number]>("Tất cả");
  const [filterType, setFilterType] = useState<"all" | "dc" | "ac">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredStations = useMemo(() => {
    return STATIONS.filter((s) => {
      const matchCity = city === "Tất cả" || s.city === city;
      const matchType =
        filterType === "all" ||
        (filterType === "dc" && s.fast) ||
        (filterType === "ac" && !s.fast);
      const matchSearch =
        !searchQuery ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.address.toLowerCase().includes(searchQuery.toLowerCase());

      return matchCity && matchType && matchSearch;
    });
  }, [city, filterType, searchQuery]);

  return (
    <section id="tram-sac" className="bg-[#070A08] py-16 sm:py-24 lg:py-32 border-b border-white/[0.06]">
      <div className="container-x">
        <Reveal className="max-w-3xl">
          <span className="eyebrow-tag">
            <MapPinIcon className="h-3.5 w-3.5 text-primary" /> {t.coverage.eyebrow}
          </span>
          <p className="mt-4 inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
            {t.coverage.previewBadge}
          </p>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-balance text-white sm:text-4xl lg:text-5xl leading-[1.24] sm:leading-[1.26] lg:leading-[1.28]">
            {t.coverage.title}
          </h2>
          <p className="mt-3 text-base sm:text-lg text-white/70 leading-relaxed">
            {t.coverage.description}
          </p>
        </Reveal>

        {/* Filter & Search Console Bar */}
        <Reveal delay={60} className="mt-10">
          <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-[#0F1612]/95 to-[#090E0C]/95 p-4 sm:p-5 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.85)]">
            {/* Row 1: Search & Charger Type Switch */}
            <div className="flex flex-col lg:flex-row gap-3.5 lg:items-center lg:justify-between">
              {/* Search Bar with clear button */}
              <div className="relative flex-1 max-w-xl group">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-emerald-400 transition-colors">
                  <MapPinIcon className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  placeholder={t.coverage.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#121A16]/80 pl-10 pr-9 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-emerald-500/60 focus:bg-[#15201B] focus:shadow-[0_0_20px_rgba(16,185,129,0.18)] focus:outline-none transition-all"
                />
                <AnimatePresence>
                  {searchQuery && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.7 }}
                      transition={{ duration: 0.15 }}
                      type="button"
                      onClick={() => setSearchQuery("")}
                      aria-label="Xóa tìm kiếm"
                      className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white flex items-center justify-center text-xs transition-colors cursor-pointer"
                    >
                      ✕
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>

              {/* Fast / AC Filter Segmented Bar with fluid sliding indicator */}
              <div className="relative inline-flex items-center gap-1 rounded-xl border border-white/10 bg-[#121A16]/90 p-1 self-start sm:self-auto">
                {(
                  [
                    { id: "all", label: `${t.coverage.filterAll} (${STATIONS.length})`, icon: null },
                    { id: "dc", label: t.coverage.filterDc, icon: <BoltIcon className="h-3 w-3 text-emerald-400" /> },
                    { id: "ac", label: t.coverage.filterAc, icon: <ACPlugIcon className="h-3 w-3" /> },
                  ] as const
                ).map((tab) => {
                  const isActive = filterType === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setFilterType(tab.id)}
                      className={`relative z-10 cursor-pointer flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors duration-200 ${
                        isActive ? "text-emerald-300" : "text-white/60 hover:text-white"
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeFilterPill"
                          className="absolute inset-0 z-[-1] rounded-lg bg-emerald-500/20 border border-emerald-500/40 shadow-sm"
                          transition={shouldReduceMotion ? { duration: 0 } : SPRINGS.layout}
                        />
                      )}
                      {tab.icon}
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Row 2: Region Filter & Feedback Status */}
            <div className="mt-4 pt-3.5 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
              {/* Region chips with fluid sliding indicator */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-white/40 mr-1 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80 animate-pulse" />
                  {locale === "en" ? "Region:" : "Khu vực:"}
                </span>
                {CITIES.map((c) => {
                  const isActive = city === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCity(c)}
                      className={`relative z-10 cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors duration-200 ${
                        isActive
                          ? "text-[#07110D] font-bold"
                          : "text-white/70 hover:text-white"
                      }`}
                    >
                      {isActive ? (
                        <motion.div
                          layoutId="activeCityPill"
                          className="absolute inset-0 z-[-1] rounded-lg bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.35)]"
                          transition={shouldReduceMotion ? { duration: 0 } : SPRINGS.layout}
                        />
                      ) : (
                        <div className="absolute inset-0 z-[-1] rounded-lg border border-white/10 bg-white/[0.03] hover:border-emerald-500/30 hover:bg-white/[0.06] transition-colors" />
                      )}
                      <span>{c === "Tất cả" ? t.common.all : c}</span>
                    </button>
                  );
                })}
              </div>

              {/* Live Count with animated odometer flip and Reset Filter button */}
              <div className="flex items-center gap-3 text-xs text-white/50">
                <span className="font-mono flex items-center gap-0.5">
                  <AnimatePresence mode="wait">
                    <motion.strong
                      key={filteredStations.length}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      transition={{ duration: 0.15 }}
                      className="text-white font-bold inline-block"
                    >
                      {filteredStations.length}
                    </motion.strong>
                  </AnimatePresence>
                  <span>/{STATIONS.length} {locale === "en" ? "stations" : "trạm"}</span>
                </span>

                <AnimatePresence>
                  {(city !== "Tất cả" || filterType !== "all" || searchQuery) && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8, x: 6 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.8, x: 6 }}
                      transition={{ duration: 0.2, ease: EASINGS.decelerate }}
                      type="button"
                      onClick={() => {
                        setCity("Tất cả");
                        setFilterType("all");
                        setSearchQuery("");
                      }}
                      className="cursor-pointer inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                      <motion.span
                        whileHover={{ rotate: 180 }}
                        transition={{ duration: 0.3 }}
                      >
                        ↺
                      </motion.span>
                      <span>{locale === "en" ? "Reset" : "Đặt lại"}</span>
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Stations Grid with 120fps GPU fluid layout reordering */}
        <motion.div
          layout
          transition={shouldReduceMotion ? { duration: 0 } : SPRINGS.layout}
          className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          <AnimatePresence mode="popLayout">
            {filteredStations.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25, ease: EASINGS.decelerate }}
                className="col-span-full rounded-2xl border border-dashed border-white/15 p-12 text-center bg-[#0E1512]"
              >
                <p className="text-sm font-semibold text-white">{t.coverage.noStationsFound}</p>
                <button
                  type="button"
                  onClick={() => {
                    setCity("Tất cả");
                    setFilterType("all");
                    setSearchQuery("");
                  }}
                  className="mt-4 btn-island-secondary text-xs py-1.5 px-4"
                >
                  {t.stationDirectory.resetFilters}
                </button>
              </motion.div>
            ) : (
              filteredStations.map((s, index) => {
                const full = s.available === 0;
                return (
                  <motion.article
                    key={s.id}
                    layout
                    initial={{ opacity: 0, scale: 0.94, y: 16 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{
                      opacity: 0,
                      scale: 0.92,
                      transition: { duration: 0.18, ease: EASINGS.accelerate },
                    }}
                    transition={{
                      duration: 0.35,
                      delay: shouldReduceMotion ? 0 : Math.min(index * 0.04, 0.2),
                      ease: EASINGS.decelerate,
                      layout: SPRINGS.layout,
                    }}
                    whileHover={
                      shouldReduceMotion
                        ? undefined
                        : {
                            y: -5,
                            transition: { duration: 0.2, ease: EASINGS.standard },
                          }
                    }
                    className="group w-full rounded-2xl border border-white/10 bg-[#0D1411]/95 p-5 flex flex-col justify-between h-full shadow-[0_12px_30px_-10px_rgba(0,0,0,0.6)] hover:border-emerald-500/40 hover:shadow-[0_18px_40px_-12px_rgba(0,0,0,0.8),0_0_24px_-5px_rgba(16,185,129,0.18)] cursor-pointer"
                  >
                    <div>
                      {/* Top status */}
                      <div className="flex flex-col items-start gap-2 sm:flex-row sm:justify-between sm:gap-3">
                        <div className="min-w-0">
                          <h3 className="font-bold text-white truncate text-base group-hover:text-emerald-300 transition-colors">
                            {s.name}
                          </h3>
                          <p className="text-xs text-white/60 mt-0.5 truncate">
                            {s.district}, {s.city}
                          </p>
                        </div>
                        <span
                          className={`pill text-[11px] shrink-0 font-bold transition-all duration-300 ${
                            full
                              ? "bg-danger/10 text-danger border border-danger/20"
                              : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 group-hover:bg-emerald-500/25 group-hover:border-emerald-400/40"
                          }`}
                        >
                          {full
                            ? (locale === "en" ? "Full" : "Hết chỗ")
                            : (locale === "en"
                                ? `${s.available}/${s.total} available`
                                : `${s.available}/${s.total} cổng trống`)}
                        </span>
                      </div>

                      {/* Power badge & specs */}
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#121A16] px-3 py-1 font-semibold text-white/80 border border-white/10 group-hover:border-white/20 transition-colors">
                          {s.fast ? (
                            <>
                              <BoltIcon className="h-3.5 w-3.5 text-emerald-400" /> {locale === "en" ? "DC Fast" : "DC Siêu nhanh"}
                            </>
                          ) : (
                            <>
                              <ACPlugIcon className="h-3.5 w-3.5 text-emerald-400" /> {locale === "en" ? "AC Standard" : "AC Tiêu chuẩn"}
                            </>
                          )}
                        </span>
                        <span className="font-mono font-bold text-emerald-400">
                          {locale === "en" ? `Ref rate: ${s.pricePerKwh}` : `Giá tham khảo: ${s.pricePerKwh}`}
                        </span>
                      </div>

                      {/* Address snippet */}
                      <p className="mt-3 text-[11px] text-white/60 line-clamp-2 leading-relaxed">
                        {s.address}
                      </p>
                    </div>

                    {/* Bottom CTA to App */}
                    <div className="mt-5 pt-3.5 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                      <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1 group-hover:text-emerald-300 transition-colors">
                        <CheckIcon className="h-3 w-3" /> {t.coverage.viewDetailCta}
                      </span>
                      <a
                        href="#tai-ung-dung"
                        className="text-xs font-bold text-white group-hover:text-emerald-400 transition inline-flex items-center gap-1"
                      >
                        <span>{locale === "en" ? "Open app" : "Mở app"}</span>
                        <span className="group-hover:translate-x-0.5 transition-transform duration-200">→</span>
                      </a>
                    </div>
                  </motion.article>
                );
              })
            )}
          </AnimatePresence>
        </motion.div>

        {/* Bottom Banner */}
        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#0E1512] p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
              <ShieldCheckIcon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-bold text-white">
                {locale === "en" ? "Own an EV charging site?" : "Bạn sở hữu điểm đặt trạm sạc?"}
              </p>
              <p className="text-xs text-white/60">
                {locale === "en"
                  ? "Explore ChargeOps tools for station operators and CPOs."
                  : "Tìm hiểu các công cụ quản lý trạm và đặt chỗ của ChargeOps."}
              </p>
            </div>
          </div>
          <Link href="/#doi-tac" className="btn-island-primary text-xs py-2 pl-4 pr-1.5">
            <span>{locale === "en" ? "For Station Operators" : "Dành cho chủ trạm"}</span>
            <span className="btn-icon-bubble !h-7 !w-7">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="h-3.5 w-3.5">
                <path d="M7 17L17 7M17 7H7M17 7V17" />
              </svg>
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
