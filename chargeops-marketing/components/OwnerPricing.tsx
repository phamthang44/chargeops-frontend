"use client";

import { useState } from "react";
import { CheckIcon, BoltIcon } from "@/components/Icons";
import { Reveal } from "./Reveal";
import { useTranslation } from "@/lib/i18n";

export function OwnerPricing() {
  const { t } = useTranslation();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");

  return (
    <section id="bang-gia-license" className="relative overflow-hidden py-16 sm:py-24 lg:py-32 bg-[#070A08] border-t border-white/[0.06]">
      <div className="container-x">
        <Reveal className="text-center max-w-2xl mx-auto">
          <span className="eyebrow-tag">
            <BoltIcon className="h-3.5 w-3.5 text-primary" /> {t.pricing.eyebrow}
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl text-balance leading-[1.24] sm:leading-[1.26] lg:leading-[1.28]">
            {t.pricing.title}
          </h2>
          <p className="mt-4 text-base sm:text-lg text-white/70 leading-relaxed">
            {t.pricing.description}
          </p>

          {/* Interactive Billing Frequency Switcher */}
          <div className="mt-8 flex w-full max-w-md flex-col items-stretch gap-1 rounded-2xl border border-white/10 bg-[#0E1512] p-1.5 shadow-sm sm:inline-flex sm:w-auto sm:flex-row sm:rounded-full sm:gap-2">
            <button
              type="button"
              onClick={() => setBillingCycle("monthly")}
              aria-pressed={billingCycle === "monthly"}
              className={`min-h-11 cursor-pointer whitespace-nowrap rounded-xl px-3 py-2 text-xs sm:rounded-full sm:px-5 sm:text-sm font-semibold transition-all ${
                billingCycle === "monthly"
                  ? "bg-[#1E2E26] text-white shadow-sm ring-1 ring-emerald-500/30"
                  : "text-white/60 hover:text-white"
              }`}
            >
              {t.pricing.monthlyToggle}
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle("yearly")}
              aria-pressed={billingCycle === "yearly"}
              className={`min-h-11 cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-xs sm:rounded-full sm:px-5 sm:text-sm font-bold transition-all ${
                billingCycle === "yearly"
                  ? "bg-primary text-white shadow-glow-emerald"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <span className="whitespace-nowrap">{t.pricing.yearlyToggle}</span>
              <span className={`whitespace-nowrap text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full ${
                billingCycle === "yearly" ? "bg-white/20 text-white" : "bg-emerald-500/20 text-emerald-400"
              }`}>
                {t.pricing.yearlyTermTag}
              </span>
            </button>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-5 lg:mt-14 lg:grid-cols-2 lg:gap-8 max-w-4xl mx-auto items-stretch">
          {/* Monthly Plan */}
          <Reveal delay={80} className="order-2 flex lg:order-1">
            <div
              className={`w-full rounded-[2rem] border bg-[#0D1411]/95 p-5 sm:p-8 flex flex-col justify-between transition-all duration-300 ${
                billingCycle === "monthly"
                  ? "border-emerald-500/40 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.8),0_0_30px_-8px_rgba(16,185,129,0.15)]"
                  : "border-white/10 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.7)] opacity-90 hover:opacity-100 hover:border-white/20"
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white">{t.pricing.monthlyPlan.name}</h3>
                    <p className="text-xs text-white/50 mt-0.5">{t.pricing.monthlyPlan.subtitle}</p>
                  </div>
                  <span className="rounded-full bg-[#16221C] border border-white/10 px-3 py-1 text-xs font-semibold text-white/80">
                    {t.pricing.monthlyPlan.badge}
                  </span>
                </div>

                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white font-mono">{t.pricing.monthlyPlan.price}</span>
                  <span className="text-base font-semibold text-white/80">đ</span>
                  <span className="text-xs text-white/50">/ {t.pricing.monthlyPlan.unit}</span>
                </div>
                <p className="mt-2 text-xs text-white/60 leading-relaxed">
                  {t.pricing.monthlyPlan.subtitle}
                </p>

                <div className="mt-7 border-t border-white/10 pt-6">
                  <p className="text-xs font-bold uppercase tracking-wider text-white/50 mb-3.5">
                    {t.pricing.monthlyPlan.badge}:
                  </p>
                  <ul className="space-y-3 text-xs sm:text-sm text-white/80">
                    {t.pricing.monthlyPlan.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2.5">
                        <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
                          <CheckIcon className="h-2.5 w-2.5" />
                        </span>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-white/10">
                <a
                  href="mailto:support@chargeops.online?subject=Đăng ký Gói Tháng License Trạm sạc ChargeOps"
                  className="btn-island-secondary w-full justify-between text-xs py-2.5 pl-5 pr-2"
                >
                  <span>{t.pricing.monthlyPlan.cta}</span>
                  <span className="btn-icon-bubble">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="h-4 w-4">
                      <path d="M7 17L17 7M17 7H7M17 7V17" />
                    </svg>
                  </span>
                </a>
              </div>
            </div>
          </Reveal>

          {/* Yearly Plan - Best Value */}
          <Reveal delay={160} className="order-1 flex relative lg:order-2">
            <div className="w-full rounded-[2rem] border border-emerald-500/50 bg-[#0D1411]/95 p-5 sm:p-8 flex flex-col justify-between shadow-[0_24px_60px_-15px_rgba(0,0,0,0.85),0_0_40px_-8px_rgba(16,185,129,0.22)] relative">
              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white">{t.pricing.yearlyPlan.name}</h3>
                    <p className="text-xs text-emerald-400 font-semibold mt-0.5">{t.pricing.yearlyPlan.subtitle}</p>
                  </div>
                  <span className="rounded-full bg-emerald-500/15 text-emerald-400 px-3 py-1 text-xs font-bold border border-emerald-500/30">
                    {t.pricing.yearlyPlan.badge}
                  </span>
                </div>

                <div className="mt-6 flex flex-col">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-extrabold text-emerald-400 font-mono">{t.pricing.yearlyPlan.price}</span>
                    <span className="text-base font-semibold text-emerald-400">đ</span>
                    <span className="text-xs text-white/50">/ {t.pricing.yearlyPlan.unit}</span>
                  </div>
                </div>
                <p className="mt-2 text-xs text-white/60 leading-relaxed">
                  {t.pricing.yearlyPlan.subtitle}
                </p>

                <div className="mt-7 border-t border-white/10 pt-6">
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3.5">
                    {t.pricing.yearlyPlan.discountBadge}:
                  </p>
                  <ul className="space-y-3 text-xs sm:text-sm text-white/80">
                    {t.pricing.yearlyPlan.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2.5">
                        <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                          <CheckIcon className="h-2.5 w-2.5" />
                        </span>
                        <span className="font-semibold text-white">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-white/10">
                <a
                  href="mailto:support@chargeops.online?subject=Đăng ký Gói Năm License Trạm sạc ChargeOps"
                  className="btn-island-primary w-full justify-between text-xs py-2.5 pl-5 pr-2"
                >
                  <span>{t.pricing.yearlyPlan.cta}</span>
                  <span className="btn-icon-bubble">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="h-4 w-4">
                      <path d="M7 17L17 7M17 7H7M17 7V17" />
                    </svg>
                  </span>
                </a>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Commitment Note */}
        <Reveal delay={200} className="mt-12 max-w-2xl mx-auto rounded-2xl border border-white/10 bg-[#0E1512] p-4 text-center text-xs text-white/60">
          {t.pricing.note}
        </Reveal>
      </div>
    </section>
  );
}
