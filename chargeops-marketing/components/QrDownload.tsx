"use client";

import { BrandMark } from "./Logo";
import { useTranslation } from "@/lib/i18n";

const DRIVER_DEMO_URL = "https://driver.chargeops.online/?demo=true";

/**
 * Interactive driver experience block.
 * Connects directly to driver.chargeops.online with mock driver pre-authenticated (?demo=true)
 * so prospective users and drivers can experience the full product flow without installation.
 */
export function QrDownload() {
  const { t } = useTranslation();
  const N = 15;
  const cells = Array.from({ length: N * N }, (_, i) => {
    const r = Math.floor(i / N);
    const c = i % N;
    const finder =
      (r < 4 && c < 4) || (r < 4 && c > N - 5) || (r > N - 5 && c < 4);
    const center = r >= 6 && r <= 8 && c >= 6 && c <= 8;
    const on =
      !finder && !center && ((r * 11 + c * 17 + (r ^ c) * 7) % 7 < 3);
    return { i, on, finder, center };
  });

  return (
    <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#0E1512] p-5 sm:p-6 text-left shadow-diffusion transition hover:border-emerald-500/40">
      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* Scannable / Clickable QR Card */}
        <a
          href={DRIVER_DEMO_URL}
          target="_blank"
          rel="noopener noreferrer"
          title={t.download.qrScanTitle}
          className="group/qr relative flex shrink-0 flex-col items-center justify-center rounded-2xl bg-[#121A16] p-3 ring-1 ring-white/10 transition-all duration-300 hover:scale-105 hover:ring-emerald-500 shadow-sm"
        >
          <div
            className="relative grid h-32 w-32 gap-[2px] rounded-xl bg-white p-1"
            style={{ gridTemplateColumns: `repeat(${N}, minmax(0, 1fr))` }}
          >
            {cells.map((cell) =>
              cell.finder || cell.center ? (
                <span key={cell.i} className="bg-transparent" />
              ) : (
                <span
                  key={cell.i}
                  className={`rounded-[1px] ${
                    cell.on ? "bg-slate-900" : "bg-transparent"
                  }`}
                />
              )
            )}
            {/* Corner Finders */}
            <Finder className="left-1 top-1" />
            <Finder className="right-1 top-1" />
            <Finder className="bottom-1 left-1" />
            {/* Center Logo */}
            <span className="absolute left-1/2 top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-lg bg-white shadow-md ring-1 ring-slate-100">
              <BrandMark size={22} />
            </span>
          </div>

          <span className="mt-2 text-[10px] font-bold tracking-tight text-white/60 group-hover/qr:text-emerald-400 transition-colors flex items-center gap-1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="h-3 w-3">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14h2v2h-2zm0-10h2v8h-2z" />
            </svg>
            {t.download.qrScanHint}
          </span>
        </a>

        {/* Action & Context */}
        <div className="flex-1 flex flex-col justify-between text-left">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400 border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {t.download.qrBadge}
            </span>
            <span className="text-[11px] text-white/50">{t.download.qrAccount}</span>
          </div>

          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
            {t.download.qrTitle}
          </h3>
          <p className="mt-1 text-xs sm:text-sm text-white/70 leading-relaxed">
            {t.download.qrDescription}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <a
              href={DRIVER_DEMO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-glow-emerald transition-all duration-300 hover:bg-primary-dark hover:scale-[1.02] active:scale-[0.98]"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="h-4 w-4">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
              <span>{t.download.qrCta}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="h-3.5 w-3.5 opacity-80">
                <path d="M7 17L17 7M17 7H7M17 7V17" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function Finder({ className }: { className?: string }) {
  return (
    <span
      className={`absolute h-7 w-7 rounded-[7px] border-[3px] border-slate-900 bg-white ${
        className ?? ""
      }`}
    >
      <span className="absolute inset-1 rounded-[3px] bg-slate-900" />
    </span>
  );
}
