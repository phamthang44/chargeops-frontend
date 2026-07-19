import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ChargeOps · Trạm sạc xe điện",
    short_name: "ChargeOps",
    description:
      "Tìm trạm sạc, đặt chỗ trước, check-in bằng QR và thanh toán, ứng dụng sạc xe điện tại Việt Nam.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#10B981",
    lang: "vi",
    icons: [
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any", purpose: "any" },
      { src: "/apple-icon", type: "image/png", sizes: "180x180" },
    ],
  };
}
