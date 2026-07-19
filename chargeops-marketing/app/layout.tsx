import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-sans",
  display: "swap",
});

const SITE_URL = "https://chargeops.vn";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "ChargeOps · Đặt chỗ trạm sạc xe điện tại Việt Nam",
    template: "%s · ChargeOps",
  },
  description:
    "ChargeOps giúp tài xế xe điện tìm trạm sạc, đặt chỗ trước khi đến, nhận QR check-in và thanh toán dễ dàng. Dành cho chủ trạm: quản lý trụ sạc và tăng doanh thu.",
  keywords: [
    "trạm sạc xe điện",
    "đặt chỗ sạc xe điện",
    "sạc ô tô điện",
    "trạm sạc gần đây",
    "sạc xe điện VinFast",
    "ChargeOps",
  ],
  authors: [{ name: "ChargeOps" }],
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: SITE_URL,
    siteName: "ChargeOps",
    title: "ChargeOps · Đặt chỗ trạm sạc xe điện tại Việt Nam",
    description:
      "Tìm trạm sạc, đặt chỗ trước, check-in bằng QR và thanh toán trong vài chạm.",
  },
  twitter: {
    card: "summary_large_image",
    title: "ChargeOps · Đặt chỗ trạm sạc xe điện",
    description: "Tìm trạm sạc, đặt chỗ trước, check-in bằng QR và thanh toán dễ dàng.",
  },
  icons: { icon: "/icon.svg", apple: "/apple-icon" },
  appleWebApp: { capable: true, title: "ChargeOps", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#10B981",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" className={inter.variable}>
      <head>
        <noscript>
          <style>{`.reveal{opacity:1 !important;transform:none !important;}`}</style>
        </noscript>
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
