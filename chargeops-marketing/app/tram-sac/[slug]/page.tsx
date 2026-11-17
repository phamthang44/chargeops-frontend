import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { STATIONS, getStationBySlug, type CoverageStation } from "@/components/stations";
import { fetchPublicStationBySlug, fetchPublicStations } from "@/lib/stations-api";
import { SubpageShell } from "@/components/home/SubpageShell";
import { StationDetail, type OtherStation } from "@/components/home/StationDetail";
import { illustrativePhotos, isSampleStation } from "@/lib/home/stationPhotos";

type Params = { slug: string };

const isSample = isSampleStation;

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
  const ogImage = (!isSample(station) && (station.primaryImageUrl || station.images?.[0])) || illustrativePhotos(station)[0];

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
      images: [{ url: ogImage }],
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

  // Other stations: prefer the live API, fall back to the sample list.
  let others: CoverageStation[] = STATIONS.filter((s) => s.slug !== station.slug).slice(0, 3);
  try {
    const listRes = await fetchPublicStations({ size: 10 });
    const apiOthers = listRes.stations.filter((s) => s.slug !== station.slug).slice(0, 3);
    if (apiOthers.length > 0) others = apiOthers;
  } catch {
    // keep the sample list
  }

  const lat = station.latitude ?? 10.7769;
  const lng = station.longitude ?? 106.7009;
  const delta = 0.006;
  const bbox = `${lng - delta}%2C${lat - delta}%2C${lng + delta}%2C${lat + delta}`;
  const mapEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;
  const googleMapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  // Real photos only come from the live API; the sample stations use the
  // home page's illustrative photos (labelled as such on the page).
  const livePhotos = isSample(station) ? [] : (station.images?.filter(Boolean) ?? []);
  const illustrative = livePhotos.length === 0;
  const photos = illustrative ? illustrativePhotos(station) : livePhotos;

  const price = (s: CoverageStation) =>
    s.priceNumber
      ? `${Number(s.priceNumber).toLocaleString("vi-VN")}đ`
      : s.pricePerKwh.replace(/\(tham khảo\)/gi, "").replace(/\/gói tham khảo/gi, "").trim();

  const otherCards: OtherStation[] = others.map((s) => ({
    station: s,
    cover: (!isSample(s) && (s.primaryImageUrl || s.images?.[0])) || illustrativePhotos(s)[0],
    price: price(s),
  }));

  return (
    <SubpageShell>
      <StationDetail
        station={station}
        others={otherCards}
        photos={photos}
        illustrative={illustrative}
        mapEmbedUrl={mapEmbedUrl}
        googleMapsDirectionsUrl={googleMapsDirectionsUrl}
        displayPrice={price(station)}
        isFull={isFull}
      />
      <JsonLd name={station.name} address={station.address} />
    </SubpageShell>
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
