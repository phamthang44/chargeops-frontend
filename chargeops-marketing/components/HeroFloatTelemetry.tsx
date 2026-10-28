"use client";

import { motion, useReducedMotion } from "motion/react";
import { CalendarIcon, BatteryIcon } from "./Icons";
import { SPRINGS } from "@/lib/motionTokens";
import { useTranslation } from "@/lib/i18n";

export function HeroFloatTelemetry() {
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();

  return (
    <>
      {/* Float Card 1: Slot Reserved Confirmation */}
      <motion.div
        initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -20, y: 10 }}
        animate={
          shouldReduceMotion
            ? { opacity: 1 }
            : {
                opacity: 1,
                x: 0,
                y: [0, -6, 0],
                transition: {
                  y: { duration: 5, repeat: Infinity, ease: "easeInOut" },
                  opacity: { duration: 0.6, delay: 0.3 },
                  x: { duration: 0.6, delay: 0.3 },
                },
              }
        }
        whileHover={
          shouldReduceMotion
            ? undefined
            : { scale: 1.04, y: -4, transition: SPRINGS.haptic }
        }
        className="absolute right-[calc(100%+0.75rem)] lg:right-[calc(100%+1.25rem)] top-8 z-20 hidden lg:flex items-center gap-3.5 rounded-2xl border border-white/10 bg-[#0E1512]/92 p-3 shadow-diffusion backdrop-blur-xl text-white cursor-pointer transition-transform hover:border-emerald-500/30 whitespace-nowrap"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 shadow-sm shrink-0">
          <CalendarIcon className="h-5 w-5" />
        </span>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              {t.hero.telemetryReservedBadge}
            </p>
          </div>
          <p className="text-xs sm:text-sm font-extrabold text-white">{t.hero.telemetryReservedSlot}</p>
          <p className="text-[10px] sm:text-[11px] text-white/60">{t.hero.telemetryReservedLocation}</p>
        </div>
      </motion.div>

      {/* Float Card 2: Live Charging Telemetry (Positioned cleanly below/right of the phone screen so the bottom payment CTA is 100% visible) */}
      <motion.div
        initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: 20, y: 10 }}
        animate={
          shouldReduceMotion
            ? { opacity: 1 }
            : {
                opacity: 1,
                x: 0,
                y: [0, 8, 0],
                transition: {
                  y: { duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 },
                  opacity: { duration: 0.6, delay: 0.5 },
                  x: { duration: 0.6, delay: 0.5 },
                },
              }
        }
        whileHover={
          shouldReduceMotion
            ? undefined
            : { scale: 1.04, y: 4, transition: SPRINGS.haptic }
        }
        className="absolute -bottom-10 -right-6 sm:-right-12 lg:-right-20 z-20 hidden md:flex items-center gap-3.5 rounded-2xl border border-white/10 bg-[#0E1512]/92 p-3 shadow-diffusion backdrop-blur-xl text-white cursor-pointer transition-transform hover:border-emerald-500/30 whitespace-nowrap"
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 shadow-sm shrink-0">
          <BatteryIcon className="h-5 w-5" />
        </span>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              {t.hero.telemetryChargingBadge}
            </p>
          </div>
          <p className="text-sm font-extrabold text-white font-mono">{t.hero.telemetryChargingStatus}</p>
          <p className="text-[11px] text-white/60">{t.hero.telemetryChargingLocation}</p>
        </div>
      </motion.div>
    </>
  );
}
