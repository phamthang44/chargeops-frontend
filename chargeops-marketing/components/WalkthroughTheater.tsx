"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useTranslation } from "@/lib/i18n";

interface WalkthroughTheaterProps {
  videoSrc?: string;
  posterSrc?: string;
  triggerButtonText?: string;
  variant?: "button" | "card" | "banner";
  theme?: "light" | "dark";
}

const CHAPTER_METAS = [
  { id: "booking", time: "00:00", seconds: 0, previewImage: "/screens/app-map-new.png" },
  { id: "checkin", time: "00:25", seconds: 25, previewImage: "/screens/app-home-new.png" },
  { id: "owner", time: "00:48", seconds: 48, previewImage: "/screens/owner-pricing-new.png" },
  { id: "admin", time: "01:08", seconds: 68, previewImage: "/stations/futuristic-hub.jpg" },
];

/**
 * Product Walkthrough Theater (60–90s)
 *
 * Implements:
 * 1. Zero 404 network errors (only loads <video> if videoSrc is provided)
 * 2. Theme-aware button (light mode: crystal island button; dark mode: glass dark)
 * 3. Liquid Glass 2.0 theater modal with ambient backlight
 * 4. Interactive chapter navigation scrub bar with live preview transitions
 * 5. High-end Doppelrand double-bezel architecture
 */
