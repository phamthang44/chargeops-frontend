"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CITIES, STATIONS, type CoverageStation } from "@/components/stations";
import { useTranslation } from "@/lib/i18n";
import { DRIVER_DEMO_URL } from "@/lib/home/content";
import { cityName, stationCover } from "@/lib/home/stationPhotos";
import {
  ArrowRightIcon,
  BoltIcon,
  CloseIcon,
  EASE_OUT,
  ExternalIcon,
  PillButton,
  PinIcon,
  Reveal,
  SearchIcon,
} from "./core";

const ALL = "Tất cả";
const CITY_EN: Record<string, string> = {
  "TP. Hồ Chí Minh": "Ho Chi Minh City",
  "Hà Nội": "Hanoi",
  "Đà Nẵng": "Da Nang",
};
/* Fallback map frames per city when no station is selected. */
const CITY_BBOX: Record<string, string> = {
  "Hà Nội": "105.7800%2C20.9800%2C105.8800%2C21.0600",
  "Đà Nẵng": "108.1800%2C16.0200%2C108.2800%2C16.1000",
};
const DEFAULT_BBOX = "106.6500%2C10.7400%2C106.7500%2C10.8200";

function priceLabel(s: CoverageStation) {
  return s.priceNumber
    ? `${Number(s.priceNumber).toLocaleString("vi-VN")}đ`
    : s.pricePerKwh.replace(/\(tham khảo\)/gi, "").replace(/\/gói tham khảo/gi, "").trim();
}

