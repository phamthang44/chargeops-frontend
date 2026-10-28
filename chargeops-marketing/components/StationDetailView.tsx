"use client";

import Link from "next/link";
import Image from "next/image";
import { StoreBadges } from "@/components/StoreBadges";
import { StationPhotoShowcase } from "@/components/StationPhotoShowcase";
import type { CoverageStation, Connector } from "@/components/stations";
import {
  MapPinIcon,
  BoltIcon,
  StarIcon,
  ChevronRightIcon,
  ClockIcon,
  QrIcon,
  ShieldCheckIcon,
  UmbrellaIcon,
  ParkingIcon,
  CoffeeIcon,
  RestroomIcon,
  WifiIcon,
  Clock24Icon,
  SmartphoneIcon,
  SparklesIcon,
} from "@/components/Icons";
import { useTranslation } from "@/lib/i18n";

const CONNECTOR_SPECS: Record<
  Connector,
  { type: string; typeEn: string; power: string; desc: string; descEn: string; vehicles: string }
> = {
  CCS2: {
    type: "Sạc nhanh siêu tốc DC",
    typeEn: "DC Ultra-Fast Charging",
    power: "60kW – 150kW",
    desc: "Chuẩn cổng sạc DC phổ biến nhất. Sạc nhanh 20% - 80% trong 20-35 phút.",
    descEn: "Most common DC fast charging standard. 20% to 80% charge in 20-35 minutes.",
    vehicles: "VinFast VF e34, VF5, VF6, VF7, VF8, VF9, Porsche Taycan, Audi e-tron, BMW iX...",
  },
  CHAdeMO: {
    type: "Sạc nhanh DC",
    typeEn: "DC Fast Charging",
    power: "50kW – 60kW",
    desc: "Chuẩn cổng sạc DC Nhật Bản. Dòng điện ổn định và an toàn.",
    descEn: "Japanese DC fast charging standard. Stable and reliable power delivery.",
    vehicles: "Nissan Leaf, Mitsubishi Outlander PHEV và một số dòng xe nhập khẩu.",
  },
  "Type 2 (AC)": {
    type: "Sạc tiêu chuẩn AC",
    typeEn: "AC Standard Charging",
    power: "11kW – 22kW",
    desc: "Chuẩn cổng sạc xoay chiều phổ thông. Thích hợp khi dừng đỗ mua sắm, làm việc.",
    descEn: "Universal AC charging standard. Ideal for shopping malls and office stays.",
    vehicles: "Tương thích hầu hết các dòng xe thuần điện (BEV) và xe lai (PHEV) tại Việt Nam.",
  },
  "GB/T": {
    type: "Sạc nhanh DC / AC",
    typeEn: "DC / AC Fast Charging",
    power: "30kW – 60kW",
    desc: "Chuẩn cổng sạc quốc gia Trung Quốc, trang bị trên các mẫu xe nội địa.",
    descEn: "Chinese national charging standard equipped on domestic vehicles.",
    vehicles: "Wuling Mini EV, BYD, MG và các dòng xe điện nhập khẩu từ thị trường Trung Quốc.",
  },
};

function AmenityIcon({ name, className = "h-4 w-4" }: { name: string; className?: string }) {
  switch (name) {
    case "Mái che":
      return <UmbrellaIcon className={className} />;
    case "Bãi đỗ rộng":
      return <ParkingIcon className={className} />;
    case "Cafe":
      return <CoffeeIcon className={className} />;
    case "Nhà vệ sinh":
      return <RestroomIcon className={className} />;
    case "Wifi":
      return <WifiIcon className={className} />;
    case "Mở 24/7":
      return <Clock24Icon className={className} />;
    case "Thanh toán trong app":
      return <SmartphoneIcon className={className} />;
    default:
      return <SparklesIcon className={className} />;
  }
}