export function WalkthroughTheater({
  videoSrc,
  posterSrc = "/stations/futuristic-hub.jpg",
  triggerButtonText,
  variant = "button",
  theme = "light",
}: WalkthroughTheaterProps) {
  const { t, locale } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [activeChapter, setActiveChapter] = useState(0);
  const [mounted, setMounted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const effectiveButtonText = triggerButtonText || t.walkthrough.triggerButtonText;

  const chapters = useMemo(() => {
    return t.walkthrough.chapters.map((chap, idx) => ({
      ...chap,
      id: CHAPTER_METAS[idx].id,
      time: CHAPTER_METAS[idx].time,
      seconds: CHAPTER_METAS[idx].seconds,
      previewImage: CHAPTER_METAS[idx].previewImage,
    }));
  }, [t]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const seekToChapter = (seconds: number, index: number) => {
    setActiveChapter(index);
    if (videoSrc && videoRef.current) {
      videoRef.current.currentTime = seconds;
      videoRef.current.play().catch(() => {});
    }
  };

  const currentChapter = chapters[activeChapter] || chapters[0];

  return (
    <>
      {/* Trigger Option 1: Island Play Button */}
      {variant === "button" && (
        <button
          onClick={() => setIsOpen(true)}
          className={`group inline-flex items-center justify-between gap-3.5 rounded-full pl-5 pr-2.5 py-2.5 text-sm font-semibold transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] ${
            theme === "light"
              ? "border border-black/[0.08] bg-white text-ink-strong shadow-[0_6px_18px_-12px_rgba(15,23,42,0.24)] hover:border-primary/40 hover:bg-surface-alt"
              : "border border-white/20 bg-white/10 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_12px_28px_-10px_rgba(0,0,0,0.5)] backdrop-blur-xl hover:bg-white/15 hover:border-white/35"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full transition-all duration-300 group-hover:scale-105 ${
                theme === "light"
                  ? "bg-primary-soft text-primary-dark ring-1 ring-primary/20 group-hover:bg-primary group-hover:text-white"
                  : "bg-emerald-500 text-white shadow-glow-emerald"
              }`}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
                <path d="M7.5 6.4c0-.9 1-1.4 1.7-.9l8.6 5.1c.7.4.7 1.4 0 1.8l-8.6 5.1c-.7.5-1.7-.1-1.7-.9V6.4z" />
              </svg>
            </span>
            <span>{effectiveButtonText}</span>
          </div>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-mono font-bold ${
              theme === "light"
                ? "bg-primary-soft text-primary-dark"
                : "bg-emerald-400/20 text-emerald-300"
            }`}
          >
            80s HD
          </span>
        </button>
      )}

      {/* Trigger Option 2: Full Cinematic Double-Bezel Banner */}
      {variant === "banner" && (
        <div
          onClick={() => setIsOpen(true)}
          className="group relative cursor-pointer overflow-hidden rounded-[2.5rem] bg-white/[0.03] p-1.5 sm:p-2.5 ring-1 ring-white/10 transition-all duration-700 ease-haptic hover:ring-emerald-500/30 hover:shadow-diffusion-dark"
        >
          <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full overflow-hidden rounded-[calc(2.5rem-0.5rem)] bg-[#070B09]">
            <Image
              src={posterSrc}
              alt="ChargeOps Product Walkthrough Video"
              fill
              sizes="(max-width: 1280px) 100vw, 1200px"
              priority
              className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.03] opacity-80"
            />
            {/* Cinematic Gradient Scrim */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#070A08] via-black/40 to-black/20" />

            {/* Top Bar Preview Tag */}
            <div className="absolute top-4 left-4 sm:top-6 sm:left-6 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-black/70 px-3.5 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-md ring-1 ring-white/15 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                {t.walkthrough.bannerBadge}
              </span>
            </div>

            {/* Centered Specular Play Badge */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
              <div className="relative flex h-18 w-18 sm:h-22 sm:w-22 items-center justify-center rounded-full bg-emerald-500 text-white shadow-glow-emerald backdrop-blur-xl ring-4 ring-white/30 transition-transform duration-500 ease-spring group-hover:scale-110">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8 sm:h-9 sm:w-9">
                  <path d="M7.5 6.4c0-.9 1-1.4 1.7-.9l8.6 5.1c.7.4.7 1.4 0 1.8l-8.6 5.1c-.7.5-1.7-.1-1.7-.9V6.4z" />
                </svg>
                {/* Outer radar pulse */}
                <span className="absolute -inset-2 rounded-full border border-emerald-400/60 animate-ping opacity-60" />
              </div>

              <h3 className="mt-5 text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight drop-shadow-md">
                {t.walkthrough.bannerTitle}
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-white/80 max-w-lg drop-shadow">
                {t.walkthrough.bannerSubtitle}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Full-Screen Liquid Glass Video Theater Modal (Cinematic Dark Linear Theme) */}
      {isOpen && mounted && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 lg:p-8 overflow-y-auto">
          {/* Backdrop with heavy dark blur covering entire viewport */}
          <div
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/90 backdrop-blur-2xl transition-opacity animate-fade-in"
          />

          {/* Liquid Glass Modal Shell - Dark Sapphire Double-Bezel */}
          <div className="relative z-10 w-full max-w-4xl my-auto max-h-[92vh] flex flex-col rounded-[2.5rem] bg-[#0E1512]/95 p-2 sm:p-2.5 ring-1 ring-white/15 shadow-[0_30px_90px_-20px_rgba(0,0,0,0.95)] backdrop-blur-2xl">
            <div className="relative overflow-y-auto rounded-[calc(2.5rem-0.5rem)] bg-[#080C0A] p-4 sm:p-6 border border-white/10">
              {/* Header Bar */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <span className="flex h-3 w-3 rounded-full bg-emerald-400 animate-pulse" />
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white">
                      {t.walkthrough.modalTitle}
                    </h3>
                    <p className="text-xs text-white/50">
                      {t.walkthrough.modalSubtitle}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsOpen(false)}
                  aria-label={locale === "vi" ? "Đóng rạp xem" : "Close theater"}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/80 ring-1 ring-white/15 transition-all hover:bg-white/20 hover:text-white"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Theater Screen Display */}
              <div className="relative mt-4 aspect-[16/9] w-full overflow-hidden rounded-2xl bg-black ring-1 ring-white/10 shadow-inner">
                {videoSrc ? (
                  <video
                    ref={videoRef}
                    src={videoSrc}
                    poster={posterSrc}
                    controls
                    autoPlay
                    playsInline
                    className="h-full w-full object-cover"
                  />
                ) : (
                  /* Interactive Chapter Preview Screen (Zero 404 network errors before file upload) */
                  <div className="relative h-full w-full flex items-center justify-center">
                    <Image
                      src={currentChapter.previewImage}
                      alt={currentChapter.title}
                      fill
                      sizes="(max-width: 1280px) 100vw, 1200px"
                      className="object-cover opacity-75 transition-all duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />

                    <div className="relative z-10 text-center px-4 max-w-xl">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3.5 py-1 text-xs font-mono font-bold text-emerald-400 ring-1 ring-emerald-400/40 backdrop-blur-md">
                        {currentChapter.time} · {currentChapter.role}
                      </span>
                      <h4 className="mt-3 text-xl sm:text-2xl font-bold text-white">
                        {currentChapter.title}
                      </h4>
                      <p className="mt-2 text-xs sm:text-sm text-white/70 leading-relaxed">
                        {currentChapter.desc}
                      </p>
                      <div className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-xs text-white/80 ring-1 ring-white/15 backdrop-blur-md">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4 text-emerald-400 shrink-0">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                        </svg>
                        <span>
                          {locale === "vi"
                            ? "Đã cấu hình sẵn khung player. Thả video OBS/CapCut vào"
                            : "Player frame ready. Place OBS/CapCut video into"}
                        </span>
                        <code className="text-emerald-400 font-mono font-semibold">public/videos/</code>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Interactive Chapter Scrub Bar */}
              <div className="mt-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    {t.walkthrough.chaptersLabel}
                  </span>
                  <span className="text-[11px] text-white/40 font-mono">01:25</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {chapters.map((chap, idx) => {
                    const isActive = activeChapter === idx;
                    return (
                      <button
                        key={chap.id}
                        onClick={() => seekToChapter(chap.seconds, idx)}
                        className={`text-left p-3 rounded-xl transition-all duration-300 ring-1 ${
                          isActive
                            ? "bg-emerald-500/20 ring-emerald-400/50 text-white shadow-sm"
                            : "bg-white/[0.03] ring-white/10 text-white/70 hover:bg-white/[0.08] hover:text-white"
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-emerald-400 font-bold">{chap.time}</span>
                          <span
                            className={`rounded px-1.5 py-0.5 text-[9px] uppercase tracking-wider font-semibold ${
                              isActive ? "bg-emerald-500/20 text-emerald-300" : "bg-white/10 text-white/70"
                            }`}
                          >
                            {chap.role}
                          </span>
                        </div>
                        <p className={`mt-1.5 text-xs font-bold line-clamp-1 ${isActive ? "text-white font-extrabold" : "text-white/90"}`}>
                          {chap.title}
                        </p>
                        <p className={`mt-0.5 text-[11px] line-clamp-2 ${isActive ? "text-white/80" : "text-white/50"}`}>
                          {chap.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Masked Data Privacy Note */}
              <div className="mt-4 pt-3 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-white/40">
                <span>{t.walkthrough.privacyNote}</span>
                <span>{locale === "vi" ? "Phím tắt: ESC để đóng" : "Shortcut: Press ESC to close"}</span>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
