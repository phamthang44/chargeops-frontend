import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { CoverageSection } from "@/components/CoverageSection";
import { StoreBadges } from "@/components/StoreBadges";
import { WaitlistForm } from "@/components/WaitlistForm";
import { PhoneFrame } from "@/components/PhoneFrame";
import { QrDownload } from "@/components/QrDownload";
import { Reveal } from "@/components/Reveal";
import { BackToTop } from "@/components/BackToTop";
import { OwnerPricing } from "@/components/OwnerPricing";
import { BrowserFrame } from "@/components/BrowserFrame";
import { OwnerConsolePreview } from "@/components/OwnerConsolePreview";
import { EcosystemStrip } from "@/components/EcosystemStrip";
import { ProblemComparison } from "@/components/ProblemComparison";
import { JourneyTimeline } from "@/components/JourneyTimeline";
import { InteractiveSlotScheduler } from "@/components/InteractiveSlotScheduler";
import { LiveChargingTelemetry } from "@/components/LiveChargingTelemetry";
import {
  MapPinIcon,
  CalendarIcon,
  QrIcon,
  BatteryIcon,
  RefundIcon,
  BoltIcon,
  CheckIcon,
} from "@/components/Icons";

export default function Home() {
  return (
    <>
      <a href="#top" className="skip-link">
        Bỏ qua tới nội dung
      </a>
      <SiteHeader />
      <main id="top" tabIndex={-1} className="pt-20 sm:pt-24">
        <Hero />
        <EcosystemStrip />
        <ProblemComparison />
        <JourneySection />
        <CoverageSection />
        <FeaturesBento />
        <Stats />
        <OwnerBand />
        <OwnerPricing />
        <DownloadCta />
      </main>
      <SiteFooter />
      <BackToTop />
      <JsonLd />
    </>
  );
}

