"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { SPRINGS } from "@/lib/motionTokens";
import { useTranslation } from "@/lib/i18n";
import { mediaAsset } from "@/lib/media";

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
  posterSrc = mediaAsset("screens/app-home-new.png"),
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
      videoRef.current.load();
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
        className="relative w-[300px] sm:w-[345px] lg:w-[370px] rounded-[2rem] p-[4px] bg-gradient-to-b from-[#2E3C35] via-[#16221C] to-[#0A100D] ring-1 ring-white/20 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.85),0_0_0_1px_rgba(0,0,0,0.9)] cursor-pointer"
      >
        {/* Inner OLED Display Container (Mathematically concentric curve: R_inner = R_outer - padding = 32px - 4px = 28px) */}
        <div className="relative aspect-[9/19.5] w-full overflow-hidden rounded-[calc(2rem-4px)] bg-black ring-1 ring-white/10">
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
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.02] to-white/[0.06]" />

          {/* Bottom Home Indicator */}
          <div className="pointer-events-none absolute bottom-1 left-1/2 -translate-x-1/2 h-0.5 w-16 rounded-full bg-white/25 backdrop-blur" />
        </div>
      </motion.div>
    </div>
  );
}
