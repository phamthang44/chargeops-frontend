"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import type { CoverageStation, Connector } from "@/components/stations";
import { useTranslation } from "@/lib/i18n";
import {
  ArrowRightIcon,
  BoltIcon,
  CheckIcon,
  EASE_OUT,
  ExternalIcon,
  ParallaxImage,
  PillButton,
  PinIcon,
  Reveal,
} from "./core";

/* Connector reference copy (kept from the previous station page). */
const CONNECTOR_SPECS: Record<
  Connector,
  { type: string; typeEn: string; power: string; desc: string; descEn: string; vehicles: string; vehiclesEn: string }
> = {
  CCS2: {
    type: "Sạc nhanh DC",
    typeEn: "DC fast charging",
    power: "60 – 150 kW",
    desc: "Chuẩn cổng sạc DC phổ biến nhất. Sạc 20% lên 80% trong khoảng 20–35 phút.",
    descEn: "The most common DC fast-charging standard. 20% to 80% in about 20–35 minutes.",
    vehicles: "VinFast VF e34, VF5, VF6, VF7, VF8, VF9, Porsche Taycan, Audi e-tron, BMW iX…",
    vehiclesEn: "VinFast VF e34, VF5, VF6, VF7, VF8, VF9, Porsche Taycan, Audi e-tron, BMW iX…",
  },
  CHAdeMO: {
    type: "Sạc nhanh DC",
    typeEn: "DC fast charging",
    power: "50 – 60 kW",
    desc: "Chuẩn cổng sạc DC của Nhật Bản, dòng điện ổn định.",
    descEn: "The Japanese DC fast-charging standard, with steady power delivery.",
    vehicles: "Nissan Leaf, Mitsubishi Outlander PHEV và một số dòng xe nhập khẩu.",
    vehiclesEn: "Nissan Leaf, Mitsubishi Outlander PHEV and some imported models.",
  },
  "Type 2 (AC)": {
    type: "Sạc AC tiêu chuẩn",
    typeEn: "AC standard charging",
    power: "11 – 22 kW",
    desc: "Chuẩn sạc xoay chiều phổ thông, hợp khi đỗ lâu để mua sắm hay làm việc.",
    descEn: "The universal AC standard, good for longer stays while shopping or working.",
    vehicles: "Hầu hết xe thuần điện (BEV) và xe lai sạc điện (PHEV) tại Việt Nam.",
    vehiclesEn: "Most battery-electric (BEV) and plug-in hybrid (PHEV) cars in Vietnam.",
  },
  "GB/T": {
    type: "Sạc nhanh DC / AC",
    typeEn: "DC / AC charging",
    power: "30 – 60 kW",
    desc: "Chuẩn sạc quốc gia của Trung Quốc, có trên các mẫu xe từ thị trường này.",
    descEn: "China's national standard, found on cars built for that market.",
    vehicles: "Wuling Mini EV, BYD, MG và các xe điện nhập từ Trung Quốc.",
    vehiclesEn: "Wuling Mini EV, BYD, MG and other EVs imported from China.",
  },
};

const AMENITY_EN: Record<string, string> = {
  "Mái che": "Covered bays",
  "Bãi đỗ rộng": "Spacious parking",
  Cafe: "Café",
  "Nhà vệ sinh": "Restrooms",
  Wifi: "Wi-Fi",
  "Mở 24/7": "Open 24/7",
  "Thanh toán trong app": "In-app payment",
};

export type OtherStation = { station: CoverageStation; cover: string; price: string };

interface StationDetailProps {
  station: CoverageStation;
  others: OtherStation[];
  photos: string[];
  /** true when the photos are brand illustrations rather than pictures of this site */
  illustrative: boolean;
  mapEmbedUrl: string;
  googleMapsDirectionsUrl: string;
  displayPrice: string;
  isFull: boolean;
}

