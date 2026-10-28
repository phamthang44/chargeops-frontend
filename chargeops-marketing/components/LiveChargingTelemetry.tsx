"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { BatteryIcon, BoltIcon, ShieldCheckIcon } from "./Icons";
import { SPRINGS } from "@/lib/motionTokens";
import { useTranslation } from "@/lib/i18n";

export function LiveChargingTelemetry() {
  const { t, locale } = useTranslation();
  const [soc, setSoc] = useState<number>(68);
  const shouldReduceMotion = useReducedMotion();

  // Dynamic calculations based on state (realistic EV charging curve)
  const powerKw = soc > 80 ? 45 : soc > 60 ? 128 : 160;
  const currentA = Math.round((powerKw * 1000) / 400);
  const remainingMin = Math.max(2, Math.round((85 - soc) * 0.45));
  const estimatedCost = Math.round(soc * 520 * 3.85);

  const presets = [35, 60, 68, 85];
  const tel = t.bento.telemetry;

  return (
    <div className="flex flex-col h-full justify-between">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="pill bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/20">
            <BatteryIcon className="h-3.5 w-3.5" /> {tel.badge}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-0.5 rounded-full border border-emerald-500/20">
            <ShieldCheckIcon className="h-3.5 w-3.5" /> {tel.sampleBadge}
          </span>
        </div>

        <h3 className="mt-4 text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          {tel.title}
        </h3>
        <p className="mt-2 text-sm text-white/70 max-w-xl leading-relaxed">
          {tel.description}
        </p>
      </div>

      {/* Interactive Telemetry Cockpit */}
      <div className="mt-8 rounded-2xl border border-white/10 bg-[#121A16] p-5 shadow-inner">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              {tel.liveSessionTag}
            </span>
          </div>

          {/* Quick SoC presets */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-white/50 mr-1 hidden sm:inline">{tel.socLabel}</span>
            {presets.map((preset) => (
              <motion.button
                key={preset}
                type="button"
                whileHover={shouldReduceMotion ? undefined : { scale: 1.05 }}
                whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
                transition={SPRINGS.haptic}
                onClick={() => setSoc(preset)}
                className={`px-2 py-0.5 rounded-md text-xs font-mono font-bold transition-colors ${
                  soc === preset
                    ? "bg-emerald-500 text-white shadow-glow-emerald"
                    : "bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/5"
                }`}
              >
                {preset}%
              </motion.button>
            ))}
          </div>
        </div>

        {/* Dynamic Battery Bar */}
        <div className="relative">
          <div className="flex items-baseline justify-between text-xs font-bold text-white mb-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-mono font-extrabold text-white">{soc}%</span>
              <span className="text-white/60 font-normal text-xs">
                {locale === "vi" ? "Dung lượng hiện tại" : "Current SoC"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400 font-mono text-sm bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
              <BoltIcon className="h-4 w-4 text-emerald-400" />
              <span className="font-bold">{powerKw} kW DC</span>
            </div>
          </div>

          <div className="h-4 w-full rounded-full bg-white/10 overflow-hidden p-0.5">
            <motion.div
              className="h-full rounded-full bg-brand-gradient shadow-glow-emerald relative"
              animate={{ width: `${soc}%` }}
              transition={shouldReduceMotion ? { duration: 0.1 } : SPRINGS.buoyant}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </motion.div>
          </div>

          <div className="mt-2.5 flex items-center justify-between text-[11px] text-white/50">
            <span>{locale === "vi" ? "20% (Khởi điểm)" : "20% (Start)"}</span>
            <input
              type="range"
              min="20"
              max="95"
              value={soc}
              onChange={(e) => setSoc(Number(e.target.value))}
              className="h-1.5 w-36 accent-emerald-400 cursor-pointer"
              aria-label={tel.sliderAria}
            />
            <span>{locale === "vi" ? "95% (Đầy bình)" : "95% (Full)"}</span>
          </div>
        </div>

        {/* Telemetry Sensor Metrics */}
        <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center sm:text-left">
          <div className="rounded-xl bg-[#16221C] p-2.5 border border-white/10">
            <p className="text-[10px] text-white/50 uppercase font-bold tracking-wider">
              {locale === "vi" ? "Điện áp nạp" : "Voltage (DC)"}
            </p>
            <p className="font-mono text-sm font-bold text-white mt-0.5">398 V</p>
          </div>
          <div className="rounded-xl bg-[#16221C] p-2.5 border border-white/10">
            <p className="text-[10px] text-white/50 uppercase font-bold tracking-wider">
              {tel.current}
            </p>
            <p className="font-mono text-sm font-bold text-white mt-0.5">{currentA} A</p>
          </div>
          <div className="rounded-xl bg-[#16221C] p-2.5 border border-white/10">
            <p className="text-[10px] text-white/50 uppercase font-bold tracking-wider">
              {tel.remainingTime}
            </p>
            <p className="font-mono text-sm font-bold text-emerald-400 mt-0.5">
              ~{tel.remainingMinutes.replace("{min}", String(remainingMin))}
            </p>
          </div>
          <div className="rounded-xl bg-[#16221C] p-2.5 border border-white/10">
            <p className="text-[10px] text-white/50 uppercase font-bold tracking-wider">
              {tel.estimatedCost}
            </p>
            <p className="font-mono text-sm font-bold text-white mt-0.5">
              {estimatedCost.toLocaleString(locale === "vi" ? "vi-VN" : "en-US")} {tel.costUnit}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
