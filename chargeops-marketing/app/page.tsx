import Image from "next/image";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { CoverageSection } from "@/components/CoverageSection";
import { StoreBadges } from "@/components/StoreBadges";
import { WaitlistForm } from "@/components/WaitlistForm";
import { PhoneFrame } from "@/components/PhoneFrame";
import { QrDownload } from "@/components/QrDownload";
import { Reveal } from "@/components/Reveal";
import { BackToTop } from "@/components/BackToTop";
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
      <main id="top" tabIndex={-1}>
        <Hero />
        <ConnectorStrip />
        <Problem />
        <HowItWorks />
        <CoverageSection />
        <Features />
        <Stats />
        <OwnerBand />
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
    <section className="relative overflow-hidden">
      {/* layered backdrop */}
      <div className="pointer-events-none absolute inset-0 bg-soft-radial" />
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-60" />
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-0 h-72 w-72 rounded-full bg-primary-light/10 blur-3xl" />

      <div className="container-x relative grid items-center gap-12 py-16 sm:py-24 lg:grid-cols-2">
        <Reveal>
          <span className="pill bg-primary-soft text-primary-dark">
            <BoltIcon className="h-3.5 w-3.5" /> Sạc xe điện thông minh
          </span>
          <h1 className="mt-5 text-4xl font-bold leading-[1.08] tracking-tight text-balance text-ink-strong sm:text-[3.25rem]">
            Đặt chỗ trạm sạc <span className="text-gradient">trước khi bạn đến</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-pretty text-ink-body">
            Không còn cảnh đến nơi trạm đã đầy. Tìm trạm gần bạn, giữ khung giờ,
            check-in bằng QR và thanh toán, tất cả trong một ứng dụng.
          </p>

          <div className="mt-7 flex items-center gap-3">
            <div className="flex text-primary">
              {Array.from({ length: 5 }).map((_, i) => (
                <StarIcon key={i} className="h-4 w-4" />
              ))}
            </div>
            <span className="text-sm text-ink-muted">
              Thiết kế dành riêng cho tài xế Việt
            </span>
          </div>

          <div className="mt-7">
            <StoreBadges />
          </div>

          <div className="mt-6">
            <p className="mb-2 text-sm font-medium text-ink-body">
              Chưa ra mắt? Nhận thông báo khi có mặt:
            </p>
            <WaitlistForm />
          </div>
        </Reveal>

        {/* phone + floating glass cards */}
        <Reveal delay={120} className="relative flex justify-center lg:justify-end">
          <div className="relative">
            <PhoneFrame
              src="/screens/app-home.png"
              alt="Màn hình tìm trạm sạc ChargeOps"
              priority
              float
            />

            <FloatCard className="-left-6 top-10 animate-float sm:-left-10">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-primary-dark">
                <CalendarIcon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs text-ink-muted">Đã giữ khung giờ</p>
                <p className="text-sm font-semibold text-ink-strong">14:00 – 15:00</p>
              </div>
            </FloatCard>

            <FloatCard className="-right-4 bottom-16 animate-float-slow sm:-right-8">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white">
                <BatteryIcon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs text-ink-muted">Đang sạc</p>
                <p className="text-sm font-semibold text-ink-strong">64% · còn 18 phút</p>
              </div>
            </FloatCard>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function FloatCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`absolute z-10 hidden items-center gap-3 rounded-2xl border border-line bg-white/90 px-4 py-3 shadow-card backdrop-blur sm:flex ${
        className ?? ""
      }`}
    >
      {children}
    </div>
  );
}

