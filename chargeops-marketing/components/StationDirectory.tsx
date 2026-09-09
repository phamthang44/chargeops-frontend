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

  return (
    <div className="container-x grid gap-8 py-10 lg:grid-cols-[1fr_320px]">
      <div>
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
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-ink-muted hover:text-ink-strong"
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
                onClick={() => setCity(c)}
                className={`cursor-pointer rounded-pill px-4 py-2 text-xs font-semibold transition ${
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
              className={`inline-flex items-center gap-1.5 rounded-pill px-3.5 py-1.5 text-xs font-medium transition ${
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
              className={`inline-flex items-center gap-1.5 rounded-pill px-3.5 py-1.5 text-xs font-medium transition ${
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
            {city !== "Tất cả" ? ` tại ${city}` : " trên toàn quốc"}
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
                title="Sẵn sàng kết nối khi Backend triển khai API công khai"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-ink-muted/50" />
                Chế độ xem trước (Sẵn sàng API)
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
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {filtered.map((s) => {
              const full = s.available === 0;
              return (
                <Link
                  key={s.id}
                  href={`/tram-sac/${s.slug}`}
                  className="group flex flex-col rounded-card border border-line bg-white p-5 shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-glass"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="font-semibold text-ink-strong group-hover:text-primary-dark line-clamp-1">
                      {s.name}
                    </h2>
                    <span
                      className={`pill shrink-0 ${
                        full ? "bg-danger/10 text-danger font-semibold" : "bg-primary-soft text-primary-dark font-semibold"
                      }`}
                    >
                      {full ? "Hết chỗ" : `${s.available}/${s.total} trống`}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-ink-muted line-clamp-1">
                    {s.district}, {s.city}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="pill inline-flex items-center gap-1 bg-surface-alt text-xs text-ink-body">
                      {s.fast ? (
                        <>
                          <BoltIcon className="h-3 w-3 text-primary" /> Sạc nhanh DC
                        </>
                      ) : (
                        <>
                          <ACPlugIcon className="h-3 w-3 text-ink-muted" /> Sạc thường AC
                        </>
                      )}
                    </span>
                    <span className="text-xs font-bold text-primary-dark">
                      {s.pricePerKwh}/kWh
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-line/60 pt-3 text-xs">
                    <span className="text-ink-muted">{s.connectors.slice(0, 2).join(" · ")}</span>
                    <span className="font-semibold text-primary-dark group-hover:translate-x-0.5 transition-transform">
                      Xem chi tiết ›
                    </span>
                  </div>
                </Link>
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
                  className="mt-4 inline-flex items-center rounded-pill bg-primary-soft px-4 py-1.5 text-xs font-semibold text-primary-dark hover:bg-primary-soft/80"
                >
                  Đặt lại bộ lọc
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Map panel */}
      <aside className="hidden lg:block">
        <div className="sticky top-20">
          <div className="relative h-[420px] overflow-hidden rounded-2xl border border-line bg-surface-alt bg-grid shadow-sm">
            <MapPin className="left-12 top-16" />
            <MapPin className="left-40 top-28" />
            <MapPin className="left-24 top-52" muted />
            <MapPin className="left-52 top-72" />
            <span className="absolute bottom-3 right-3 rounded-pill border border-line bg-white px-3 py-1 text-xs font-medium text-ink-muted shadow-sm">
              Bản đồ định vị
            </span>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-ink-muted">
            Vị trí, độ trống và giá hiển thị mang tính minh hoạ. Mở ứng dụng di động ChargeOps để
            đặt khung giờ theo thời gian thực.
          </p>
        </div>
      </aside>
    </div>
  );
}

function MapPin({ className, muted }: { className?: string; muted?: boolean }) {
  return (
    <span
      className={`absolute ${muted ? "text-ink-muted" : "text-primary"} ${className ?? ""}`}
      aria-hidden
    >
      <MapPinIcon className="h-7 w-7 drop-shadow-sm" />
    </span>
  );
}
