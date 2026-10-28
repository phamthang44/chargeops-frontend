import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { I18nProvider } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

const SITE_URL = "https://chargeops.online";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "ChargeOps · Đặt chỗ trạm sạc xe điện tại Việt Nam",
    template: "%s · ChargeOps",
  },
  description:
    "ChargeOps giúp tài xế xe điện tìm trạm, đặt khung giờ và check-in QR. Chủ trạm có thể quản lý thông tin trạm và đặt chỗ trên Web Console.",
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
      "Tìm trạm sạc, đặt khung giờ và check-in bằng QR với ChargeOps.",
  },
  twitter: {
    card: "summary_large_image",
    title: "ChargeOps · Đặt chỗ trạm sạc xe điện",
    description: "Tìm trạm sạc, đặt khung giờ và check-in bằng QR với ChargeOps.",
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
    <html lang="vi" className={plusJakartaSans.variable}>
      <head>
        <noscript>
          <style>{`.reveal{opacity:1 !important;transform:none !important;}`}</style>
        </noscript>
      </head>
      <body className="font-sans antialiased">
        <I18nProvider>
          {children}
          <LanguageSwitcher variant="floating" />
        </I18nProvider>
      </body>
    </html>
  );
}

