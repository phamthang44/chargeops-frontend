"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { CalendarIcon, BoltIcon } from "./Icons";
import { SPRINGS } from "@/lib/motionTokens";
import { useTranslation } from "@/lib/i18n";

interface SlotData {
  id: string;
  time: string;
  type: "past" | "reserved" | "available" | "offpeak";
  rate: number;
  availablePlugs: number;
  discount?: string;
}

const SLOTS: SlotData[] = [
  {
    id: "s1",
    time: "11:30 – 12:30",
    type: "past",
    rate: 3200,
    availablePlugs: 0,
  },
  {
    id: "s2",
    time: "14:00 – 15:00",
    type: "reserved",
    rate: 3850,
    availablePlugs: 1,
  },
  {
    id: "s3",
    time: "15:30 – 16:30",
    type: "available",
    rate: 3850,
    availablePlugs: 3,
  },
  {
    id: "s4",
    time: "21:30 – 22:30",
    type: "offpeak",
    rate: 2850,
    availablePlugs: 5,
    discount: "-26%",
  },
];

export function InteractiveSlotScheduler() {
  const { t, locale } = useTranslation();
  const [selectedId, setSelectedId] = useState<string>("s2");
  const selectedSlot = SLOTS.find((s) => s.id === selectedId) || SLOTS[1];

  const sText = t.bento.scheduler;

  return (
    <div className="flex flex-col h-full justify-between">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="pill bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/20">
            <CalendarIcon className="h-3.5 w-3.5" /> {sText.badge}
          </span>
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>{sText.sampleTag}</span>
          </div>
        </div>

        <h3 className="mt-4 text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          {sText.title}
        </h3>
        <p className="mt-2 text-sm text-white/70 max-w-xl leading-relaxed">
          {sText.description}
        </p>
      </div>

      {/* Interactive Slot Selector Bar */}
      <div className="mt-8 rounded-2xl border border-white/10 bg-[#121A16] p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="font-bold text-white">{sText.stationDate}</span>
          </div>
          <span className="text-white/60 text-[11px]">{sText.instruction}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {SLOTS.map((slot) => {
            const isSelected = slot.id === selectedId;
            const isPast = slot.type === "past";

            let statusLabel = sText.plugsRemaining.replace("{count}", String(slot.availablePlugs));
            if (isPast) statusLabel = sText.pastStatus;
            else if (isSelected) statusLabel = sText.selectedStatus;

            return (
              <motion.button
                key={slot.id}
                type="button"
                disabled={isPast}
                onClick={() => setSelectedId(slot.id)}
                whileHover={isPast ? undefined : { scale: 1.02 }}
                whileTap={isPast ? undefined : { scale: 0.96 }}
                transition={SPRINGS.haptic}
                className={`text-left p-3 rounded-xl transition-colors duration-200 relative overflow-hidden cursor-pointer ${
                  isPast
                    ? "opacity-30 bg-[#0E1512] border border-white/5 cursor-not-allowed"
                    : isSelected
                    ? "bg-[#1A2620] border border-emerald-400 shadow-[0_0_16px_rgba(16,185,129,0.35)]"
                    : "bg-[#16221C] border border-white/10 hover:border-emerald-500/40 hover:bg-[#1C2C24]"
                }`}
              >
                {slot.discount && (
                  <span className="absolute top-1.5 right-1.5 bg-emerald-600 text-white font-mono text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                    {slot.discount}
                  </span>
                )}
                <p className="font-mono text-xs font-bold text-white">{slot.time}</p>
                <p
                  className={`text-[10.5px] mt-1 font-semibold ${
                    isSelected ? "text-emerald-400" : "text-white/60"
                  }`}
                >
                  {statusLabel}
                </p>
                <p className="font-mono text-[10px] text-white/50 mt-0.5">
                  {slot.rate.toLocaleString(locale === "vi" ? "vi-VN" : "en-US")} {sText.rateUnit}
                </p>
              </motion.button>
            );
          })}
        </div>

        {/* Selected Slot Dynamic Telemetry Bar */}
        <div className="mt-4 pt-3.5 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
              <BoltIcon className="h-3.5 w-3.5" />
            </span>
            <span className="text-white/80">
              {sText.timeLabel} <strong className="text-white">{selectedSlot.time}</strong>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono font-bold text-emerald-400 text-sm">
              {selectedSlot.rate.toLocaleString(locale === "vi" ? "vi-VN" : "en-US")} {sText.rateUnit}
            </span>
            <span className="text-emerald-400 font-semibold text-[11px] bg-emerald-500/15 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
              {sText.availablePlugsLabel.replace("{count}", String(selectedSlot.availablePlugs))}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
