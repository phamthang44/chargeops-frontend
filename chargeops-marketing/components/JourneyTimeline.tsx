"use client";

import { useState } from "react";
import Image from "next/image";
import { PhoneFrame } from "./PhoneFrame";
import { BoltIcon, CalendarIcon, QrIcon, CheckIcon, MapPinIcon } from "./Icons";

interface Stage {
  step: string;
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  screenSrc: string;
  screenAlt: string;
}

const STAGES: Stage[] = [
  {
    step: "01",
    badge: "ĐỊNH VỊ THÔNG MINH",
    title: "Tìm & Kiểm tra trạm sạc quanh bạn",
    subtitle: "Xem thông tin trạm và cổng sạc được hiển thị trong ứng dụng",
    description:
      "Tìm trạm theo khu vực, xem thông tin cổng sạc, giá và tình trạng được ghi nhận để chọn điểm đến phù hợp.",
    features: [
      "Tìm trạm theo khu vực",
      "Xem loại cổng sạc và thông tin trạm",
      "Mở chỉ đường tới địa điểm trạm",
    ],
    screenSrc: "/screens/app-map-new.png",
    screenAlt: "Bản đồ tìm kiếm trạm sạc ChargeOps",
  },
  {
    step: "02",
    badge: "ĐIỀU PHỐI ĐỘC QUYỀN",
    title: "Chọn khung giờ và xem giá",
    subtitle: "Chọn khung giờ và xem giá trước khi xác nhận",
    description:
      "Chọn gói thời gian và khung giờ còn khả dụng, xem lại thông tin rồi xác nhận đặt chỗ trong ứng dụng.",
    features: [
      "Xem giá gói trước khi đặt",
      "Theo dõi trạng thái và hạn giữ chỗ trong ứng dụng",
      "Xem khoản hoàn áp dụng trước khi xác nhận hủy",
    ],
    screenSrc: "/screens/app-bookings-new.png",
    screenAlt: "Màn hình đặt khung giờ sạc xe điện",
  },
  {
    step: "03",
    badge: "XÁC THỰC MỘT CHẠM",
    title: "Quét mã QR để check-in",
    subtitle: "Xác nhận đúng điểm sạc và đặt chỗ",
    description:
      "Khi tới trạm, quét mã QR của cổng đã đặt và xác nhận check-in trong ứng dụng. Việc quét mã chưa đồng nghĩa phiên sạc đã bắt đầu.",
    features: [
      "Ứng dụng kiểm tra thông tin đặt chỗ và mã QR",
      "Trạng thái check-in được ghi nhận trong ứng dụng",
      "Phiên sạc và điều khiển thiết bị phụ thuộc vào trạm được kết nối",
    ],
    screenSrc: "/screens/app-home-new.png",
    screenAlt: "Màn hình điều khiển phiên sạc đang diễn ra",
  },
];

export function JourneyTimeline() {
  const [activeStage, setActiveStage] = useState<number>(0);
  const current = STAGES[activeStage];

  return (
    <div className="w-full">
      {/* Stage Selector Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-12 sm:mb-16">
        {STAGES.map((s, idx) => {
          const isActive = idx === activeStage;
          return (
            <button
              key={s.step}
              type="button"
              onClick={() => setActiveStage(idx)}
              className={`cursor-pointer inline-flex items-center gap-2.5 rounded-full px-5 py-2.5 text-xs sm:text-sm font-bold transition-all duration-300 ease-haptic ${
                isActive
                  ? "bg-primary text-white shadow-glow-emerald scale-[1.02]"
                  : "border border-black/10 bg-white text-ink-body hover:border-primary/40 hover:bg-surface-alt active:scale-[0.98]"
              }`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-mono ${
                  isActive ? "bg-white/20 text-white" : "bg-black/5 text-ink-muted"
                }`}
              >
                {s.step}
              </span>
              <span>{s.title.split("&")[0].trim()}</span>
            </button>
          );
        })}
      </div>

      {/* Main Asymmetrical Showcase Stage */}
      <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-14">
        {/* Left Interactive Phone Frame Container (5 cols) */}
        <div className="lg:col-span-5 flex justify-center order-2 lg:order-1">
          <div className="relative">
            <PhoneFrame
              src={current.screenSrc}
              alt={current.screenAlt}
              priority
              float
            />

            {/* Dynamic Step Floating Indicator */}
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 rounded-full border border-black/10 bg-white/95 px-4 py-1.5 shadow-lg backdrop-blur-xl">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="font-mono text-xs font-bold text-ink-heading uppercase tracking-wider">
                BƯỚC {current.step} / 03 · {current.badge}
              </span>
            </div>
          </div>
        </div>

        {/* Right Stage Narrative Details (7 cols) */}
        <div className="lg:col-span-7 order-1 lg:order-2 flex flex-col justify-center">
          <div className="double-bezel">
            <div className="double-bezel-inner !p-7 sm:!p-9">
              <span className="eyebrow-tag">
                <BoltIcon className="h-3.5 w-3.5 text-primary" /> {current.badge}
              </span>

              <h3 className="mt-4 text-2xl sm:text-3xl font-extrabold tracking-tight text-ink-heading">
                {current.title}
              </h3>
              <p className="mt-2 text-sm sm:text-base font-semibold text-primary-dark">
                {current.subtitle}
              </p>

              <p className="mt-4 text-sm sm:text-base leading-relaxed text-ink-body">
                {current.description}
              </p>

              <div className="mt-7 space-y-3 border-t border-black/[0.05] pt-6">
                {current.features.map((feat) => (
                  <div key={feat} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary-dark">
                      <CheckIcon className="h-3 w-3" />
                    </span>
                    <span className="text-sm font-semibold text-ink-heading">{feat}</span>
                  </div>
                ))}
              </div>

              {/* Progress Stepper Action */}
              <div className="mt-8 pt-4 flex items-center justify-between">
                <div className="flex gap-2">
                  {STAGES.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      aria-label={`Chuyển tới bước ${i + 1}`}
                      onClick={() => setActiveStage(i)}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        i === activeStage ? "w-8 bg-primary" : "w-2 bg-black/15 hover:bg-black/30"
                      }`}
                    />
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={activeStage === 0}
                    onClick={() => setActiveStage((p) => Math.max(0, p - 1))}
                    aria-label="Bước trước"
                    className="cursor-pointer inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white text-ink-body transition hover:border-primary disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    disabled={activeStage === STAGES.length - 1}
                    onClick={() => setActiveStage((p) => Math.min(STAGES.length - 1, p + 1))}
                    aria-label="Bước tiếp theo"
                    className="cursor-pointer inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white text-ink-body transition hover:border-primary disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
