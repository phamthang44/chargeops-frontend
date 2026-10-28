import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { StationsView } from "@/components/StationsView";
import type { CoverageStation } from "@/components/stations";
import { fetchPublicStations } from "@/lib/stations-api";

export const metadata: Metadata = {
  title: "Trạm sạc xe điện ChargeOps · Tìm trạm gần bạn",
  description:
    "Tìm kiếm trạm sạc ChargeOps, xem thông tin địa điểm, cổng sạc và khung giờ. Dữ liệu hiển thị tùy theo thông tin được trạm cung cấp.",
  alternates: { canonical: "/tram-sac" },
  openGraph: {
    title: "Trạm sạc xe điện ChargeOps · Tìm trạm gần bạn",
    description:
      "Tìm trạm sạc ChargeOps và xem thông tin địa điểm, cổng sạc cùng khung giờ do trạm cung cấp.",
    url: "/tram-sac",
  },
};

export default async function StationsPage() {
  const data = await fetchPublicStations();

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-[#070A08] text-white pt-24 sm:pt-28">
        <StationsView stations={data.stations} isLive={data.isLive} />
      </main>
      <SiteFooter />
      <JsonLd stations={data.isLive ? data.stations : []} />
    </>
  );
}

function JsonLd({ stations }: { stations: CoverageStation[] }) {
  if (stations.length === 0) return null;
  const data = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Trạm sạc xe điện ChargeOps",
    itemListElement: stations.map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `https://chargeops.online/tram-sac/${s.slug}`,
      name: s.name,
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
