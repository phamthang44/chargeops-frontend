"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { CITIES, STATIONS, type CoverageStation } from "./stations";
import { BoltIcon, ACPlugIcon, MapPinIcon } from "./Icons";
import { fetchPublicStations } from "@/lib/stations-api";
import { useTranslation } from "@/lib/i18n";
import { EASINGS, SPRINGS } from "@/lib/motionTokens";

interface StationDirectoryProps {
  initialStations?: CoverageStation[];
  initialIsLive?: boolean;
}

export function StationDirectory({
  initialStations = STATIONS,
  initialIsLive = false,
}: StationDirectoryProps) {
  const { t, locale } = useTranslation();
  const shouldReduceMotion = useReducedMotion();
  const [stationList, setStationList] = useState<CoverageStation[]>(initialStations);
  const [isLive, setIsLive] = useState<boolean>(initialIsLive);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [city, setCity] = useState<string>("Tất cả");
  const [query, setQuery] = useState("");
  const [fastOnly, setFastOnly] = useState(false);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "map">("list");

  // Asynchronously fetch stations from backend API
  useEffect(() => {
    let mounted = true;
    async function loadStations() {
      if (initialIsLive && initialStations.length > 0) {
        return;
      }
      setIsLoading(true);
      try {
        const res = await fetchPublicStations({ size: 50 });
        if (mounted) {
          if (res.stations && res.stations.length > 0) {
            setStationList(res.stations);
            setIsLive(res.isLive);
          }
        }
      } catch (err) {
        console.info("Stations API not reachable, using showcase fallback:", err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    loadStations();
    return () => {
      mounted = false;
    };
  }, []);

  // Compute dynamic city options based on loaded stations
  const availableCities = useMemo(() => {
    const set = new Set<string>(["Tất cả"]);
    CITIES.forEach((c) => set.add(c));
    stationList.forEach((s) => {
      if (s.city) set.add(s.city);
    });
    return Array.from(set);
  }, [stationList]);

  // Client-side filter
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return stationList.filter((s) => {
      const cityOk = city === "Tất cả" || s.city.toLowerCase().includes(city.toLowerCase());
      const queryOk =
        q === "" ||
        s.name.toLowerCase().includes(q) ||
        s.district.toLowerCase().includes(q) ||
        s.address.toLowerCase().includes(q);
      const fastOk = !fastOnly || s.fast;
      const availableOk = !availableOnly || s.available > 0;
      return cityOk && queryOk && fastOk && availableOk;
    });
  }, [stationList, city, query, fastOnly, availableOnly]);

  // Active station currently spotlighted on the map
  const activeStation = useMemo(() => {
    if (selectedStationId) {
      const found = filtered.find((s) => s.id === selectedStationId);
      if (found) return found;
    }
    return filtered[0] || stationList[0] || null;
  }, [selectedStationId, filtered, stationList]);

  // OpenStreetMap embed URL centered on active station or city
  const mapEmbedUrl = useMemo(() => {
    if (activeStation && activeStation.latitude && activeStation.longitude) {
      const lat = activeStation.latitude;
      const lng = activeStation.longitude;
      const deltaLat = 0.007;
      const deltaLng = 0.009;
      const minLng = (lng - deltaLng).toFixed(5);
      const minLat = (lat - deltaLat).toFixed(5);
      const maxLng = (lng + deltaLng).toFixed(5);
      const maxLat = (lat + deltaLat).toFixed(5);
      return `https://www.openstreetmap.org/export/embed.html?bbox=${minLng}%2C${minLat}%2C${maxLng}%2C${maxLat}&layer=mapnik&marker=${lat.toFixed(5)}%2C${lng.toFixed(5)}`;
    }
    if (city === "Hà Nội") {
      return `https://www.openstreetmap.org/export/embed.html?bbox=105.7800%2C20.9800%2C105.8800%2C21.0600&layer=mapnik`;
    }
    if (city === "Đà Nẵng") {
      return `https://www.openstreetmap.org/export/embed.html?bbox=108.1800%2C16.0200%2C108.2800%2C16.1000&layer=mapnik`;
    }
    return `https://www.openstreetmap.org/export/embed.html?bbox=106.6500%2C10.7400%2C106.7500%2C10.8200&layer=mapnik`;
  }, [activeStation, city]);

  const googleMapsDirectionsUrl = activeStation
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
        activeStation.name + ", " + activeStation.address
      )}`
    : "#";

  return (
    <div className="container-x py-8 sm:py-10">
      {/* Mobile View Switcher (Visible only below lg breakpoint) */}
      <div className="mb-6 flex lg:hidden items-center rounded-2xl bg-white/[0.04] p-1 border border-white/10 shadow-sm backdrop-blur-md">
        <button
          type="button"
          onClick={() => setMobileView("list")}
          className={`min-h-11 flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 px-2 text-xs font-semibold transition cursor-pointer ${
            mobileView === "list"
              ? "bg-[#0E1512] text-white shadow-sm ring-1 ring-white/10"
              : "text-white/60 hover:text-white"
          }`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4 text-emerald-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
          <span>{locale === "en" ? `Station List (${filtered.length})` : `Danh sách trạm (${filtered.length})`}</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileView("map")}
          className={`min-h-11 flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 px-2 text-xs font-semibold transition cursor-pointer ${
            mobileView === "map"
              ? "bg-emerald-500 text-white shadow-glow-emerald font-bold"
              : "text-white/60 hover:text-white"
          }`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934a1.12 1.12 0 01-1.006 0L9.503 3.31a1.125 1.125 0 00-1.006 0L3.623 5.748A1.125 1.125 0 003 6.754v11.53c0 .836.88 1.38 1.628 1.006l3.869-1.934a1.12 1.12 0 011.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
          </svg>
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px]">
        {/* Left Column: Search, Filters & Station Cards */}
        <div className={mobileView === "map" ? "hidden lg:block" : "block"}>
          {/* Search Bar and City Pills */}
          <div className="flex flex-col gap-4">
            <div className="relative">
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.stationDirectory.searchPlaceholder}
                aria-label={t.stationDirectory.searchPlaceholder}
                className="w-full rounded-2xl border border-white/10 bg-[#0E1512] px-4 py-3.5 pl-11 text-sm text-white outline-none transition placeholder:text-white/40 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 shadow-sm"
              />
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
                <MapPinIcon className="h-4 w-4" />
              </span>
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-white/60 hover:text-white cursor-pointer"
                >
                  {locale === "en" ? "Clear" : "Xóa"}
                </button>
              )}
            </div>

            {/* City Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {availableCities.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setCity(c);
                    setSelectedStationId(null);
                  }}
                  className={`min-h-11 cursor-pointer rounded-pill px-4 py-2 text-xs font-semibold transition ${
                    city === c
                      ? "bg-primary text-white shadow-glow-emerald"
                      : "border border-white/10 bg-[#0E1512] text-white/70 hover:border-emerald-500/40 hover:bg-[#121A16] hover:text-white"
                  }`}
                >
                  {c === "Tất cả" ? t.common.all : c}
                </button>
              ))}
            </div>

            {/* Feature Filters */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setFastOnly(!fastOnly)}
                className={`min-h-11 inline-flex items-center gap-1.5 rounded-pill px-3.5 py-2 text-xs font-medium transition cursor-pointer ${
                  fastOnly
                    ? "border border-primary bg-primary-soft text-primary-dark font-semibold"
                    : "border border-line bg-surface-alt text-ink-muted hover:text-ink-body"
                }`}
              >
                <BoltIcon className="h-3.5 w-3.5" />
                {t.stationDirectory.filterFastOnly}
              </button>

              <button
                type="button"
                onClick={() => setAvailableOnly(!availableOnly)}
                className={`min-h-11 inline-flex items-center gap-1.5 rounded-pill px-3.5 py-2 text-xs font-medium transition cursor-pointer ${
                  availableOnly
                    ? "border border-primary bg-primary-soft text-primary-dark font-semibold"
                    : "border border-line bg-surface-alt text-ink-muted hover:text-ink-body"
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-primary" />
                {t.stationDirectory.filterAvailableOnly}
              </button>
            </div>
          </div>

          {/* Status indicator bar */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs text-ink-muted">
            <p>
              {locale === "en" ? (
                <>
                  Found <strong className="text-white">{filtered.length}</strong> stations
                  {city !== "Tất cả" ? ` in ${city}` : " in current list"}
                </>
              ) : (
                <>
                  Tìm thấy <strong className="text-white">{filtered.length}</strong> trạm sạc
                  {city !== "Tất cả" ? ` tại ${city}` : " trong danh sách hiện có"}
                </>
              )}
            </p>

            {/* Live API sync status indicator */}
            <div className="flex items-center gap-2">
              {isLive ? (
                <span className="inline-flex items-center gap-1.5 rounded-pill bg-primary-soft px-2.5 py-1 font-semibold text-primary-dark">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  {locale === "en" ? "Live Online (API Sync)" : "Dữ liệu trực tuyến (API kết nối)"}
                </span>
              ) : (
                <span
                  className="inline-flex items-center gap-1.5 rounded-pill bg-surface-alt px-2.5 py-1 font-medium text-ink-muted ring-1 ring-line"
                  title={locale === "en" ? "Sample station list" : "Danh sách trạm minh họa"}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-ink-muted/50" />
                  {t.common.simulatedData}
                </span>
              )}
            </div>
          </div>

          {/* Loading Skeletons */}
          {isLoading && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-card border border-white/10 bg-[#0E1512] p-5 shadow-card space-y-3"
                >
                  <div className="h-5 w-3/4 rounded bg-surface-alt" />
                  <div className="h-4 w-1/2 rounded bg-surface-alt" />
                  <div className="h-6 w-1/3 rounded bg-surface-alt" />
                </div>
              ))}
            </div>
          )}

          {/* Station cards grid with 120fps fluid layout reordering */}
          {!isLoading && (
            <motion.div
              layout
              transition={shouldReduceMotion ? { duration: 0 } : SPRINGS.layout}
              className="mt-6 grid gap-5 sm:grid-cols-2"
            >
              <AnimatePresence mode="popLayout">
                {filtered.map((s, index) => {
                const full = s.total > 0 && s.available === 0;
                const isSelected = activeStation?.id === s.id;
                const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                  s.name + ", " + s.address
                )}`;

                return (
                  <motion.div
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
                            y: -4,
                            transition: { duration: 0.2, ease: EASINGS.standard },
                          }
                    }
                    onClick={() => setSelectedStationId(s.id)}
                    onMouseEnter={() => setSelectedStationId(s.id)}
                    className={`group rounded-2xl p-5 flex flex-col justify-between h-full cursor-pointer transition-all duration-300 border ${
                      isSelected
                        ? "border-emerald-500 bg-[#121A16] shadow-[0_16px_40px_-10px_rgba(0,0,0,0.8),0_0_25px_-5px_rgba(16,185,129,0.25)]"
                        : "border-white/10 bg-[#0D1411]/95 shadow-[0_12px_30px_-10px_rgba(0,0,0,0.6)] hover:border-white/20 hover:shadow-[0_16px_36px_-10px_rgba(0,0,0,0.7)]"
                    }`}
                  >
                    <div>
                      <div className="flex flex-col items-start gap-2 sm:flex-row sm:justify-between sm:gap-3">
                        <h2 className="font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-1">
                          {s.name}
                        </h2>
                        <span
                          className={`pill shrink-0 text-[11px] font-bold ${
                            full ? "bg-red-500/15 text-red-400 border border-red-500/20" : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                          }`}
                        >
                          {s.total === 0
                            ? (locale === "en" ? "No plug data" : "Chưa có dữ liệu cổng")
                            : full
                            ? (locale === "en" ? "Full" : "Hết chỗ")
                            : (locale === "en" ? `${s.available}/${s.total} available` : `${s.available}/${s.total} trống`)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-white/60 line-clamp-1">
                        {s.district}, {s.city}
                      </p>
                    </div>

                    <div className="mt-5 pt-3 border-t border-white/10">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="pill inline-flex items-center gap-1 bg-[#16221C] border border-white/10 text-xs font-medium text-white/80">
                          {s.connectors.length === 0 && !s.maxPowerKw ? (
                            <>{locale === "en" ? "Connector info pending" : "Thông tin cổng chưa cập nhật"}</>
                          ) : s.fast ? (
                            <>
                              <BoltIcon className="h-3 w-3 text-emerald-400" /> {locale === "en" ? "DC Fast" : "DC Siêu nhanh"}
                            </>
                          ) : (
                            <>
                              <ACPlugIcon className="h-3 w-3 text-white/50" /> {locale === "en" ? "AC Standard" : "AC Tiêu chuẩn"}
                            </>
                          )}
                        </span>
                        <span className="font-mono text-xs font-bold text-emerald-400">
                          {s.pricePerKwh}
                        </span>
                      </div>
                      <div className="mt-3.5 flex items-center justify-between text-xs text-white/60">
                        <a
                          href={directionsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex min-h-11 items-center gap-1 px-1 font-semibold text-emerald-400 hover:text-emerald-300 hover:underline"
                          title={locale === "en" ? "Open directions on Google Maps" : "Mở chỉ đường trên Google Maps"}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="h-3.5 w-3.5">
                            <path d="M3 11l19-9-9 19-2-8-8-2z" />
                          </svg>
                          <span>{locale === "en" ? "Directions" : "Chỉ đường"}</span>
                        </a>

                        <Link
                          href={`/tram-sac/${s.slug}`}
                          className="inline-flex min-h-11 items-center gap-0.5 px-1 font-semibold text-ink-strong hover:text-primary transition-colors"
                        >
                          <span>{locale === "en" ? "Details" : "Chi tiết trạm"}</span>
                          <span className="group-hover:translate-x-0.5 transition-transform">›</span>
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {filtered.length === 0 && (
                <motion.div
                  key="empty-directory"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25, ease: EASINGS.decelerate }}
                  className="col-span-2 rounded-2xl border border-dashed border-white/15 bg-[#0E1512] p-10 text-center text-sm text-white/60"
                >
                  <p className="font-medium text-white">{t.stationDirectory.noStationsMatched}</p>
                  <p className="mt-1">{locale === "en" ? "Try changing your search keywords or clearing filters." : "Thử thay đổi từ khóa tìm kiếm hoặc bỏ chọn các bộ lọc."}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      setCity("Tất cả");
                      setFastOnly(false);
                      setAvailableOnly(false);
                    }}
                    className="mt-4 inline-flex items-center rounded-pill bg-emerald-500/15 px-4 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/25 cursor-pointer"
                  >
                    {t.stationDirectory.resetFilters}
                  </button>
                </motion.div>
              )}
              </AnimatePresence>
            </motion.div>
          )}
        </div>

        {/* Right Column: Live Interactive Map & Station Spotlight Card */}
        <aside className={mobileView === "list" ? "hidden lg:block" : "block"}>
          <div className="sticky top-24 space-y-4">
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0E1512] shadow-card">
              {/* Map Header */}
              <div className="flex items-center justify-between border-b border-white/10 bg-[#121A16] px-4 py-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <span className="truncate text-xs font-bold text-white">
                    {activeStation ? activeStation.name : (locale === "en" ? "Station Network Map" : "Bản đồ mạng lưới trạm sạc")}
                  </span>
                </div>
                <span className="shrink-0 rounded-pill bg-[#16221C] px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400 ring-1 ring-white/10">
                  {city !== "Tất cả" ? city : (locale === "en" ? "Real Coordinates" : "Vị trí thực tế")}
                </span>
              </div>

              {/* Interactive OpenStreetMap embed */}
              <div className="relative h-[290px] sm:h-[320px] w-full bg-[#16221C] overflow-hidden">
                <iframe
                  key={activeStation?.id ?? city}
                  src={mapEmbedUrl}
                  title={locale === "en" ? "Charging station map" : "Bản đồ trạm sạc"}
                  className="h-[calc(100%+38px)] w-full border-0 select-none -mb-[38px]"
                  loading="lazy"
                  tabIndex={-1}
                />

                {/* Floating Navigation Shortcut */}
                <div className="absolute right-3 top-3 flex flex-col gap-1.5 z-10">
                  <a
                    href={googleMapsDirectionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={locale === "en" ? "Open directions on Google Maps" : "Mở chỉ đường trên Google Maps"}
                    className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0E1512]/95 text-white/80 shadow-md backdrop-blur transition hover:bg-[#16221C] hover:text-emerald-400 hover:scale-105 border border-white/10"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                      <circle cx="12" cy="9" r="2.5" />
                    </svg>
                  </a>
                </div>
              </div>

              {/* Station Spotlight Card */}
              {activeStation ? (
                <div className="p-4 sm:p-5 bg-[#0E1512]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/tram-sac/${activeStation.slug}`}
                        className="block text-sm font-bold text-ink-strong hover:text-primary transition-colors line-clamp-1"
                      >
                        {activeStation.name}
                      </Link>
                      <p className="mt-1 flex items-start gap-1.5 text-xs text-ink-muted line-clamp-2">
                        <MapPinIcon className="h-3.5 w-3.5 shrink-0 text-primary mt-0.5" />
                        <span>{activeStation.address}</span>
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-pill px-2.5 py-1 text-[11px] font-bold ${
                        activeStation.total > 0 && activeStation.available === 0
                          ? "bg-danger/10 text-danger"
                          : "bg-primary-soft text-primary-dark"
                      }`}
                    >
                      {activeStation.total === 0
                        ? (locale === "en" ? "No plug data" : "Chưa có dữ liệu cổng")
                        : activeStation.available === 0
                        ? (locale === "en" ? "Full" : "Hết chỗ")
                        : (locale === "en"
                            ? `${activeStation.available}/${activeStation.total} available`
                            : `${activeStation.available}/${activeStation.total} trống`)}
                    </span>
                  </div>

                  {/* Quick Specs */}
                  <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-y border-line py-2.5 text-xs">
                    <span className="flex items-center gap-1.5 font-medium text-ink-body">
                      {activeStation.fast ? (
                        <>
                          <BoltIcon className="h-3.5 w-3.5 text-primary" />
                          <span>{locale === "en" ? "DC Fast" : "DC Siêu nhanh"}</span>
                        </>
                      ) : (
                        <>
                          <ACPlugIcon className="h-3.5 w-3.5 text-ink-muted" />
                          <span>{locale === "en" ? "AC Standard" : "AC Tiêu chuẩn"}</span>
                        </>
                      )}
                    </span>
                    <span className="font-mono font-bold text-primary-dark">
                      {activeStation.pricePerKwh}
                    </span>
                    <span className="text-ink-muted text-[11px]">{activeStation.hours}</span>
                  </div>

                  {/* Action CTA Buttons */}
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <a
                      href={googleMapsDirectionsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2.5 text-xs font-semibold text-white shadow-glow-emerald transition hover:bg-primary-dark active:scale-[0.98]"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="h-3.5 w-3.5">
                        <path d="M3 11l19-9-9 19-2-8-8-2z" />
                      </svg>
                      <span>{locale === "en" ? "Directions" : "Chỉ đường"}</span>
                    </a>

                    <Link
                      href={`/tram-sac/${activeStation.slug}`}
                      className="flex items-center justify-center gap-1 rounded-xl border border-line bg-surface-alt px-3 py-2.5 text-xs font-semibold text-ink-strong transition hover:border-primary/40 hover:bg-white active:scale-[0.98]"
                    >
                      <span>{locale === "en" ? "Station Details ›" : "Chi tiết trạm ›"}</span>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="p-5 text-center text-xs text-ink-muted">
                  {locale === "en"
                    ? "Select a station from the list to view its location and directions."
                    : "Chọn một trạm sạc từ danh sách để xem vị trí và chỉ đường."}
                </div>
              )}
            </div>

            {/* Hint footnote */}
            <p className="px-2 text-[11px] leading-relaxed text-white/50 flex items-start gap-1.5">
              <MapPinIcon className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                {locale === "en"
                  ? "Station locations are based on provider records. Please verify before departure; Directions opens Google Maps."
                  : "Vị trí theo thông tin trạm. Hãy kiểm tra lại địa chỉ trước khi đi; nút Chỉ đường sẽ mở Google Maps."}
              </span>
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
