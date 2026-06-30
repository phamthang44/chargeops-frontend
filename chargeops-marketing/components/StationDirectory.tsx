"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CITIES, STATIONS } from "./stations";
import { BoltIcon, ACPlugIcon, MapPinIcon } from "./Icons";

/**
 * Full station directory — the read-only explorer searchers land on. Filters
 * client-side over the same mock data the landing page uses; every card links
 * to an indexable per-station detail page. No login, no booking on web.
 */
export function StationDirectory() {
  const [city, setCity] = useState<(typeof CITIES)[number]>("Tất cả");
  const [query, setQuery] = useState("");

  const stations = useMemo(() => {
    const q = query.trim().toLowerCase();
    return STATIONS.filter((s) => {
      const cityOk = city === "Tất cả" || s.city === city;
      const queryOk =
        q === "" ||
        s.name.toLowerCase().includes(q) ||
        s.district.toLowerCase().includes(q) ||
        s.address.toLowerCase().includes(q);
      return cityOk && queryOk;
    });
  }, [city, query]);

  return (
    <div className="container-x grid gap-8 py-10 lg:grid-cols-[1fr_320px]">
      <div>
        {/* search + filters */}
        <div className="flex flex-col gap-4">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo tên trạm, quận hoặc địa chỉ…"
            aria-label="Tìm trạm sạc"
            className="w-full rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none
              transition placeholder:text-ink-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <div className="flex flex-wrap gap-2">
            {CITIES.map((c) => (
              <button
                key={c}
                onClick={() => setCity(c)}
                className={`cursor-pointer rounded-pill px-4 py-2 text-sm font-medium transition ${
                  city === c
                    ? "bg-primary text-white shadow-glass"
                    : "border border-line bg-white text-ink-body hover:border-primary/40"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-5 text-sm text-ink-muted">
          {stations.length} trạm sạc
          {city !== "Tất cả" ? ` tại ${city}` : " trên toàn quốc"}
        </p>

        {/* station list */}
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {stations.map((s) => {
            const full = s.available === 0;
            return (
              <Link
                key={s.id}
                href={`/tram-sac/${s.slug}`}
                className="group flex flex-col rounded-card border border-line bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-glass"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-semibold text-ink-strong group-hover:text-primary-dark">
                    {s.name}
                  </h2>
                  <span
                    className={`pill ${
                      full ? "bg-danger/10 text-danger" : "bg-primary-soft text-primary-dark"
                    }`}
                  >
                    {full ? "Hết chỗ" : `${s.available}/${s.total} trống`}
                  </span>
                </div>
                <p className="mt-1 text-sm text-ink-muted">
                  {s.district}, {s.city}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="pill inline-flex items-center gap-1 bg-surface-alt text-ink-body">
                    {s.fast ? <><BoltIcon className="h-3.5 w-3.5" /> Sạc nhanh DC</> : <><ACPlugIcon className="h-3.5 w-3.5" /> Sạc thường AC</>}
                  </span>
                  <span className="text-sm font-semibold text-primary-dark">
                    {s.pricePerKwh}/kWh
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-1 text-sm font-medium text-primary-dark opacity-0 transition group-hover:opacity-100">
                  Xem chi tiết
                  <span aria-hidden>›</span>
                </div>
              </Link>
            );
          })}

          {stations.length === 0 && (
            <p className="text-ink-muted">
              Không tìm thấy trạm phù hợp. Thử từ khoá hoặc thành phố khác.
            </p>
          )}
        </div>
      </div>

      {/* map panel — illustrative placeholder; swap for a real map later */}
      <aside className="hidden lg:block">
        <div className="sticky top-20">
          <div className="relative h-[420px] overflow-hidden rounded-card border border-line bg-surface-alt bg-grid">
            <MapPin className="left-12 top-16" />
            <MapPin className="left-40 top-28" />
            <MapPin className="left-24 top-52" muted />
            <MapPin className="left-52 top-72" />
            <span className="absolute bottom-3 right-3 rounded-pill border border-line bg-white px-3 py-1 text-xs text-ink-muted">
              Bản đồ minh hoạ
            </span>
          </div>
          <p className="mt-3 text-xs text-ink-muted">
            Vị trí, độ trống và giá hiển thị mang tính minh hoạ. Mở ứng dụng để
            xem theo thời gian thực.
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
      <MapPinIcon className="h-7 w-7" />
    </span>
  );
}
