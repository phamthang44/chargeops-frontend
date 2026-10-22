import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { StoreBadges } from "@/components/StoreBadges";
import { StationPhotoShowcase } from "@/components/StationPhotoShowcase";
import { STATIONS, getStationBySlug, type Connector } from "@/components/stations";
import { fetchPublicStationBySlug, fetchPublicStations } from "@/lib/stations-api";
import {
  MapPinIcon,
  BoltIcon,
  StarIcon,
  CheckIcon,
  ChevronRightIcon,
} from "@/components/Icons";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return STATIONS.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const station = (await fetchPublicStationBySlug(slug)) || getStationBySlug(slug);
  if (!station) return { title: "Không tìm thấy trạm sạc" };

  const title = `${station.name} · Trạm sạc xe điện ${station.district}, ${station.city}`;
  const description = `${station.name} tại ${station.address}. Xem thông tin địa điểm và cổng sạc. Dữ liệu và khả năng đặt chỗ phụ thuộc vào thông tin do trạm cung cấp.`;

  return {
    title,
    description,
    alternates: { canonical: `/tram-sac/${station.slug}` },
    openGraph: {
      title,
      description,
      url: `/tram-sac/${station.slug}`,
      images: station.primaryImageUrl ? [{ url: station.primaryImageUrl }] : [],
    },
  };
}

const CONNECTOR_SPECS: Record<
  Connector,
  { type: string; power: string; desc: string; vehicles: string }
> = {
  CCS2: {
    type: "Sạc nhanh siêu tốc DC",
    power: "60kW – 150kW",
    desc: "Chuẩn cổng sạc DC phổ biến nhất. Sạc nhanh 20% - 80% trong 20-35 phút.",
    vehicles: "VinFast VF e34, VF5, VF6, VF7, VF8, VF9, Porsche Taycan, Audi e-tron, BMW iX...",
  },
  CHAdeMO: {
    type: "Sạc nhanh DC",
    power: "50kW – 60kW",
    desc: "Chuẩn cổng sạc DC Nhật Bản. Dòng điện ổn định và an toàn.",
    vehicles: "Nissan Leaf, Mitsubishi Outlander PHEV và một số dòng xe nhập khẩu.",
  },
  "Type 2 (AC)": {
    type: "Sạc tiêu chuẩn AC",
    power: "11kW – 22kW",
    desc: "Chuẩn cổng sạc xoay chiều phổ thông. Thích hợp khi dừng đỗ mua sắm, làm việc.",
    vehicles: "Tương thích hầu hết các dòng xe thuần điện (BEV) và xe lai (PHEV) tại Việt Nam.",
  },
  "GB/T": {
    type: "Sạc nhanh DC / AC",
    power: "30kW – 60kW",
    desc: "Chuẩn cổng sạc quốc gia Trung Quốc, trang bị trên các mẫu xe nội địa.",
    vehicles: "Wuling Mini EV, BYD, MG và các dòng xe điện nhập khẩu từ thị trường Trung Quốc.",
  },
};

const AMENITY_ICONS: Record<string, string> = {
  "Mái che": "☂️",
  "Bãi đỗ rộng": "🅿️",
  "Cafe": "☕",
  "Nhà vệ sinh": "🚻",
  "Wifi": "📶",
  "Mở 24/7": "🕒",
  "Thanh toán trong app": "📱",
};

