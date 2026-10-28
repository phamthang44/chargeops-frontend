"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { SPRINGS } from "@/lib/motionTokens";
import { useTranslation } from "@/lib/i18n";

interface HeroVideoPreviewProps {
  videoSrc?: string;
  posterSrc?: string;
  alt?: string;
  className?: string;
  hasVideo?: boolean;
}

/**
 * Hero Video Preview (8–12s Looping Driver App Flow)
 *
 * Placed inside a machined titanium phone frame with:
 * - Dynamic Island & specular glass glare
 * - Zero 404 network errors: only renders <video> if hasVideo={true}
 * - Crisp Retina poster presentation with smooth ambient emerald backlight
 * - Motion.dev GPU-accelerated spring buoyancy
 */
export function HeroVideoPreview({
  videoSrc,
  posterSrc = "/screens/app-home-new.png",
  alt,
  className = "",
  hasVideo = false,
}: HeroVideoPreviewProps) {
  const { t } = useTranslation();
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const effectiveAlt = alt || t.hero.videoPosterAlt;

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
      {/* Ambient Emerald Backlight Glow */}
      <div className="pointer-events-none absolute -inset-6 rounded-[4rem] bg-gradient-to-tr from-primary/25 via-emerald-500/10 to-transparent blur-3xl opacity-75 animate-pulse" />

      {/* Machined Dark Titanium Outer Shell with Motion.dev Buoyancy */}
      <motion.div
        animate={
          shouldReduceMotion
            ? undefined
            : {
                y: [0, -8, 0],
                transition: {
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut",
                },
              }
        }
        whileHover={
          shouldReduceMotion
            ? undefined
            : {
                y: -12,
                rotateZ: -0.75,
                transition: SPRINGS.buoyant,
              }
        }
        className="relative w-[275px] sm:w-[315px] rounded-[3.25rem] p-2 sm:p-2.5 bg-gradient-to-b from-[#2E3C35] via-[#16221C] to-[#0A100D] ring-1 ring-white/20 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.85),0_0_0_1px_rgba(0,0,0,0.9)] cursor-pointer"
      >
        {/* Inner OLED Display Container */}
        <div className="relative aspect-[9/19.5] w-full overflow-hidden rounded-[2.6rem] bg-black ring-1 ring-white/10">
          {/* Dynamic Island pill */}
          <div className="absolute left-1/2 top-3 z-30 flex h-5 w-24 -translate-x-1/2 items-center justify-between rounded-full bg-black px-2.5 ring-1 ring-white/10 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-[#0a1510] ring-1 ring-primary/40 animate-pulse" />
            <span className="h-1.5 w-1.5 rounded-full bg-[#121e18]" />
          </div>

          {/* Micro Status Tag: Driver App Preview */}
          <div className="absolute top-10 left-1/2 z-20 -translate-x-1/2 pointer-events-none">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-black/80 px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-emerald-400 backdrop-blur-md ring-1 ring-white/15 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
              {hasVideo ? t.hero.videoTagDemo : t.hero.videoTagInterface}
            </span>
          </div>

          {/* Retina Poster Display */}
          <Image
            src={posterSrc}
            alt={effectiveAlt}
            width={600}
            height={1300}
            priority
            className={`h-full w-full object-cover transition-transform duration-700 hover:scale-[1.02] ${
              hasVideo && isPlaying ? "opacity-0 absolute inset-0" : "opacity-100"
            }`}
          />

          {/* Optional HTML5 Video (Only rendered when a real video source is enabled) */}
          {hasVideo && videoSrc && (
            <video
              ref={videoRef}
              src={videoSrc}
              poster={posterSrc}
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

          {/* Precision Specular Glare */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.03] to-white/[0.14]" />

          {/* Bottom Home Indicator */}
          <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 h-1 w-28 rounded-full bg-white/40 backdrop-blur" />
        </div>
      </motion.div>
    </div>
  );
}