/* ----------------------------- Hero ----------------------------- */
function Hero() {
  return (
    <section className="relative overflow-hidden pt-5 pb-12 sm:pt-10 sm:pb-20 lg:pt-12 lg:pb-28">
      {/* Soft, on-brand backdrop that keeps the product preview in focus. */}
      <div className="pointer-events-none absolute inset-0 bg-soft-radial" />
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-20" />

      <div className="container-x relative grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
        <Reveal>
          <div className="inline-flex">
            <span className="eyebrow-tag">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              TÌM TRẠM VÀ ĐẶT KHUNG GIỜ SẠC
            </span>
          </div>

          <h1 className="mt-5 max-w-[15ch] text-[clamp(2.125rem,9vw,3rem)] font-extrabold leading-[1.08] tracking-[-0.045em] text-balance text-ink-heading sm:mt-6 sm:text-5xl lg:text-[3.5rem]">
            Tìm trạm sạc và chọn khung giờ phù hợp
          </h1>

          <p className="mt-5 max-w-xl text-base sm:text-lg leading-relaxed text-ink-body">
            Chủ động hành trình xe điện: Tìm trạm sạc gần nhất, xem giá gói minh bạch và đặt trước khung giờ để không phải chờ đợi. Khi tới nơi, chỉ cần quét mã QR để bắt đầu nạp năng lượng.
          </p>

          {/* Island CTA Buttons (Button-in-Button Architecture) */}
          <div className="mt-7 flex flex-col items-stretch gap-3 sm:mt-8 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
            <a
              href="https://driver.chargeops.online/?demo=true"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-island-primary w-full justify-between sm:w-auto"
            >
              <span>Trải nghiệm Driver Web</span>
              <span className="btn-icon-bubble">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="h-4 w-4">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </span>
            </a>

            <Link href="/tram-sac" className="btn-island-secondary w-full justify-between sm:w-auto">
              <span>Khám phá trạm sạc</span>
              <span className="btn-icon-bubble">
                <MapPinIcon className="h-4 w-4" />
              </span>
            </Link>
          </div>

          {/* Micro Trust Strip */}
          <div className="mt-9 flex flex-wrap items-center gap-3 pt-3 border-t border-black/[0.04] text-xs sm:text-[13px] text-ink-muted">
            <span className="font-semibold text-ink-heading">Dành cho tài xế và đơn vị vận hành trạm sạc</span>
            <span className="text-ink-muted/50">·</span>
            <span>Tìm trạm, đặt chỗ và quản lý thông tin vận hành</span>
          </div>
        </Reveal>

        {/* Machined Titanium Phone Mockup with Dual-Bezel Floating Telemetry */}
        <Reveal delay={120} className="relative flex justify-center lg:justify-end">
          <div className="relative">
            <PhoneFrame
              src="/screens/app-home-new.png"
              alt="Màn hình tìm và đặt chỗ trạm sạc ChargeOps"
              priority
              float
            />

            {/* Float Card 1: Slot Reserved Confirmation */}
            <div className="absolute -left-6 sm:-left-12 top-10 z-20 hidden sm:flex items-center gap-3.5 rounded-2xl border border-black/5 bg-white/95 p-3.5 shadow-diffusion backdrop-blur-xl animate-float">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary-dark shadow-sm">
                <CalendarIcon className="h-5 w-5" />
              </span>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  <p className="text-[10px] font-bold uppercase tracking-wider text-primary-dark">
                    Đã giữ chỗ riêng cho xe bạn
                  </p>
                </div>
                <p className="text-sm font-extrabold text-ink-heading">14:00 – 15:00 · Trụ DC 120kW</p>
                <p className="text-[11px] text-ink-muted">Vincom Đồng Khởi · Trụ #02</p>
              </div>
            </div>

            {/* Float Card 2: Live Charging Telemetry */}
            <div className="absolute -right-4 sm:-right-8 bottom-14 z-20 hidden sm:flex items-center gap-3.5 rounded-2xl border border-white/10 bg-[#080C0A]/95 p-3.5 shadow-diffusion-dark backdrop-blur-xl text-white animate-float-slow">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white shadow-glow-emerald">
                <BatteryIcon className="h-5 w-5" />
              </span>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                    <p className="text-[10px] font-semibold text-primary-light uppercase tracking-wider">
                    Phiên sạc minh họa
                  </p>
                </div>
                <p className="text-sm font-extrabold text-white font-mono">68% · 128 kW · còn 14 phút</p>
                <p className="text-[11px] text-white/60">Thông số trên màn hình là dữ liệu minh họa</p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ----------------------- Journey Section ------------------------ */
function JourneySection() {
  return (
    <section id="cach-hoat-dong" className="bg-[#FAFBFB] py-16 sm:py-24 lg:py-32 border-y border-black/[0.05]">
      <div className="container-x">
        <Reveal className="mx-auto max-w-2xl text-center mb-14">
          <span className="eyebrow-tag">TRẢI NGHIỆM ĐƠN GIẢN</span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-balance text-ink-heading sm:text-4xl lg:text-5xl">
            Sạc xe chuẩn xác <span className="text-gradient">với 3 bước chủ động</span>
          </h2>
          <p className="mt-3 text-ink-body text-sm sm:text-base leading-relaxed">
            Quy trình được tối ưu hóa cho tài xế xe điện bận rộn: không chờ đợi, không thao tác phức tạp,
            để bạn có thể xem thông tin và lựa chọn khung giờ trước khi tới trạm.
          </p>
        </Reveal>

        <Reveal delay={80}>
          <JourneyTimeline />
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------- Asymmetrical Bento Grid Features ----------- */
function FeaturesBento() {
  return (
    <section id="tinh-nang" className="py-16 sm:py-24 lg:py-32">
      <div className="container-x">
        <Reveal className="max-w-2xl">
          <span className="eyebrow-tag">CÁC TÍNH NĂNG CHÍNH</span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-balance text-ink-heading sm:text-4xl lg:text-5xl">
            Những việc bạn có thể làm với ChargeOps
          </h2>
          <p className="mt-3 text-sm sm:text-base text-ink-body leading-relaxed">
            Các màn hình bên dưới giới thiệu luồng và giao diện của ứng dụng. Một số dữ liệu hiển thị là nội dung minh họa.
          </p>
        </Reveal>

      <div className="mt-10 grid grid-cols-1 gap-5 items-stretch sm:mt-12 sm:gap-6 lg:mt-14 lg:grid-cols-12">
          {/* Bento Tile 1: Interactive Slot Scheduler (Span 8) */}
          <Reveal className="flex lg:col-span-8">
            <div className="double-bezel w-full flex flex-col">
              <div className="double-bezel-inner flex-1 flex flex-col justify-between !p-5 sm:!p-8">
                <InteractiveSlotScheduler />
              </div>
            </div>
          </Reveal>

          {/* Bento Tile 2: Instant Laser QR Check-in (Span 4) */}
          <Reveal delay={80} className="flex lg:col-span-4">
            <div className="double-bezel-dark w-full flex flex-col">
              <div className="double-bezel-dark-inner flex-1 flex flex-col justify-between text-white !p-5 sm:!p-8">
                <div>
                  <span className="pill bg-white/10 text-primary-light font-bold">
                    <QrIcon className="h-3.5 w-3.5" /> Check-in bằng mã QR
                  </span>
                  <h3 className="mt-4 text-xl sm:text-2xl font-bold text-white">
                    Quét mã QR để bắt đầu sạc
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-white/70 leading-relaxed">
                    Quét mã QR của cổng đã đặt và xác nhận check-in trong ứng dụng. Hệ thống kiểm tra thông tin đặt chỗ trước khi tiếp tục.
                  </p>
                </div>

                {/* Laser QR Visual Card with animated sweep */}
                <div className="mt-6 relative overflow-hidden rounded-2xl border border-white/15 bg-white/5 p-5 text-center">
                  <div className="mx-auto relative flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/20 text-primary-light ring-1 ring-primary/40 shadow-glow-emerald">
                    <QrIcon className="h-9 w-9" />
                    {/* Animated Laser Scanning Line */}
                    <div className="pointer-events-none absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-glow-laser animate-laser-sweep" />
                  </div>
                  <p className="mt-3.5 font-mono text-xs font-bold text-primary-light tracking-wider">
                    QUÉT MÃ ĐỂ BẮT ĐẦU
                  </p>
                  <p className="text-[10px] font-mono text-white/50 mt-1">Giao diện minh họa</p>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Bento Tile 3: 100% Refund Policy (Span 4) */}
          <Reveal delay={120} className="flex lg:col-span-4">
            <div className="double-bezel w-full flex flex-col">
              <div className="double-bezel-inner flex-1 flex flex-col justify-between !p-5 sm:!p-8">
                <div>
                  <span className="pill bg-primary-soft text-primary-dark font-bold">
                    <RefundIcon className="h-3.5 w-3.5" /> Minh bạch tài chính
                  </span>
                  <h3 className="mt-4 text-xl sm:text-2xl font-bold text-ink-heading">
                    Chính sách hủy và hoàn tiền
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-ink-body leading-relaxed">
                    Đặt chỗ đã thanh toán có thể được hoàn đủ giá gói nếu hủy trước hạn áp dụng. Thanh toán và hoàn tiền hiện được mô phỏng.
                  </p>
                </div>

                <div className="mt-6 rounded-2xl border border-black/[0.05] bg-surface-alt p-4 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-ink-heading">Trong 10 phút từ khi thanh toán</span>
                    <span className="rounded-full bg-primary text-white px-2.5 py-0.5 text-[11px] shadow-sm">
                      Có thể hoàn đủ*
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-ink-body">
                    <span>Hết thời gian ân hạn</span>
                    <span className="font-semibold text-ink-heading">Hoàn 0% do đổi ý</span>
                  </div>
                  <div className="flex items-center justify-between text-ink-muted">
                    <span>*Trước hạn hủy và giờ bắt đầu</span>
                    <span>Ứng dụng hiển thị trước khi xác nhận</span>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Bento Tile 4: Live Telemetry & Battery Safety (Span 8) */}
          <Reveal delay={160} className="flex lg:col-span-8">
            <div className="double-bezel w-full flex flex-col">
              <div className="double-bezel-inner flex-1 flex flex-col justify-between !p-5 sm:!p-8">
                <LiveChargingTelemetry />
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ----------------------------- Stats ---------------------------- */
function Stats() {
  const items = [
    { value: "Tìm", label: "xem thông tin trạm sạc" },
    { value: "Đặt", label: "chọn gói và khung giờ" },
    { value: "QR", label: "check-in theo đặt chỗ" },
    { value: "Theo dõi", label: "xem trạng thái đặt chỗ" },
  ];

  return (
    <section className="py-6 sm:py-8">
      <div className="container-x">
        <Reveal>
          <div className="double-bezel-dark">
            <div className="double-bezel-dark-inner relative overflow-hidden bg-gradient-to-r from-[#080C0A] via-[#101915] to-[#080C0A] !p-5 sm:!p-8 lg:!p-12">
              <div className="pointer-events-none absolute inset-0 bg-grid-light opacity-25" />
              <div className="relative grid grid-cols-2 gap-8 lg:grid-cols-4 text-center">
                {items.map((it) => (
                  <div key={it.label} className="py-2">
                    <div className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight font-mono">
                      {it.value}
                    </div>
                    <div className="mt-2 text-xs sm:text-sm text-white/70 max-w-[20ch] mx-auto leading-snug">
                      {it.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------- Owner band --------------------------- */
function OwnerBand() {
  return (
    <section id="doi-tac" className="relative overflow-hidden py-16 sm:py-24 lg:py-32 bg-[#FAFBFB] border-y border-black/[0.05]">
      <div className="container-x relative">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.3fr] lg:gap-16">
          <Reveal>
            <span className="eyebrow-tag">
              <BoltIcon className="h-3.5 w-3.5 text-primary" /> DÀNH CHO ĐỐI TÁC CHỦ TRẠM
            </span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-balance text-ink-heading sm:text-4xl lg:text-5xl">
              Sở hữu trạm sạc? Quản lý thông tin trên Web Console
            </h2>
            <p className="mt-4 text-base sm:text-lg leading-relaxed text-ink-body">
              Dùng ChargeOps để quản lý thông tin trạm, cổng sạc, giá và lịch đặt chỗ trên Web Console.
            </p>

            <div className="mt-7 space-y-3">
              {[
                "Cấu hình giá và khung giờ áp dụng cho trạm",
                "Theo dõi trụ sạc và lịch đặt chỗ theo trạng thái được ghi nhận",
                "Xem thông tin thanh toán và hoàn tiền trong quy trình mô phỏng",
              ].map((t) => (
                <div key={t} className="flex items-start gap-3 text-sm text-ink-body font-medium">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                    <CheckIcon className="h-2.5 w-2.5" />
                  </span>
                  <span>{t}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href="mailto:phamthang3564@gmail.com?subject=Đăng ký hợp tác trạm sạc ChargeOps"
                className="btn-island-primary"
              >
                <span>Đăng ký trạm của bạn</span>
                <span className="btn-icon-bubble">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="h-4 w-4">
                    <path d="M7 17L17 7M17 7H7M17 7V17" />
                  </svg>
                </span>
              </a>
            </div>
          </Reveal>

          <Reveal delay={100} className="w-full">
            <BrowserFrame
              url="https://console.chargeops.online/owner/pricing"
              title="ChargeOps Console — Cấu hình biểu giá & Quản trị trạm"
            >
              <OwnerConsolePreview />
            </BrowserFrame>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ------------------------ Download CTA -------------------------- */
function DownloadCta() {
  return (
    <section id="tai-ung-dung" className="py-16 sm:py-24 lg:py-32">
      <div className="container-x">
        <Reveal>
          <div className="double-bezel-dark max-w-4xl mx-auto">
            <div className="double-bezel-dark-inner relative overflow-hidden bg-gradient-to-b from-[#121B17] via-[#0E1512] to-[#080C0A] p-8 sm:p-14 text-center">
              <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/25 blur-3xl" />
              <div className="pointer-events-none absolute -left-24 -bottom-24 h-72 w-72 rounded-full bg-primary-light/15 blur-3xl" />
              <div className="relative">
                <span className="pill bg-white/10 text-primary-light font-bold mb-4">
                  DÙNG THỬ TRỰC TIẾP TRÊN WEB
                </span>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white text-balance mt-3">
                  Trải nghiệm ứng dụng tài xế ChargeOps ngay hôm nay
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-sm sm:text-base text-white/80 leading-relaxed">
                  Không phải chờ tải app hay đăng ký rườm rà. Thử ngay trọn vẹn luồng tìm trạm, giữ trước khung giờ và check-in sạc bằng mã QR với tài khoản tài xế mẫu có sẵn.
                </p>

                <div className="mt-8 flex flex-col items-center gap-6">
                  <QrDownload />
                  <div className="pt-2 text-center">
                    <p className="text-xs text-white/50 mb-3">Ứng dụng di động bản chính thức (iOS &amp; Android)</p>
                    <StoreBadges />
                  </div>
                  <div className="w-full max-w-md pt-2">
                    <WaitlistForm compact />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* --------------------- Structured data (SEO) -------------------- */
function JsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "ChargeOps",
    applicationCategory: "TravelApplication",
    operatingSystem: "iOS, Android",
    description:
      "Ứng dụng đặt chỗ trạm sạc xe điện tại Việt Nam: tìm trạm, giữ khung giờ, QR check-in và thanh toán.",
    offers: { "@type": "Offer", price: "0", priceCurrency: "VND" },
    inLanguage: "vi-VN",
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
