"use client";

import { useState } from "react";
import Image from "next/image";
import { BoltIcon } from "@/components/Icons";

interface StationPhotoShowcaseProps {
  stationName: string;
  stationAddress: string;
  images: string[];
  maxPowerKw?: number | null;
  fast?: boolean;
}

export function StationPhotoShowcase({
  stationName,
  stationAddress,
  images,
  maxPowerKw,
  fast,
}: StationPhotoShowcaseProps) {
  const [activeIdx, setActiveIdx] = useState(0);

  const photoList =
    images && images.length > 0
      ? images
      : [
          "/stations/futuristic-hub.jpg",
          "/stations/hub-exterior.jpg",
          "/stations/charger-close.jpg",
          "/stations/mall-indoor.jpg",
        ];

  const currentImage = photoList[activeIdx] || photoList[0];

  return (
    <div className="space-y-3">
      {/* Main Double-Bezel Featured Showcase */}
      <div className="group relative overflow-hidden rounded-[2rem] bg-white/[0.04] p-1.5 sm:p-2 ring-1 ring-white/10 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:shadow-diffusion-dark hover:ring-emerald-500/30">
        <div className="relative aspect-[16/10] sm:aspect-[21/9] w-full overflow-hidden rounded-[calc(2rem-0.5rem)] bg-[#0C1210]">
          <Image
            src={currentImage}
            alt={`${stationName} - Hình ảnh thực tế trụ sạc`}
            fill
            priority
            className="object-cover transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.03]"
            sizes="(max-width: 1280px) 100vw, 1200px"
          />

          {/* Cinematic Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/10" />
          <div className="absolute inset-0 bg-radial-gradient from-transparent to-black/40 pointer-events-none" />

          {/* Top Floating Badge Bar */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-xl px-3.5 py-1.5 text-[11px] font-bold text-white/95 ring-1 ring-white/20 shadow-lg">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Hình ảnh thực tế tại trạm
            </span>

            {maxPowerKw ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/90 backdrop-blur-xl px-3.5 py-1.5 text-[11px] font-extrabold text-white shadow-glow-emerald">
                <BoltIcon className="h-3.5 w-3.5 text-white" />
                <span>Sạc siêu tốc {maxPowerKw}kW</span>
              </span>
            ) : fast ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/90 backdrop-blur-xl px-3.5 py-1.5 text-[11px] font-extrabold text-white shadow-glow-emerald">
                <BoltIcon className="h-3.5 w-3.5 text-white" />
                <span>Sạc nhanh DC</span>
              </span>
            ) : null}
          </div>

          {/* Bottom Floating Metadata Caption */}
          <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3 text-white pointer-events-none">
            <div className="max-w-xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-400">
                ChargeOps Network Hub
              </p>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight drop-shadow-md">
                {stationName}
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-white/80 line-clamp-1 drop-shadow">
                {stationAddress}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded-full bg-white/20 backdrop-blur-md px-3 py-1 text-[11px] font-semibold text-white/95 ring-1 ring-white/30">
                Ảnh {activeIdx + 1} / {photoList.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Multi-Angle Thumbnail Strip (If > 1 photo) */}
      {photoList.length > 1 && (
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 pt-1 no-scrollbar">
          {photoList.map((img, idx) => {
            const isActive = idx === activeIdx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveIdx(idx)}
                className={`group relative h-16 w-24 sm:h-20 sm:w-32 shrink-0 overflow-hidden rounded-2xl p-1 transition-all duration-300 ${
                  isActive
                    ? "bg-emerald-500 ring-2 ring-emerald-500 ring-offset-2 ring-offset-[#070A08] scale-100 shadow-glow-emerald"
                    : "bg-white/[0.04] ring-1 ring-white/10 opacity-70 hover:opacity-100 hover:scale-[1.02] hover:ring-white/30"
                }`}
              >
                <div className="relative h-full w-full overflow-hidden rounded-[calc(1rem-0.15rem)]">
                  <Image
                    src={img}
                    alt={`${stationName} thumbnail ${idx + 1}`}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="128px"
                  />
                  <div
                    className={`absolute inset-0 transition-opacity ${
                      isActive ? "bg-transparent" : "bg-black/25 group-hover:bg-transparent"
                    }`}
                  />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
