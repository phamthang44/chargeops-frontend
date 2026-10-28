"use client";

import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { CoverageSection } from "@/components/CoverageSection";
import { StoreBadges } from "@/components/StoreBadges";
import { WaitlistForm } from "@/components/WaitlistForm";
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
import { InteractiveRefundScrubber } from "@/components/InteractiveRefundScrubber";
import { LiveChargingTelemetry } from "@/components/LiveChargingTelemetry";
import { HeroVideoPreview } from "@/components/HeroVideoPreview";
import { WalkthroughTheater } from "@/components/WalkthroughTheater";
import { mediaAsset } from "@/lib/media";
import { EngineeringArchitecture } from "@/components/EngineeringArchitecture";
import { SystemCapabilities } from "@/components/SystemCapabilities";
import { HeroFloatTelemetry } from "@/components/HeroFloatTelemetry";
import {
  QrIcon,
  BoltIcon,
  CheckIcon,
} from "@/components/Icons";
import { useTranslation, useLocale } from "@/lib/i18n";

export default function Home() {
  const { t } = useTranslation();

  return (
    <>
      <a href="#top" className="skip-link">
        {t.common.skipToContent}
      </a>
      <SiteHeader />
      <main id="top" tabIndex={-1} className="pt-20 sm:pt-24">
        <Hero />
        <EcosystemStrip />
        <ProblemComparison />
        <JourneySection />
        <FeaturesBento />
        <WalkthroughSection />
        <CoverageSection />
        <OwnerBand />
        <OwnerPricing />
        <EngineeringArchitecture />
        <SystemCapabilities />
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
  const { t } = useTranslation();
  const { locale } = useLocale();

  const language = locale === "en" ? "en" : "vi";
  const videoSrc = mediaAsset(`videos/driver-booking-flow-${language}.webm`);
  const posterSrc = mediaAsset(`screens/app-home-${language}.png`);

  const walkthroughVideoSrc =
    locale === "en"
      ? process.env.NEXT_PUBLIC_CHARGEOPS_WALKTHROUGH_VIDEO_EN_URL || mediaAsset("videos/chargeops-master-walkthrough-80s-v2-en.mp4")
      : process.env.NEXT_PUBLIC_CHARGEOPS_WALKTHROUGH_VIDEO_VI_URL || mediaAsset("videos/chargeops-master-walkthrough-80s-v2-vi.mp4");
  const walkthroughAudioSrc = process.env.NEXT_PUBLIC_CHARGEOPS_WALKTHROUGH_AUDIO_URL || undefined;

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
              {t.hero.eyebrow}
            </span>
          </div>

          <h1 className="mt-5 max-w-2xl text-[clamp(2.125rem,7vw,3.25rem)] font-extrabold leading-[1.24] sm:leading-[1.24] lg:leading-[1.26] tracking-tight text-balance text-white sm:mt-6 sm:text-5xl lg:text-[3.5rem]">
            {t.hero.titlePart1}<span className="text-gradient">{t.hero.titleHighlight}</span>
          </h1>

          <p className="mt-5 max-w-xl text-base sm:text-lg leading-relaxed text-white/70">
            {t.hero.description}
          </p>

          {/* Island CTA Buttons (Button-in-Button Architecture) */}
          <div className="mt-7 flex flex-col items-stretch gap-3 sm:mt-8 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
            <a
              href="https://driver.chargeops.online/?demo=true"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-island-primary w-full justify-between sm:w-auto"
            >
              <span>{t.hero.ctaPrimary}</span>
              <span className="btn-icon-bubble">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="h-4 w-4">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </span>
            </a>

            <WalkthroughTheater
              videoSrc={walkthroughVideoSrc}
              audioSrc={walkthroughAudioSrc}
              variant="button"
              theme="dark"
              triggerButtonText={t.hero.ctaSecondary}
            />
          </div>

          {/* Micro Trust Strip */}
          <div className="mt-9 flex flex-wrap items-center gap-3 pt-3 border-t border-white/10 text-xs sm:text-[13px] text-white/60">
            <span className="font-semibold text-white">{t.hero.trustRole}</span>
            <span className="text-white/30">·</span>
            <Link href="/tram-sac" className="text-emerald-400 font-medium hover:underline">
              {t.hero.trustStationsLink}
            </Link>
          </div>
        </Reveal>

        {/* Machined Titanium Phone Mockup with 8-12s Looping Preview & Floating Liquid Telemetry */}
        <Reveal delay={120} className="relative flex justify-center lg:justify-end">
          <div className="relative">
            <HeroVideoPreview
              videoSrc={videoSrc}
              posterSrc={posterSrc}
              alt={t.hero.videoPosterAlt}
              hasVideo={true}
            />

            {/* Floating Liquid Telemetry Cards (Motion.dev spring floating physics) */}
            <HeroFloatTelemetry />
          </div>
        </Reveal>
      </div>
    </section>
)}

