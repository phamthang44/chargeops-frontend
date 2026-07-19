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
    <section id="tram-sac" className="bg-surface-alt py-20 sm:py-24">
      <div className="container-x">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight text-balance text-ink-strong sm:text-4xl">
            ChargeOps có mặt gần bạn
          </h2>
          <p className="mt-3 text-ink-body">
            Xem nhanh các trạm sạc trong khu vực. Mở ứng dụng để đặt chỗ trước,
            xem khung giờ trống và thanh toán.
          </p>
        </div>

        <div className="mt-7 flex flex-wrap gap-2">
          {CITIES.map((c) => (
            <button
              key={c}
              onClick={() => setCity(c)}
              className={`rounded-pill px-4 py-2 text-sm font-medium transition ${
                city === c
                  ? "bg-primary text-white shadow-glass"
                  : "border border-line bg-white text-ink-body hover:border-primary/40"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stations.map((s) => {
            const full = s.available === 0;
            return (
              <article
                key={s.id}
                className="rounded-card border border-line bg-white p-5 shadow-card"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold text-ink-strong">{s.name}</h3>
                  <span
                    className={`pill ${
                      full
                        ? "bg-danger/10 text-danger"
                        : "bg-primary-soft text-primary-dark"
                    }`}
                  >
                    {full ? "Hết chỗ" : `${s.available}/${s.total} trống`}
                  </span>
                </div>
                <p className="mt-1 text-sm text-ink-muted">
                  {s.district}, {s.city}
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <span className="pill inline-flex items-center gap-1 bg-surface-alt text-ink-body">
                    {s.fast ? <><BoltIcon className="h-3.5 w-3.5" /> Sạc nhanh DC</> : <><ACPlugIcon className="h-3.5 w-3.5" /> Sạc thường AC</>}
                  </span>
                  <span className="text-sm font-semibold text-primary-dark">
                    {s.pricePerKwh}/kWh
                  </span>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-3">
          <Link
            href="/tram-sac"
            className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-white px-5 py-2.5 text-sm font-semibold text-primary-dark transition hover:border-primary/60 hover:bg-primary-soft/40"
          >
            Xem tất cả trạm sạc <span aria-hidden>›</span>
          </Link>
          <p className="text-sm text-ink-muted">
            Dữ liệu hiển thị mang tính minh hoạ. Mở ứng dụng để xem theo thời
            gian thực và đặt chỗ.
          </p>
        </div>
      </div>
    </section>
  );
}
