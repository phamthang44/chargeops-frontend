import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { StoreBadges } from "@/components/StoreBadges";
import { STATIONS, getStationBySlug, type Connector } from "@/components/stations";
import { fetchPublicStationBySlug } from "@/lib/stations-api";
import {
  MapPinIcon,
  BoltIcon,
  StarIcon,
  CheckIcon,
  ChevronRightIcon,
  BuildingIcon,
  PlugIcon,
  CarIcon,
  CoffeeIcon,
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
  const description = `${station.name} tại ${station.address}. ${
    station.fast ? "Trạm sạc nhanh DC" : "Trạm sạc chuẩn AC"
  }, công suất ${station.maxPowerKw ? `${station.maxPowerKw}kW` : "tiêu chuẩn"}, giá ${station.pricePerKwh}/kWh, chuẩn ${station.connectors.join(", ")}. Đặt trước khung giờ và check-in QR trong app ChargeOps.`;

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
    desc: "Chuẩn sạc nhanh phổ biến nhất tại Việt Nam và Châu Âu, sạc đầy 20%–80% chỉ trong 20–30 phút.",
    vehicles: "VinFast VF5/6/7/8/9, Porsche Taycan, Audi e-tron, Hyundai Ioniq 5, BMW iX",
  },
  CHAdeMO: {
    type: "Sạc nhanh DC",
    power: "50kW – 60kW",
    desc: "Chuẩn sạc nhanh DC theo tiêu chuẩn Nhật Bản, nguồn điện ổn định bảo vệ tuổi thọ pack pin.",
    vehicles: "Nissan Leaf, Mitsubishi Outlander PHEV, các dòng xe nhập khẩu Nhật",
  },
  "Type 2 (AC)": {
    type: "Sạc tiêu chuẩn AC",
    power: "11kW – 22kW",
    desc: "Chuẩn sạc chậm AC tiện lợi, phù hợp vừa gửi xe mua sắm, làm việc hoặc sạc qua đêm an toàn.",
    vehicles: "Tất cả các dòng xe điện và xe lai sạc điện (PHEV) lưu hành tại Việt Nam",
  },
  "GB/T": {
    type: "Sạc nhanh DC / AC",
    power: "30kW – 60kW",
    desc: "Chuẩn sạc tiêu chuẩn quốc gia cho các dòng xe điện nhập khẩu từ thị trường Trung Quốc.",
    vehicles: "BYD Atto 3, Dolphin, Seal, Wuling Mini EV, MG4 EV",
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

  const isFull = station.available === 0;
  const others = STATIONS.filter((s) => s.slug !== station.slug).slice(0, 3);

  // Real GPS & Maps navigation
  const lat = station.latitude ?? 10.7769;
  const lng = station.longitude ?? 106.7009;
  const delta = 0.006;
  const bbox = `${lng - delta}%2C${lat - delta}%2C${lng + delta}%2C${lat + delta}`;
  const mapEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;
  const googleMapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  // Real gallery images (fallback to high-res charging & app scenes)
  const defaultImages = [
    station.primaryImageUrl || "/screens/charging.jpg",
    "/screens/slot-picker.jpg",
    "/screens/home.jpg",
    "/screens/success.jpg",
  ];
  const gallery = station.images && station.images.length > 0 ? station.images : defaultImages;
  const mainImage = gallery[0] || "/screens/charging.jpg";
  const subImages = gallery.slice(1, 4);

  const fillPercent =
    station.total > 0
      ? Math.round(((station.total - station.available) / station.total) * 100)
      : 100;

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-[#FDFDFC]">
        {/* Top Breadcrumb Bar */}
        <section className="border-b border-line bg-surface-alt/70">
          <div className="container-x py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs text-ink-muted">
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 flex-wrap">
              <Link href="/" className="hover:text-primary transition-colors">
                Trang chủ
              </Link>
              <span aria-hidden className="text-ink-muted/50">›</span>
              <Link href="/tram-sac" className="hover:text-primary transition-colors">
                Trạm sạc
              </Link>
              <span aria-hidden className="text-ink-muted/50">›</span>
              <span className="font-medium text-ink-body">{station.city}</span>
              <span aria-hidden className="text-ink-muted/50">›</span>
              <span className="font-semibold text-primary-dark">{station.name}</span>
            </nav>

            <Link
              href="/tram-sac"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-dark transition-colors"
            >
              <span>← Quay lại danh sách trạm</span>
            </Link>
          </div>
        </section>

        <div className="container-x py-8 sm:py-10">
          {/* Station Hero Header */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 pb-6 border-b border-line">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2 mb-2.5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary-dark">
                  <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  Mạng lưới trạm sạc ChargeOps
                </span>
                {station.fast ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-700">
                    <BoltIcon className="h-3.5 w-3.5" /> Sạc nhanh DC {station.maxPowerKw ? `${station.maxPowerKw}kW` : ""}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 px-2.5 py-1 text-xs font-bold text-sky-700">
                    Sạc chuẩn AC
                  </span>
                )}
                <span className="rounded-full bg-surface-alt px-2.5 py-1 text-xs font-medium text-ink-muted border border-line">
                  {station.hours}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-ink-strong">
                {station.name}
              </h1>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-ink-body">
                <p className="inline-flex items-center gap-1.5 font-medium">
                  <MapPinIcon className="h-4 w-4 shrink-0 text-primary" />
                  <span>{station.address}</span>
                </p>
                <span className="text-ink-muted hidden sm:inline">·</span>
                <a
                  href={googleMapsDirectionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-primary-dark underline underline-offset-4 cursor-pointer"
                >
                  Mở chỉ đường Google Maps ↗
                </a>
              </div>
            </div>

            {/* Quick Rating & Live Badge */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-2 rounded-2xl border border-line bg-white px-4 py-3 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                  <StarIcon className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-base font-extrabold text-ink-strong">{station.rating.toFixed(1)}</span>
                    <span className="text-xs text-ink-muted">/5.0</span>
                  </div>
                  <p className="text-[11px] text-ink-muted font-medium">{station.reviewCount} đánh giá tài xế</p>
                </div>
              </div>

              <div
                className={`rounded-2xl border px-4 py-3 shadow-sm ${
                  isFull
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-primary/20 bg-primary-soft text-primary-dark"
                }`}
              >
                <p className="text-[11px] font-semibold uppercase tracking-wider">Trạng thái cổng</p>
                <p className="text-base font-extrabold">
                  {isFull ? "Hết chỗ tạm thời" : `${station.available}/${station.total} cổng sẵn sàng`}
                </p>
              </div>
            </div>
          </div>

          {/* Real Photo Gallery (No Placeholders) */}
          <section aria-label="Thư viện hình ảnh trạm sạc" className="mt-8">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Main Featured Photo (Span 8) */}
              <div className="md:col-span-8 relative aspect-[16/10] sm:aspect-[16/9] overflow-hidden rounded-2xl border border-line bg-surface-alt shadow-card group">
                <Image
                  src={mainImage}
                  alt={`${station.name} - Trụ sạc thực tế`}
                  fill
                  priority
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 66vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                
                <div className="absolute left-4 bottom-4 right-4 flex items-end justify-between gap-3 text-white">
                  <div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-md px-3 py-1 text-xs font-semibold ring-1 ring-white/30">
                      📸 Trụ sạc thực tế tại trạm
                    </span>
                    <h2 className="mt-1.5 text-lg sm:text-xl font-bold drop-shadow">
                      {station.name}
                    </h2>
                    <p className="text-xs text-white/80 line-clamp-1 drop-shadow">
                      {station.address}
                    </p>
                  </div>
                  <span className="hidden sm:inline-flex shrink-0 rounded-xl bg-primary px-3 py-1.5 text-xs font-extrabold text-white shadow-glow-emerald">
                    {station.fast ? "SẠC NHANH DC" : "SẠC TIÊU CHUẨN"}
                  </span>
                </div>
              </div>

              {/* Secondary Detail Photos (Span 4) */}
              <div className="md:col-span-4 grid grid-cols-2 md:grid-cols-1 gap-4">
                {subImages.map((imgSrc, idx) => {
                  const labels = [
                    "Cổng sạc & Bãi đỗ xe",
                    "Giao diện giữ chỗ trên App",
                    "Không gian & Tiện ích trạm",
                  ];
                  return (
                    <div
                      key={idx}
                      className="relative aspect-[16/10] md:aspect-[16/7.5] overflow-hidden rounded-2xl border border-line bg-surface-alt shadow-card group"
                    >
                      <Image
                        src={imgSrc}
                        alt={`${station.name} - ${labels[idx] || "Ảnh chi tiết"}`}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 50vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <span className="absolute bottom-2.5 left-3 text-[11px] font-semibold text-white/95 drop-shadow">
                        {labels[idx] || "Ảnh chi tiết"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Key Facts & Status Grid */}
          <section className="mt-8">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {/* Fact 1: Available Ports */}
              <div className="rounded-2xl border border-line bg-white p-5 shadow-card">
                <div className="flex items-center justify-between text-xs text-ink-muted">
                  <span>Cổng sạc trống</span>
                  <span
                    className={`h-2 w-2 rounded-full ${
                      isFull ? "bg-red-500" : "bg-primary animate-pulse"
                    }`}
                  />
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl sm:text-3xl font-extrabold text-ink-strong">
                    {station.available}
                  </span>
                  <span className="text-sm font-semibold text-ink-muted">/ {station.total} cổng</span>
                </div>
                {/* Visual Capacity Bar */}
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-alt">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isFull ? "bg-red-500" : "bg-primary"
                    }`}
                    style={{ width: `${Math.max(10, 100 - fillPercent)}%` }}
                  />
                </div>
                <p className="mt-2 text-[11px] text-ink-muted">
                  {isFull ? "Hiện đã kín lịch đặt" : `Khả dụng ${100 - fillPercent}% năng lực trạm`}
                </p>
              </div>

              {/* Fact 2: Max Power */}
              <div className="rounded-2xl border border-line bg-white p-5 shadow-card">
                <div className="flex items-center justify-between text-xs text-ink-muted">
                  <span>Công suất đỉnh</span>
                  <BoltIcon className="h-4 w-4 text-amber-500" />
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl sm:text-3xl font-extrabold text-ink-strong">
                    {station.maxPowerKw || (station.fast ? 120 : 60)}
                  </span>
                  <span className="text-sm font-semibold text-ink-muted">kW</span>
                </div>
                <p className="mt-3 text-xs font-semibold text-primary-dark">
                  {station.fast ? "DC Siêu nhanh" : "AC Tiêu chuẩn"}
                </p>
                <p className="mt-0.5 text-[11px] text-ink-muted">
                  Tương thích mọi hãng xe EV
                </p>
              </div>

              {/* Fact 3: Price */}
              <div className="rounded-2xl border border-line bg-white p-5 shadow-card">
                <div className="flex items-center justify-between text-xs text-ink-muted">
                  <span>Đơn giá niêm yết</span>
                  <span className="text-[10px] font-bold text-primary uppercase">Cố định</span>
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl sm:text-3xl font-extrabold text-primary-dark">
                    {station.pricePerKwh}
                  </span>
                  <span className="text-xs font-semibold text-ink-muted">/kWh</span>
                </div>
                <p className="mt-3 text-xs font-semibold text-ink-body">
                  Không phụ phí ẩn
                </p>
                <p className="mt-0.5 text-[11px] text-ink-muted">
                  Minh bạch trước khi đặt chỗ
                </p>
              </div>

              {/* Fact 4: Hours */}
              <div className="rounded-2xl border border-line bg-white p-5 shadow-card">
                <div className="flex items-center justify-between text-xs text-ink-muted">
                  <span>Khung giờ hoạt động</span>
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                </div>
                <div className="mt-2">
                  <p className="text-xl sm:text-2xl font-extrabold text-ink-strong truncate">
                    {station.hours}
                  </p>
                </div>
                <p className="mt-3 text-xs font-semibold text-ink-body">
                  Hỗ trợ trực tuyến 24/7
                </p>
                <p className="mt-0.5 text-[11px] text-ink-muted">
                  Hotline kỹ thuật luôn sẵn sàng
                </p>
              </div>
            </div>
          </section>

          {/* Main Content Layout: Left Details + Right Map/CTA Sidebar */}
          <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_400px]">
            {/* Left Column: Connectors, Amenities, Description, Policy */}
            <div className="space-y-8">
              {/* Connector Specifications */}
              <div className="rounded-2xl border border-line bg-white p-6 shadow-card">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-ink-strong">
                      Chuẩn sạc tương thích & Đầu nối
                    </h2>
                    <p className="mt-1 text-xs text-ink-muted">
                      Trạm trang bị các đầu cắm tiêu chuẩn quốc tế, phù hợp cho đa số xe điện tại Việt Nam.
                    </p>
                  </div>
                  <span className="hidden sm:inline-flex rounded-pill bg-primary-soft px-3 py-1 text-xs font-semibold text-primary-dark">
                    {station.connectors.length} chuẩn hỗ trợ
                  </span>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
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
                        className="rounded-xl border border-line bg-surface-alt/70 p-4 transition hover:border-primary/40 hover:bg-white"
                      >
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1.5 font-bold text-ink-strong">
                            <BoltIcon className="h-4 w-4 text-primary" /> {c}
                          </span>
                          <span className="rounded-pill bg-white px-2 py-0.5 text-[10px] font-bold text-primary-dark border border-line">
                            {spec.power}
                          </span>
                        </div>
                        <p className="mt-1.5 text-xs font-semibold text-primary-dark">
                          {spec.type}
                        </p>
                        <p className="mt-1 text-xs text-ink-muted leading-relaxed">
                          {spec.desc}
                        </p>
                        <div className="mt-3 border-t border-line/60 pt-2 text-[11px] text-ink-body">
                          <span className="font-semibold text-ink-strong">Tương thích: </span>
                          <span className="text-ink-muted">{spec.vehicles}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Amenities & Surrounding Services */}
              <div className="rounded-2xl border border-line bg-white p-6 shadow-card">
                <h2 className="text-lg font-bold text-ink-strong">
                  Tiện ích xung quanh trạm sạc
                </h2>
                <p className="mt-1 text-xs text-ink-muted">
                  Không gian thuận tiện giúp bạn thư giãn hoặc làm việc trong thời gian sạc pin.
                </p>

                <div className="mt-4 flex flex-wrap gap-2.5">
                  {station.amenities.map((a) => (
                    <span
                      key={a}
                      className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface-alt px-3.5 py-2 text-xs font-semibold text-ink-body transition hover:border-primary/40 hover:bg-primary-soft/50"
                    >
                      <span>{AMENITY_ICONS[a] || "✨"}</span>
                      <span>{a}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Description & Location Guide */}
              <div className="rounded-2xl border border-line bg-white p-6 shadow-card">
                <h2 className="text-lg font-bold text-ink-strong">
                  Giới thiệu & Hướng dẫn tiếp cận
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-ink-body whitespace-pre-line">
                  {station.description}
                </p>

                <div className="mt-5 rounded-xl border border-line/80 bg-surface-alt/50 p-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-ink-strong">
                    📍 Hướng dẫn di chuyển vào vị trí sạc
                  </h3>
                  <ul className="mt-2 space-y-1.5 text-xs text-ink-muted">
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-bold">1.</span>
                      <span>Theo biển chỉ dẫn sạc xe điện (EV Charging) khi tiến vào bãi đỗ.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-bold">2.</span>
                      <span>Đến đúng trụ sạc đã đặt trên ứng dụng ChargeOps (mã trụ hiển thị trên vé đặt).</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-bold">3.</span>
                      <span>Cắm đầu sạc vào cổng sạc xe và quét mã QR dán trên thân trụ để kích hoạt nguồn điện.</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Booking & Cancellation Policy Standard (Booking v4.9) */}
              <div className="rounded-2xl border border-line bg-white p-6 shadow-card">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-ink-strong">
                    Chính sách đặt chỗ & Check-in minh bạch
                  </h2>
                  <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                    Quy chuẩn v4.9
                  </span>
                </div>
                <p className="mt-1 text-xs text-ink-muted">
                  ChargeOps bảo vệ tối đa quyền lợi của tài xế và đảm bảo trụ sạc luôn sẵn sàng khi bạn đến.
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-line bg-surface-alt p-3.5">
                    <span className="text-lg">⏱️</span>
                    <h3 className="mt-2 text-xs font-bold text-ink-strong">
                      15 phút giữ chỗ miễn phí
                    </h3>
                    <p className="mt-1 text-[11px] text-ink-muted leading-relaxed">
                      Trụ sạc được khóa riêng cho xe bạn, tính từ thời điểm khung giờ sạc bắt đầu.
                    </p>
                  </div>

                  <div className="rounded-xl border border-line bg-surface-alt p-3.5">
                    <span className="text-lg">📲</span>
                    <h3 className="mt-2 text-xs font-bold text-ink-strong">
                      Check-in QR không chạm
                    </h3>
                    <p className="mt-1 text-[11px] text-ink-muted leading-relaxed">
                      Quét mã QR tại trụ để mở nguồn điện. Không cần thủ tục giấy tờ hay tiền mặt.
                    </p>
                  </div>

                  <div className="rounded-xl border border-line bg-surface-alt p-3.5">
                    <span className="text-lg">🛡️</span>
                    <h3 className="mt-2 text-xs font-bold text-ink-strong">
                      Hoàn tiền 100% linh hoạt
                    </h3>
                    <p className="mt-1 text-[11px] text-ink-muted leading-relaxed">
                      Hủy trước khung giờ hoặc trong thời gian ân hạn được hoàn tiền đầy đủ vào ví.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column (Sidebar): Live Interactive Map & App Booking CTA */}
            <aside className="space-y-6">
              {/* Real OpenStreetMap Live Navigation Card */}
              <div className="sticky top-24 space-y-6">
                <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
                  {/* Map Card Header */}
                  <div className="flex items-center justify-between border-b border-line bg-surface-alt px-4 py-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="h-2 w-2 rounded-full bg-primary animate-pulse shrink-0" />
                      <span className="truncate text-xs font-bold text-ink-strong">
                        Vị trí thực tế trên bản đồ
                      </span>
                    </div>
                    <span className="shrink-0 rounded-pill bg-white px-2 py-0.5 text-[10px] font-semibold text-primary-dark ring-1 ring-line">
                      GPS: {lat.toFixed(4)}, {lng.toFixed(4)}
                    </span>
                  </div>

                  {/* Interactive OpenStreetMap Embed */}
                  <div className="relative h-[250px] w-full bg-[#E5E3DF] overflow-hidden">
                    <iframe
                      src={mapEmbedUrl}
                      title={`Bản đồ trạm sạc ${station.name}`}
                      className="h-full w-full border-0 select-none"
                      loading="lazy"
                    />
                  </div>

                  {/* Google Maps Directions Action */}
                  <div className="p-4 bg-white space-y-3">
                    <div>
                      <p className="text-xs font-bold text-ink-strong">{station.name}</p>
                      <p className="mt-0.5 text-xs text-ink-muted flex items-start gap-1">
                        <MapPinIcon className="h-3.5 w-3.5 shrink-0 text-primary mt-0.5" />
                        <span>{station.address}</span>
                      </p>
                    </div>

                    <a
                      href={googleMapsDirectionsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-bold text-white shadow-glow-emerald transition hover:bg-primary-dark hover:scale-[1.01] cursor-pointer"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                        <circle cx="12" cy="9" r="2.5" />
                      </svg>
                      <span>Chỉ đường qua Google Maps</span>
                    </a>
                  </div>
                </div>

                {/* App Booking CTA Card */}
                <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary-soft/90 via-primary-soft/40 to-white p-6 shadow-card">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white">
                    Ứng dụng tài xế
                  </span>
                  <h3 className="mt-3 text-base sm:text-lg font-bold text-ink-strong">
                    Đặt trước khung giờ sạc cho xe bạn
                  </h3>
                  <p className="mt-2 text-xs text-ink-body leading-relaxed">
                    Đừng để hết chỗ khi đến nơi. Khóa cổng sạc độc quyền trên ứng dụng ChargeOps trước 15–30 phút.
                  </p>

                  <div className="mt-4 pt-3 border-t border-primary/15">
                    <StoreBadges />
                  </div>

                  <div className="mt-4 flex items-center justify-between text-[11px] text-ink-muted border-t border-line/60 pt-3">
                    <span>⚡ Không cần đặt cọc trước</span>
                    <span>✓ Miễn phí hủy trong 15p</span>
                  </div>
                </div>
              </div>
            </aside>
          </div>

          {/* Related / Other Stations in Same City */}
          <section className="mt-16 border-t border-line pt-10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-ink-strong">
                  Các trạm sạc khác tại {station.city}
                </h2>
                <p className="mt-1 text-xs text-ink-muted">
                  Khám phá thêm các trạm sạc xe điện chất lượng cao trong cùng khu vực
                </p>
              </div>
              <Link
                href="/tram-sac"
                className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-primary-dark"
              >
                <span>Xem tất cả trạm</span>
                <ChevronRightIcon className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {others.map((s) => (
                <Link
                  key={s.id}
                  href={`/tram-sac/${s.slug}`}
                  className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-line bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-glass"
                >
                  <div className="relative aspect-[16/9] w-full overflow-hidden bg-surface-alt">
                    <Image
                      src={s.primaryImageUrl || "/screens/charging.jpg"}
                      alt={s.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                    <div className="absolute left-3 top-3 flex gap-1.5">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          s.fast
                            ? "bg-primary text-white shadow-sm"
                            : "bg-surface-alt text-ink-strong ring-1 ring-line"
                        }`}
                      >
                        {s.fast ? "SẠC NHANH DC" : "AC TIÊU CHUẨN"}
                      </span>
                    </div>
                    <span className="absolute bottom-2.5 right-3 rounded-pill bg-black/60 backdrop-blur-md px-2 py-0.5 text-[10px] font-semibold text-white">
                      ★ {s.rating.toFixed(1)}
                    </span>
                  </div>

                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-ink-strong group-hover:text-primary-dark transition-colors line-clamp-1">
                        {s.name}
                      </h3>
                      <p className="mt-1 text-xs text-ink-muted line-clamp-1">
                        {s.district}, {s.city}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-line/60 pt-3">
                      <div>
                        <span className="text-[10px] text-ink-muted uppercase tracking-wider block">Đơn giá</span>
                        <span className="text-sm font-extrabold text-primary-dark">{s.pricePerKwh}/kWh</span>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                          s.available === 0
                            ? "bg-red-50 text-red-600"
                            : "bg-primary-soft text-primary-dark"
                        }`}
                      >
                        {s.available === 0 ? "Hết chỗ" : `Còn ${s.available}/${s.total} cổng`}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>

      <SiteFooter />

      <JsonLd
        name={station.name}
        address={station.address}
        rating={station.rating}
        reviewCount={station.reviewCount}
        priceRange={`${station.pricePerKwh}/kWh`}
      />
    </>
  );
}

function JsonLd({
  name,
  address,
  rating,
  reviewCount,
  priceRange,
}: {
  name: string;
  address: string;
  rating: number;
  reviewCount: number;
  priceRange: string;
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name,
    address: { "@type": "PostalAddress", streetAddress: address, addressCountry: "VN" },
    priceRange,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: rating,
      reviewCount,
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
