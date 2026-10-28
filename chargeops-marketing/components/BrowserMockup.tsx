"use client";

import { ReactNode, useRef, useEffect, useState } from "react";
import Image from "next/image";

export interface BrowserMockupProps {
  children?: ReactNode;
  src?: string;
  videoSrc?: string;
  hasVideo?: boolean;
  alt?: string;
  priority?: boolean;
  url?: string;
  title?: string;
  className?: string;
  statusBadge?: string;
}

/**
 * High-End macOS Dark Desktop Browser Window Mockup
 *
 * Designed for showcasing Web Console dashboards, analytics, and admin controls.
 * Features:
 * - macOS Traffic Lights (red, yellow, green)
 * - Monospace SSL Lock address bar
 * - LIVE / Simulated Status Indicator
 * - Supports custom children or image / future video playback
 */
export function BrowserMockup({
  children,
  src,
  videoSrc,
  hasVideo = false,
  alt = "ChargeOps Web Operator Console",
  priority = false,
  url = "https://console.chargeops.online/owner/pricing",
  title = "ChargeOps Operator Console — Quản trị trạm sạc",
  className = "",
  statusBadge = "LIVE",
}: BrowserMockupProps) {
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
    <div className={`double-bezel shadow-2xl ${className}`}>
      <div className="relative overflow-hidden rounded-[calc(2rem-0.375rem)] border border-white/10 bg-[#0E1512] shadow-sm">
        {/* Window Titlebar */}
        <div className="flex items-center justify-between border-b border-white/10 bg-[#0B100D] px-4 py-3 backdrop-blur">
          {/* macOS Traffic Lights */}
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#FF5F56] shadow-sm ring-1 ring-black/10" />
            <span className="h-3 w-3 rounded-full bg-[#FFBD2E] shadow-sm ring-1 ring-black/10" />
            <span className="h-3 w-3 rounded-full bg-[#27C93F] shadow-sm ring-1 ring-black/10" />
          </div>

          {/* Address Bar */}
          <div className="mx-2 flex max-w-sm flex-1 items-center justify-center gap-2 rounded-lg border border-white/10 bg-[#16221C] px-3.5 py-1 text-[11px] font-medium text-white/80 shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)] sm:max-w-md">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="h-3 w-3 text-primary"
              aria-hidden="true"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span className="truncate font-mono text-[10.5px] text-emerald-400">{url}</span>
          </div>

          {/* Right Tab Status Indicator */}
          <div className="flex items-center gap-1.5 opacity-90">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="hidden text-[10px] font-semibold uppercase tracking-wider text-emerald-400/90 sm:inline">
              {statusBadge}
            </span>
          </div>
        </div>

        {/* Screen Content Container */}
        <div className="relative overflow-hidden bg-[#070A08]">
          {children ? (
            children
          ) : (
            <>
              {src && (
                <Image
                  src={src}
                  alt={alt}
                  width={1400}
                  height={800}
                  priority={priority}
                  className={`h-auto w-full object-cover transition-transform duration-700 hover:scale-[1.01] ${
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
                  className={`h-auto w-full object-cover transition-opacity duration-700 ${
                    isPlaying ? "opacity-100" : "opacity-0"
                  }`}
                />
              )}
            </>
          )}

          {/* Specular hairline refraction */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.02] to-white/[0.08]" />
        </div>
      </div>
    </div>
  );
}
