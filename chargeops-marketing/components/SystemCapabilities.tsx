"use client";

import { Reveal } from "./Reveal";
import { useTranslation } from "@/lib/i18n";

/**
 * System Capabilities Dashboard
 * Replaces the generic stats strip with authentic software engineering metrics.
 */
export function SystemCapabilities() {
  const { t } = useTranslation();

  return (
    <section className="py-8 sm:py-12 bg-[#070A08]">
      <div className="container-x">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-r from-[#0E1512] via-[#121A16] to-[#0E1512] p-6 sm:p-8 lg:p-10 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.75)]">
            {/* Subtle grid pattern */}
            <div className="pointer-events-none absolute inset-0 bg-grid opacity-15" />

            <div className="relative grid grid-cols-2 gap-6 sm:gap-8 lg:grid-cols-4 text-center divide-y lg:divide-y-0 lg:divide-x divide-white/10">
              {t.capabilities.metrics.map((it, idx) => (
                <div key={it.label} className={`py-3 lg:py-2 px-2 ${idx > 1 ? "pt-6 lg:pt-2" : ""}`}>
                  <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-emerald-400 tracking-tight font-mono">
                    {it.metric}
                  </div>
                  <div className="mt-2 text-xs sm:text-sm font-bold text-white leading-snug">
                    {it.label}
                  </div>
                  <div className="mt-1 text-[11px] text-white/50 max-w-[22ch] mx-auto leading-relaxed">
                    {it.description}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
