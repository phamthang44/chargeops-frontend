import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { STATIONS, getStationBySlug } from "@/components/stations";
import { fetchPublicStationBySlug, fetchPublicStations } from "@/lib/stations-api";
import { StationDetailView } from "@/components/StationDetailView";

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

  // Clean price display
  const displayPrice = station.priceNumber
    ? `${Number(station.priceNumber).toLocaleString("vi-VN")}đ`
    : station.pricePerKwh.replace(/\(tham khảo\)/gi, "").replace(/\/gói tham khảo/gi, "").trim();

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-[#070A08] text-white pt-24 sm:pt-28 lg:pt-32 pb-24">
        <StationDetailView
          station={station}
          others={others}
          gallery={gallery}
          mapEmbedUrl={mapEmbedUrl}
          googleMapsDirectionsUrl={googleMapsDirectionsUrl}
          lat={lat}
          lng={lng}
          displayPrice={displayPrice}
          fillPercent={fillPercent}
          isFull={isFull}
        />
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
