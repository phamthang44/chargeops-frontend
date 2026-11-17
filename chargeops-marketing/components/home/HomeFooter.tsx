"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { useLocale } from "@/lib/i18n";
import { DRIVER_DEMO_URL, SUPPORT_EMAIL } from "@/lib/home/content";
import { EASE_OUT, ExternalIcon, GlobeIcon, Wordmark, useAnchorScroll, useHomeCopy, useHomeHref } from "./core";

export function HomeFooter() {
  const c = useHomeCopy();
  const { locale, setLocale } = useLocale();
  const anchorScroll = useAnchorScroll();
  const homeHref = useHomeHref();
  const reduce = useReducedMotion();
  const year = new Date().getFullYear();

  return (
    <footer className="relative bg-hm-brand">
      <div className="rounded-b-[24px] rounded-br-[80px] bg-hm-ink px-5 pb-8 pt-16 text-white md:px-10 lg:rounded-br-[160px] lg:px-14 lg:pt-20">
        <div className="mx-auto grid max-w-[1320px] gap-12 lg:grid-cols-12 lg:gap-6">
          <div className="lg:col-span-3">
            <Wordmark tone="white" />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/60">{c.hero.subtitle}</p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-6">
            {c.footer.cols.map((col) => (
              <div key={col.title}>
                <p className="text-sm font-semibold text-white">{col.title}</p>
                <ul className="mt-4 space-y-3">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      {l.href.startsWith("/") ? (
                        <Link href={l.href} className="text-sm text-white/65 transition hover:text-white">
                          {l.label}
                        </Link>
                      ) : (
                        <a
                          href={homeHref(l.href)}
                          {...(l.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                          onClick={(e) => {
                            if (anchorScroll(l.href)) e.preventDefault();
                          }}
                          className="inline-flex items-center gap-1.5 break-all text-sm text-white/65 transition hover:text-white"
                        >
                          {l.label}
                          {l.external && <ExternalIcon className="h-3 w-3 shrink-0" />}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="lg:col-span-3">
            <p className="text-sm font-semibold">{c.footer.appTitle}</p>
            <div className="mt-4 flex flex-col items-start gap-3">
              <a
                href={DRIVER_DEMO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center gap-2 rounded-full border border-white/30 px-5 text-sm text-white transition hover:bg-white hover:text-hm-ink"
              >
                {c.footer.appWeb}
                <ExternalIcon />
              </a>
              <span className="inline-flex h-11 items-center rounded-full border border-dashed border-white/20 px-5 text-sm text-white/50">
                {c.footer.appSoon}
              </span>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-14 flex max-w-[1320px] flex-col gap-5 border-t border-white/10 pt-6 text-[13px] text-white/55 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-5">
            <button
              type="button"
              onClick={() => setLocale(locale === "vi" ? "en" : "vi")}
              className="inline-flex items-center gap-1.5 transition hover:text-white"
            >
              <GlobeIcon />
              {locale === "vi" ? "Tiếng Việt · Switch to English" : "English · Chuyển sang Tiếng Việt"}
            </button>
            <a href={`mailto:${SUPPORT_EMAIL}`} className="transition hover:text-white">
              {c.footer.help}
            </a>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <span>{c.footer.copyright.replace("{year}", String(year))}</span>
            {c.footer.legal.map((l) => (
              <Link key={l.href} href={l.href} className="transition hover:text-white">
                {l.label}
              </Link>
            ))}
            <span className="text-white/40">{c.footer.aiNote}</span>
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden" aria-hidden="true">
        <motion.p
          className="select-none whitespace-nowrap px-3 text-center font-display text-[19.5vw] font-bold leading-[0.78] tracking-[-0.06em] text-white"
          initial={reduce ? false : { y: "45%" }}
          whileInView={{ y: "14%" }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 1.4, ease: EASE_OUT }}
        >
          chargeops
        </motion.p>
      </div>
      {/* room for the sticky mobile app bar */}
      <div className="h-[130px] lg:hidden" />
    </footer>
  );
}
