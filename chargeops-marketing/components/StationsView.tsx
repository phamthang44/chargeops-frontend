"use client";

import Link from "next/link";
import { StationDirectory } from "@/components/StationDirectory";
import { StoreBadges } from "@/components/StoreBadges";
import type { CoverageStation } from "@/components/stations";
import { useTranslation } from "@/lib/i18n";

export function StationsView({
  stations,
  isLive,
}: {
  stations: CoverageStation[];
  isLive: boolean;
}) {
  const { t } = useTranslation();

  return (
    <>
      <section className="relative overflow-hidden bg-soft-radial pb-6">
        <div className="container-x py-10 sm:py-14">
          <nav
            aria-label="Breadcrumb"
            className="mb-6 inline-flex flex-wrap items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium text-white/60 shadow-glass backdrop-blur-md"
          >
            <Link href="/" className="hover:text-emerald-400 transition-colors">
              {t.stationsPage.breadcrumbHome}
            </Link>
            <span aria-hidden className="text-white/30">/</span>
            <span className="text-emerald-400 font-semibold">{t.stationsPage.breadcrumbNetwork}</span>
          </nav>

          <div className="max-w-3xl">
            <span className="eyebrow-tag mb-3.5 inline-flex">{t.stationsPage.eyebrow}</span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.24] sm:leading-[1.26] lg:leading-[1.28]">
              {t.stationsPage.titlePart1}<span className="text-gradient">{t.stationsPage.titleHighlight}</span>
            </h1>
            <p className="mt-4 text-base sm:text-lg text-white/70 leading-relaxed">
              {t.stationsPage.description}
            </p>
          </div>
        </div>
      </section>

      <StationDirectory initialStations={stations} initialIsLive={isLive} />

      <section className="border-t border-white/10 bg-[#0B100D] py-20">
        <div className="container-x flex flex-col items-center gap-5 text-center">
          <span className="eyebrow-tag">{t.stationsPage.instantBookingEyebrow}</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            {t.stationsPage.instantBookingTitle}
          </h2>
          <p className="max-w-xl text-sm leading-relaxed text-white/70">
            {t.stationsPage.instantBookingDescription}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-2">
            <a
              href="https://driver.chargeops.online/?demo=true"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-island-primary text-xs py-2.5 px-5"
            >
              <span>{t.stationsPage.tryDriverCta}</span>
              <span className="btn-icon-bubble">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="h-3.5 w-3.5">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </span>
            </a>
            <StoreBadges className="justify-center" />
          </div>
        </div>
      </section>
    </>
  );
}
