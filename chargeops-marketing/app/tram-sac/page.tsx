import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { StationDirectory } from "@/components/StationDirectory";
import { StoreBadges } from "@/components/StoreBadges";
import { STATIONS } from "@/components/stations";

export const metadata: Metadata = {
  title: "Trạm sạc xe điện ChargeOps · Tìm trạm gần bạn",
  description:
    "Danh sách trạm sạc xe điện ChargeOps tại TP. Hồ Chí Minh, Hà Nội và Đà Nẵng. Xem độ trống, giá đ/kWh và chuẩn sạc, rồi đặt chỗ trong ứng dụng.",
  alternates: { canonical: "/tram-sac" },
  openGraph: {
    title: "Trạm sạc xe điện ChargeOps · Tìm trạm gần bạn",
    description:
      "Tìm trạm sạc xe điện gần bạn: độ trống, giá và chuẩn sạc. Đặt chỗ trong ứng dụng ChargeOps.",
    url: "/tram-sac",
  },
};

export default function StationsPage() {
  return (
    <>
      <SiteHeader />
      <main>
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
              Tìm trạm sạc gần bạn tại TP. Hồ Chí Minh, Hà Nội và Đà Nẵng. Xem độ
              trống, giá và chuẩn sạc, rồi giữ khung giờ trong ứng dụng.
            </p>
          </div>
        </section>

        <StationDirectory />

        <section className="border-t border-line bg-surface-alt py-16">
          <div className="container-x flex flex-col items-center gap-5 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-ink-strong sm:text-3xl">
              Đặt chỗ tại trạm bạn chọn
            </h2>
            <p className="max-w-xl text-ink-body">
              Việc giữ khung giờ, check-in QR và thanh toán được thực hiện trong
              ứng dụng ChargeOps trên điện thoại.
            </p>
            <StoreBadges className="justify-center" />
          </div>
        </section>
      </main>
      <SiteFooter />
      <JsonLd />
    </>
  );
}

function JsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Trạm sạc xe điện ChargeOps",
    itemListElement: STATIONS.map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `https://chargeops.vn/tram-sac/${s.slug}`,
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
