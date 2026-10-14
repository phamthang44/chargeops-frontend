"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CITIES, STATIONS } from "./stations";
import { BoltIcon, ACPlugIcon } from "./Icons";

/**
 * Public, read-only station coverage — the "bridge" that lets a web visitor
 * check if ChargeOps covers their area before downloading. No login, no
 * booking: every action funnels to the app download.
 */
export function CoverageSection() {
  const [city, setCity] = useState<(typeof CITIES)[number]>("Tất cả");

  const stations = useMemo(
    () => (city === "Tất cả" ? STATIONS : STATIONS.filter((s) => s.city === city)),
    [city]
  );

  return (
    <section id="tram-sac" className="bg-[#FAFBFB] py-24 sm:py-32 border-b border-black/[0.05]">
      <div className="container-x">
        <div className="max-w-2xl">
          <span className="eyebrow-tag">MẠNG LƯỚI TRẠM SẠC</span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-balance text-ink-strong sm:text-4xl">
            ChargeOps có mặt gần bạn
          </h2>
          <p className="mt-3 text-base text-ink-body leading-relaxed">
            Xem nhanh các trạm sạc đang mở trong khu vực. Mở ứng dụng để kiểm tra khung giờ trống thời gian thực và đặt chỗ trước.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          {CITIES.map((c) => (
            <button
              key={c}
              onClick={() => setCity(c)}
              className={`cursor-pointer rounded-full px-4 py-2 text-xs font-semibold transition-all duration-200 ease-haptic ${
                city === c
                  ? "bg-primary text-white shadow-glow-emerald"
                  : "border border-black/10 bg-white text-ink-body hover:border-primary/40 hover:bg-surface-alt active:scale-[0.98]"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {stations.map((s) => {
            const full = s.available === 0;
            return (
              <div key={s.id} className="double-bezel hover:-translate-y-1">
                <article className="double-bezel-inner !p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-bold text-ink-strong truncate">{s.name}</h3>
                    <span
                      className={`pill text-[11px] shrink-0 font-bold ${
                        full
                          ? "bg-danger/10 text-danger"
                          : "bg-primary-soft text-primary-dark"
                      }`}
                    >
                      {full ? "Hết chỗ" : `${s.available}/${s.total} trụ trống`}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-ink-muted">
                    {s.district}, {s.city}
                  </p>
                  <div className="mt-5 flex items-center justify-between border-t border-black/[0.04] pt-3.5">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-alt px-2.5 py-1 text-xs font-semibold text-ink-body">
                      {s.fast ? (
                        <>
                          <BoltIcon className="h-3.5 w-3.5 text-primary" /> Sạc DC siêu nhanh
                        </>
                      ) : (
                        <>
                          <ACPlugIcon className="h-3.5 w-3.5 text-primary" /> Sạc tiêu chuẩn AC
                        </>
                      )}
                    </span>
                    <span className="font-mono text-xs font-bold text-primary-dark">
                      {s.pricePerKwh}/kWh
                    </span>
                  </div>
                </article>
              </div>
            );
          })}
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 pt-2">
          <Link
            href="/tram-sac"
            className="btn-island-secondary text-xs sm:text-sm"
          >
            <span>Xem toàn bộ mạng lưới trạm sạc</span>
            <span className="btn-icon-bubble">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="h-3.5 w-3.5">
                <path d="M7 17L17 7M17 7H7M17 7V17" />
              </svg>
            </span>
          </Link>
          <p className="text-xs sm:text-sm text-ink-muted">
            Dữ liệu được cập nhật từ hệ thống quản lý trạm. Mở ứng dụng để giữ chỗ ngay.
          </p>
        </div>
      </div>
    </section>
  );
}