export default async function StationDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const station = (await fetchPublicStationBySlug(slug)) || getStationBySlug(slug);
  if (!station) notFound();

  const isFull = station.total > 0 && station.available === 0;

  // Fetch contextual other stations (prefer live API stations, fallback to curated STATIONS)
  let others = STATIONS.filter((s) => s.slug !== station.slug).slice(0, 3);
  try {
    const listRes = await fetchPublicStations({ size: 10 });
    const apiOthers = listRes.stations.filter((s) => s.slug !== station.slug).slice(0, 3);
    if (apiOthers.length > 0) others = apiOthers;
  } catch {
    // Keep fallback
  }

  // Real GPS & Maps navigation
  const lat = station.latitude ?? 10.7769;
  const lng = station.longitude ?? 106.7009;
  const delta = 0.006;
  const bbox = `${lng - delta}%2C${lat - delta}%2C${lng + delta}%2C${lat + delta}`;
  const mapEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;
  const googleMapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  // Gallery images priority: backend assets > primaryImageUrl > curated real EV photography
  const defaultStationPhotos = [
    "/stations/hub-exterior.jpg",
    "/stations/charger-close.jpg",
    "/stations/mall-indoor.jpg",
  ];
  const gallery =
    station.images && station.images.length > 0
      ? station.images
      : defaultStationPhotos;

  const fillPercent =
    station.total > 0
      ? Math.round(((station.total - station.available) / station.total) * 100)
      : 100;

  // Clean price display (no redundant "tham khảo" repetition)
  const displayPrice = station.priceNumber
    ? `${Number(station.priceNumber).toLocaleString("vi-VN")}đ`
    : station.pricePerKwh.replace(/\(tham khảo\)/gi, "").replace(/\/gói tham khảo/gi, "").trim();

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-[#FAFAF8] pt-24 sm:pt-28 lg:pt-32 pb-20">
        <div className="container-x">
          {/* Top Breadcrumb Navigation Pill */}
          <nav
            aria-label="Breadcrumb"
            className="mb-6 inline-flex flex-wrap items-center gap-2 rounded-full border border-black/[0.06] bg-white/80 px-4 py-2 text-xs font-medium text-ink-muted shadow-[0_2px_8px_rgba(0,0,0,0.02)] backdrop-blur-md"
          >
            <Link href="/" className="hover:text-primary transition-colors">
              Trang chủ
            </Link>
            <span aria-hidden className="text-ink-muted/40">/</span>
            <Link href="/tram-sac" className="hover:text-primary transition-colors">
              Trạm sạc
            </Link>
            <span aria-hidden className="text-ink-muted/40">/</span>
            <span className="text-ink-body font-semibold">{station.city}</span>
            <span aria-hidden className="text-ink-muted/40">/</span>
            <span className="font-bold text-primary-dark line-clamp-1 max-w-[200px] sm:max-w-none">
              {station.name}
            </span>
          </nav>

          {/* Station Hero Header (Double-Bezel Identity) */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 pb-8 border-b border-black/[0.06]">
            <div className="max-w-3xl">
              {/* Eyebrow Status Badges */}
              <div className="flex flex-wrap items-center gap-2.5 mb-3.5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3.5 py-1 text-xs font-bold text-emerald-800 ring-1 ring-emerald-500/20">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Mạng lưới trạm sạc ChargeOps
                </span>

                {station.fast ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-800 ring-1 ring-amber-500/20">
                    <BoltIcon className="h-3.5 w-3.5 text-amber-600" />
                    Sạc nhanh DC {station.maxPowerKw ? `${station.maxPowerKw}kW` : ""}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 px-3 py-1 text-xs font-bold text-sky-800 ring-1 ring-sky-500/20">
                    Sạc tiêu chuẩn AC
                  </span>
                )}

                <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-ink-body ring-1 ring-black/[0.08] shadow-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {station.hours}
                </span>
              </div>

              {/* Station Name */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-ink-strong text-balance">
                {station.name}
              </h1>

              {/* Address & Google Maps Direction Island */}
              <div className="mt-3.5 flex flex-wrap items-center gap-3 text-sm text-ink-body">
                <p className="inline-flex items-center gap-1.5 font-medium">
                  <MapPinIcon className="h-4 w-4 shrink-0 text-primary" />
                  <span>{station.address}</span>
                </p>
                <span className="text-ink-muted/40 hidden sm:inline">·</span>
                <a
                  href={googleMapsDirectionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-bold text-primary ring-1 ring-primary/20 shadow-sm transition-all duration-300 hover:bg-primary hover:text-white hover:ring-primary"
                >
                  <span>Chỉ đường Google Maps</span>
                  <span className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                    ↗
                  </span>
                </a>
              </div>
            </div>

            {/* Quick Rating & Infrastructure Status Pill */}
            <div className="flex items-center gap-3 shrink-0">
              {station.reviewCount > 0 && (
                <div className="rounded-[1.5rem] bg-black/[0.02] p-1 ring-1 ring-black/[0.06]">
                  <div className="flex items-center gap-2 rounded-[calc(1.5rem-0.25rem)] bg-white px-4 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                      <StarIcon className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="text-base font-extrabold text-ink-strong">
                          {station.rating.toFixed(1)}
                        </span>
                        <span className="text-xs text-ink-muted">/5.0</span>
                      </div>
                      <p className="text-[10px] text-ink-muted font-semibold">
                        {station.reviewCount} đánh giá
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Real Capacity Badge */}
              <div className="rounded-[1.5rem] bg-black/[0.02] p-1 ring-1 ring-black/[0.06]">
                <div
                  className={`flex items-center gap-3 rounded-[calc(1.5rem-0.25rem)] px-4 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.02)] ${
                    isFull
                      ? "bg-red-50 text-red-700 ring-1 ring-red-200"
                      : "bg-emerald-50/90 text-emerald-900 ring-1 ring-emerald-200/80"
                  }`}
                >
                  <span
                    className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                      isFull ? "bg-red-500" : "bg-emerald-500 animate-pulse"
                    }`}
                  />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider opacity-75">
                      Hạ tầng sạc
                    </p>
                    <p className="text-sm font-extrabold">
                      {station.total === 0
                        ? "Đang cập nhật"
                        : isFull
                        ? "Hết chỗ tạm thời"
                        : `${station.available}/${station.total} cổng sẵn sàng`}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* High-End Station Asset Gallery (Client Interactive Showcase) */}
          <section aria-label="Hình ảnh thực tế trạm sạc" className="mt-8">
            <StationPhotoShowcase
              stationName={station.name}
              stationAddress={station.address}
              images={gallery}
              maxPowerKw={station.maxPowerKw}
              fast={station.fast}
            />
          </section>

          {/* 4 Bento KPI Metric Cards (Double-Bezel Architecture) */}
          <section className="mt-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Available Ports */}
              <div className="group rounded-[1.75rem] bg-black/[0.02] p-1 ring-1 ring-black/[0.06] transition-all duration-300 hover:shadow-card">
                <div className="h-full rounded-[calc(1.75rem-0.25rem)] bg-white p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_4px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold text-ink-muted">
                      <span>Cổng sạc trống</span>
                      <span
                        className={`h-2 w-2 rounded-full ${
                          isFull ? "bg-red-500" : "bg-emerald-500 animate-pulse"
                        }`}
                      />
                    </div>
                    <div className="mt-3 flex items-baseline gap-1.5">
                      <span className="text-3xl font-extrabold text-ink-strong tracking-tight">
                        {station.available}
                      </span>
                      <span className="text-sm font-semibold text-ink-muted">
                        / {station.total} cổng
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-black/[0.04]">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-alt">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          isFull ? "bg-red-500" : "bg-primary"
                        }`}
                        style={{ width: `${Math.max(10, 100 - fillPercent)}%` }}
                      />
                    </div>
                    <p className="mt-2 text-[11px] font-medium text-ink-muted">
                      {isFull ? "Hiện đã kín lịch sạc" : `Khả dụng ${100 - fillPercent}% năng lực`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 2: Peak Power */}
              <div className="group rounded-[1.75rem] bg-black/[0.02] p-1 ring-1 ring-black/[0.06] transition-all duration-300 hover:shadow-card">
                <div className="h-full rounded-[calc(1.75rem-0.25rem)] bg-white p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_4px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold text-ink-muted">
                      <span>Công suất sạc</span>
                      <BoltIcon className="h-4 w-4 text-amber-500" />
                    </div>
                    <div className="mt-3 flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-ink-strong tracking-tight">
                        {station.maxPowerKw || "120"}
                      </span>
                      <span className="text-sm font-bold text-ink-muted">kW</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-black/[0.04]">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-extrabold text-emerald-800">
                      {station.fast ? "DC Ultra-Fast" : "AC Standard"}
                    </span>
                    <p className="mt-1 text-[11px] font-medium text-ink-muted">
                      Tự động điều tiết dòng sạc tối ưu
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 3: Unit Pricing (Fixed Repetition Bug) */}
              <div className="group rounded-[1.75rem] bg-black/[0.02] p-1 ring-1 ring-black/[0.06] transition-all duration-300 hover:shadow-card">
                <div className="h-full rounded-[calc(1.75rem-0.25rem)] bg-white p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_4px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold text-ink-muted">
                      <span>Đơn giá niêm yết</span>
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary-dark">
                        Minh bạch
                      </span>
                    </div>
                    <div className="mt-3 flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-primary-dark tracking-tight">
                        {displayPrice}
                      </span>
                      <span className="text-xs font-bold text-ink-muted">/ kWh</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-black/[0.04]">
                    <p className="text-xs font-bold text-ink-strong">
                      Giá điện năng thực tế
                    </p>
                    <p className="mt-0.5 text-[11px] font-medium text-ink-muted">
                      Đo đếm chính xác từng phiên sạc
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 4: Operating Hours */}
              <div className="group rounded-[1.75rem] bg-black/[0.02] p-1 ring-1 ring-black/[0.06] transition-all duration-300 hover:shadow-card">
                <div className="h-full rounded-[calc(1.75rem-0.25rem)] bg-white p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_4px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold text-ink-muted">
                      <span>Thời gian hoạt động</span>
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    </div>
                    <div className="mt-3">
                      <p className="text-2xl font-extrabold text-ink-strong tracking-tight truncate">
                        {station.hours}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-black/[0.04]">
                    <p className="text-xs font-bold text-ink-strong">
                      Phục vụ xuyên suốt
                    </p>
                    <p className="mt-0.5 text-[11px] font-medium text-ink-muted">
                      Hỗ trợ check-in tự động 24/7
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
              <div className="rounded-[2rem] bg-black/[0.02] p-1.5 ring-1 ring-black/[0.06]">
                <div className="rounded-[calc(2rem-0.375rem)] bg-white p-6 sm:p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-ink-strong tracking-tight">
                        Chuẩn sạc tương thích & Đầu cắm
                      </h2>
                      <p className="mt-1 text-xs text-ink-muted">
                        Hỗ trợ các chuẩn cổng sạc tiêu chuẩn quốc tế và tương thích với hầu hết dòng xe điện hiện nay.
                      </p>
                    </div>
                    <span className="hidden sm:inline-flex rounded-full bg-primary/10 px-3.5 py-1 text-xs font-bold text-primary-dark">
                      {station.connectors.length} chuẩn kết nối
                    </span>
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    {station.connectors.map((c) => {
                      const spec = CONNECTOR_SPECS[c] || {
                        type: "Đầu sạc tiêu chuẩn",
                        power: "Tiêu chuẩn",
                        desc: "Tương thích các dòng xe điện thông dụng.",
                        vehicles: "Xe điện và Hybrid sạc ngoài",
                      };
                      return (
                        <div
                          key={c}
                          className="group rounded-2xl border border-black/[0.06] bg-surface-alt/60 p-5 transition-all duration-300 hover:border-primary/40 hover:bg-white hover:shadow-card"
                        >
                          <div className="flex items-center justify-between">
                            <span className="inline-flex items-center gap-2 text-base font-extrabold text-ink-strong">
                              <BoltIcon className="h-4.5 w-4.5 text-primary" /> {c}
                            </span>
                            <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-extrabold text-primary-dark ring-1 ring-black/[0.06] shadow-sm">
                              {spec.power}
                            </span>
                          </div>
                          <p className="mt-2 text-xs font-bold text-primary-dark">
                            {spec.type}
                          </p>
                          <p className="mt-1 text-xs text-ink-muted leading-relaxed">
                            {spec.desc}
                          </p>
                          <div className="mt-3.5 border-t border-black/[0.04] pt-2.5 text-[11px]">
                            <span className="font-bold text-ink-strong">Tương thích: </span>
                            <span className="text-ink-muted">{spec.vehicles}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Amenities & Surrounding Services */}
              <div className="rounded-[2rem] bg-black/[0.02] p-1.5 ring-1 ring-black/[0.06]">
                <div className="rounded-[calc(2rem-0.375rem)] bg-white p-6 sm:p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)]">
                  <h2 className="text-xl font-bold text-ink-strong tracking-tight">
                    Tiện ích xung quanh trạm sạc
                  </h2>
                  <p className="mt-1 text-xs text-ink-muted">
                    Không gian nghỉ ngơi, làm việc và giải trí thuận tiện trong thời gian sạc pin cho xe.
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2.5">
                    {station.amenities.map((a) => (
                      <span
                        key={a}
                        className="inline-flex items-center gap-2 rounded-2xl border border-black/[0.06] bg-surface-alt px-4 py-2.5 text-xs font-bold text-ink-body shadow-sm transition hover:border-primary/40 hover:bg-primary/5"
                      >
                        <span className="text-base">{AMENITY_ICONS[a] || "✨"}</span>
                        <span>{a}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Description & Location Guide */}
              <div className="rounded-[2rem] bg-black/[0.02] p-1.5 ring-1 ring-black/[0.06]">
                <div className="rounded-[calc(2rem-0.375rem)] bg-white p-6 sm:p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)]">
                  <h2 className="text-xl font-bold text-ink-strong tracking-tight">
                    Giới thiệu & Hướng dẫn tiếp cận
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-ink-body whitespace-pre-line">
                    {station.description}
                  </p>

                  <div className="mt-6 rounded-2xl border border-black/[0.06] bg-surface-alt/70 p-5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-ink-strong">
                      📍 3 Bước tiếp cận và cắm sạc
                    </h3>
                    <ul className="mt-3 space-y-2 text-xs text-ink-body">
                      <li className="flex items-start gap-2.5">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-extrabold text-white">
                          1
                        </span>
                        <span>Quan sát biển chỉ dẫn sạc xe điện (EV Charging) khi vào bãi đỗ.</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-extrabold text-white">
                          2
                        </span>
                        <span>Đỗ xe đúng ô sạc đã đặt giữ chỗ trên ứng dụng ChargeOps.</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-extrabold text-white">
                          3
                        </span>
                        <span>Cắm đầu sạc vào xe và mở app quét mã QR trên trụ để kích hoạt dòng điện.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Transparent Booking & Cancellation Standards */}
              <div className="rounded-[2rem] bg-black/[0.02] p-1.5 ring-1 ring-black/[0.06]">
                <div className="rounded-[calc(2rem-0.375rem)] bg-white p-6 sm:p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-ink-strong tracking-tight">
                        Chính sách giữ chỗ & Quyền lợi tài xế
                      </h2>
                      <p className="mt-1 text-xs text-ink-muted">
                        Bảo đảm công bằng cho mọi tài xế và tối ưu hóa hạ tầng sạc công cộng.
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-800">
                      Chuẩn quy định v4.9
                    </span>
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-black/[0.06] bg-surface-alt/70 p-4">
                      <span className="text-xl">⏱️</span>
                      <h3 className="mt-2 text-xs font-bold text-ink-strong">
                        Giữ chỗ 10 phút
                      </h3>
                      <p className="mt-1 text-[11px] text-ink-muted leading-relaxed">
                        Khung giờ đặt được giữ độc quyền cho bạn trong 10 phút để hoàn tất thanh toán.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-black/[0.06] bg-surface-alt/70 p-4">
                      <span className="text-xl">📲</span>
                      <h3 className="mt-2 text-xs font-bold text-ink-strong">
                        Check-in QR không chạm
                      </h3>
                      <p className="mt-1 text-[11px] text-ink-muted leading-relaxed">
                        Chỉ cần quét mã QR tại trụ để mở khóa nguồn sạc tức thì mà không cần thẻ từ.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-black/[0.06] bg-surface-alt/70 p-4">
                      <span className="text-xl">🛡️</span>
                      <h3 className="mt-2 text-xs font-bold text-ink-strong">
                        Hoàn tiền 100%
                      </h3>
                      <p className="mt-1 text-[11px] text-ink-muted leading-relaxed">
                        Hủy trong vòng 10 phút và trước giờ sạc được hoàn 100% phí giữ chỗ tự động.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Sticky Sidebar (Interactive Map + Driver App Portal) */}
            <aside className="space-y-6">
              <div className="sticky top-28 space-y-6">
                {/* Real OpenStreetMap Live Navigation Card (Double-Bezel) */}
                <div className="rounded-[2rem] bg-black/[0.02] p-1.5 ring-1 ring-black/[0.06]">
                  <div className="overflow-hidden rounded-[calc(2rem-0.375rem)] bg-white shadow-[0_4px_16px_rgba(0,0,0,0.03)]">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-black/[0.06] bg-surface-alt px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                        <span className="text-xs font-bold text-ink-strong">
                          Vị trí thực tế trên bản đồ
                        </span>
                      </div>
                      <span className="rounded-full bg-white px-2.5 py-0.5 text-[10px] font-bold text-primary-dark ring-1 ring-black/[0.06]">
                        {lat.toFixed(4)}, {lng.toFixed(4)}
                      </span>
                    </div>

                    {/* OpenStreetMap Embed */}
                    <div className="relative h-[240px] w-full bg-[#E5E3DF] overflow-hidden">
                      <iframe
                        src={mapEmbedUrl}
                        title={`Bản đồ trạm sạc ${station.name}`}
                        className="h-[calc(100%+38px)] w-full border-0 select-none -mb-[38px]"
                        loading="lazy"
                        tabIndex={-1}
                      />
                    </div>

                    {/* Google Maps Directions Action */}
                    <div className="p-5 bg-white space-y-3.5">
                      <div>
                        <p className="text-xs font-extrabold text-ink-strong">{station.name}</p>
                        <p className="mt-1 text-xs text-ink-muted flex items-start gap-1.5">
                          <MapPinIcon className="h-3.5 w-3.5 shrink-0 text-primary mt-0.5" />
                          <span>{station.address}</span>
                        </p>
                      </div>

                      <a
                        href={googleMapsDirectionsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-xs font-bold text-white shadow-glow-emerald transition-all duration-300 hover:bg-primary-dark hover:scale-[1.01]"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                          <circle cx="12" cy="9" r="2.5" />
                        </svg>
                        <span>Mở chỉ đường trên Google Maps</span>
                      </a>
                    </div>
                  </div>
                </div>

                {/* Luxury Emerald Booking Action Portal (Double-Bezel Architecture) */}
                <div className="rounded-[2rem] bg-emerald-950/[0.08] p-1.5 ring-1 ring-emerald-900/10">
                  <div className="relative overflow-hidden rounded-[calc(2rem-0.375rem)] bg-gradient-to-b from-[#111A16] via-[#0D1411] to-[#080D0B] p-6 sm:p-7 text-white shadow-[0_12px_32px_rgba(0,0,0,0.18)]">
                    <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-primary/20 blur-2xl" />

                    <div className="relative">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-emerald-400 ring-1 ring-white/10">
                        ⚡ ChargeOps Driver Portal
                      </span>

                      <h3 className="mt-3.5 text-xl font-extrabold tracking-tight text-white">
                        Đặt trước trụ sạc tại trạm này
                      </h3>
                      <p className="mt-2 text-xs text-white/75 leading-relaxed">
                        Không cần lo đến nơi bị hết chỗ. Chọn trước khung giờ, thanh toán và quét mã QR check-in sạc ngay khi bạn vừa lái xe tới nơi.
                      </p>

                      {/* Nested Button-in-Button CTA */}
                      <div className="mt-6 space-y-3">
                        <a
                          href={`https://driver.chargeops.online/?demo=true&stationId=${station.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group relative flex w-full items-center justify-between overflow-hidden rounded-full bg-primary pl-5 pr-2 py-2 text-xs font-bold text-white shadow-glow-emerald transition-all duration-300 hover:bg-primary-light hover:scale-[1.01] active:scale-[0.98]"
                        >
                          <span className="tracking-wide">Thử đặt chỗ trên Driver Web</span>
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} className="h-4 w-4">
                              <path d="M7 17L17 7M17 7H7M17 7V17" />
                            </svg>
                          </span>
                        </a>

                        <StoreBadges />
                      </div>

                      <div className="mt-5 border-t border-white/10 pt-3 flex items-center justify-between text-[10px] text-white/60">
                        <span>✓ Giữ chỗ linh hoạt</span>
                        <span>✓ Quét mã QR vào sạc ngay</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>

          {/* Section: Other Stations in Same City (Showcase Redesigned - No Screenshot Gimmicks) */}
          <section className="mt-20 border-t border-black/[0.06] pt-12">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
                  Mở rộng phạm vi tìm kiếm
                </p>
                <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-ink-strong">
                  Các trạm sạc khác tại {station.city}
                </h2>
              </div>
              <Link
                href="/tram-sac"
                className="group hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary-dark transition-colors"
              >
                <span>Xem tất cả trạm</span>
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
                    className="group rounded-[2rem] bg-black/[0.02] p-1.5 ring-1 ring-black/[0.06] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1.5 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08)]"
                  >
                    <div className="h-full rounded-[calc(2rem-0.375rem)] bg-white overflow-hidden flex flex-col justify-between shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)]">
                      {/* Photo Header */}
                      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#0C1210]">
                        <Image
                          src={coverImg}
                          alt={`${s.name} - Trạm sạc xe điện`}
                          fill
                          className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />

                        {/* Top Badges */}
                        <div className="absolute left-3.5 top-3.5 flex items-center gap-1.5">
                          <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-md ${
                              s.fast
                                ? "bg-emerald-500/90 text-white shadow-glow-emerald"
                                : "bg-black/60 text-white/95 ring-1 ring-white/20"
                            }`}
                          >
                            {s.fast ? `DC ${s.maxPowerKw ? `${s.maxPowerKw}kW` : "Siêu tốc"}` : "AC Tiêu chuẩn"}
                          </span>
                        </div>

                        {/* Rating or Verified Tag */}
                        <span className="absolute bottom-3 right-3 rounded-full bg-black/60 backdrop-blur-md px-2.5 py-0.5 text-[11px] font-bold text-white ring-1 ring-white/20">
                          {s.reviewCount > 0 ? `★ ${s.rating.toFixed(1)}` : "Trạm xác thực"}
                        </span>
                      </div>

                      {/* Content Body */}
                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="text-base font-extrabold text-ink-strong group-hover:text-primary transition-colors line-clamp-1">
                            {s.name}
                          </h3>
                          <p className="mt-1 text-xs text-ink-muted line-clamp-1 flex items-center gap-1">
                            <MapPinIcon className="h-3 w-3 shrink-0 text-primary" />
                            <span>{s.district}, {s.city}</span>
                          </p>
                        </div>

                        {/* Card Footer */}
                        <div className="mt-5 flex items-center justify-between border-t border-black/[0.04] pt-3.5">
                          <div>
                            <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider block">
                              Đơn giá sạc
                            </span>
                            <span className="text-sm font-extrabold text-primary-dark">
                              {otherPrice}
                              <span className="text-[11px] font-semibold text-ink-muted"> / kWh</span>
                            </span>
                          </div>

                          <span
                            className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                              s.total > 0 && s.available === 0
                                ? "bg-red-50 text-red-600"
                                : "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200"
                            }`}
                          >
                            {s.total === 0 ? "Đang cập nhật" : s.available === 0 ? "Hết chỗ" : `Còn ${s.available}/${s.total} cổng`}
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
      </main>

      <SiteFooter />

      <JsonLd name={station.name} address={station.address} />
    </>
  );
}

function JsonLd({
  name,
  address,
}: {
  name: string;
  address: string;
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name,
    address: { "@type": "PostalAddress", streetAddress: address, addressCountry: "VN" },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
