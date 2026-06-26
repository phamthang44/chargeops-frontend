"use client";

import { useMemo, useState } from "react";
import { CITIES, STATIONS } from "./stations";

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
          <span className="pill bg-primary-soft text-primary-dark">Độ phủ</span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-ink-strong sm:text-4xl">
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
                  <span className="pill bg-surface-alt text-ink-body">
                    {s.fast ? "⚡ Sạc nhanh DC" : "Sạc thường AC"}
                  </span>
                  <span className="text-sm font-semibold text-primary-dark">
                    {s.pricePerKwh}/kWh
                  </span>
                </div>
              </article>
            );
          })}
        </div>

        <p className="mt-8 text-sm text-ink-muted">
          Dữ liệu hiển thị mang tính minh hoạ.{" "}
          <a href="#tai-ung-dung" className="font-semibold text-primary-dark">
            Tải ứng dụng
          </a>{" "}
          để xem trạm sạc theo thời gian thực và đặt chỗ.
        </p>
      </div>
    </section>
  );
}