export function StationDetail({
  station,
  others,
  photos,
  illustrative,
  mapEmbedUrl,
  googleMapsDirectionsUrl,
  displayPrice,
  isFull,
}: StationDetailProps) {
  const { t, locale } = useTranslation();
  const en = locale === "en";
  const reduce = useReducedMotion();
  const bookUrl = `https://driver.chargeops.online/?demo=true&stationId=${encodeURIComponent(station.id)}`;
  const freePct = station.total > 0 ? Math.round((station.available / station.total) * 100) : 0;

  const status =
    station.total === 0
      ? en
        ? "Being updated"
        : "Đang cập nhật"
      : isFull
        ? en
          ? "Full right now"
          : "Tạm hết chỗ"
        : en
          ? `${station.available}/${station.total} ports free`
          : `${station.available}/${station.total} cổng trống`;

  const rise = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 36 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.9, ease: EASE_OUT, delay },
        };

  return (
    <>
      {/* ------------------------------------------------------------ */}
      {/* Hero: text left, framed photo right                            */}
      {/* ------------------------------------------------------------ */}
      <section className="px-4 pb-6 pt-2 lg:pb-10">
        <div className="mx-auto grid max-w-[1400px] grid-cols-1 items-center gap-8 lg:grid-cols-[1.05fr_1fr] lg:gap-12">
          <div className="order-2 lg:order-1 lg:pl-6">
            <motion.nav
              aria-label="Breadcrumb"
              {...rise(0.05)}
              className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-hm-body"
            >
              <Link href="/" className="transition hover:text-hm-ink">
                {t.stationDetail.breadcrumbHome}
              </Link>
              <span aria-hidden="true" className="text-hm-body/40">
                /
              </span>
              <Link href="/tram-sac" className="transition hover:text-hm-ink">
                {t.stationDetail.breadcrumbStations}
              </Link>
              <span aria-hidden="true" className="text-hm-body/40">
                /
              </span>
              <span className="text-hm-ink">{station.city}</span>
            </motion.nav>

            <motion.div {...rise(0.12)} className="mt-6 flex flex-wrap gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium ${
                  station.fast ? "bg-hm-ink text-white" : "bg-hm-mist text-hm-ink"
                }`}
              >
                <BoltIcon className="h-3.5 w-3.5" />
                {station.fast
                  ? `${en ? "DC fast" : "Sạc nhanh DC"}${station.maxPowerKw ? ` ${station.maxPowerKw} kW` : ""}`
                  : en
                    ? "AC standard"
                    : "Sạc AC tiêu chuẩn"}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-hm-mint px-3 py-1.5 text-[13px] font-medium text-hm-deep">
                <span className="h-1.5 w-1.5 rounded-full bg-hm-brand" />
                {station.hours}
              </span>
            </motion.div>

            <motion.h1 {...rise(0.2)} className="t-xl mt-5 text-balance">
              {station.name}
            </motion.h1>

            <motion.p {...rise(0.28)} className="t-body-lg mt-5 flex max-w-xl items-start gap-2 text-hm-body">
              <PinIcon className="mt-1 h-5 w-5 shrink-0 text-hm-deep" />
              <span>{station.address}</span>
            </motion.p>

            <motion.div {...rise(0.36)} className="mt-8 flex flex-wrap items-center gap-3">
              <PillButton
                href={bookUrl}
                external
                label={en ? "Book on Driver Web" : "Thử đặt chỗ trên Driver Web"}
                icon={<BoltIcon />}
                tone="dark"
              />
              <a
                href={googleMapsDirectionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-[72px] items-center gap-2 rounded-full border border-hm-ink/15 px-7 text-[16px] font-medium text-hm-ink transition hover:border-hm-ink/30 hover:bg-hm-paper"
              >
                {en ? "Directions" : "Chỉ đường"}
                <ExternalIcon />
              </a>
            </motion.div>

            <motion.div {...rise(0.44)} className="mt-10 grid max-w-xl grid-cols-2 gap-3">
              <div className="rounded-[20px] bg-hm-paper p-5 ring-1 ring-hm-ink/5">
                <p className="text-[13px] text-hm-body">{en ? "Right now" : "Lúc này"}</p>
                <p className="mt-1 flex items-center gap-2 text-lg font-semibold">
                  <span className={`h-2 w-2 rounded-full ${isFull ? "bg-red-500" : "animate-pulse bg-hm-brand"}`} />
                  {status}
                </p>
              </div>
              <div className="rounded-[20px] bg-hm-paper p-5 ring-1 ring-hm-ink/5">
                <p className="text-[13px] text-hm-body">{en ? "Driver rating" : "Đánh giá"}</p>
                <p className="mt-1 text-lg font-semibold">
                  {station.reviewCount > 0 ? (
                    <>
                      {station.rating.toFixed(1)}
                      <span className="text-sm font-normal text-hm-body">
                        {" "}
                        / 5 · {station.reviewCount} {en ? "reviews" : "lượt"}
                      </span>
                    </>
                  ) : (
                    <span className="text-hm-body">{en ? "No reviews yet" : "Chưa có đánh giá"}</span>
                  )}
                </p>
              </div>
            </motion.div>
          </div>

          <motion.div
            className="frame-tr relative order-1 aspect-[4/5] max-h-[78vh] w-full overflow-hidden bg-hm-mist lg:order-2 lg:aspect-auto lg:h-[min(78vh,760px)]"
            initial={reduce ? false : { clipPath: "inset(12% 8% 12% 8% round 24px)" }}
            animate={{ clipPath: "inset(0% 0% 0% 0% round 0px)" }}
            transition={{ duration: 1.2, ease: EASE_OUT }}
          >
            <motion.div
              className="absolute inset-0"
              initial={reduce ? false : { scale: 1.18 }}
              animate={{ scale: 1 }}
              transition={{ duration: 1.6, ease: EASE_OUT }}
            >
              <Image
                src={photos[0]}
                alt={station.name}
                fill
                preload
                sizes="(min-width: 1024px) 48vw, 100vw"
                className="object-cover"
              />
            </motion.div>
            {illustrative && (
              <span className="absolute bottom-4 left-4 rounded-full bg-white/85 px-3 py-1 text-[11px] font-medium text-hm-body backdrop-blur">
                {en ? "Illustration" : "Ảnh minh hoạ"}
              </span>
            )}
          </motion.div>
        </div>
      </section>

      {/* ------------------------------------------------------------ */}
      {/* Key numbers                                                   */}
      {/* ------------------------------------------------------------ */}
      <section className="px-4 py-12 lg:py-16">
        <div className="mx-auto grid max-w-[1200px] grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
          {[
            {
              label: en ? "Free ports" : "Cổng đang trống",
              value: `${station.available}`,
              unit: `/ ${station.total}`,
              note: station.total > 0 ? (en ? `${freePct}% of capacity free` : `Còn ${freePct}% công suất`) : status,
              bar: station.total > 0 ? freePct : null,
            },
            {
              label: en ? "Peak power" : "Công suất tối đa",
              value: station.maxPowerKw ? `${station.maxPowerKw}` : "—",
              unit: station.maxPowerKw ? "kW" : "",
              note: station.fast ? (en ? "DC fast charging" : "Sạc nhanh DC") : en ? "AC charging" : "Sạc AC",
              bar: null,
            },
            {
              label: en ? "Listed price" : "Đơn giá niêm yết",
              value: displayPrice,
              unit: "/ kWh",
              note: en ? "Metered per session" : "Tính theo điện năng từng phiên",
              bar: null,
            },
            {
              label: en ? "Opening hours" : "Giờ hoạt động",
              value: station.hours,
              unit: "",
              note: en ? "QR check-in on arrival" : "Check-in bằng QR khi tới",
              bar: null,
            },
          ].map((k, i) => (
            <Reveal key={k.label} delay={i * 0.07} className="flex flex-col justify-between rounded-[20px] bg-hm-paper p-5 ring-1 ring-hm-ink/5 md:p-6">
              <p className="text-[13px] text-hm-body">{k.label}</p>
              <p className="mt-3 flex flex-wrap items-baseline gap-x-1.5">
                <span
                  className={`font-bold leading-tight tracking-tight ${
                    k.value.length > 8
                      ? "whitespace-nowrap text-[clamp(1.125rem,0.9rem+0.8vw,1.5rem)]"
                      : "text-[clamp(1.5rem,1.1rem+1.4vw,2.25rem)]"
                  }`}
                >
                  {k.value}
                </span>
                {k.unit && <span className="text-sm text-hm-body">{k.unit}</span>}
              </p>
              <div className="mt-4">
                {k.bar !== null && (
                  <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-hm-ink/10">
                    <motion.div
                      className={`h-full rounded-full ${isFull ? "bg-red-500" : "bg-hm-brand"}`}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${Math.max(6, k.bar)}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.2, ease: EASE_OUT, delay: 0.2 }}
                    />
                  </div>
                )}
                <p className="text-[13px] text-hm-body">{k.note}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------ */}
      {/* Details (left) + sticky map and booking (right)                */}
      {/* ------------------------------------------------------------ */}
      <section className="px-4 pb-16 lg:pb-24">
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-12 lg:grid-cols-[1fr_400px] lg:gap-14">
          <div className="min-w-0 space-y-16">
            {/* About this station */}
            <Reveal>
              <h2 className="t-md">{en ? "About this station" : "Giới thiệu trạm"}</h2>
              <p className="t-body-lg mt-4 whitespace-pre-line text-hm-body">{station.description}</p>
            </Reveal>

            {/* Connectors */}
            <div>
              <Reveal className="flex flex-wrap items-end justify-between gap-3">
                <h2 className="t-md">{en ? "Connectors" : "Chuẩn sạc tương thích"}</h2>
                <span className="rounded-full bg-hm-mint px-3 py-1 text-[13px] font-medium text-hm-deep">
                  {station.connectors.length} {en ? "standards" : "chuẩn"}
                </span>
              </Reveal>
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {station.connectors.map((c, i) => {
                  const spec = CONNECTOR_SPECS[c];
                  return (
                    <Reveal
                      key={c}
                      delay={i * 0.08}
                      className="rounded-[20px] rounded-tr-[48px] border border-hm-ink/10 bg-white p-6 transition hover:border-hm-brand/40"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xl font-bold">{c}</span>
                        {spec && (
                          <span className="whitespace-nowrap rounded-full bg-hm-paper px-3 py-1 text-[13px] text-hm-ink ring-1 ring-hm-ink/5">
                            {spec.power}
                          </span>
                        )}
                      </div>
                      {spec && (
                        <>
                          <p className="mt-3 font-semibold">{en ? spec.typeEn : spec.type}</p>
                          <p className="mt-1.5 text-[15px] leading-relaxed text-hm-body">{en ? spec.descEn : spec.desc}</p>
                          <p className="mt-4 border-t border-hm-ink/10 pt-3 text-[13px] leading-relaxed text-hm-body">
                            <span className="font-medium text-hm-ink">{en ? "Works with: " : "Xe phù hợp: "}</span>
                            {en ? spec.vehiclesEn : spec.vehicles}
                          </p>
                        </>
                      )}
                    </Reveal>
                  );
                })}
              </div>
            </div>

            {/* Amenities */}
            {station.amenities.length > 0 && (
              <Reveal>
                <h2 className="t-md">{t.stationDetail.amenitiesTitle}</h2>
                <ul className="mt-6 flex flex-wrap gap-2.5">
                  {station.amenities.map((a) => (
                    <li key={a} className="inline-flex items-center gap-2 rounded-full bg-hm-mint px-4 py-2.5 text-[15px] text-hm-ink">
                      <CheckIcon className="h-4 w-4 text-hm-deep" />
                      {en ? (AMENITY_EN[a] ?? a) : a}
                    </li>
                  ))}
                </ul>
              </Reveal>
            )}

            {/* Second photo row */}
            {photos.length > 2 && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_1.35fr]">
                <ParallaxImage
                  src={photos[1]}
                  alt=""
                  sizes="(min-width: 1024px) 320px, 50vw"
                  className="frame-tr relative aspect-[4/5] overflow-hidden bg-hm-mist"
                />
                <ParallaxImage
                  src={photos[2]}
                  alt=""
                  sizes="(min-width: 1024px) 440px, 100vw"
                  className="relative aspect-[4/5] overflow-hidden rounded-[20px] bg-hm-mist sm:aspect-auto"
                />
              </div>
            )}

            {/* Arrive and plug in */}
            <div>
              <Reveal>
                <h2 className="t-md">{en ? "Arrive and plug in" : "Đến nơi và cắm sạc"}</h2>
              </Reveal>
              <ol className="mt-6">
                {[
                  en
                    ? "Follow the EV Charging signs as you enter the car park."
                    : "Đi theo biển chỉ dẫn sạc xe điện (EV Charging) khi vào bãi đỗ.",
                  en
                    ? "Park in the bay you reserved in ChargeOps."
                    : "Đỗ đúng ô sạc bạn đã giữ chỗ trên ChargeOps.",
                  en
                    ? "Plug in, then scan the QR code on the charger to start."
                    : "Cắm đầu sạc vào xe, rồi quét mã QR trên trụ để bắt đầu sạc.",
                ].map((step, i) => (
                  <li key={i} className="relative flex items-start gap-5 py-5">
                    <motion.span
                      aria-hidden="true"
                      className="absolute inset-x-0 bottom-0 h-px origin-left bg-hm-ink/10"
                      initial={reduce ? false : { scaleX: 0 }}
                      whileInView={{ scaleX: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.1, ease: EASE_OUT, delay: i * 0.1 }}
                    />
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-hm-mint text-[15px] font-semibold text-hm-deep">
                      {i + 1}
                    </span>
                    <p className="t-body-lg pt-1.5">{step}</p>
                  </li>
                ))}
              </ol>
            </div>

            {/* Booking rules */}
            <div>
              <Reveal>
                <h2 className="t-md">{en ? "How holds work here" : "Giữ chỗ tại trạm này"}</h2>
              </Reveal>
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                {[
                  {
                    illo: "/home/illo-stopwatch.webp",
                    w: 361,
                    h: 440,
                    title: en ? "10-minute hold" : "Giữ chỗ 10 phút",
                    body: en
                      ? "Your slot is held for 10 minutes while you finish paying."
                      : "Khung giờ được giữ riêng cho bạn 10 phút để hoàn tất thanh toán.",
                  },
                  {
                    illo: "/home/illo-phone-qr.webp",
                    w: 347,
                    h: 440,
                    title: en ? "QR check-in" : "Check-in bằng QR",
                    body: en
                      ? "Scan the code on the charger to start. No card needed."
                      : "Quét mã trên trụ để bắt đầu sạc, không cần thẻ từ.",
                  },
                  {
                    illo: "/home/illo-bell.webp",
                    w: 440,
                    h: 427,
                    title: en ? "Full refund window" : "Hoàn tiền 100%",
                    body: en
                      ? "Cancel within 10 minutes of paying, before your slot starts, for a full refund."
                      : "Hủy trong 10 phút sau khi thanh toán và trước giờ sạc thì được hoàn 100%.",
                  },
                ].map((r, i) => (
                  <Reveal key={r.title} delay={i * 0.08} className="rounded-[20px] bg-hm-mint/60 p-5">
                    <Image src={r.illo} alt="" width={r.w} height={r.h} className="h-16 w-auto" />
                    <p className="mt-4 font-semibold">{r.title}</p>
                    <p className="mt-1.5 text-[15px] leading-relaxed text-hm-body">{r.body}</p>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>

          {/* Sticky side column */}
          <aside className="min-w-0">
            <div className="space-y-4 lg:sticky lg:top-6">
              <Reveal className="overflow-hidden rounded-[20px] rounded-tr-[48px] border border-hm-ink/10 bg-white">
                <div className="relative h-[260px] bg-hm-mist">
                  <iframe
                    src={mapEmbedUrl}
                    title={en ? `Map of ${station.name}` : `Bản đồ ${station.name}`}
                    className="h-[calc(100%+38px)] w-full border-0 [filter:saturate(0.6)]"
                    loading="lazy"
                    tabIndex={-1}
                  />
                </div>
                <div className="space-y-4 p-5">
                  <div>
                    <p className="font-semibold">{station.name}</p>
                    <p className="mt-1 text-[15px] text-hm-body">{station.address}</p>
                  </div>
                  <a
                    href={googleMapsDirectionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="small-pill small-pill--dark w-full gap-2"
                  >
                    <PinIcon className="h-4 w-4" />
                    {en ? "Open in Google Maps" : "Mở chỉ đường Google Maps"}
                  </a>
                </div>
              </Reveal>

              <Reveal delay={0.08} className="relative overflow-hidden rounded-[20px] rounded-tr-[48px] bg-hm-ink p-6 text-white">
                <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.35),transparent_65%)]" />
                <div className="relative">
                  <h3 className="text-[22px] font-bold leading-snug">{t.stationDetail.reserveSlotCta}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-white/75">
                    {en
                      ? "Pick a time, pay the hold, and scan the QR code when you pull in."
                      : "Chọn khung giờ, thanh toán giữ chỗ, đến nơi quét QR là sạc."}
                  </p>
                  <div className="mt-6">
                    <PillButton
                      href={bookUrl}
                      external
                      label={en ? "Book on Driver Web" : "Đặt chỗ trên Driver Web"}
                      icon={<BoltIcon />}
                      tone="white"
                      className="w-full"
                    />
                  </div>
                  <p className="mt-4 text-[13px] text-white/60">
                    {en ? "Free web demo · iOS & Android coming soon" : "Bản web dùng thử miễn phí · iOS & Android sắp ra mắt"}
                  </p>
                </div>
              </Reveal>
            </div>
          </aside>
        </div>
      </section>

      {/* ------------------------------------------------------------ */}
      {/* Other stations                                                */}
      {/* ------------------------------------------------------------ */}
      {others.length > 0 && (
        <section className="bg-hm-paper px-4 py-16 lg:py-24">
          <div className="mx-auto max-w-[1200px]">
            <Reveal className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="t-lg max-w-2xl">{en ? "More stations to try" : "Các trạm khác bạn có thể ghé"}</h2>
              <Link
                href="/tram-sac"
                className="group inline-flex items-center gap-2 text-[15px] font-medium text-hm-ink"
              >
                {en ? "All stations" : "Xem tất cả trạm"}
                <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Reveal>

            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {others.map(({ station: s, cover, price }, i) => {
                const full = s.total > 0 && s.available === 0;
                return (
                  <Reveal key={s.id} delay={i * 0.08}>
                    <Link href={`/tram-sac/${s.slug}`} className="group block">
                      <div className="relative aspect-[4/3] overflow-hidden rounded-[16px] rounded-tr-[56px] bg-hm-mist">
                        <Image
                          src={cover}
                          alt=""
                          fill
                          sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
                          className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
                        />
                        <span
                          className={`absolute left-3 top-3 rounded-full px-3 py-1 text-[12px] font-medium backdrop-blur ${
                            s.fast ? "bg-hm-ink/85 text-white" : "bg-white/85 text-hm-ink"
                          }`}
                        >
                          {s.fast ? `DC${s.maxPowerKw ? ` ${s.maxPowerKw} kW` : ""}` : "AC"}
                        </span>
                      </div>
                      <div className="mt-4 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="text-lg font-semibold leading-snug transition group-hover:text-hm-deep">{s.name}</h3>
                          <p className="mt-0.5 truncate text-[15px] text-hm-body">
                            {s.district}, {s.city}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-[13px] font-medium ${
                            full ? "bg-red-50 text-red-700" : "bg-hm-mint text-hm-deep"
                          }`}
                        >
                          {s.total === 0
                            ? en
                              ? "Updating"
                              : "Đang cập nhật"
                            : full
                              ? en
                                ? "Full"
                                : "Hết chỗ"
                              : `${s.available}/${s.total}`}
                        </span>
                      </div>
                      <p className="mt-2 text-[15px] text-hm-ink">
                        {price} <span className="text-hm-body">/ kWh</span>
                      </p>
                    </Link>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
