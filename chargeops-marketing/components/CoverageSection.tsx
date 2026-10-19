"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CITIES, STATIONS } from "./stations";
import { BoltIcon, ACPlugIcon, MapPinIcon, CheckIcon, ShieldCheckIcon } from "./Icons";
import { Reveal } from "./Reveal";

export function CoverageSection() {
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
    <section id="tram-sac" className="bg-[#FAFBFB] py-16 sm:py-24 lg:py-32 border-b border-black/[0.05]">
      <div className="container-x">
        <Reveal className="max-w-3xl">
          <span className="eyebrow-tag">
            <MapPinIcon className="h-3.5 w-3.5 text-primary" /> DANH SÁCH TRẠM SẠC
          </span>
          <p className="mt-4 inline-flex rounded-full border border-primary/20 bg-primary-soft px-3 py-1 text-xs font-semibold text-primary-dark">
            Bản xem trước · dữ liệu minh họa
          </p>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-balance text-ink-heading sm:text-4xl lg:text-5xl">
            Xem thông tin trạm sạc
          </h2>
          <p className="mt-3 text-base sm:text-lg text-ink-body leading-relaxed">
            Xem địa điểm, loại cổng và thông tin trạm hiện có. Tình trạng và khả năng đặt chỗ có thể thay đổi; hãy kiểm tra lại trong ứng dụng trước khi tới.
          </p>
        </Reveal>

        {/* Filter & Search Console Bar */}
        <Reveal delay={60} className="mt-10">
          <div className="rounded-2xl border border-black/[0.06] bg-white p-4 sm:p-5 shadow-sm space-y-4">
            {/* Row 1: Search & Charger Type Switch */}
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted">
                  <MapPinIcon className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  placeholder="Tìm theo tên trạm, quận/huyện hoặc địa chỉ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="min-h-11 w-full rounded-full border border-black/10 bg-surface-alt pl-10 pr-4 py-2.5 text-sm text-ink-heading placeholder:text-ink-muted focus:border-primary focus:bg-white focus:outline-none transition-all"
                />
              </div>

              {/* Fast / AC Filter Pills */}
              <div className="flex flex-wrap items-center gap-1 bg-black/[0.04] p-1 rounded-2xl sm:rounded-full">
                <button
                  type="button"
                  onClick={() => setFilterType("all")}
                  className={`min-h-11 flex-1 cursor-pointer rounded-full px-2 py-2 text-[11px] leading-tight font-semibold transition-all sm:px-3 sm:text-xs ${
                    filterType === "all"
                      ? "bg-white text-ink-heading shadow-sm"
                      : "text-ink-muted hover:text-ink-heading"
                  }`}
                >
                  Tất cả ({STATIONS.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType("dc")}
                  className={`min-h-11 flex-1 cursor-pointer flex items-center justify-center gap-1 rounded-full px-2 py-2 text-[11px] leading-tight font-semibold transition-all sm:gap-1.5 sm:px-3 sm:text-xs ${
                    filterType === "dc"
                      ? "bg-white text-primary-dark shadow-sm"
                      : "text-ink-muted hover:text-ink-heading"
                  }`}
                >
                  <BoltIcon className="h-3 w-3 text-primary" /> DC Siêu nhanh
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType("ac")}
                  className={`min-h-11 flex-1 cursor-pointer flex items-center justify-center gap-1 rounded-full px-2 py-2 text-[11px] leading-tight font-semibold transition-all sm:gap-1.5 sm:px-3 sm:text-xs ${
                    filterType === "ac"
                      ? "bg-white text-ink-heading shadow-sm"
                      : "text-ink-muted hover:text-ink-heading"
                  }`}
                >
                  <ACPlugIcon className="h-3 w-3" /> AC Tiêu chuẩn
                </button>
              </div>
            </div>

            {/* Row 2: City Selector Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-black/[0.04]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted mr-1">
                Khu vực:
              </span>
              {CITIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCity(c)}
                  className={`min-h-11 cursor-pointer rounded-full px-3.5 py-2 text-xs font-semibold transition-all duration-200 ease-haptic ${
                    city === c
                      ? "bg-primary text-white shadow-glow-emerald"
                      : "border border-black/5 bg-surface-alt text-ink-body hover:border-primary/40 hover:bg-white"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </Reveal>

        {/* Stations Grid */}
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredStations.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-dashed border-black/15 p-12 text-center bg-white">
              <p className="text-sm font-semibold text-ink-heading">Không tìm thấy trạm sạc phù hợp</p>
              <p className="text-xs text-ink-muted mt-1">Vui lòng thử tìm kiếm với từ khóa khác hoặc chọn khu vực khác.</p>
              <button
                type="button"
                onClick={() => {
                  setCity("Tất cả");
                  setFilterType("all");
                  setSearchQuery("");
                }}
                className="mt-4 btn-island-secondary text-xs py-1.5 px-4"
              >
                Đặt lại bộ lọc
              </button>
            </div>
          ) : (
            filteredStations.map((s) => {
              const full = s.available === 0;
              return (
                <div key={s.id} className="double-bezel hover:-translate-y-1">
                  <article className="double-bezel-inner !p-5 flex flex-col justify-between h-full">
                    <div>
                      {/* Top status */}
                      <div className="flex flex-col items-start gap-2 sm:flex-row sm:justify-between sm:gap-3">
                        <div className="min-w-0">
                          <h3 className="font-bold text-ink-heading truncate text-base">{s.name}</h3>
                          <p className="text-xs text-ink-muted mt-0.5 truncate">
                            {s.district}, {s.city}
                          </p>
                        </div>
                        <span
                          className={`pill text-[11px] shrink-0 font-bold ${
                            full
                              ? "bg-danger/10 text-danger border border-danger/20"
                              : "bg-primary-soft text-primary-dark border border-primary/20"
                          }`}
                        >
                          {full ? "Hết chỗ" : `${s.available}/${s.total} cổng trống`}
                        </span>
                      </div>

                      {/* Power badge & specs */}
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-alt px-3 py-1 font-semibold text-ink-body border border-black/5">
                          {s.fast ? (
                            <>
                              <BoltIcon className="h-3.5 w-3.5 text-primary" /> DC Siêu nhanh
                            </>
                          ) : (
                            <>
                              <ACPlugIcon className="h-3.5 w-3.5 text-primary" /> AC Tiêu chuẩn
                            </>
                          )}
                        </span>
                        <span className="font-mono font-bold text-primary-dark">
                          Giá tham khảo: {s.pricePerKwh}
                        </span>
                      </div>

                      {/* Address snippet */}
                      <p className="mt-3 text-[11px] text-ink-muted line-clamp-2 leading-relaxed">
                        {s.address}
                      </p>
                    </div>

                    {/* Bottom CTA to App */}
                    <div className="mt-5 pt-3.5 border-t border-black/[0.04] flex flex-wrap items-center justify-between gap-3">
                      <span className="text-[11px] font-semibold text-primary-dark flex items-center gap-1">
                        <CheckIcon className="h-3 w-3" /> Xem chi tiết trạm
                      </span>
                      <a
                        href="#tai-ung-dung"
                        className="text-xs font-bold text-ink-heading hover:text-primary-dark transition inline-flex items-center gap-1"
                      >
                        <span>Mở app</span>
                        <span>→</span>
                      </a>
                    </div>
                  </article>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Banner */}
        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-primary-dark">
              <ShieldCheckIcon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-bold text-ink-heading">Bạn sở hữu điểm đặt trạm sạc?</p>
              <p className="text-xs text-ink-muted">Tìm hiểu các công cụ quản lý trạm và đặt chỗ của ChargeOps.</p>
            </div>
          </div>
          <Link href="/#doi-tac" className="btn-island-primary text-xs py-2 pl-4 pr-1.5">
            <span>Dành cho chủ trạm</span>
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
