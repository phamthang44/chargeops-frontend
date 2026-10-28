"use client";

import { BoltIcon } from "./Icons";
import { useTranslation } from "@/lib/i18n";

/**
 * Ecosystem Architecture Strip
 * Highlights the 4 interconnected components of ChargeOps:
 * 1. Driver Mobile App
 * 2. Charging Simulator (OCPP)
 * 3. Owner Web Console
 * 4. Admin Management Portal
 */
export function EcosystemStrip() {
  const { t } = useTranslation();

  return (
    <section className="border-y border-white/[0.08] bg-[#0A0E0C] py-7 sm:py-9 relative overflow-hidden">
      <div className="container-x flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30">
            <BoltIcon className="h-4 w-4" />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <span>{t.ecosystem.eyebrow}</span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
            </p>
            <p className="text-[11px] text-white/50">{t.ecosystem.subtitle}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-semibold text-white/90">
          {t.ecosystem.pillars.map((p) => (
            <div
              key={p.name}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-[#121A16]/80 px-3.5 py-2 backdrop-blur-md transition-colors hover:border-emerald-500/30"
            >
              <span className="font-mono text-emerald-400 text-xs font-bold">{p.num}</span>
              <div className="min-w-0">
                <p className="text-white text-xs font-bold truncate">{p.name}</p>
                <p className="text-[10px] text-white/40 truncate font-normal">{p.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
