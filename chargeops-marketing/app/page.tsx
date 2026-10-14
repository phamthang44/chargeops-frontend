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
import {
  MapPinIcon,
  CalendarIcon,
  QrIcon,
  BatteryIcon,
  CardIcon,
  RefundIcon,
  BoltIcon,
  CheckIcon,
  StarIcon,
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
        <ConnectorStrip />
        <Problem />
        <HowItWorks />
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
    <section className="relative overflow-hidden pt-4 pb-20 sm:pt-10 sm:pb-28">
      {/* Cinematic ambient backdrop */}
      <div className="pointer-events-none absolute inset-0 bg-soft-radial" />
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" />
      <div className="pointer-events-none absolute -left-20 top-20 h-96 w-96 rounded-full bg-primary/15 blur-[100px]" />
      <div className="pointer-events-none absolute -right-20 top-40 h-96 w-96 rounded-full bg-primary-light/10 blur-[120px]" />

      <div className="container-x relative grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
        <Reveal>
          <div className="inline-flex">
            <span className="eyebrow-tag">
              <BoltIcon className="h-3.5 w-3.5 text-primary" /> HẠ TẦNG SẠC XE ĐIỆN THÔNG MINH
            </span>
          </div>

          <h1 className="mt-6 text-4xl font-extrabold leading-[1.08] tracking-tight text-balance text-ink-strong sm:text-5xl lg:text-[3.5rem]">
            Đặt chỗ trạm sạc <span className="text-gradient">trước khi bạn đến</span>
          </h1>

          <p className="mt-5 max-w-xl text-base sm:text-lg leading-relaxed text-ink-body">
            Không còn cảnh đến nơi trạm đã đầy. Giữ khung giờ với giá cố định,
            quét mã QR check-in tức thì và khởi động phiên sạc trên toàn quốc.
          </p>

          {/* Island CTA Buttons (Button-in-Button Architecture) */}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a href="#tai-ung-dung" className="btn-island-primary">
              <span>Tải ứng dụng ngay</span>
              <span className="btn-icon-bubble">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="h-4 w-4">
                  <path d="M7 17L17 7M17 7H7M17 7V17" />
                </svg>
              </span>
            </a>

            <Link href="/tram-sac" className="btn-island-secondary">
              <span>Khám phá trạm sạc</span>
              <span className="btn-icon-bubble">
                <MapPinIcon className="h-4 w-4" />
              </span>
            </Link>
          </div>

          {/* Micro Trust Strip */}
          <div className="mt-8 flex flex-wrap items-center gap-3 pt-2 text-xs sm:text-sm text-ink-muted">
            <div className="flex text-amber-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <StarIcon key={i} className="h-4 w-4 fill-amber-400" />
              ))}
            </div>
            <span className="font-semibold text-ink-strong">5.0 / 5.0</span>
            <span className="text-ink-muted/60">·</span>
            <span>Tối ưu cho tài xế VinFast, Hyundai, Porsche & mọi dòng xe EV</span>
          </div>
        </Reveal>

        {/* Machined Titanium Phone Mockup with Dual-Bezel Cards */}
        <Reveal delay={120} className="relative flex justify-center lg:justify-end">
          <div className="relative">
            <PhoneFrame
              src="/screens/app-home-new.png"
              alt="Màn hình tìm trạm sạc ChargeOps"
              priority
              float
            />

            {/* Float Card 1: Slot Reserved */}
            <div className="absolute -left-6 sm:-left-12 top-12 z-20 hidden sm:flex items-center gap-3.5 rounded-2xl border border-black/5 bg-white/95 p-3.5 shadow-[0_15px_35px_-10px_rgba(0,0,0,0.12),inset_0_1px_1px_rgba(255,255,255,0.9)] backdrop-blur-xl animate-float">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary-dark shadow-sm">
                <CalendarIcon className="h-5 w-5" />
              </span>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  <p className="text-[11px] font-bold uppercase tracking-wider text-primary-dark">Đã giữ chỗ</p>
                </div>
                <p className="text-sm font-extrabold text-ink-strong">14:00 – 15:00 · Trụ DC 120kW</p>
              </div>
            </div>

            {/* Float Card 2: Charging Telemetry */}
            <div className="absolute -right-4 sm:-right-8 bottom-16 z-20 hidden sm:flex items-center gap-3.5 rounded-2xl border border-black/5 bg-[#090D0C]/95 p-3.5 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.15)] backdrop-blur-xl text-white animate-float-slow">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-glow-emerald">
                <BatteryIcon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[11px] font-semibold text-primary-light">Đang sạc siêu nhanh DC</p>
                <p className="text-sm font-extrabold text-white">64% · 124 kW · còn 18 phút</p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ----------------------- Connector strip ------------------------ */