/* ----------------------- Journey Section ------------------------ */
function JourneySection() {
  const { t } = useTranslation();

  return (
    <section id="cach-hoat-dong" className="bg-[#090D0B] py-16 sm:py-24 lg:py-32 border-y border-white/[0.06]">
      <div className="container-x">
        <Reveal className="mx-auto max-w-2xl text-center mb-14">
          <span className="eyebrow-tag">{t.journey.eyebrow}</span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-balance text-white sm:text-4xl lg:text-5xl leading-[1.24] sm:leading-[1.26] lg:leading-[1.28]">
            {t.journey.titlePart1}<span className="text-gradient">{t.journey.titleHighlight}</span>
          </h2>
          <p className="mt-3 text-white/70 text-sm sm:text-base leading-relaxed">
            {t.journey.description}
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
  const { t } = useTranslation();

  return (
    <section id="tinh-nang" className="py-16 sm:py-24 lg:py-32 bg-[#070A08]">
      <div className="container-x">
        <Reveal className="max-w-2xl">
          <span className="eyebrow-tag">{t.bento.eyebrow}</span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-balance text-white sm:text-4xl lg:text-5xl leading-[1.24] sm:leading-[1.26] lg:leading-[1.28]">
            {t.bento.title}
          </h2>
          <p className="mt-3 text-sm sm:text-base text-white/70 leading-relaxed">
            {t.bento.description}
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
            <div className="double-bezel w-full flex flex-col">
              <div className="double-bezel-inner flex-1 flex flex-col justify-between !p-5 sm:!p-8">
                <div>
                  <span className="pill bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/20">
                    <QrIcon className="h-3.5 w-3.5" /> {t.bento.qr.badge}
                  </span>
                  <h3 className="mt-4 text-xl sm:text-2xl font-bold text-white">
                    {t.bento.qr.title}
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-white/70 leading-relaxed">
                    {t.bento.qr.description}
                  </p>
                </div>

                {/* Laser QR Visual Card with animated sweep */}
                <div className="mt-6 relative overflow-hidden rounded-2xl border border-white/10 bg-[#121A16] p-5 text-center">
                  <div className="mx-auto relative flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30 shadow-sm">
                    <QrIcon className="h-9 w-9" />
                    {/* Animated Laser Scanning Line */}
                    <div className="pointer-events-none absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-glow-laser animate-laser-sweep" />
                  </div>
                  <p className="mt-3.5 font-mono text-xs font-bold text-emerald-400 tracking-wider">
                    {t.bento.qr.sweepTag}
                  </p>
                  <p className="text-[10px] font-mono text-white/40 mt-1">{t.bento.qr.sampleTag}</p>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Bento Tile 3: 100% Refund Policy & Grace Period Scrubber (Span 4) */}
          <Reveal delay={120} className="flex lg:col-span-4">
            <div className="double-bezel w-full flex flex-col">
              <div className="double-bezel-inner flex-1 flex flex-col justify-between !p-5 sm:!p-8">
                <InteractiveRefundScrubber />
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

/* -------------------- Walkthrough Showcase Section -------------- */
function WalkthroughSection() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const walkthroughVideoSrc =
    locale === "en"
      ? process.env.NEXT_PUBLIC_CHARGEOPS_WALKTHROUGH_VIDEO_EN_URL || mediaAsset("videos/chargeops-master-walkthrough-80s-v2-en.mp4")
      : process.env.NEXT_PUBLIC_CHARGEOPS_WALKTHROUGH_VIDEO_VI_URL || mediaAsset("videos/chargeops-master-walkthrough-80s-v2-vi.mp4");
  const walkthroughAudioSrc = process.env.NEXT_PUBLIC_CHARGEOPS_WALKTHROUGH_AUDIO_URL || undefined;

  return (
    <section id="video-demo" className="py-16 sm:py-24 lg:py-32 bg-[#090D0B] border-y border-white/[0.06] relative overflow-hidden">
      {/* Soft ambient emerald radial aura */}
      <div className="pointer-events-none absolute -top-40 right-1/4 h-96 w-96 rounded-full bg-emerald-500/[0.07] blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 left-1/4 h-96 w-96 rounded-full bg-emerald-500/[0.06] blur-[120px]" />

      <div className="container-x relative">
        <Reveal className="max-w-3xl mb-12">
          <span className="eyebrow-tag">
            <BoltIcon className="h-3.5 w-3.5 text-primary" /> {t.walkthrough.eyebrow}
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-balance text-white sm:text-4xl lg:text-5xl leading-[1.24] sm:leading-[1.26] lg:leading-[1.28]">
            {t.walkthrough.title}
          </h2>
          <p className="mt-3 text-sm sm:text-base text-white/70 leading-relaxed max-w-2xl">
            {t.walkthrough.description}
          </p>
        </Reveal>

        <Reveal delay={80}>
          <WalkthroughTheater
            videoSrc={walkthroughVideoSrc}
            audioSrc={walkthroughAudioSrc}
            variant="banner"
            posterSrc={mediaAsset("stations/futuristic-hub.jpg")}
          />
        </Reveal>

        {/* Product highlights across the Driver and Owner chapters */}
        <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-3">
          {t.walkthrough.highlights.map((item) => (
            <div
              key={item.tag}
              className="rounded-2xl border border-white/10 bg-[#0E1512] p-5 shadow-sm space-y-1 transition-all duration-300 hover:border-emerald-500/40 hover:shadow-glow-emerald"
            >
              <span className="text-xs font-mono font-bold text-emerald-400">{item.tag}</span>
              <p className="text-sm font-bold text-white">{item.title}</p>
              <p className="text-xs text-white/60 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------- Owner band --------------------------- */
function OwnerBand() {
  const { t } = useTranslation();

  return (
    <section id="doi-tac" className="relative overflow-hidden py-16 sm:py-24 lg:py-32 bg-[#090D0B] border-y border-white/[0.06]">
      <div className="container-x relative">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.3fr] lg:gap-16">
          <Reveal>
            <span className="eyebrow-tag">
              <BoltIcon className="h-3.5 w-3.5 text-emerald-400" /> {t.owner.eyebrow}
            </span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-balance text-white sm:text-4xl lg:text-5xl leading-[1.24] sm:leading-[1.26] lg:leading-[1.28]">
              {t.owner.title}
            </h2>
            <p className="mt-4 text-base sm:text-lg leading-relaxed text-white/70">
              {t.owner.description}
            </p>

            <div className="mt-7 space-y-3">
              {t.owner.features.map((featureText) => (
                <div key={featureText} className="flex items-start gap-3 text-sm text-white/80 font-medium">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                    <CheckIcon className="h-2.5 w-2.5" />
                  </span>
                  <span>{featureText}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href="https://console.chargeops.online"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-island-primary"
              >
                <span>{t.owner.openConsole}</span>
                <span className="btn-icon-bubble">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="h-4 w-4">
                    <path d="M7 17L17 7M17 7H7M17 7V17" />
                  </svg>
                </span>
              </a>

              <a
                href="mailto:support@chargeops.online?subject=Đăng ký hợp tác trạm sạc ChargeOps"
                className="btn-island-secondary"
              >
                <span>{t.owner.contactPartner}</span>
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
              title={t.owner.consoleTitle}
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
  const { t } = useTranslation();

  return (
    <section id="tai-ung-dung" className="py-16 sm:py-24 lg:py-32 bg-[#070A08]">
      <div className="container-x">
        <Reveal>
          <div className="double-bezel max-w-4xl mx-auto">
            <div className="double-bezel-inner relative overflow-hidden bg-gradient-to-b from-[#0E1512] via-[#121A16] to-[#070A08] p-8 sm:p-14 text-center border border-emerald-500/30">
              <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
              <div className="pointer-events-none absolute -left-24 -bottom-24 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
              <div className="relative">
                <span className="pill bg-emerald-500/15 text-emerald-400 font-bold mb-4 border border-emerald-500/20">
                  {t.download.eyebrow}
                </span>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white text-balance mt-3 leading-[1.24] sm:leading-[1.26] lg:leading-[1.28]">
                  {t.download.title}
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-sm sm:text-base text-white/70 leading-relaxed">
                  {t.download.description}
                </p>

                <div className="mt-8 flex flex-col items-center gap-6">
                  <QrDownload />
                  <div className="pt-2 text-center">
                    <p className="text-xs text-white/60 mb-3">{t.download.officialMobileApp}</p>
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
