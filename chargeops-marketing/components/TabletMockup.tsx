"use client";

import { ReactNode, useRef, useEffect, useState } from "react";
import Image from "next/image";

export interface TabletMockupProps {
  src?: string;
  videoSrc?: string;
  hasVideo?: boolean;
  alt?: string;
  priority?: boolean;
  orientation?: "landscape" | "portrait";
  className?: string;
  children?: ReactNode;
  tag?: string;
}

/**
 * High-End Dark Titanium Tablet Mockup (iPad Pro Style)
 *
 * Provides a modern tablet showcase for dispatcher or tablet-based CPO controls.
 * Features:
 * - Slim uniform bezel with chamfered specular edge
 * - Camera sensor dot
 * - Flexible orientation (landscape or portrait)
 * - Future-proof video support (<video> only plays when hasVideo && videoSrc)
 */
export function TabletMockup({
  src,
  videoSrc,
  hasVideo = false,
  alt = "ChargeOps Tablet View",
  priority = false,
  orientation = "landscape",
  className = "",
  children,
  tag,
}: TabletMockupProps) {
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

  const isLandscape = orientation === "landscape";

  return (
    <div className={`relative ${className}`}>
      {/* Ambient Emerald Aura */}
      <div className="pointer-events-none absolute -inset-6 rounded-[3.5rem] bg-gradient-to-tr from-primary/20 via-primary-neon/10 to-transparent blur-3xl opacity-60" />

      {/* Titanium Outer Chassis */}
      <div
        className={`relative rounded-[2.5rem] sm:rounded-[2.75rem] p-3 sm:p-4 bg-gradient-to-b from-[#25322C] via-[#121A16] to-[#0A100D] ring-1 ring-white/20 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.85),0_0_0_1px_rgba(0,0,0,0.9)] ${
          isLandscape ? "w-full max-w-[680px]" : "w-[340px] sm:w-[420px]"
        }`}
      >
        {/* Inner Screen */}
        <div
          className={`relative overflow-hidden rounded-[1.8rem] sm:rounded-[2rem] bg-black ring-1 ring-white/10 ${
            isLandscape ? "aspect-[16/10]" : "aspect-[3/4]"
          }`}
        >
          {/* Tablet Front Camera Dot */}
          <div
            className={`absolute z-30 flex items-center justify-center ${
              isLandscape
                ? "top-2 left-1/2 -translate-x-1/2 h-2.5 w-2.5"
                : "top-2 left-1/2 -translate-x-1/2 h-2.5 w-2.5"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-[#16221C] ring-1 ring-white/20" />
          </div>

          {/* Optional Overlay Tag */}
          {tag && (
            <div className="absolute top-4 left-4 z-20 pointer-events-none">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-black/80 px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-emerald-400 backdrop-blur-md ring-1 ring-white/15 shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                {tag}
              </span>
            </div>
          )}

          {/* Children / Media Slot */}
          {children ? (
            <div className="h-full w-full overflow-y-auto">{children}</div>
          ) : (
            <>
              {src && (
                <Image
                  src={src}
                  alt={alt}
                  width={isLandscape ? 1200 : 800}
                  height={isLandscape ? 750 : 1060}
                  priority={priority}
                  className={`h-full w-full object-cover transition-transform duration-700 hover:scale-[1.02] ${
                    hasVideo && isPlaying ? "opacity-0 absolute inset-0" : "opacity-100"
                  }`}
                />
              )}

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

          {/* Specular Glare */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.02] to-white/[0.10]" />

          {/* Home Bar Indicator */}
          <div
            className={`pointer-events-none absolute left-1/2 -translate-x-1/2 h-1 rounded-full bg-white/40 backdrop-blur ${
              isLandscape ? "bottom-2 w-36" : "bottom-2 w-28"
            }`}
          />
        </div>
      </div>
    </div>
  );
}