export function StationsList({
  initialStations = STATIONS,
  initialIsLive = false,
}: {
  initialStations?: CoverageStation[];
  initialIsLive?: boolean;
}) {
  const { t, locale } = useTranslation();
  const en = locale === "en";
  const reduce = useReducedMotion();
  // The server page fetches the public API (with revalidation); no browser retry,
  // since the API does not allow cross-origin calls from the marketing site.
  const stations = initialStations;
  const isLive = initialIsLive;
  const [city, setCity] = useState<string>(ALL);
  const [query, setQuery] = useState("");
  const [fastOnly, setFastOnly] = useState(false);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "map">("list");


  const cities = useMemo(() => {
    // Only cities that have stations, known cities first.
    const present = new Set(stations.map((s) => cityName(s.city)).filter(Boolean));
    const known = CITIES.filter((c) => c !== ALL && present.has(c));
    const others = [...present].filter((c) => !(CITIES as readonly string[]).includes(c));
    return [ALL, ...known, ...others];
  }, [stations]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return stations.filter((s) => {
      const cityOk = city === ALL || cityName(s.city) === city;
      const queryOk =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.district.toLowerCase().includes(q) ||
        s.address.toLowerCase().includes(q);
      return cityOk && queryOk && (!fastOnly || s.fast) && (!availableOnly || s.available > 0);
    });
  }, [stations, city, query, fastOnly, availableOnly]);

  const active = useMemo(
    () => filtered.find((s) => s.id === selectedId) ?? filtered[0] ?? null,
    [filtered, selectedId],
  );

  const mapEmbedUrl = useMemo(() => {
    if (active?.latitude && active.longitude) {
      const { latitude: lat, longitude: lng } = active;
      const bbox = [lng - 0.009, lat - 0.007, lng + 0.009, lat + 0.007].map((n) => n.toFixed(5)).join("%2C");
      return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat.toFixed(5)}%2C${lng.toFixed(5)}`;
    }
    return `https://www.openstreetmap.org/export/embed.html?bbox=${CITY_BBOX[city] ?? DEFAULT_BBOX}&layer=mapnik`;
  }, [active, city]);

  const directions = (s: CoverageStation) =>
    `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${s.name}, ${s.address}`)}`;

  const status = (s: CoverageStation) =>
    s.total === 0
      ? en
        ? "No port data"
        : "Chưa có dữ liệu cổng"
      : s.available === 0
        ? en
          ? "Full"
          : "Hết chỗ"
        : en
          ? `${s.available}/${s.total} free`
          : `${s.available}/${s.total} trống`;

  const resetFilters = () => {
    setQuery("");
    setCity(ALL);
    setFastOnly(false);
    setAvailableOnly(false);
  };

  const rise = (delay: number) =>
    reduce
      ? {}
      : { initial: { opacity: 0, y: 36 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.9, ease: EASE_OUT, delay } };

  const chip = (on: boolean) =>
    `inline-flex h-11 items-center gap-2 whitespace-nowrap rounded-full px-4 text-[15px] transition ${
      on ? "bg-hm-ink text-white" : "bg-white text-hm-ink ring-1 ring-hm-ink/10 hover:bg-hm-mint"
    }`;

  return (
    <>
      {/* ------------------------------------------------------------ */}
      {/* Intro                                                         */}
      {/* ------------------------------------------------------------ */}
      <section className="px-4 pb-8 pt-4 lg:pb-12 lg:pt-8">
        <div className="mx-auto max-w-[1300px]">
          <motion.nav aria-label="Breadcrumb" {...rise(0.05)} className="flex items-center gap-2 text-sm text-hm-body">
            <Link href="/" className="transition hover:text-hm-ink">
              {t.stationsPage.breadcrumbHome}
            </Link>
            <span aria-hidden="true" className="text-hm-body/40">
              /
            </span>
            <span className="text-hm-ink">{t.stationsPage.breadcrumbNetwork}</span>
          </motion.nav>
          <div className="mt-6 grid items-end gap-6 lg:grid-cols-[1.3fr_1fr]">
            <motion.h1 {...rise(0.12)} className="t-xl text-balance">
              {en ? "Find a charger, then hold it." : "Tìm trạm sạc, rồi giữ chỗ trước."}
            </motion.h1>
            <motion.p {...rise(0.2)} className="t-body-lg text-hm-body lg:pb-2">
              {t.stationsPage.description}
            </motion.p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ */}
      {/* Search + filters                                              */}
      {/* ------------------------------------------------------------ */}
      <section className="px-4">
        <motion.div
          {...rise(0.28)}
          className="mx-auto max-w-[1300px] rounded-[24px] rounded-tr-[56px] bg-hm-paper p-4 ring-1 ring-hm-ink/5 md:p-5"
        >
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-hm-body" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.stationDirectory.searchPlaceholder}
              aria-label={t.stationDirectory.searchPlaceholder}
              className="h-14 w-full rounded-full bg-white pl-14 pr-14 text-[16px] text-hm-ink outline-none ring-1 ring-hm-ink/10 transition placeholder:text-hm-body/70 focus:ring-2 focus:ring-hm-brand"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label={en ? "Clear search" : "Xóa tìm kiếm"}
                className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-hm-body transition hover:bg-hm-mist hover:text-hm-ink"
              >
                <CloseIcon />
              </button>
            )}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {cities.map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={city === c}
                onClick={() => {
                  setCity(c);
                  setSelectedId(null);
                }}
                className={chip(city === c)}
              >
                {c === ALL ? t.common.all : en ? (CITY_EN[c] ?? c) : c}
              </button>
            ))}
            <span className="mx-1 hidden h-6 w-px bg-hm-ink/15 sm:block" aria-hidden="true" />
            <button type="button" aria-pressed={fastOnly} onClick={() => setFastOnly((v) => !v)} className={chip(fastOnly)}>
              <BoltIcon className="h-4 w-4" />
              {en ? "DC fast only" : "Chỉ sạc nhanh DC"}
            </button>
            <button
              type="button"
              aria-pressed={availableOnly}
              onClick={() => setAvailableOnly((v) => !v)}
              className={chip(availableOnly)}
            >
              <span className={`h-2 w-2 rounded-full ${availableOnly ? "bg-hm-brand" : "bg-hm-brand/70"}`} />
              {en ? "Free ports only" : "Còn cổng trống"}
            </button>
          </div>
        </motion.div>
      </section>

      {/* ------------------------------------------------------------ */}
      {/* Results + map                                                 */}
      {/* ------------------------------------------------------------ */}
      <section className="px-4 pb-20 pt-8 lg:pb-28">
        <div className="mx-auto max-w-[1300px]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[15px] text-hm-body" aria-live="polite">
              {en ? (
                <>
                  <strong className="text-hm-ink">{filtered.length}</strong> stations
                  {city !== ALL ? ` in ${CITY_EN[city] ?? city}` : ""}
                </>
              ) : (
                <>
                  <strong className="text-hm-ink">{filtered.length}</strong> trạm sạc
                  {city !== ALL ? ` tại ${city}` : ""}
                </>
              )}
            </p>
            <span
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[13px] ${
                isLive ? "bg-hm-mint text-hm-deep" : "bg-hm-mist text-hm-body"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${isLive ? "animate-pulse bg-hm-brand" : "bg-hm-body/50"}`} />
              {isLive ? (en ? "Live data" : "Dữ liệu trực tuyến") : en ? "Sample data" : "Dữ liệu minh hoạ"}
            </span>
          </div>

          {/* Mobile list / map switch */}
          <div role="group" className="mt-5 flex rounded-full bg-hm-paper p-1 ring-1 ring-hm-ink/5 lg:hidden">
            {(["list", "map"] as const).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={mobileView === v}
                onClick={() => setMobileView(v)}
                className={`h-11 flex-1 rounded-full text-[15px] font-medium transition ${
                  mobileView === v ? "bg-hm-ink text-white" : "text-hm-ink"
                }`}
              >
                {v === "list" ? (en ? `List (${filtered.length})` : `Danh sách (${filtered.length})`) : en ? "Map" : "Bản đồ"}
              </button>
            ))}
          </div>

          <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_420px] lg:gap-10">
            {/* Cards */}
            <div className={mobileView === "map" ? "hidden lg:block" : ""}>
              <motion.ul layout={!reduce} className="grid gap-x-5 gap-y-10 sm:grid-cols-2">
                <AnimatePresence mode="popLayout">
                  {filtered.map((s, i) => {
                    const cover = stationCover(s);
                    const full = s.total > 0 && s.available === 0;
                    const isActive = active?.id === s.id;
                    return (
                      <motion.li
                        key={s.id}
                        layout={!reduce}
                        initial={reduce ? false : { opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.2 } }}
                        transition={{ duration: 0.7, ease: EASE_OUT, delay: Math.min(i * 0.05, 0.25) }}
                        onMouseEnter={() => setSelectedId(s.id)}
                        onFocus={() => setSelectedId(s.id)}
                        className="group"
                      >
                        <Link href={`/tram-sac/${s.slug}`} className="block">
                          <div
                            className={`relative aspect-[4/3] overflow-hidden rounded-[16px] rounded-tr-[56px] bg-hm-mist transition ${
                              isActive ? "ring-2 ring-hm-brand ring-offset-4" : ""
                            }`}
                          >
                            <Image
                              src={cover.src}
                              alt=""
                              fill
                              sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
                              loading={i < 2 ? "eager" : "lazy"}
                              fetchPriority={i < 2 ? "high" : "auto"}
                              className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
                            />
                            <span
                              className={`absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-3 py-1 text-[12px] font-medium backdrop-blur ${
                                s.fast ? "bg-hm-ink/85 text-white" : "bg-white/85 text-hm-ink"
                              }`}
                            >
                              {s.fast && <BoltIcon className="h-3 w-3" />}
                              {s.fast ? `DC${s.maxPowerKw ? ` ${s.maxPowerKw} kW` : ""}` : "AC"}
                            </span>
                            <span
                              className={`absolute bottom-3 right-3 whitespace-nowrap rounded-full px-3 py-1 text-[12px] font-medium backdrop-blur ${
                                full ? "bg-red-50/95 text-red-700" : "bg-white/90 text-hm-deep"
                              }`}
                            >
                              {status(s)}
                            </span>
                          </div>
                          <h2 className="mt-4 text-lg font-semibold leading-snug transition group-hover:text-hm-deep">
                            {s.name}
                          </h2>
                          <p className="mt-0.5 text-[15px] text-hm-body">
                            {s.district}, {s.city}
                          </p>
                        </Link>
                        <div className="mt-3 flex items-center justify-between gap-3 border-t border-hm-ink/10 pt-3">
                          <p className="text-[15px]">
                            {priceLabel(s)} <span className="text-hm-body">/ kWh</span>
                          </p>
                          <a
                            href={directions(s)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex min-h-11 items-center gap-1.5 text-[15px] font-medium text-hm-deep hover:underline"
                          >
                            {en ? "Directions" : "Chỉ đường"}
                            <ExternalIcon />
                          </a>
                        </div>
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
              </motion.ul>

              {filtered.length === 0 && (
                <div className="rounded-[24px] bg-hm-paper p-10 text-center ring-1 ring-hm-ink/5">
                  <p className="text-lg font-semibold">{t.stationDirectory.noStationsMatched}</p>
                  <p className="mt-1 text-hm-body">
                    {en ? "Try another keyword or clear the filters." : "Thử từ khóa khác hoặc bỏ bớt bộ lọc."}
                  </p>
                  <button type="button" onClick={resetFilters} className="small-pill small-pill--dark mt-5">
                    {t.stationDirectory.resetFilters}
                  </button>
                </div>
              )}
            </div>

            {/* Sticky map + spotlight */}
            <aside className={mobileView === "list" ? "hidden lg:block" : ""}>
              <div className="space-y-3 lg:sticky lg:top-6">
                <div className="overflow-hidden rounded-[20px] rounded-tr-[48px] border border-hm-ink/10 bg-white">
                  <div className="relative h-[340px] bg-hm-mist lg:h-[380px]">
                    <iframe
                      key={active?.id ?? city}
                      src={mapEmbedUrl}
                      title={en ? "Station map" : "Bản đồ trạm sạc"}
                      className="h-[calc(100%+38px)] w-full border-0 [filter:saturate(0.6)]"
                      loading="lazy"
                      tabIndex={-1}
                    />
                  </div>
                  {active ? (
                    <div className="space-y-4 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold">{active.name}</p>
                          <p className="mt-1 flex items-start gap-1.5 text-[15px] text-hm-body">
                            <PinIcon className="mt-0.5 h-4 w-4 shrink-0 text-hm-deep" />
                            {active.address}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 text-[13px]">
                        <span className="rounded-full bg-hm-mint px-3 py-1 text-hm-deep">{status(active)}</span>
                        <span className="rounded-full bg-hm-paper px-3 py-1 ring-1 ring-hm-ink/5">{priceLabel(active)} / kWh</span>
                        <span className="rounded-full bg-hm-paper px-3 py-1 ring-1 ring-hm-ink/5">{active.hours}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Link href={`/tram-sac/${active.slug}`} className="small-pill small-pill--dark gap-1.5">
                          {en ? "Details" : "Chi tiết"}
                          <ArrowRightIcon className="h-4 w-4" />
                        </Link>
                        <a
                          href={directions(active)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="small-pill gap-1.5 text-hm-ink ring-1 ring-hm-ink/15 hover:bg-hm-paper"
                        >
                          {en ? "Directions" : "Chỉ đường"}
                          <ExternalIcon />
                        </a>
                      </div>
                    </div>
                  ) : (
                    <p className="p-5 text-[15px] text-hm-body">
                      {en ? "Pick a station to see it on the map." : "Chọn một trạm để xem trên bản đồ."}
                    </p>
                  )}
                </div>
                <p className="px-2 text-[13px] leading-relaxed text-hm-body">
                  {en
                    ? "Locations come from station records. Check the address before you set off; Directions opens Google Maps."
                    : "Vị trí theo thông tin trạm cung cấp. Hãy kiểm tra địa chỉ trước khi đi; nút Chỉ đường mở Google Maps."}
                </p>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ */}
      {/* Booking band                                                  */}
      {/* ------------------------------------------------------------ */}
      <section className="px-4 pb-4">
        <div className="frame-tr relative overflow-hidden bg-hm-ink px-5 py-16 text-center text-white md:px-10 md:py-20">
          <div className="pointer-events-none absolute -right-40 -top-40 h-[480px] w-[480px] rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.28),transparent_65%)]" />
          <Reveal className="relative mx-auto max-w-2xl">
            <h2 className="t-lg">{t.stationsPage.instantBookingTitle}</h2>
            <p className="t-body-lg mx-auto mt-5 text-white/75">
              {en
                ? "Your slot is held for 10 minutes while you pay. When you arrive, scan the QR code on the charger. No card needed."
                : "Khung giờ được giữ 10 phút để bạn thanh toán. Đến nơi, quét mã QR trên trụ là sạc, không cần thẻ."}
            </p>
            <div className="mt-9 flex justify-center">
              <PillButton href={DRIVER_DEMO_URL} external label={t.stationsPage.tryDriverCta} icon={<BoltIcon />} tone="light" />
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
