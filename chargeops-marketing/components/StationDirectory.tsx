"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CITIES, STATIONS, type CoverageStation } from "./stations";
import { BoltIcon, ACPlugIcon, MapPinIcon } from "./Icons";
import { fetchPublicStations } from "@/lib/stations-api";

interface StationDirectoryProps {
  initialStations?: CoverageStation[];
  initialIsLive?: boolean;
}

export function StationDirectory({
  initialStations = STATIONS,
  initialIsLive = false,
}: StationDirectoryProps) {
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
      <div className="mb-6 flex lg:hidden items-center rounded-2xl bg-surface-alt p-1 border border-line shadow-sm">
        <button
          type="button"
          onClick={() => setMobileView("list")}
          className={`min-h-11 flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 px-2 text-xs font-semibold transition cursor-pointer ${
            mobileView === "list"
              ? "bg-white text-ink-strong shadow-sm ring-1 ring-black/5"
              : "text-ink-muted hover:text-ink-strong"
          }`}
        >
          <span>📋</span>
          <span>Danh sách trạm ({filtered.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileView("map")}
          className={`min-h-11 flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 px-2 text-xs font-semibold transition cursor-pointer ${
            mobileView === "map"
              ? "bg-primary text-white shadow-glow-emerald"
              : "text-ink-muted hover:text-ink-strong"
          }`}
        >
          <span>🗺️</span>
          <span>Bản đồ & Chỉ đường</span>
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
                placeholder="Tìm theo tên trạm, quận hoặc địa chỉ…"
                aria-label="Tìm trạm sạc"
                className="w-full rounded-2xl border border-line bg-white px-4 py-3.5 pl-11 text-sm outline-none transition placeholder:text-ink-muted focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm"
              />
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted">
                <MapPinIcon className="h-4 w-4" />
              </span>
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-ink-muted hover:text-ink-strong cursor-pointer"
                >
                  Xóa
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
                      ? "bg-primary text-white shadow-glass"
                      : "border border-line bg-white text-ink-body hover:border-primary/40"
                  }`}
                >
                  {c}
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
                Sạc nhanh DC
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
                Đang còn chỗ
              </button>
            </div>
          </div>

          {/* Status indicator bar */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs text-ink-muted">
            <p>
              Tìm thấy <strong className="text-ink-strong">{filtered.length}</strong> trạm sạc
              {city !== "Tất cả" ? ` tại ${city}` : " trong danh sách hiện có"}
            </p>

            {/* Live API sync status indicator */}
            <div className="flex items-center gap-2">
              {isLive ? (
                <span className="inline-flex items-center gap-1.5 rounded-pill bg-primary-soft px-2.5 py-1 font-semibold text-primary-dark">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  Dữ liệu trực tuyến (API kết nối)
                </span>
              ) : (
                <span
                  className="inline-flex items-center gap-1.5 rounded-pill bg-surface-alt px-2.5 py-1 font-medium text-ink-muted ring-1 ring-line"
                  title="Danh sách trạm minh họa khi chưa có dữ liệu trực tuyến"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-ink-muted/50" />
                  Dữ liệu minh họa
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
                  className="animate-pulse rounded-card border border-line bg-white p-5 shadow-card space-y-3"
                >
                  <div className="h-5 w-3/4 rounded bg-surface-alt" />
                  <div className="h-4 w-1/2 rounded bg-surface-alt" />
                  <div className="h-6 w-1/3 rounded bg-surface-alt" />
                </div>
              ))}
            </div>
          )}

          {/* Station cards grid */}
          {!isLoading && (
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              {filtered.map((s) => {
                const full = s.total > 0 && s.available === 0;
                const isSelected = activeStation?.id === s.id;
                const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                  s.name + ", " + s.address
                )}`;

                return (
                  <div
                    key={s.id}
                    onClick={() => setSelectedStationId(s.id)}
                    onMouseEnter={() => setSelectedStationId(s.id)}
                    className={`double-bezel group block transition-all duration-300 hover:-translate-y-1 cursor-pointer ${
                      isSelected
                        ? "ring-2 ring-primary border-primary shadow-lg"
                        : ""
                    }`}
                  >
                    <div className="double-bezel-inner !p-5 flex flex-col justify-between h-full">
                      <div>
                        <div className="flex flex-col items-start gap-2 sm:flex-row sm:justify-between sm:gap-3">
                          <h2 className="font-bold text-ink-strong group-hover:text-primary-dark transition-colors line-clamp-1">
                            {s.name}
                          </h2>
                          <span
                            className={`pill shrink-0 text-[11px] font-bold ${
                              full ? "bg-danger/10 text-danger" : "bg-primary-soft text-primary-dark"
                            }`}
                          >
                            {s.total === 0 ? "Chưa có dữ liệu cổng" : full ? "Hết chỗ" : `${s.available}/${s.total} trống`}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-ink-muted line-clamp-1">
                          {s.district}, {s.city}
                        </p>
                      </div>

                      <div className="mt-5 pt-3 border-t border-black/[0.04]">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="pill inline-flex items-center gap-1 bg-surface-alt text-xs font-medium text-ink-body">
                            {s.connectors.length === 0 && !s.maxPowerKw ? (
                              <>Thông tin cổng chưa cập nhật</>
                            ) : s.fast ? (
                              <>
                                <BoltIcon className="h-3 w-3 text-primary" /> DC Siêu nhanh
                              </>
                            ) : (
                              <>
                                <ACPlugIcon className="h-3 w-3 text-ink-muted" /> AC Tiêu chuẩn
                              </>
                            )}
                          </span>
                          <span className="font-mono text-xs font-bold text-primary-dark">
                            {s.pricePerKwh}
                          </span>
                        </div>
                        <div className="mt-3.5 flex items-center justify-between text-xs text-ink-muted">
                          <a
                            href={directionsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex min-h-11 items-center gap-1 px-1 font-semibold text-primary hover:text-primary-dark hover:underline"
                            title="Mở chỉ đường trên Google Maps"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="h-3.5 w-3.5">
                              <path d="M3 11l19-9-9 19-2-8-8-2z" />
                            </svg>
                            <span>Chỉ đường</span>
                          </a>

                          <Link
                            href={`/tram-sac/${s.slug}`}
                            className="inline-flex min-h-11 items-center gap-0.5 px-1 font-semibold text-ink-strong hover:text-primary transition-colors"
                          >
                            <span>Chi tiết trạm</span>
                            <span className="group-hover:translate-x-0.5 transition-transform">›</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filtered.length === 0 && (
                <div className="col-span-2 rounded-2xl border border-dashed border-line bg-white p-10 text-center text-sm text-ink-muted">
                  <p className="font-medium text-ink-strong">Không tìm thấy trạm sạc phù hợp</p>
                  <p className="mt-1">Thử thay đổi từ khóa tìm kiếm hoặc bỏ chọn các bộ lọc.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      setCity("Tất cả");
                      setFastOnly(false);
                      setAvailableOnly(false);
                    }}
                    className="mt-4 inline-flex items-center rounded-pill bg-primary-soft px-4 py-1.5 text-xs font-semibold text-primary-dark hover:bg-primary-soft/80 cursor-pointer"
                  >
                    Đặt lại bộ lọc
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Live Interactive Map & Station Spotlight Card */}
        <aside className={mobileView === "list" ? "hidden lg:block" : "block"}>
          <div className="sticky top-24 space-y-4">
            <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
              {/* Map Header */}
              <div className="flex items-center justify-between border-b border-line bg-surface-alt px-4 py-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse shrink-0" />
                  <span className="truncate text-xs font-bold text-ink-strong">
                    {activeStation ? activeStation.name : "Bản đồ mạng lưới trạm sạc"}
                  </span>
                </div>
                <span className="shrink-0 rounded-pill bg-white px-2.5 py-0.5 text-[10px] font-semibold text-primary-dark ring-1 ring-line">
                  {city !== "Tất cả" ? city : "Vị trí thực tế"}
                </span>
              </div>

              {/* Interactive OpenStreetMap embed */}
              <div className="relative h-[290px] sm:h-[320px] w-full bg-[#E5E3DF] overflow-hidden">
                <iframe
                  key={activeStation?.id ?? city}
                  src={mapEmbedUrl}
                  title="Bản đồ trạm sạc"
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
                    title="Mở chỉ đường trên Google Maps"
                    className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/95 text-ink-body shadow-md backdrop-blur transition hover:bg-white hover:text-primary hover:scale-105"
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
                <div className="p-4 sm:p-5 bg-white">
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
                        ? "Chưa có dữ liệu cổng"
                        : activeStation.available === 0
                        ? "Hết chỗ"
                        : `${activeStation.available}/${activeStation.total} trống`}
                    </span>
                  </div>

                  {/* Quick Specs */}
                  <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-y border-line py-2.5 text-xs">
                    <span className="flex items-center gap-1.5 font-medium text-ink-body">
                      {activeStation.fast ? (
                        <>
                          <BoltIcon className="h-3.5 w-3.5 text-primary" />
                          <span>DC Siêu nhanh</span>
                        </>
                      ) : (
                        <>
                          <ACPlugIcon className="h-3.5 w-3.5 text-ink-muted" />
                          <span>AC Tiêu chuẩn</span>
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
                      <span>Chỉ đường</span>
                    </a>

                    <Link
                      href={`/tram-sac/${activeStation.slug}`}
                      className="flex items-center justify-center gap-1 rounded-xl border border-line bg-surface-alt px-3 py-2.5 text-xs font-semibold text-ink-strong transition hover:border-primary/40 hover:bg-white active:scale-[0.98]"
                    >
                      <span>Chi tiết trạm ›</span>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="p-5 text-center text-xs text-ink-muted">
                  Chọn một trạm sạc từ danh sách để xem vị trí và chỉ đường.
                </div>
              )}
            </div>

            {/* Hint footnote */}
            <p className="px-2 text-[11px] leading-relaxed text-ink-muted">
              📍 Vị trí theo thông tin trạm. Hãy kiểm tra lại địa chỉ trước khi đi; nút <strong>Chỉ đường</strong> sẽ mở Google Maps.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
