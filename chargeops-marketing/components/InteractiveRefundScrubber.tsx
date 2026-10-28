"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { RefundIcon, ClockIcon } from "./Icons";
import { SPRINGS } from "@/lib/motionTokens";
import { useTranslation } from "@/lib/i18n";

/**
 * Interactive Timeline Scrubber for Cancellation & Refund Policy
 *
 * Demonstrates the 10-Minute Grace Period logic:
 * - 0 to 10 min: 100% full refund if changing plans.
 * - >10 min: 0% refund (locked for anti-abuse & reserving the bay).
 */
export function InteractiveRefundScrubber() {
  const { t, locale } = useTranslation();
  const [minutes, setMinutes] = useState<number>(4);

  const isGracePeriod = minutes <= 10;
  const refundPercent = isGracePeriod ? 100 : 0;
  const rText = t.bento.refund;

  return (
    <div className="flex flex-col justify-between h-full space-y-5">
      <div>
        <div className="flex items-center justify-between gap-2">
          <span className="pill bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/20">
            <RefundIcon className="h-3.5 w-3.5" /> {rText.badge}
          </span>
          <span className="font-mono text-[11px] text-white/50">{rText.sampleTag}</span>
        </div>

        <h3 className="mt-3 text-xl sm:text-2xl font-bold text-white">
          {rText.title}
        </h3>
        <p className="mt-1.5 text-xs sm:text-sm text-white/70 leading-relaxed">
          {rText.description}
        </p>
      </div>

      {/* Interactive Timeline Visualizer Card */}
      <div className="rounded-2xl border border-white/10 bg-[#121A16] p-4 sm:p-5 space-y-4">
        {/* Scrubber Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-emerald-400 border border-white/10">
              <ClockIcon className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-white/50 font-mono">
                {rText.timeElapsedLabel}
              </p>
              <p className="text-base font-extrabold text-white font-mono">
                {rText.minutesUnit.replace("{count}", String(minutes))}{" "}
                <span className="text-xs text-white/50 font-sans font-normal">{rText.afterDepositUnit}</span>
              </p>
            </div>
          </div>

          <motion.div
            key={refundPercent}
            initial={{ scale: 0.88 }}
            animate={{ scale: 1 }}
            transition={SPRINGS.haptic}
            className={`px-3 py-1.5 rounded-xl border text-right transition-colors duration-300 ${
              isGracePeriod
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-glow-emerald"
                : "border-amber-500/30 bg-amber-500/10 text-amber-400"
            }`}
          >
            <p className="text-[10px] uppercase font-bold tracking-wider">
              {isGracePeriod ? rText.refundableStatus : rText.lockedStatus}
            </p>
            <p className="text-lg font-black font-mono leading-none mt-0.5">
              {refundPercent}%
            </p>
          </motion.div>
        </div>

        {/* Range Slider */}
        <div className="space-y-2 pt-1">
          <div className="relative">
            {/* 10-Minute Grace Zone Indicator */}
            <div className="absolute top-0 bottom-0 left-0 w-1/3 bg-emerald-500/15 rounded-l-lg pointer-events-none" />
            
            <input
              type="range"
              min={0}
              max={30}
              step={1}
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value))}
              className="w-full accent-emerald-400 h-2 bg-white/10 rounded-lg cursor-pointer"
              aria-label={rText.ariaLabelSlider}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-white/40">
            <span>{rText.min0}</span>
            <span className="text-emerald-400 font-bold">{rText.min10Grace}</span>
            <span>{rText.min30}</span>
          </div>
        </div>

        {/* Dynamic Status Breakdown */}
        <div
          className={`rounded-xl border p-3 text-xs transition-all duration-300 ${
            isGracePeriod
              ? "border-emerald-500/20 bg-emerald-500/[0.06] text-white/90"
              : "border-amber-500/20 bg-amber-500/[0.06] text-white/90"
          }`}
        >
          <div className="flex items-center gap-2 font-bold mb-1">
            <span
              className={`h-2 w-2 rounded-full ${
                isGracePeriod ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
              }`}
            />
            <span className={isGracePeriod ? "text-emerald-400" : "text-amber-400"}>
              {isGracePeriod ? rText.graceActiveTitle : rText.graceExpiredTitle}
            </span>
          </div>
          <p className="text-[11px] text-white/60 leading-relaxed">
            {isGracePeriod ? rText.graceActiveDesc : rText.graceExpiredDesc}
          </p>
        </div>

        {/* Quick Select Buttons */}
        <div className="flex items-center gap-1.5 pt-1">
          {[2, 8, 14, 25].map((m) => (
            <motion.button
              key={m}
              type="button"
              onClick={() => setMinutes(m)}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.94 }}
              transition={SPRINGS.haptic}
              className={`flex-1 min-h-8 cursor-pointer py-1.5 rounded-lg text-[10px] font-mono font-bold transition-colors ${
                minutes === m
                  ? "bg-emerald-500 text-white shadow-sm font-extrabold"
                  : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
              }`}
            >
              {m} {locale === "vi" ? "phút" : "mins"}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
