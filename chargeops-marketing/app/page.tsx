import { HomePage } from "@/components/home/HomePage";

export default function Home() {
  return (
    <>
      <HomePage />
      <JsonLd />
    </>
  );
}

function JsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "ChargeOps",
    applicationCategory: "TravelApplication",
    operatingSystem: "Web",
    description:
      "Ứng dụng đặt chỗ trạm sạc xe điện tại Việt Nam: tìm trạm, giữ khung giờ 15–30 phút và check-in bằng mã QR.",
    offers: { "@type": "Offer", price: "0", priceCurrency: "VND" },
    inLanguage: "vi-VN",
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
