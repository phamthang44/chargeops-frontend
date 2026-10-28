"use client";

import { ReactNode, useRef, useEffect, useState } from "react";
import Image from "next/image";

export interface PhoneMockupProps {
  src?: string;
  videoSrc?: string;
  hasVideo?: boolean;
  alt?: string;
  priority?: boolean;
  float?: boolean;
  className?: string;
  children?: ReactNode;
  tag?: string;
  badge?: string;
}

/**
 * High-End Machined Titanium Phone Mockup (Dark Edition)
 *
 * Designed according to Direction B: Cinematic Energy-Tech.
 * Features:
 * - Concentric double-bezel curvature
 * - Dynamic Island with sensor glow
 * - Specular reflection overlay
 * - Automatic poster / fallback handling
 * - Future-proof video support (<video> only plays when hasVideo && videoSrc, zero 404s)
 */
export function PhoneMockup({
  src = "/screens/app-home-new.png",
  videoSrc,
  hasVideo = false,
  alt = "ChargeOps Driver Mobile App",
  priority = false,
  float = false,
  className = "",
  children,
  tag,
  badge,
}: PhoneMockupProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (hasVideo && videoSrc && videoRef.current) {
      videoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  }, [hasVideo, videoSrc]);

  return (
    <div className={`relative ${className}`}>
      {/* Ambient emerald backlight aura */}
      <div className="pointer-events-none absolute -inset-5 rounded-[4rem] bg-gradient-to-tr from-primary/25 via-emerald-500/10 to-transparent blur-3xl opacity-75 animate-pulse" />

      {/* Titanium Outer Shell (Double-Bezel Hardware Architecture) */}
      <div
        className={`relative w-[270px] sm:w-[310px] rounded-[3.25rem] p-2 sm:p-2.5 bg-gradient-to-b from-[#2E3C35] via-[#16221C] to-[#0A100D] ring-1 ring-white/20 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.85),0_0_0_1px_rgba(0,0,0,0.9)] transition-transform duration-700 ease-haptic ${
          float ? "animate-float-slow" : ""
        }`}
      >
        {/* Inner OLED Display Container */}
        <div className="relative aspect-[9/19.5] w-full overflow-hidden rounded-[2.6rem] bg-black ring-1 ring-white/10">
          {/* Dynamic Island Pill */}
          <div className="absolute left-1/2 top-3 z-30 flex h-5 w-24 -translate-x-1/2 items-center justify-between rounded-full bg-black px-2.5 ring-1 ring-white/10 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-[#0a1510] ring-1 ring-primary/40 animate-pulse" />
            <span className="h-1.5 w-1.5 rounded-full bg-[#121e18]" />
          </div>

          {/* Optional Overlay Tag / Badge */}
          {(tag || badge) && (
            <div className="absolute top-10 left-1/2 z-20 -translate-x-1/2 pointer-events-none">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-black/80 px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-emerald-400 backdrop-blur-md ring-1 ring-white/15 shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                {tag || badge}
              </span>
            </div>
          )}

          {/* Children Slot (Custom UI) or Media Slot */}
          {children ? (
            <div className="h-full w-full overflow-y-auto">{children}</div>
          ) : (
            <>
              {/* Poster Image */}
              {src && (
                <Image
                  src={src}
                  alt={alt}
                  width={600}
                  height={1300}
                  priority={priority}
                  className={`h-full w-full object-cover transition-transform duration-700 hover:scale-[1.02] ${
                    hasVideo && isPlaying ? "opacity-0 absolute inset-0" : "opacity-100"
                  }`}
                />
              )}

              {/* Future Video Integration Point (Autoplay, Loop, Muted, PlaysInline) */}
              {hasVideo && videoSrc && (
                <video
                  ref={videoRef}
                  src={videoSrc}
                  poster={src}
                  muted
                  autoPlay
                  loop
                  playsInline
                  onPlaying={() => setIsPlaying(true)}
                  onError={() => setIsPlaying(false)}
                  className={`h-full w-full object-cover transition-opacity duration-700 ${
                    isPlaying ? "opacity-100" : "opacity-0"
                  }`}
                />
              )}
            </>
          )}

          {/* Precision Specular Optical Glare */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.03] to-white/[0.12]" />

          {/* Bottom Home Indicator Bar */}
          <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 h-1 w-28 rounded-full bg-white/40 backdrop-blur" />
        </div>
      </div>
    </div>
  );
}
