"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { PhoneFrame } from "./PhoneFrame";
import { BoltIcon, CheckIcon } from "./Icons";
import { SPRINGS, EASINGS } from "@/lib/motionTokens";
import { useTranslation } from "@/lib/i18n";
import { mediaAsset } from "@/lib/media";

const STAGE_SCREENS = [
  { screenSrc: mediaAsset("screens/app-map-new.png"), screenAlt: "App Map" },
  { screenSrc: mediaAsset("screens/app-bookings-new.png"), screenAlt: "App Bookings" },
  { screenSrc: mediaAsset("screens/app-home-new.png"), screenAlt: "App Session" },
];

export function JourneyTimeline() {
  const { t, locale } = useTranslation();
  const [activeStage, setActiveStage] = useState<number>(0);

  const stages = t.journey.stages.map((stage, idx) => ({
    ...stage,
    screenSrc: STAGE_SCREENS[idx]?.screenSrc || STAGE_SCREENS[0].screenSrc,
    screenAlt: STAGE_SCREENS[idx]?.screenAlt || STAGE_SCREENS[0].screenAlt,
  }));

  const current = stages[activeStage] || stages[0];

  return (
    <div className="w-full">
      {/* Stage Selector Tabs with Fluid layoutId Spring Pill */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-12 sm:mb-16">
        {stages.map((s, idx) => {
          const isActive = idx === activeStage;
          return (
            <button
              key={s.step}
              type="button"
              onClick={() => setActiveStage(idx)}
              className={`relative cursor-pointer inline-flex items-center gap-2.5 rounded-full px-5 py-2.5 text-xs sm:text-sm font-bold transition-colors duration-300 ${
                isActive
                  ? "text-white"
                  : "border border-white/10 bg-[#121A16] text-white/70 hover:border-emerald-500/40 hover:bg-[#16221C] hover:text-white"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTimelinePill"
                  className="absolute inset-0 rounded-full bg-emerald-500 shadow-glow-emerald"
                  transition={SPRINGS.layout}
                />
              )}
              <span
                className={`relative z-10 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-mono ${
                  isActive ? "bg-black/25 text-white" : "bg-white/10 text-white/60"
                }`}
              >
                {s.step}
              </span>
              <span className="relative z-10">{s.title.split("&")[0].trim()}</span>
            </button>
          );
        })}
      </div>

      {/* Main Asymmetrical Showcase Stage */}
      <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-14">
        {/* Left Interactive Phone Frame Container (5 cols) */}
        <div className="lg:col-span-5 flex justify-center order-2 lg:order-1">
          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStage}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.35, ease: EASINGS.decelerate }}
              >
                <PhoneFrame
                  src={current.screenSrc}
                  alt={current.screenAlt}
                  priority
                  float
                />
              </motion.div>
            </AnimatePresence>

            {/* Dynamic Step Floating Indicator */}
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 rounded-full border border-white/15 bg-[#0E1512]/95 px-4 py-1.5 shadow-lg backdrop-blur-xl">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                {locale === "vi" ? "BƯỚC" : "STEP"} {current.step} / 03 · {current.badge}
              </span>
            </div>
          </div>
        </div>

        {/* Right Stage Narrative Details (7 cols) */}
        <div className="lg:col-span-7 order-1 lg:order-2 flex flex-col justify-center">
          <div className="rounded-[2rem] border border-white/10 bg-[#0D1411]/95 p-7 sm:p-9 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.75)]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStage}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3, ease: EASINGS.decelerate }}
              >
                <span className="eyebrow-tag">
                  <BoltIcon className="h-3.5 w-3.5 text-primary" /> {current.badge}
                </span>

                <h3 className="mt-4 text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  {current.title}
                </h3>
                <p className="mt-2 text-sm sm:text-base font-semibold text-emerald-400">
                  {current.subtitle}
                </p>

                <p className="mt-4 text-sm sm:text-base leading-relaxed text-white/70">
                  {current.description}
                </p>

                <div className="mt-7 space-y-3 border-t border-white/10 pt-6">
                  {current.features.map((feat) => (
                    <div key={feat} className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
                        <CheckIcon className="h-3 w-3" />
                      </span>
                      <span className="text-sm font-semibold text-white/90">{feat}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Progress Stepper Action */}
            <div className="mt-8 pt-4 flex items-center justify-between border-t border-white/10">
              <div className="flex gap-2">
                {stages.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={locale === "vi" ? `Chuyển tới bước ${i + 1}` : `Go to step ${i + 1}`}
                    onClick={() => setActiveStage(i)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i === activeStage ? "w-8 bg-emerald-500" : "w-2 bg-white/20 hover:bg-white/40"
                    }`}
                  />
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={activeStage === 0}
                  onClick={() => setActiveStage((p) => Math.max(0, p - 1))}
                  aria-label={locale === "vi" ? "Bước trước" : "Previous step"}
                  className="cursor-pointer inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-[#121A16] text-white/80 transition hover:border-emerald-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  ←
                </button>
                <button
                  type="button"
                  disabled={activeStage === stages.length - 1}
                  onClick={() => setActiveStage((p) => Math.min(stages.length - 1, p + 1))}
                  aria-label={locale === "vi" ? "Bước tiếp theo" : "Next step"}
                  className="cursor-pointer inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-[#121A16] text-white/80 transition hover:border-emerald-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