/* ----------------------- Connector strip ------------------------ */
function ConnectorStrip() {
  const standards = ["CCS2", "CHAdeMO", "Type 2 (AC)", "GB/T"];
  return (
    <section className="border-y border-line bg-white">
      <div className="container-x flex flex-col items-center gap-5 py-7 sm:flex-row sm:justify-between">
        <p className="text-sm font-medium text-ink-muted">
          Hỗ trợ mọi chuẩn sạc phổ biến tại Việt Nam
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          {standards.map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-1.5 rounded-pill border border-line bg-surface-alt px-3.5 py-1.5 text-sm font-semibold text-ink-body"
            >
              <BoltIcon className="h-3.5 w-3.5 text-primary" />
              {s}
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
    <section className="py-20 sm:py-24">
      <div className="container-x grid items-center gap-12 lg:grid-cols-2">
        <Reveal className="order-2 flex justify-center lg:order-1">
          <PhoneFrame src="/screens/app-map.png" alt="Bản đồ trạm sạc quanh bạn" />
        </Reveal>
        <Reveal delay={80} className="order-1 lg:order-2">
          <h2 className="text-3xl font-bold tracking-tight text-balance text-ink-strong sm:text-4xl">
            Đến nơi mới biết trạm đã đầy?
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-ink-body">
            Lái xe điện ở Việt Nam thường phải “hên xui”: chạy tới trạm, chờ đợi,
            hoặc phải tìm trạm khác. ChargeOps cho bạn{" "}
            <strong className="text-ink-strong">giữ chỗ trước</strong> với giá cố
            định theo khung giờ, để mỗi chuyến đi đều chắc chắn.
          </p>
          <ul className="mt-6 space-y-3">
            {[
              "Xem khung giờ trống theo thời gian thực",
              "Giá cố định cho mỗi khung giờ, không bất ngờ",
              "Huỷ linh hoạt với chính sách hoàn tiền rõ ràng",
            ].map((t) => (
              <li key={t} className="flex items-start gap-3 text-ink-body">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary-dark">
                  <CheckIcon className="h-3.5 w-3.5" />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------- How it works ------------------------- */
function HowItWorks() {
  const steps = [
    {
      n: "1",
      title: "Tìm trạm gần bạn",
      desc: "Lọc theo sạc nhanh DC, giá, hoặc trạm đang mở. Xem đánh giá và tiện ích.",
      img: "/screens/app-home.png",
    },
    {
      n: "2",
      title: "Đặt chỗ & giữ khung giờ",
      desc: "Chọn trạm và giữ khung giờ trước với giá cố định. Theo dõi các lượt đặt sắp tới.",
      img: "/screens/app-bookings.png",
    },
    {
      n: "3",
      title: "Check-in & xem lịch sử",
      desc: "Quét QR tại trạm để bắt đầu sạc, rồi xem lại toàn bộ lịch sử chuyến sạc.",
      img: "/screens/app-history.png",
    },
  ];
  return (
    <section id="cach-hoat-dong" className="bg-surface-alt py-20 sm:py-24">
      <div className="container-x">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="pill bg-primary-soft text-primary-dark">Cách hoạt động</span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-balance text-ink-strong sm:text-4xl">
            Sạc xe chỉ với 3 bước
          </h2>
        </Reveal>
        <div className="mt-14 grid gap-10 md:grid-cols-3">
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 110} className="text-center">
              <div className="flex justify-center">
                <PhoneFrame src={s.img} alt={s.title} />
              </div>
              <div className="mx-auto mt-7 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-white shadow-glass">
                {s.n}
              </div>
              <h3 className="mt-3 text-lg font-semibold text-ink-strong">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{s.desc}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------- Features ----------------------------- */
function Features() {
  const features = [
    { Icon: MapPinIcon, title: "Tìm trạm thông minh", desc: "Bản đồ và danh sách trạm với bộ lọc sạc nhanh, giá, khoảng cách." },
    { Icon: CalendarIcon, title: "Đặt chỗ trước", desc: "Giữ khung giờ với giá cố định. Không lo đến nơi hết chỗ." },
    { Icon: QrIcon, title: "QR check-in", desc: "Quét mã tại trạm để bắt đầu phiên sạc trong vài giây." },
    { Icon: BatteryIcon, title: "Theo dõi phiên sạc", desc: "Xem tiến trình sạc trực tiếp; tự dừng khi đầy pin." },
    { Icon: CardIcon, title: "Thanh toán nội địa", desc: "Thanh toán bằng VND ngay trong ứng dụng, minh bạch từng đồng." },
    { Icon: RefundIcon, title: "Hoàn tiền theo bậc", desc: "Huỷ sớm hoàn 100%, chính sách rõ ràng theo từng mốc thời gian." },
  ];
  return (
    <section id="tinh-nang" className="py-20 sm:py-24">
      <div className="container-x">
        <Reveal className="max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight text-balance text-ink-strong sm:text-4xl">
            Mọi thứ bạn cần để sạc xe yên tâm
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={(i % 3) * 90}>
              <div className="group h-full rounded-card border border-line bg-white p-6 shadow-card transition hover:-translate-y-1 hover:border-primary/30 hover:shadow-glass">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft text-primary-dark transition group-hover:bg-primary group-hover:text-white">
                  <f.Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 font-semibold text-ink-strong">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{f.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ----------------------------- Stats ---------------------------- */
function Stats() {
  const items = [
    { value: "30 giây", label: "để đặt một khung giờ sạc" },
    { value: "QR", label: "check-in nhanh tại trạm" },
    { value: "100%", label: "hoàn tiền nếu huỷ sớm" },
    { value: "VND", label: "thanh toán nội địa dễ dàng" },
  ];
  return (
    <section className="pb-4">
      <div className="container-x">
        <Reveal className="relative overflow-hidden rounded-card bg-brand-gradient px-6 py-12 text-white shadow-glass">
          <div className="pointer-events-none absolute inset-0 bg-grid-light opacity-60" />
          <div className="relative grid grid-cols-2 gap-8 lg:grid-cols-4">
            {items.map((it) => (
              <div key={it.label} className="text-center">
                <div className="text-3xl font-bold sm:text-4xl">{it.value}</div>
                <div className="mt-1 text-sm text-white/85">{it.label}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------- Owner band --------------------------- */
function OwnerBand() {
  return (
    <section id="doi-tac" className="relative overflow-hidden py-20 sm:py-24">
      <div className="pointer-events-none absolute inset-0 bg-surface-alt" />
      <div className="container-x relative grid items-center gap-12 lg:grid-cols-2">
        <Reveal>
          <h2 className="text-3xl font-bold tracking-tight text-balance text-ink-strong sm:text-4xl">
            Sở hữu trụ sạc? Tăng doanh thu cùng ChargeOps
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-ink-body">
            Đăng ký trụ sạc, đặt giá theo khung giờ, quản lý đặt chỗ và theo dõi
            doanh thu, tất cả qua bảng điều khiển dành cho chủ trạm.
          </p>
          <ul className="mt-6 space-y-3">
            {[
              "Tự đặt giá đ/kWh và khung giờ cao điểm",
              "Quản lý trụ, khung giờ và đặt chỗ tập trung",
              "Báo cáo doanh thu minh bạch",
            ].map((t) => (
              <li key={t} className="flex items-start gap-3 text-ink-body">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary-dark">
                  <CheckIcon className="h-3.5 w-3.5" />
                </span>
                {t}
              </li>
            ))}
          </ul>
          <a
            href="mailto:phamthang3564@gmail.com?subject=Đăng ký trạm sạc ChargeOps"
            className="btn-primary mt-8"
          >
            Đăng ký trạm của bạn
          </a>
        </Reveal>

        <Reveal delay={100} className="flex justify-center lg:justify-end">
          <div className="rounded-card border border-line bg-white p-3 shadow-glass">
            <Image
              src="/screens/owner-pricing.jpg"
              alt="Bảng quản lý giá & khung giờ cho chủ trạm"
              width={520}
              height={1100}
              className="h-auto w-[260px] rounded-[0.9rem] sm:w-[300px]"
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------ Download CTA -------------------------- */
function DownloadCta() {
  return (
    <section id="tai-ung-dung" className="py-20 sm:py-28">
      <div className="container-x">
        <Reveal className="relative mx-auto max-w-4xl overflow-hidden rounded-card bg-ink-strong px-6 py-14 text-center shadow-glass sm:px-14">
          <div className="pointer-events-none absolute inset-0 bg-grid-light opacity-50" />
          <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
          <div className="relative">
            <h2 className="text-3xl font-bold tracking-tight text-balance text-white sm:text-4xl">
              Sẵn sàng cho chuyến đi không lo hết chỗ?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-white/80">
              Tải ChargeOps và đặt khung giờ sạc đầu tiên của bạn. Hoặc để lại
              email để chúng tôi báo khi ứng dụng ra mắt.
            </p>
            <div className="mt-9 flex flex-col items-center gap-6">
              <StoreBadges />
              <QrDownload />
              <div className="w-full max-w-md">
                <WaitlistForm compact />
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