interface StationDetailViewProps {
  station: CoverageStation;
  others: CoverageStation[];
  gallery: string[];
  mapEmbedUrl: string;
  googleMapsDirectionsUrl: string;
  lat: number;
  lng: number;
  displayPrice: string;
  fillPercent: number;
  isFull: boolean;
}

export function StationDetailView({
  station,
  others,
  gallery,
  mapEmbedUrl,
  googleMapsDirectionsUrl,
  lat,
  lng,
  displayPrice,
  fillPercent,
  isFull,
}: StationDetailViewProps) {
  const { t, locale } = useTranslation();

  return (
    <div className="container-x">
      {/* Top Breadcrumb Navigation Pill */}
      <nav
        aria-label="Breadcrumb"
        className="mb-6 inline-flex flex-wrap items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium text-white/60 shadow-glass backdrop-blur-md"
      >
        <Link href="/" className="hover:text-emerald-400 transition-colors">
          {t.stationDetail.breadcrumbHome}
        </Link>
        <span aria-hidden className="text-white/30">/</span>
        <Link href="/tram-sac" className="hover:text-emerald-400 transition-colors">
          {t.stationDetail.breadcrumbStations}
        </Link>
        <span aria-hidden className="text-white/30">/</span>
        <span className="text-white/80 font-semibold">{station.city}</span>
        <span aria-hidden className="text-white/30">/</span>
        <span className="font-bold text-emerald-400 line-clamp-1 max-w-[200px] sm:max-w-none">
          {station.name}
        </span>
      </nav>

      {/* Station Hero Header (Double-Bezel Identity) */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 pb-8 border-b border-white/10">
        <div className="max-w-3xl">
          {/* Eyebrow Status Badges */}
          <div className="flex flex-wrap items-center gap-2.5 mb-3.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3.5 py-1 text-xs font-bold text-emerald-400 ring-1 ring-emerald-500/30">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              {locale === "en" ? "ChargeOps Station Network" : "Mạng lưới trạm sạc ChargeOps"}
            </span>

            {station.fast ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-300 ring-1 ring-amber-500/30">
                <BoltIcon className="h-3.5 w-3.5 text-amber-400" />
                {locale === "en"
                  ? `DC Fast ${station.maxPowerKw ? `${station.maxPowerKw}kW` : ""}`
                  : `Sạc nhanh DC ${station.maxPowerKw ? `${station.maxPowerKw}kW` : ""}`}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/15 px-3 py-1 text-xs font-bold text-sky-300 ring-1 ring-sky-500/30">
                {locale === "en" ? "AC Standard" : "Sạc tiêu chuẩn AC"}
              </span>
            )}

            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-3 py-1 text-xs font-semibold text-white/90 ring-1 ring-white/10 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {station.hours}
            </span>
          </div>

          {/* Station Name */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white text-balance leading-[1.24] sm:leading-[1.26] lg:leading-[1.28]">
            {station.name}
          </h1>

          {/* Address & Google Maps Direction Island */}
          <div className="mt-3.5 flex flex-wrap items-center gap-3 text-sm text-white/70">
            <p className="inline-flex items-center gap-1.5 font-medium">
              <MapPinIcon className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>{station.address}</span>
            </p>
            <span className="text-white/30 hidden sm:inline">·</span>
            <a
              href={googleMapsDirectionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-xs font-bold text-emerald-400 ring-1 ring-emerald-500/30 shadow-sm transition-all duration-300 hover:bg-emerald-500 hover:text-white hover:ring-emerald-500"
            >
              <span>{locale === "en" ? "Google Maps Directions" : "Chỉ đường Google Maps"}</span>
              <span className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                ↗
              </span>
            </a>
          </div>
        </div>

        {/* Quick Rating & Infrastructure Status Pill */}
        <div className="flex items-center gap-3 shrink-0">
          {station.reviewCount > 0 && (
            <div className="rounded-[1.5rem] bg-white/[0.04] p-1 ring-1 ring-white/10">
              <div className="flex items-center gap-2 rounded-[calc(1.5rem-0.25rem)] bg-[#0E1512] px-4 py-3 border border-white/10 shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
                  <StarIcon className="h-4.5 w-4.5 fill-amber-400 text-amber-400" />
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-base font-extrabold text-white">
                      {station.rating.toFixed(1)}
                    </span>
                    <span className="text-xs text-white/50">/5.0</span>
                  </div>
                  <p className="text-[10px] text-white/50 font-semibold">
                    {station.reviewCount} {locale === "en" ? "reviews" : "đánh giá"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Real Capacity Badge */}
          <div className="rounded-[1.5rem] bg-white/[0.04] p-1 ring-1 ring-white/10">
            <div
              className={`flex items-center gap-3 rounded-[calc(1.5rem-0.25rem)] px-4 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.4)] ${
                isFull
                  ? "bg-red-950/40 text-red-300 ring-1 ring-red-500/30"
                  : "bg-emerald-950/40 text-emerald-300 ring-1 ring-emerald-500/30"
              }`}
            >
              <span
                className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                  isFull ? "bg-red-500" : "bg-emerald-400 animate-pulse"
                }`}
              />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider opacity-75">
                  {locale === "en" ? "Infrastructure" : "Hạ tầng sạc"}
                </p>
                <p className="text-sm font-extrabold text-white">
                  {station.total === 0
                    ? (locale === "en" ? "Updating" : "Đang cập nhật")
                    : isFull
                    ? (locale === "en" ? "Temporarily Full" : "Hết chỗ tạm thời")
                    : (locale === "en"
                        ? `${station.available}/${station.total} ports ready`
                        : `${station.available}/${station.total} cổng sẵn sàng`)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* High-End Station Asset Gallery */}
      <section aria-label={locale === "en" ? "Real station photos" : "Hình ảnh thực tế trạm sạc"} className="mt-8">
        <StationPhotoShowcase
          stationName={station.name}
          stationAddress={station.address}
          images={gallery}
          maxPowerKw={station.maxPowerKw}
          fast={station.fast}
        />
      </section>

      {/* 4 Bento KPI Metric Cards */}
      <section className="mt-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Available Ports */}
          <div className="group rounded-[1.75rem] bg-white/[0.04] p-1 ring-1 ring-white/10 transition-all duration-300 hover:shadow-glow-emerald/10 hover:ring-emerald-500/30">
            <div className="h-full rounded-[calc(1.75rem-0.25rem)] bg-[#0E1512] p-5 border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-white/60">
                  <span>{locale === "en" ? "Available Ports" : "Cổng sạc trống"}</span>
                  <span
                    className={`h-2 w-2 rounded-full ${
                      isFull ? "bg-red-500" : "bg-emerald-400 animate-pulse"
                    }`}
                  />
                </div>
                <div className="mt-3 flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold text-white tracking-tight">
                    {station.available}
                  </span>
                  <span className="text-sm font-semibold text-white/50">
                    / {station.total} {locale === "en" ? "ports" : "cổng"}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/10">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      isFull ? "bg-red-500" : "bg-emerald-400"
                    }`}
                    style={{ width: `${Math.max(10, 100 - fillPercent)}%` }}
                  />
                </div>
                <p className="mt-2 text-[11px] font-medium text-white/60">
                  {isFull
                    ? (locale === "en" ? "Fully booked currently" : "Hiện đã kín lịch sạc")
                    : (locale === "en"
                        ? `${100 - fillPercent}% capacity available`
                        : `Khả dụng ${100 - fillPercent}% năng lực`)}
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: Peak Power */}
          <div className="group rounded-[1.75rem] bg-white/[0.04] p-1 ring-1 ring-white/10 transition-all duration-300 hover:shadow-glow-emerald/10 hover:ring-emerald-500/30">
            <div className="h-full rounded-[calc(1.75rem-0.25rem)] bg-[#0E1512] p-5 border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-white/60">
                  <span>{locale === "en" ? "Charging Power" : "Công suất sạc"}</span>
                  <BoltIcon className="h-4 w-4 text-amber-400" />
                </div>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-white tracking-tight">
                    {station.maxPowerKw || "120"}
                  </span>
                  <span className="text-sm font-bold text-white/50">kW</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/10">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-extrabold text-emerald-300">
                  {station.fast ? "DC Ultra-Fast" : "AC Standard"}
                </span>
                <p className="mt-1 text-[11px] font-medium text-white/60">
                  {locale === "en" ? "Dynamic power curve modulation" : "Tự động điều tiết dòng sạc tối ưu"}
                </p>
              </div>
            </div>
          </div>

          {/* Card 3: Unit Pricing */}
          <div className="group rounded-[1.75rem] bg-white/[0.04] p-1 ring-1 ring-white/10 transition-all duration-300 hover:shadow-glow-emerald/10 hover:ring-emerald-500/30">
            <div className="h-full rounded-[calc(1.75rem-0.25rem)] bg-[#0E1512] p-5 border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-white/60">
                  <span>{locale === "en" ? "Published Rate" : "Đơn giá niêm yết"}</span>
                  <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                    {locale === "en" ? "Transparent" : "Minh bạch"}
                  </span>
                </div>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-emerald-400 tracking-tight">
                    {displayPrice}
                  </span>
                  <span className="text-xs font-bold text-white/50">/ kWh</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/10">
                <p className="text-xs font-bold text-white">
                  {locale === "en" ? "Actual energy cost" : "Giá điện năng thực tế"}
                </p>
                <p className="mt-0.5 text-[11px] font-medium text-white/60">
                  {locale === "en" ? "Accurately metered per session" : "Đo đếm chính xác từng phiên sạc"}
                </p>
              </div>
            </div>
          </div>

          {/* Card 4: Operating Hours */}
          <div className="group rounded-[1.75rem] bg-white/[0.04] p-1 ring-1 ring-white/10 transition-all duration-300 hover:shadow-glow-emerald/10 hover:ring-emerald-500/30">
            <div className="h-full rounded-[calc(1.75rem-0.25rem)] bg-[#0E1512] p-5 border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-white/60">
                  <span>{locale === "en" ? "Operating Hours" : "Thời gian hoạt động"}</span>
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-extrabold text-white tracking-tight truncate">
                    {station.hours}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/10">
                <p className="text-xs font-bold text-white">
                  {locale === "en" ? "Continuous Service" : "Phục vụ xuyên suốt"}
                </p>
                <p className="mt-0.5 text-[11px] font-medium text-white/60">
                  {locale === "en" ? "24/7 automated check-in support" : "Hỗ trợ check-in tự động 24/7"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Layout: Left Specs + Right Sticky Sidebar */}
      <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_390px] xl:grid-cols-[1fr_420px]">
        {/* Left Column: Connectors, Amenities, Guide, Cancellation Standard */}
        <div className="space-y-8">
          {/* Connector Specifications */}
          <div className="rounded-[2rem] bg-white/[0.04] p-1.5 ring-1 ring-white/10">
            <div className="rounded-[calc(2rem-0.375rem)] bg-[#0E1512] border border-white/10 p-6 sm:p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    {locale === "en" ? "Compatible Standards & Connectors" : "Chuẩn sạc tương thích & Đầu cắm"}
                  </h2>
                  <p className="mt-1 text-xs text-white/60">
                    {locale === "en"
                      ? "Supports international charging standards compatible with most electric vehicles."
                      : "Hỗ trợ các chuẩn cổng sạc tiêu chuẩn quốc tế và tương thích với hầu hết dòng xe điện hiện nay."}
                  </p>
                </div>
                <span className="hidden sm:inline-flex rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3.5 py-1 text-xs font-bold text-emerald-400">
                  {station.connectors.length} {locale === "en" ? "standards" : "chuẩn kết nối"}
                </span>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {station.connectors.map((c) => {
                  const spec = CONNECTOR_SPECS[c] || {
                    type: "Cổng sạc tiêu chuẩn",
                    typeEn: "Standard Charging Port",
                    power: "Đang cập nhật",
                    desc: "Tương thích các dòng xe thông dụng.",
                    descEn: "Compatible with mainstream EV models.",
                    vehicles: "Hầu hết xe điện.",
                  };
                  return (
                    <div
                      key={c}
                      className="rounded-2xl border border-white/10 bg-[#121A16] p-5 shadow-sm transition hover:border-emerald-500/40"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-base font-extrabold text-emerald-400">
                          {c}
                        </span>
                        <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-bold text-white/80">
                          {spec.power}
                        </span>
                      </div>
                      <p className="mt-2 text-xs font-bold text-white">
                        {locale === "en" ? spec.typeEn : spec.type}
                      </p>
                      <p className="mt-1 text-xs text-white/70 leading-relaxed">
                        {locale === "en" ? spec.descEn : spec.desc}
                      </p>
                      <p className="mt-3 text-[11px] text-white/50 border-t border-white/10 pt-2.5">
                        <strong className="text-white/70">{locale === "en" ? "Vehicles: " : "Xe hỗ trợ: "}</strong>
                        {spec.vehicles}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Amenities Grid */}
          <div className="rounded-[2rem] bg-white/[0.04] p-1.5 ring-1 ring-white/10">
            <div className="rounded-[calc(2rem-0.375rem)] bg-[#0E1512] border border-white/10 p-6 sm:p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
              <h2 className="text-xl font-bold text-white tracking-tight">
                {t.stationDetail.amenitiesTitle}
              </h2>
              <div className="mt-5 flex flex-wrap gap-2.5">
                {station.amenities.map((a) => (
                  <span
                    key={a}
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-[#121A16] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:border-emerald-500/40 hover:bg-emerald-500/10"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
                      <AmenityIcon name={a} className="h-3.5 w-3.5 text-emerald-400" />
                    </span>
                    <span>{a}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Description & Location Guide */}
          <div className="rounded-[2rem] bg-white/[0.04] p-1.5 ring-1 ring-white/10">
            <div className="rounded-[calc(2rem-0.375rem)] bg-[#0E1512] border border-white/10 p-6 sm:p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
              <h2 className="text-xl font-bold text-white tracking-tight">
                {locale === "en" ? "Overview & Approach Guide" : "Giới thiệu & Hướng dẫn tiếp cận"}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-white/80 whitespace-pre-line">
                {station.description}
              </p>

              <div className="mt-6 rounded-2xl border border-white/10 bg-[#121A16] p-5">
                <div className="flex items-center gap-2">
                  <MapPinIcon className="h-4 w-4 text-emerald-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                    {locale === "en" ? "3 Steps to Approach & Plug In" : "3 Bước tiếp cận và cắm sạc"}
                  </h3>
                </div>
                <ul className="mt-3.5 space-y-2.5 text-xs text-white/80">
                  <li className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-extrabold text-white">
                      1
                    </span>
                    <span>
                      {locale === "en"
                        ? "Look for EV Charging signage upon entering the parking area."
                        : "Quan sát biển chỉ dẫn sạc xe điện (EV Charging) khi vào bãi đỗ."}
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-extrabold text-white">
                      2
                    </span>
                    <span>
                      {locale === "en"
                        ? "Park in the exact charging bay reserved on the ChargeOps app."
                        : "Đỗ xe đúng ô sạc đã đặt giữ chỗ trên ứng dụng ChargeOps."}
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-extrabold text-white">
                      3
                    </span>
                    <span>
                      {locale === "en"
                        ? "Plug in connector and open the app to scan the QR code on the pedestal to activate charging."
                        : "Cắm đầu sạc vào xe và mở app quét mã QR trên trụ để kích hoạt dòng điện."}
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Transparent Booking & Cancellation Standards */}
          <div className="rounded-[2rem] bg-white/[0.04] p-1.5 ring-1 ring-white/10">
            <div className="rounded-[calc(2rem-0.375rem)] bg-[#0E1512] border border-white/10 p-6 sm:p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    {locale === "en" ? "Reservation Policy & Driver Protections" : "Chính sách giữ chỗ & Quyền lợi tài xế"}
                  </h2>
                  <p className="mt-1 text-xs text-white/60">
                    {locale === "en"
                      ? "Ensuring fairness for drivers and optimal public charging utilization."
                      : "Bảo đảm công bằng cho mọi tài xế và tối ưu hóa hạ tầng sạc công cộng."}
                  </p>
                </div>
                <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-400">
                  {locale === "en" ? "Standard Rules v4.9" : "Chuẩn quy định v4.9"}
                </span>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-[#121A16] p-4 hover:border-emerald-500/30 transition-colors">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 mb-2.5">
                    <ClockIcon className="h-4.5 w-4.5" />
                  </div>
                  <h3 className="text-xs font-bold text-white">
                    {locale === "en" ? "10-Minute Hold" : "Giữ chỗ 10 phút"}
                  </h3>
                  <p className="mt-1 text-[11px] text-white/60 leading-relaxed">
                    {locale === "en"
                      ? "Reserved slot held exclusively for 10 minutes to complete payment."
                      : "Khung giờ đặt được giữ độc quyền cho bạn trong 10 phút để hoàn tất thanh toán."}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-[#121A16] p-4 hover:border-emerald-500/30 transition-colors">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 mb-2.5">
                    <QrIcon className="h-4.5 w-4.5" />
                  </div>
                  <h3 className="text-xs font-bold text-white">
                    {locale === "en" ? "Touchless QR Check-in" : "Check-in QR không chạm"}
                  </h3>
                  <p className="mt-1 text-[11px] text-white/60 leading-relaxed">
                    {locale === "en"
                      ? "Scan the QR code at the pedestal to unlock charging power without RFID cards."
                      : "Chỉ cần quét mã QR tại trụ để mở khóa nguồn sạc tức thì mà không cần thẻ từ."}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-[#121A16] p-4 hover:border-emerald-500/30 transition-colors">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 mb-2.5">
                    <ShieldCheckIcon className="h-4.5 w-4.5" />
                  </div>
                  <h3 className="text-xs font-bold text-white">
                    {locale === "en" ? "100% Refundable" : "Hoàn tiền 100%"}
                  </h3>
                  <p className="mt-1 text-[11px] text-white/60 leading-relaxed">
                    {locale === "en"
                      ? "Cancel within 10 minutes before the scheduled time for automatic 100% deposit refund."
                      : "Hủy trong vòng 10 phút và trước giờ sạc được hoàn 100% phí giữ chỗ tự động."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Sticky Sidebar (Interactive Map + Driver App Portal) */}
        <aside className="space-y-6">
          <div className="sticky top-28 space-y-6">
            {/* Real OpenStreetMap Live Navigation Card */}
            <div className="rounded-[2rem] bg-white/[0.04] p-1.5 ring-1 ring-white/10">
              <div className="overflow-hidden rounded-[calc(2rem-0.375rem)] bg-[#0E1512] border border-white/10 shadow-diffusion-dark">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/10 bg-[#121A16] px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold text-white">
                      {locale === "en" ? "Actual Location on Map" : "Vị trí thực tế trên bản đồ"}
                    </span>
                  </div>
                  <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 ring-1 ring-white/10">
                    {lat.toFixed(4)}, {lng.toFixed(4)}
                  </span>
                </div>

                {/* OpenStreetMap Embed */}
                <div className="relative h-[240px] w-full bg-[#0C1210] overflow-hidden">
                  <iframe
                    src={mapEmbedUrl}
                    title={locale === "en" ? `Charging map for ${station.name}` : `Bản đồ trạm sạc ${station.name}`}
                    className="h-[calc(100%+38px)] w-full border-0 select-none -mb-[38px] opacity-90"
                    loading="lazy"
                    tabIndex={-1}
                  />
                </div>

                {/* Google Maps Directions Action */}
                <div className="p-5 bg-[#0E1512] space-y-3.5">
                  <div>
                    <p className="text-xs font-extrabold text-white">{station.name}</p>
                    <p className="mt-1 text-xs text-white/60 flex items-start gap-1.5">
                      <MapPinIcon className="h-3.5 w-3.5 shrink-0 text-emerald-400 mt-0.5" />
                      <span>{station.address}</span>
                    </p>
                  </div>

                  <a
                    href={googleMapsDirectionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex w-full items-center justify-center gap-2 rounded-full bg-emerald-500 px-5 py-3 text-xs font-bold text-white shadow-glow-emerald transition-all duration-300 hover:bg-emerald-400 hover:scale-[1.01]"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                      <circle cx="12" cy="9" r="2.5" />
                    </svg>
                    <span>{locale === "en" ? "Open directions on Google Maps" : "Mở chỉ đường trên Google Maps"}</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Luxury Emerald Booking Action Portal */}
            <div className="rounded-[2rem] bg-emerald-950/20 p-1.5 ring-1 ring-emerald-500/20">
              <div className="relative overflow-hidden rounded-[calc(2rem-0.375rem)] bg-gradient-to-b from-[#111A16] via-[#0D1411] to-[#080D0B] p-6 sm:p-7 text-white border border-white/10 shadow-[0_12px_32px_rgba(0,0,0,0.5)]">
                <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-emerald-500/20 blur-2xl" />

                <div className="relative">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-emerald-400 ring-1 ring-white/10">
                    <BoltIcon className="h-3 w-3 text-emerald-400" />
                    <span>ChargeOps Driver Portal</span>
                  </span>

                  <h3 className="mt-3.5 text-xl font-extrabold tracking-tight text-white">
                    {t.stationDetail.reserveSlotCta}
                  </h3>
                  <p className="mt-2 text-xs text-white/75 leading-relaxed">
                    {locale === "en"
                      ? "Never worry about arriving to full chargers. Select time slot, deposit, and scan QR to charge on arrival."
                      : "Không cần lo đến nơi bị hết chỗ. Chọn trước khung giờ, thanh toán và quét mã QR check-in sạc ngay khi bạn vừa lái xe tới nơi."}
                  </p>

                  {/* Nested Button-in-Button CTA */}
                  <div className="mt-6 space-y-3">
                    <a
                      href={`https://driver.chargeops.online/?demo=true&stationId=${station.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative flex w-full items-center justify-between overflow-hidden rounded-full bg-emerald-500 pl-5 pr-2 py-2 text-xs font-bold text-white shadow-glow-emerald transition-all duration-300 hover:bg-emerald-400 hover:scale-[1.01] active:scale-[0.98]"
                    >
                      <span className="tracking-wide">
                        {locale === "en" ? "Reserve on Driver Web" : "Thử đặt chỗ trên Driver Web"}
                      </span>
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/20 text-white transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} className="h-4 w-4">
                          <path d="M7 17L17 7M17 7H7M17 7V17" />
                        </svg>
                      </span>
                    </a>

                    <StoreBadges />
                  </div>

                  <div className="mt-5 border-t border-white/10 pt-3 flex items-center justify-between text-[10px] text-white/60">
                    <span>✓ {locale === "en" ? "Flexible hold" : "Giữ chỗ linh hoạt"}</span>
                    <span>✓ {locale === "en" ? "Scan QR to charge" : "Quét mã QR vào sạc ngay"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Section: Other Stations in Same City */}
      <section className="mt-20 border-t border-white/10 pt-12">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">
              {locale === "en" ? "Expand search range" : "Mở rộng phạm vi tìm kiếm"}
            </p>
            <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {locale === "en" ? `Other charging stations in ${station.city}` : `Các trạm sạc khác tại ${station.city}`}
            </h2>
          </div>
          <Link
            href="/tram-sac"
            className="group hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <span>{locale === "en" ? "View all stations" : "Xem tất cả trạm"}</span>
            <span className="transition-transform duration-300 group-hover:translate-x-1">
              <ChevronRightIcon className="h-4 w-4" />
            </span>
          </Link>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {others.map((s) => {
            const coverImg =
              s.primaryImageUrl ||
              s.images?.[0] ||
              "/stations/hub-exterior.jpg";

            const otherPrice = s.priceNumber
              ? `${Number(s.priceNumber).toLocaleString("vi-VN")}đ`
              : s.pricePerKwh.replace(/\(tham khảo\)/gi, "").replace(/\/gói tham khảo/gi, "").trim();

            return (
              <Link
                key={s.id}
                href={`/tram-sac/${s.slug}`}
                className="group rounded-[2rem] bg-white/[0.04] p-1.5 ring-1 ring-white/10 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1.5 hover:ring-emerald-500/40 hover:shadow-diffusion-dark"
              >
                <div className="h-full rounded-[calc(2rem-0.375rem)] bg-[#0E1512] border border-white/10 overflow-hidden flex flex-col justify-between shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
                  {/* Photo Header */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#0C1210]">
                    <Image
                      src={coverImg}
                      alt={`${s.name} - Trạm sạc xe điện`}
                      fill
                      className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

                    {/* Top Badges */}
                    <div className="absolute left-3.5 top-3.5 flex items-center gap-1.5">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-md ${
                          s.fast
                            ? "bg-emerald-500/90 text-white shadow-glow-emerald"
                            : "bg-black/70 text-white/95 ring-1 ring-white/20"
                        }`}
                      >
                        {s.fast
                          ? `DC ${s.maxPowerKw ? `${s.maxPowerKw}kW` : (locale === "en" ? "Fast" : "Siêu tốc")}`
                          : (locale === "en" ? "AC Standard" : "AC Tiêu chuẩn")}
                      </span>
                    </div>

                    {/* Rating or Verified Tag */}
                    <span className="absolute bottom-3 right-3 rounded-full bg-black/70 backdrop-blur-md px-2.5 py-0.5 text-[11px] font-bold text-white ring-1 ring-white/20 inline-flex items-center gap-1">
                      {s.reviewCount > 0 ? (
                        <>
                          <StarIcon className="h-3 w-3 text-amber-400 fill-amber-400" />
                          <span>{s.rating.toFixed(1)}</span>
                        </>
                      ) : (
                        locale === "en" ? "Verified Station" : "Trạm xác thực"
                      )}
                    </span>
                  </div>

                  {/* Content Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-base font-extrabold text-white group-hover:text-emerald-400 transition-colors line-clamp-1">
                        {s.name}
                      </h3>
                      <p className="mt-1 text-xs text-white/60 line-clamp-1 flex items-center gap-1">
                        <MapPinIcon className="h-3 w-3 shrink-0 text-emerald-400" />
                        <span>{s.district}, {s.city}</span>
                      </p>
                    </div>

                    {/* Card Footer */}
                    <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-3.5">
                      <div>
                        <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider block">
                          {locale === "en" ? "Charging Rate" : "Đơn giá sạc"}
                        </span>
                        <span className="text-sm font-extrabold text-emerald-400">
                          {otherPrice}
                          <span className="text-[11px] font-semibold text-white/50"> / kWh</span>
                        </span>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                          s.total > 0 && s.available === 0
                            ? "bg-red-950/40 text-red-400 ring-1 ring-red-500/30"
                            : "bg-emerald-950/40 text-emerald-400 ring-1 ring-emerald-500/30"
                        }`}
                      >
                        {s.total === 0
                          ? (locale === "en" ? "Updating" : "Đang cập nhật")
                          : s.available === 0
                          ? (locale === "en" ? "Full" : "Hết chỗ")
                          : (locale === "en"
                              ? `${s.available}/${s.total} ports left`
                              : `Còn ${s.available}/${s.total} cổng`)}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