function ConnectorStrip() {
  const oems = ["VinFast", "Hyundai Ioniq", "Porsche Taycan", "BYD", "Tesla (Adapter)", "Audi e-tron"];
  const standards = [
    { name: "CCS2", spec: "Tới 180kW DC" },
    { name: "Type 2", spec: "22kW AC" },
    { name: "GB/T", spec: "Sạc nhanh quốc tế" },
    { name: "CHAdeMO", spec: "DC Fast" },
  ];

  return (
    <section className="border-y border-black/[0.06] bg-[#FAFBFB] py-6">
      <div className="container-x flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink-muted">
          <span className="h-2 w-2 rounded-full bg-primary" />
          <span>Tương thích các chuẩn sạc tại Việt Nam:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {standards.map((s) => (
            <span
              key={s.name}
              className="inline-flex items-center gap-2 rounded-full border border-black/[0.06] bg-white px-3.5 py-1.5 text-xs font-semibold text-ink-strong shadow-sm"
            >
              <BoltIcon className="h-3.5 w-3.5 text-primary" />
              <span>{s.name}</span>
              <span className="text-[10px] font-normal text-ink-muted">({s.spec})</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* --------------------------- Problem ---------------------------- */
function Problem() {
  return (
    <section className="py-24 sm:py-32">
      <div className="container-x grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <Reveal className="order-2 flex justify-center lg:order-1">
          <PhoneFrame src="/screens/app-map-new.png" alt="Bản đồ trạm sạc quanh bạn" />
        </Reveal>
        <Reveal delay={80} className="order-1 lg:order-2">
          <span className="eyebrow-tag">
            GIẢI PHÁP ĐỘT PHÁ
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-balance text-ink-strong sm:text-4xl">
            Đến nơi mới biết trạm đã đầy xe chờ?
          </h2>
          <p className="mt-4 text-base sm:text-lg leading-relaxed text-ink-body">
            Lái xe điện đường dài thường phải “hên xui”: chạy tới trạm, xếp hàng chờ đợi,
            hoặc trạm bị xe khác chiếm chỗ. ChargeOps cho bạn{" "}
            <strong className="text-ink-strong font-bold">giữ chỗ trước 100%</strong> với biểu giá cố
            định theo khung giờ, để mỗi hành trình đều chủ động và thảnh thơi.
          </p>

          <div className="mt-8 space-y-3.5">
            {[
              {
                title: "Xem số trụ và khung giờ trống thực tế",
                desc: "Dữ liệu cập nhật liên tục từng giây trực tiếp từ giao thức trạm sạc.",
              },
              {
                title: "Khóa giá Time-of-Use cố định",
                desc: "Biết trước chi phí đ/kWh của khung giờ đã đặt, không phát sinh phụ phí ẩn.",
              },
              {
                title: "Huỷ linh hoạt với hoàn tiền tự động",
                desc: "Huỷ trước 30 phút hoàn 100% số tiền trực tiếp vào tài khoản.",
              },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3.5 rounded-2xl border border-black/[0.04] bg-surface-alt/70 p-4 transition-colors hover:bg-white hover:border-black/10">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-sm">
                  <CheckIcon className="h-3 w-3" />
                </span>
                <div>
                  <p className="text-sm font-bold text-ink-strong">{item.title}</p>
                  <p className="text-xs text-ink-muted mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------- How it works ------------------------- */
function HowItWorks() {
  const steps = [
    {
      n: "01",
      title: "Tìm trạm sạc gần bạn",
      desc: "Lọc theo trạm sạc nhanh DC, khoảng cách và đơn giá. Xem đánh giá thực tế từ cộng đồng tài xế.",
      img: "/screens/app-home-new.png",
    },
    {
      n: "02",
      title: "Giữ trước khung giờ sạc",
      desc: "Chọn giờ sạc bạn muốn đến, hệ thống khóa chỗ riêng cho xe bạn với biểu giá cố định minh bạch.",
      img: "/screens/app-bookings-new.png",
    },
    {
      n: "03",
      title: "Check-in QR & Khởi động",
      desc: "Đến đúng trạm, quét mã QR dán tại trụ để mở nguồn điện. Phiên sạc bắt đầu ngay trong vài giây.",
      img: "/screens/app-map-new.png",
    },
  ];

  return (
    <section id="cach-hoat-dong" className="bg-[#FAFBFB] py-24 sm:py-32 border-y border-black/[0.05]">
      <div className="container-x">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="eyebrow-tag">TRẢI NGHIỆM ĐƠN GIẢN</span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-balance text-ink-strong sm:text-4xl">
            Sạc xe nhanh chóng chỉ với 3 bước
          </h2>
          <p className="mt-3 text-ink-body text-sm sm:text-base">
            Quy trình được tối ưu hóa cho tài xế bận rộn: không chờ đợi, không thao tác phức tạp.
          </p>
        </Reveal>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 110} className="flex flex-col">
              <div className="double-bezel h-full flex flex-col justify-between">
                <div className="double-bezel-inner flex-1 flex flex-col items-center text-center">
                  <div className="flex justify-center mb-6">
                    <PhoneFrame src={s.img} alt={s.title} className="scale-90 origin-top -mb-8" />
                  </div>
                  <div className="mt-4 inline-flex items-center justify-center rounded-full bg-primary px-3 py-1 text-xs font-extrabold text-white shadow-glow-emerald">
                    BƯỚC {s.n}
                  </div>
                  <h3 className="mt-3 text-lg font-bold text-ink-strong">{s.title}</h3>
                  <p className="mt-2 text-xs sm:text-sm leading-relaxed text-ink-muted">{s.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------- Asymmetrical Bento Grid Features ----------- */
function FeaturesBento() {
  return (
    <section id="tinh-nang" className="py-24 sm:py-32">
      <div className="container-x">
        <Reveal className="max-w-2xl">
          <span className="eyebrow-tag">CÔNG NGHỆ TIÊN TIẾN</span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-balance text-ink-strong sm:text-4xl">
            Mọi tính năng cần thiết để chuyến đi luôn suôn sẻ
          </h2>
          <p className="mt-3 text-sm sm:text-base text-ink-body">
            Được thiết kế từ phản hồi thực tế của hàng nghìn tài xế xe điện tại Việt Nam.
          </p>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Bento Tile 1: Slot Scheduler Preview (Span 8) */}
          <Reveal className="md:col-span-8 flex">
            <div className="double-bezel w-full flex flex-col">
              <div className="double-bezel-inner flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="pill bg-primary-soft text-primary-dark font-bold">
                      <CalendarIcon className="h-3.5 w-3.5" /> Đặt chỗ thông minh
                    </span>
                    <span className="font-mono text-xs text-primary-dark font-bold">Time-of-Use</span>
                  </div>
                  <h3 className="mt-4 text-2xl font-bold text-ink-strong">
                    Khóa trước khung giờ & Đơn giá minh bạch
                  </h3>
                  <p className="mt-2 text-sm text-ink-muted max-w-xl leading-relaxed">
                    Chọn trước giờ sạc phù hợp với lịch trình. Trụ sạc tự động chuyển sang chế độ bảo lưu riêng cho bạn, ngăn các xe khác cắm sạc sai giờ.
                  </p>
                </div>

                {/* Simulated interactive slot picker bar */}
                <div className="mt-8 rounded-2xl border border-black/[0.06] bg-surface-alt p-4">
                  <div className="flex items-center justify-between mb-3 text-xs text-ink-muted">
                    <span className="font-semibold text-ink-strong">Khung giờ trạm Vincom Đồng Khởi (Hôm nay):</span>
                    <span className="text-primary-dark font-medium">8 khung giờ khả dụng</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="rounded-xl border border-black/5 bg-white p-2.5 opacity-60">
                      <p className="font-mono text-xs font-semibold text-ink-muted">12:00 – 13:00</p>
                      <p className="text-[10px] text-ink-muted">Đã qua</p>
                    </div>
                    <div className="rounded-xl border border-primary/30 bg-primary-soft/50 p-2.5 ring-1 ring-primary/30">
                      <p className="font-mono text-xs font-bold text-primary-dark">14:00 – 15:00</p>
                      <p className="text-[10px] font-bold text-primary-dark">✓ ĐÃ GIỮ CHO BẠN</p>
                    </div>
                    <div className="rounded-xl border border-black/5 bg-white p-2.5">
                      <p className="font-mono text-xs font-semibold text-ink-strong">15:00 – 16:00</p>
                      <p className="text-[10px] text-primary-dark font-semibold">Còn 2 trụ trống</p>
                    </div>
                    <div className="rounded-xl border border-black/5 bg-white p-2.5">
                      <p className="font-mono text-xs font-semibold text-ink-strong">16:00 – 17:00</p>
                      <p className="text-[10px] text-primary-dark font-semibold">Còn 3 trụ trống</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Bento Tile 2: Instant QR Check-in (Span 4) */}
          <Reveal delay={80} className="md:col-span-4 flex">
            <div className="double-bezel-dark w-full flex flex-col">
              <div className="double-bezel-dark-inner flex-1 flex flex-col justify-between text-white">
                <div>
                  <span className="pill bg-white/10 text-primary-light font-bold">
                    <QrIcon className="h-3.5 w-3.5" /> Check-in 5 giây
                  </span>
                  <h3 className="mt-4 text-xl font-bold text-white">
                    Quét mã QR tại trụ
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-white/70 leading-relaxed">
                    Xác thực vị trí tức thì. Đúng xe, đúng trụ, hệ thống tự động kích hoạt relay dòng điện an toàn.
                  </p>
                </div>

                {/* Laser QR Visual Card */}
                <div className="mt-6 relative overflow-hidden rounded-2xl border border-white/15 bg-white/5 p-4 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/20 text-primary-light ring-1 ring-primary/40 shadow-glow-emerald">
                    <QrIcon className="h-8 w-8" />
                  </div>
                  <p className="mt-3 font-mono text-xs font-bold text-primary-light tracking-wider">
                    SCAN TO CHARGE
                  </p>
                  <p className="text-[10px] text-white/50 mt-0.5">Xác thực mã định danh trụ sạc</p>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Bento Tile 3: 100% Refund Policy (Span 4) */}
          <Reveal delay={120} className="md:col-span-4 flex">
            <div className="double-bezel w-full flex flex-col">
              <div className="double-bezel-inner flex-1 flex flex-col justify-between">
                <div>
                  <span className="pill bg-primary-soft text-primary-dark font-bold">
                    <RefundIcon className="h-3.5 w-3.5" /> Minh bạch tài chính
                  </span>
                  <h3 className="mt-4 text-xl font-bold text-ink-strong">
                    Chính sách hoàn tiền 100%
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-ink-muted leading-relaxed">
                    Thay đổi kế hoạch đột xuất? Huỷ phiên sạc trước 30 phút để nhận hoàn 100% tiền cọc tự động qua ví.
                  </p>
                </div>

                <div className="mt-6 rounded-2xl border border-black/[0.05] bg-surface-alt p-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-ink-strong">&gt; 30 phút trước giờ sạc</span>
                    <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-primary-dark font-bold">Hoàn 100%</span>
                  </div>
                  <div className="flex items-center justify-between text-ink-muted">
                    <span>15 – 30 phút</span>
                    <span>Hoàn 80%</span>
                  </div>
                  <div className="flex items-center justify-between text-ink-muted">
                    <span>Dưới 15 phút</span>
                    <span>Phí giữ chỗ tối thiểu</span>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Bento Tile 4: Live Telemetry & Battery Safety (Span 8) */}
          <Reveal delay={160} className="md:col-span-8 flex">
            <div className="double-bezel w-full flex flex-col">
              <div className="double-bezel-inner flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="pill bg-primary-soft text-primary-dark font-bold">
                      <BatteryIcon className="h-3.5 w-3.5" /> Giám sát thời gian thực
                    </span>
                    <span className="text-xs font-semibold text-primary-dark">Tự ngắt khi đạt 80%</span>
                  </div>
                  <h3 className="mt-4 text-2xl font-bold text-ink-strong">
                    Theo dõi tiến trình & Bảo vệ pin xe điện
                  </h3>
                  <p className="mt-2 text-sm text-ink-muted max-w-xl leading-relaxed">
                    Xem trực tiếp công suất nạp (kW), tốc độ dòng điện và ước tính thời gian kết thúc. Tự động ngắt khi đầy để bảo vệ tuổi thọ pin.
                  </p>
                </div>

                {/* Telemetry Progress Bar Visual */}
                <div className="mt-8 rounded-2xl border border-black/[0.06] bg-surface-alt p-4">
                  <div className="flex items-center justify-between text-xs font-bold text-ink-strong mb-2">
                    <span>Mức pin: 64%</span>
                    <span className="text-primary-dark font-mono">124 kW DC Fast Charging</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-black/5 overflow-hidden p-0.5">
                    <div className="h-full rounded-full bg-brand-gradient shadow-glow-emerald w-[64%] transition-all duration-1000" />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[11px] text-ink-muted">
                    <span>Điện áp: 395V · 315A</span>
                    <span>Chi phí tạm tính: 154.200 đ</span>
                    <span>Thời gian còn: 18 phút</span>
                  </div>
                </div>
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
    { value: "30s", label: "để đặt trước một khung giờ sạc" },
    { value: "100%", label: "bảo đảm có trụ sạc trống khi đến" },
    { value: "180kW", label: "công suất sạc DC tối đa hỗ trợ" },
    { value: "100%", label: "hoàn tiền tự động khi huỷ sớm" },
  ];
  return (
    <section className="py-6">
      <div className="container-x">
        <Reveal>
          <div className="double-bezel-dark">
            <div className="double-bezel-dark-inner relative overflow-hidden bg-gradient-to-r from-[#090D0C] via-[#101915] to-[#090D0C]">
              <div className="pointer-events-none absolute inset-0 bg-grid-light opacity-30" />
              <div className="relative grid grid-cols-2 gap-8 lg:grid-cols-4 text-center">
                {items.map((it) => (
                  <div key={it.label} className="py-2">
                    <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-sans">
                      {it.value}
                    </div>
                    <div className="mt-1.5 text-xs sm:text-sm text-white/70 max-w-[18ch] mx-auto leading-snug">
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
    <section id="doi-tac" className="relative overflow-hidden py-24 sm:py-32 bg-[#FAFBFB] border-y border-black/[0.05]">
      <div className="container-x relative grid items-center gap-12 lg:grid-cols-[1fr_1.3fr] lg:gap-16">
        <Reveal>
          <span className="eyebrow-tag">DÀNH CHO CHỦ TRẠM</span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-balance text-ink-strong sm:text-4xl">
            Sở hữu trạm sạc? Tối ưu doanh thu cùng ChargeOps
          </h2>
          <p className="mt-4 text-base sm:text-lg leading-relaxed text-ink-body">
            Gia nhập mạng lưới trạm sạc ChargeOps để tiếp cận ngay hàng chục nghìn tài xế xe điện.
            Tự chủ cấu hình biểu giá theo khung giờ (Time-of-Use), quản lý lượt đặt chỗ và nhận báo cáo doanh thu
            minh bạch qua bảng điều khiển Web Console chuẩn doanh nghiệp.
          </p>

          <div className="mt-7 space-y-3">
            {[
              "Tự thiết lập đơn giá đ/kWh linh hoạt theo giờ cao điểm",
              "Quản lý trụ sạc, tình trạng kết nối và lịch đặt chỗ tập trung",
              "Báo cáo dòng tiền, thống kê điện năng tiêu thụ chuẩn xác",
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
    </section>
  );
}

/* ------------------------ Download CTA -------------------------- */
function DownloadCta() {
  return (
    <section id="tai-ung-dung" className="py-24 sm:py-32">
      <div className="container-x">
        <Reveal>
          <div className="double-bezel-dark max-w-4xl mx-auto">
            <div className="double-bezel-dark-inner relative overflow-hidden bg-gradient-to-b from-[#0F1714] to-[#090D0C] p-8 sm:p-14 text-center">
              <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/25 blur-3xl" />
              <div className="relative">
                <span className="pill bg-white/10 text-primary-light font-bold mb-4">
                  ỨNG DỤNG CHO iOS & ANDROID
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white text-balance mt-3">
                  Sẵn sàng cho chuyến đi không lo hết chỗ?
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-sm sm:text-base text-white/80 leading-relaxed">
                  Tải ứng dụng ChargeOps để đặt khung giờ sạc đầu tiên của bạn. Hoặc để lại email để chúng tôi thông báo khi mở trạm mới tại khu vực của bạn.
                </p>

                <div className="mt-8 flex flex-col items-center gap-6">
                  <StoreBadges />
                  <QrDownload />
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

