import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { StationDirectory } from "@/components/StationDirectory";
import { StoreBadges } from "@/components/StoreBadges";
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
      <main className="pt-20 sm:pt-24">
        <section className="bg-soft-radial">
          <div className="container-x py-14 sm:py-16">
            <nav aria-label="Breadcrumb" className="text-sm text-ink-muted">
              <a href="/" className="hover:text-primary-dark">
                Trang chủ
              </a>{" "}
              <span aria-hidden>›</span> <span className="text-ink-body">Trạm sạc</span>
            </nav>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-ink-strong sm:text-5xl">
              Trạm sạc xe điện <span className="text-gradient">ChargeOps</span>
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-ink-body">
              Xem danh sách trạm, thông tin địa điểm và cổng sạc hiện có. Hãy kiểm tra trạng thái mới nhất trong ứng dụng trước khi tới.
            </p>
          </div>
        </section>

        <StationDirectory initialStations={data.stations} initialIsLive={data.isLive} />

        <section className="border-t border-line bg-surface-alt py-16">
          <div className="container-x flex flex-col items-center gap-5 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-ink-strong sm:text-3xl">
              Đặt chỗ tại trạm bạn chọn
            </h2>
            <p className="max-w-xl text-ink-body">
              Giữ khung giờ và check-in QR được thực hiện trong ứng dụng ChargeOps. Bạn có thể mở ngay bản Driver Web để trải nghiệm trực tiếp.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="https://driver.chargeops.online/?demo=true"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-island-primary text-xs py-2.5 px-5"
              >
                <span>Dùng thử Driver Web ngay</span>
                <span className="btn-icon-bubble">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="h-3.5 w-3.5">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                </span>
              </a>
              <StoreBadges className="justify-center" />
            </div>
          </div>
        </section>
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
