"use client";

import { CheckIcon, BoltIcon, CalendarIcon, RefundIcon, ShieldCheckIcon } from "./Icons";
import { Reveal } from "./Reveal";
import { useTranslation } from "@/lib/i18n";

export function ProblemComparison() {
  const { t } = useTranslation();

  const chargeOpsIcons = [CalendarIcon, BoltIcon, RefundIcon];

  return (
    <section className="py-24 sm:py-32 overflow-hidden">
      <div className="container-x">
        {/* Section Header */}
        <Reveal className="max-w-2xl mx-auto text-center">
          <span className="eyebrow-tag">
            <BoltIcon className="h-3.5 w-3.5 text-primary" /> {t.problem.eyebrow}
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-balance text-white sm:text-4xl lg:text-5xl leading-[1.24] sm:leading-[1.26] lg:leading-[1.28]">
            {t.problem.title}
          </h2>
          <p className="mt-4 text-base sm:text-lg text-white/70 leading-relaxed">
            {t.problem.description}
          </p>
        </Reveal>

        {/* Asymmetrical Comparison Board */}
        <div className="mt-16 grid gap-8 lg:grid-cols-12 items-stretch">
          {/* Traditional Frustrations (5 cols) */}
          <Reveal delay={80} className="lg:col-span-5 flex">
            <div className="w-full rounded-[2rem] border border-white/10 bg-[#0C120F]/90 p-6 sm:p-8 flex flex-col justify-between shadow-2xl">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red-500/15 text-red-400 text-xs font-bold ring-1 ring-red-500/30">
                    ✕
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-red-400">
                    {t.problem.oldBadge}
                  </span>
                </div>
                <h3 className="mt-4 text-xl font-bold text-white">
                  {t.problem.oldTitle}
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-white/50 leading-relaxed">
                  {t.problem.oldDesc}
                </p>

                <div className="mt-6 space-y-4">
                  {t.problem.oldItems.map((item) => (
                    <div key={item.title} className="rounded-xl border border-red-500/15 bg-red-500/[0.04] p-3.5">
                      <p className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                        <span>•</span> {item.title}
                      </p>
                      <p className="text-[11px] text-white/60 mt-1 leading-relaxed">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 text-center text-xs text-white/40 font-medium">
                {t.problem.oldFooter}
              </div>
            </div>
          </Reveal>

          {/* ChargeOps Peace of Mind (7 cols) */}
          <Reveal delay={140} className="lg:col-span-7 flex">
            <div className="w-full rounded-[2rem] border border-emerald-500/30 bg-[#0D1411]/95 p-6 sm:p-8 lg:p-9 flex flex-col justify-between shadow-[0_24px_50px_-12px_rgba(0,0,0,0.85),0_0_40px_-10px_rgba(16,185,129,0.15)] relative">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="pill bg-emerald-500 text-white font-bold shadow-glow-emerald">
                    <CheckIcon className="h-3 w-3" /> {t.problem.newBadge}
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-400">{t.problem.newTag}</span>
                </div>

                <h3 className="mt-4 text-2xl sm:text-3xl font-extrabold text-white">
                  {t.problem.newTitle}
                </h3>
                <p className="mt-2 text-sm sm:text-base text-white/70 leading-relaxed">
                  {t.problem.newDesc}
                </p>

                <div className="mt-6 space-y-4">
                  {t.problem.newItems.map((item, idx) => {
                    const IconComp = chargeOpsIcons[idx] || CheckIcon;
                    return (
                      <div
                        key={item.title}
                        className="flex items-start gap-3.5 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4 transition-all hover:bg-emerald-500/[0.12] hover:border-emerald-500/40 hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.5),0_0_15px_-4px_rgba(16,185,129,0.15)]"
                      >
                        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-sm">
                          <IconComp className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="text-sm font-bold text-white">{item.title}</p>
                          <p className="text-xs text-white/70 mt-0.5 leading-relaxed">{item.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-8 pt-5 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                  <ShieldCheckIcon className="h-4 w-4" />
                  <span>{t.problem.newFooterBadge}</span>
                </div>
                <a href="https://driver.chargeops.online/?demo=true" target="_blank" rel="noopener noreferrer" className="btn-island-primary text-xs py-2 pl-4 pr-1.5">
                  <span>{t.problem.newCta}</span>
                  <span className="btn-icon-bubble !h-7 !w-7">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="h-3.5 w-3.5">
                      <path d="M7 17L17 7M17 7H7M17 7V17" />
                    </svg>
                  </span>
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
