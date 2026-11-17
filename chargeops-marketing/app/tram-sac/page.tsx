import type { Metadata } from "next";
import { SubpageShell } from "@/components/home/SubpageShell";
import { StationsList } from "@/components/home/StationsList";
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
    <SubpageShell>
      <StationsList initialStations={data.stations} initialIsLive={data.isLive} />
      <JsonLd stations={data.isLive ? data.stations : []} />
    </SubpageShell>
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
