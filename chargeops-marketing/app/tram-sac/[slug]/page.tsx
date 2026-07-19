import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { StoreBadges } from "@/components/StoreBadges";
import { STATIONS, getStationBySlug } from "@/components/stations";
import {
  MapPinIcon,
  BoltIcon,
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
  const station = getStationBySlug(slug);
  if (!station) return { title: "Không tìm thấy trạm sạc" };

  const title = `${station.name} · Trạm sạc xe điện ${station.district}`;
  const description = `${station.name} tại ${station.address}. ${
    station.fast ? "Sạc nhanh DC" : "Sạc thường AC"
  }, giá ${station.pricePerKwh}/kWh, chuẩn ${station.connectors.join(", ")}. Đặt chỗ trong ứng dụng ChargeOps.`;

  return {
    title,
    description,
    alternates: { canonical: `/tram-sac/${station.slug}` },
    openGraph: { title, description, url: `/tram-sac/${station.slug}` },
  };
}

export default async function StationDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const station = getStationBySlug(slug);
  if (!station) notFound();

  const full = station.available === 0;
  const others = STATIONS.filter((s) => s.slug !== station.slug).slice(0, 3);

  return (
    <>
      <SiteHeader />
      <main>
        <div className="container-x py-10">
          {/* breadcrumb */}
          <nav aria-label="Breadcrumb" className="text-sm text-ink-muted">
            <Link href="/" className="hover:text-primary-dark">
              Trang chủ
            </Link>{" "}
            <span aria-hidden>›</span>{" "}
            <Link href="/tram-sac" className="hover:text-primary-dark">
              Trạm sạc
            </Link>{" "}
            <span aria-hidden>›</span> <span>{station.city}</span>{" "}
            <span aria-hidden>›</span>{" "}
            <span className="text-ink-body">{station.name}</span>
          </nav>

          {/* header */}
          <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-ink-strong sm:text-4xl">
                {station.name}
              </h1>
              <p className="mt-2 inline-flex items-center gap-1.5 text-ink-body">
                <MapPinIcon className="h-4 w-4 shrink-0 text-primary" /> {station.address}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="pill bg-warning/10 text-warning">
                ★ {station.rating.toFixed(1)} · {station.reviewCount} đánh giá
              </span>
              <span
                className={`pill ${
                  full ? "bg-danger/10 text-danger" : "bg-primary-soft text-primary-dark"
                }`}
              >
                {full ? "Hết chỗ" : `${station.available}/${station.total} trống`}
              </span>
            </div>
          </div>

          {/* photo strip (placeholders) */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { icon: BuildingIcon, label: "Trạm sạc" },
              { icon: PlugIcon, label: "Đầu sạc" },
              { icon: CarIcon, label: "Bãi đỗ" },
              { icon: CoffeeIcon, label: "Tiện ích" },
            ].map(({ icon: Icon, label }, i) => (
              <div
                key={i}
                className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-card border border-line bg-surface-alt"
                aria-hidden
              >
                <Icon className="h-8 w-8 text-ink-muted" />
                <span className="text-xs text-ink-muted">{label}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
            {/* left: facts + amenities + description */}
            <div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Fact label="Còn trống" value={full ? "0" : `${station.available}/${station.total}`} />
                <Fact label="Giá" value={`${station.pricePerKwh}`} sub="/kWh" />
                <Fact label="Loại sạc" value={station.fast ? "Nhanh DC" : "Thường AC"} />
                <Fact label="Giờ mở" value={station.hours} small />
              </div>

              <h2 className="mt-8 text-lg font-semibold text-ink-strong">Chuẩn sạc</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {station.connectors.map((c) => (
                  <span
                    key={c}
                    className="inline-flex items-center gap-1.5 rounded-pill border border-line bg-white px-3.5 py-1.5 text-sm font-semibold text-ink-body"
                  >
                    <BoltIcon className="h-3.5 w-3.5" /> {c}
                  </span>
                ))}
              </div>

              <h2 className="mt-8 text-lg font-semibold text-ink-strong">Tiện ích</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {station.amenities.map((a) => (
                  <span key={a} className="pill bg-surface-alt text-ink-body">
                    {a}
                  </span>
                ))}
              </div>

              <h2 className="mt-8 text-lg font-semibold text-ink-strong">Giới thiệu</h2>
              <p className="mt-3 leading-relaxed text-ink-body">{station.description}</p>
            </div>

            {/* right: CTA + map */}
            <aside className="space-y-5">
              <div className="rounded-card bg-primary-soft p-6">
                <h2 className="text-lg font-semibold text-primary-dark">
                  Đặt chỗ khung giờ trong ứng dụng
                </h2>
                <p className="mt-2 text-sm text-primary-dark/90">
                  Giữ chỗ, check-in bằng QR và thanh toán ngay trên điện thoại.
                </p>
                <div className="mt-4">
                  <StoreBadges />
                </div>
              </div>

              <div className="relative h-56 overflow-hidden rounded-card border border-line bg-surface-alt bg-grid">
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-primary">
                  <MapPinIcon className="h-9 w-9" />
                </span>
                <span className="absolute bottom-3 right-3 rounded-pill border border-line bg-white px-3 py-1 text-xs text-ink-muted">
                  Bản đồ minh hoạ
                </span>
              </div>
            </aside>
          </div>

          {/* other stations */}
          <section className="mt-14 border-t border-line pt-10">
            <h2 className="text-xl font-bold tracking-tight text-ink-strong">
              Trạm sạc khác
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              {others.map((s) => (
                <Link
                  key={s.id}
                  href={`/tram-sac/${s.slug}`}
                  className="group rounded-card border border-line bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-glass"
                >
                  <h3 className="font-semibold text-ink-strong group-hover:text-primary-dark">
                    {s.name}
                  </h3>
                  <p className="mt-1 text-sm text-ink-muted">
                    {s.district}, {s.city}
                  </p>
                  <p className="mt-3 text-sm font-semibold text-primary-dark">
                    {s.pricePerKwh}/kWh
                  </p>
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

function Fact({
  label,
  value,
  sub,
  small,
}: {
  label: string;
  value: string;
  sub?: string;
  small?: boolean;
}) {
  return (
    <div className="rounded-card bg-surface-alt p-4">
      <p className="text-xs text-ink-muted">{label}</p>
      <p className={`mt-1 font-bold text-ink-strong ${small ? "text-base" : "text-xl"}`}>
        {value}
        {sub && <span className="text-xs font-medium text-ink-muted">{sub}</span>}
      </p>
    </div>
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
