"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useTranslation } from "@/lib/i18n";
import { mediaAsset } from "@/lib/media";

interface WalkthroughTheaterProps {
  videoSrc?: string;
  audioSrc?: string;
  posterSrc?: string;
  triggerButtonText?: string;
  variant?: "button" | "card" | "banner";
  theme?: "light" | "dark";
}

const CHAPTER_METAS = [
  {
    id: "driver",
    time: "00:03",
    seconds: 3,
    previewImages: {
      vi: mediaAsset("screens/app-map-new.png"),
      en: mediaAsset("screens/app-map-new.png"),
    },
  },
  {
    id: "owner-registration",
    time: "00:20",
    seconds: 20.5,
    previewImages: {
      vi: mediaAsset("screens/owner-registration-vi.png"),
      en: mediaAsset("screens/owner-registration-en.png"),
    },
  },
  {
    id: "admin-approval",
    time: "00:33",
    seconds: 33,
    previewImages: {
      vi: mediaAsset("screens/admin-approvals-vi.png"),
      en: mediaAsset("screens/admin-approvals-en.png"),
    },
  },
  {
    id: "owner-operations",
    time: "00:46",
    seconds: 46.5,
    previewImages: {
      vi: mediaAsset("screens/owner-pricing-dark.png"),
      en: mediaAsset("screens/owner-pricing-dark.png"),
    },
  },
];

/**
 * High-End Product Walkthrough Theater (80s HD)
 *
 * Designed according to high-end-visual-design (Awwwards-Tier / Linear / Apple):
 * 1. Double-Bezel (Doppelrand) Architecture: Outer glowing shell + concentric inner dark sapphire core
 * 2. Floating Liquid-Glass Island Control Dock: Concentric master play/pause, haptic -10s/+10s skip buttons, time capsule, soundwave equalizer, and volume dock
 * 3. 4-Chapter Bento Cards with Real 16:9 Thumbnail Previews:
 *    - Chapter 0 (00:03): Driver App Booking
 *    - Chapter 1 (00:20): Owner Station Registration
 *    - Chapter 2 (00:33): Admin License Verification & Approval
 *    - Chapter 3 (00:46): Owner Station Operations & Tariffs
 * 4. Specular Ambient Backlight Halo behind the cinema viewport
 * 5. Dynamic Chapter Navigation & live progress illumination
 */
export function WalkthroughTheater({
  videoSrc,
  posterSrc = mediaAsset("stations/futuristic-hub.jpg"),
  audioSrc,
  triggerButtonText,
  variant = "button",
  theme = "light",
}: WalkthroughTheaterProps) {
  const { t, locale } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [activeChapter, setActiveChapter] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(80);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [volume, setVolume] = useState(0.25);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const effectiveButtonText = triggerButtonText || t.walkthrough.triggerButtonText;

  const chapters = useMemo(() => {
    return t.walkthrough.chapters.slice(0, CHAPTER_METAS.length).map((chap, idx) => ({
      ...chap,
      id: CHAPTER_METAS[idx].id,
      time: CHAPTER_METAS[idx].time,
      seconds: CHAPTER_METAS[idx].seconds,
      previewImage: CHAPTER_METAS[idx].previewImages[locale === "vi" ? "vi" : "en"],
    }));
  }, [t, locale]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      videoRef.current?.pause();
      audioRef.current?.pause();
      if (audioRef.current) audioRef.current.muted = true;
      setIsPlaying(false);
    } else {
      setAudioEnabled(true);
    }
  }, [isOpen]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.muted = !audioEnabled;
    }
    if (videoRef.current && !audioSrc) {
      videoRef.current.volume = volume;
      videoRef.current.muted = !audioEnabled;
    }
  }, [audioEnabled, volume, audioSrc]);

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

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const cur = video.currentTime;
    setCurrentTime(cur);
    if (Number.isFinite(video.duration) && video.duration > 0) {
      setDuration(video.duration);
    }

    const audio = audioRef.current;
    if (audioSrc && audioEnabled && audio && !audio.paused && Number.isFinite(audio.duration)) {
      const audioTime = Math.min(cur, audio.duration);
      if (Math.abs(audio.currentTime - audioTime) > 0.45) audio.currentTime = audioTime;
    }

    // Dynamic chapter sync across all 4 chapters
    for (let i = CHAPTER_METAS.length - 1; i >= 0; i--) {
      if (cur >= CHAPTER_METAS[i].seconds - 0.5) {
        setActiveChapter(i);
        break;
      }
    }
  };

  const playVideo = () => {
    const video = videoRef.current;
    if (!video) return;
    video.play().catch(() => setIsPlaying(false));
    if (audioSrc && audioEnabled && audioRef.current) {
      const audio = audioRef.current;
      audio.currentTime = Number.isFinite(audio.duration) ? Math.min(video.currentTime, audio.duration) : video.currentTime;
      audio.volume = volume;
      audio.muted = false;
      audio.play().catch(() => setAudioEnabled(false));
    }
  };

  const togglePlayback = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      playVideo();
    } else {
      videoRef.current.pause();
      audioRef.current?.pause();
    }
  };

  const handleSeek = (value: number) => {
    if (!videoRef.current) return;
    try {
      videoRef.current.currentTime = value;
    } catch (err) {
      console.warn("Seek warning:", err);
    }
    setCurrentTime(value);
    if (audioSrc && audioRef.current) {
      const audio = audioRef.current;
      audio.currentTime = Number.isFinite(audio.duration) ? Math.min(value, audio.duration) : value;
    }
  };

  const skipTime = (seconds: number) => {
    if (!videoRef.current) return;
    const target = Math.max(0, Math.min(duration || 80, videoRef.current.currentTime + seconds));
    handleSeek(target);
  };

  const toggleAudio = () => {
    if (!audioSrc || !audioRef.current) return;
    if (audioEnabled) {
      audioRef.current.pause();
      audioRef.current.muted = true;
      setAudioEnabled(false);
      return;
    }
    setAudioEnabled(true);
    audioRef.current.volume = volume;
    if (videoRef.current && !videoRef.current.paused) {
      audioRef.current.currentTime = Number.isFinite(audioRef.current.duration)
        ? Math.min(videoRef.current.currentTime, audioRef.current.duration)
        : videoRef.current.currentTime;
      audioRef.current.muted = false;
      audioRef.current.play().catch(() => setAudioEnabled(false));
    }
  };

  const formatTime = (seconds: number) => {
    if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const remainder = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
  };

  const toggleFullscreen = () => {
    const screen = videoRef.current?.parentElement;
    if (!screen) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void screen.requestFullscreen?.();
  };

  const seekToChapter = (seconds: number, index: number) => {
    setActiveChapter(index);
    if (videoSrc && videoRef.current) {
      handleSeek(seconds);
      playVideo();
    }
  };

  const currentChapter = chapters[activeChapter] || chapters[0];
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      {/* Trigger Option 1: Specular Island Play Button */}
      {variant === "button" && (
        <button
          onClick={() => setIsOpen(true)}
          className={`group relative inline-flex items-center gap-3 rounded-full p-1 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] ${
            theme === "light"
              ? "bg-white/80 ring-1 ring-black/[0.08] shadow-[0_6px_20px_-10px_rgba(15,23,42,0.18)] hover:bg-white hover:ring-primary/40 hover:shadow-lg"
              : "bg-white/[0.06] ring-1 ring-white/15 backdrop-blur-xl shadow-[0_12px_28px_-10px_rgba(0,0,0,0.6)] hover:bg-white/[0.1] hover:ring-emerald-400/35"
          }`}
        >
          <div className="flex items-center gap-2.5 rounded-full pl-3 pr-2 py-1.5">
            <span
              className={`flex h-7 w-7 shrink-0 aspect-square items-center justify-center rounded-full transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-110 ${
                theme === "light"
                  ? "bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                  : "bg-emerald-400 text-[#07110D] shadow-[0_0_16px_rgba(52,211,153,0.5)]"
              }`}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5 shrink-0">
                <path d="M6.5 5.25a1.25 1.25 0 0 1 1.93-1.04l10.5 6.75a1.25 1.25 0 0 1 0 2.08l-10.5 6.75A1.25 1.25 0 0 1 6.5 18.75V5.25Z" />
              </svg>
            </span>
            <span className={`text-sm font-semibold tracking-tight ${theme === "light" ? "text-ink-strong" : "text-white"}`}>
              {effectiveButtonText}
            </span>
            <span
              className={`ml-1.5 rounded-full px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider uppercase ${
                theme === "light"
                  ? "bg-primary-soft text-primary-dark"
                  : "bg-emerald-400/20 text-emerald-300 ring-1 ring-emerald-400/30"
              }`}
            >
              80s HD
            </span>
          </div>
        </button>
      )}

      {/* Trigger Option 2: Full Cinematic Double-Bezel Banner */}
      {variant === "banner" && (
        <div
          onClick={() => setIsOpen(true)}
          className="group relative cursor-pointer overflow-hidden rounded-[2.5rem] bg-white/[0.03] p-1.5 sm:p-2.5 ring-1 ring-white/10 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:ring-emerald-500/40 hover:shadow-[0_20px_70px_rgba(16,185,129,0.15)]"
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
              <span className="inline-flex items-center gap-2 rounded-full bg-black/75 px-3.5 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-md ring-1 ring-white/15 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                {t.walkthrough.bannerBadge}
              </span>
            </div>

            {/* Centered Specular Play Badge */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
              <div className="relative flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 aspect-square items-center justify-center rounded-full bg-emerald-400 text-[#07110D] shadow-[0_0_36px_rgba(52,211,153,0.55)] backdrop-blur-xl ring-4 ring-white/30 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-110">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8 sm:h-9 sm:w-9 shrink-0">
                  <path d="M6.5 5.25a1.25 1.25 0 0 1 1.93-1.04l10.5 6.75a1.25 1.25 0 0 1 0 2.08l-10.5 6.75A1.25 1.25 0 0 1 6.5 18.75V5.25Z" />
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

      {/* Full-Screen Liquid Glass Video Theater Modal */}
      {isOpen && mounted && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 lg:p-6 overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {/* Backdrop with heavy dark blur covering entire viewport */}
          <div
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/92 backdrop-blur-2xl transition-opacity animate-fade-in"
          />

          {/* Liquid Glass Modal Shell - Dark Sapphire Double-Bezel */}
          <div className="relative z-10 w-full max-w-5xl my-auto max-h-[95vh] flex flex-col rounded-[2.5rem] bg-[#0A0F0D]/95 p-2 sm:p-3 ring-1 ring-white/15 shadow-[0_30px_100px_-20px_rgba(0,0,0,0.95)] backdrop-blur-2xl">
            {/* Ambient Backlight Halo behind the cinema viewport */}
            <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-80 w-[42rem] rounded-full bg-emerald-500/15 blur-[100px]" />

            <div className="relative overflow-y-auto rounded-[calc(2.5rem-0.625rem)] bg-[#050806] p-4 sm:p-6 border border-white/10 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {/* Header Bar */}
              <div className="flex items-center justify-between pb-3.5 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400" />
                  </span>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
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
                  className="flex h-10 w-10 shrink-0 aspect-square items-center justify-center rounded-full bg-white/[0.07] text-white/80 ring-1 ring-white/15 transition-all duration-200 hover:bg-white/[0.15] hover:text-white active:scale-95"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5 shrink-0">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Theater Screen Display */}
              <div className="relative mt-4 aspect-[16/9] w-full overflow-hidden rounded-2xl bg-black ring-1 ring-white/15 shadow-2xl">
                {videoSrc ? (
                  <video
                    ref={videoRef}
                    src={videoSrc}
                    autoPlay
                    muted
                    playsInline
                    preload="metadata"
                    onLoadedMetadata={(event) => {
                      const dur = event.currentTarget.duration;
                      if (Number.isFinite(dur) && dur > 0) setDuration(dur);
                    }}
                    onPlay={() => {
                      setIsPlaying(true);
                      if (audioSrc && audioEnabled && audioRef.current) {
                        const audio = audioRef.current;
                        audio.currentTime = Number.isFinite(audio.duration)
                          ? Math.min(videoRef.current?.currentTime || 0, audio.duration)
                          : 0;
                        audio.volume = volume;
                        audio.muted = false;
                        audio.play().catch(() => {});
                      }
                    }}
                    onPause={() => setIsPlaying(false)}
                    onTimeUpdate={handleTimeUpdate}
                    onSeeking={() => {
                      const video = videoRef.current;
                      const audio = audioRef.current;
                      if (audioSrc && video && audio) {
                        audio.currentTime = Number.isFinite(audio.duration)
                          ? Math.min(video.currentTime, audio.duration)
                          : video.currentTime;
                      }
                    }}
                    onEnded={() => audioRef.current?.pause()}
                    onClick={togglePlayback}
                    className="h-full w-full cursor-pointer object-cover"
                  />
                ) : (
                  /* Interactive chapter preview fallback */
                  <div className="relative h-full w-full flex items-center justify-center">
                    {currentChapter.previewImage && (
                      <Image
                        src={currentChapter.previewImage}
                        alt={currentChapter.title}
                        fill
                        sizes="(max-width: 1280px) 100vw, 1200px"
                        className="object-cover opacity-75 transition-all duration-500"
                      />
                    )}
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
                    </div>
                  </div>
                )}

                {/* On-screen Active Chapter Pill */}
                <div className="pointer-events-none absolute top-3 left-3 sm:top-4 sm:left-4 z-20 flex items-center gap-2">
                  <span className="inline-flex items-center gap-2.5 rounded-full bg-black/85 px-3.5 py-1.5 text-xs font-semibold text-white/95 backdrop-blur-xl ring-1 ring-white/20 shadow-xl">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-mono text-emerald-300 uppercase tracking-wider text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 ring-1 ring-emerald-400/30">
                      {currentChapter.role}
                    </span>
                    <span className="text-white/30">·</span>
                    <span className="truncate max-w-[200px] sm:max-w-none text-white/95">
                      {currentChapter.title}
                    </span>
                  </span>
                </div>

                {/* Specular Center Play Overlay when Paused */}
                {videoSrc && !isPlaying && (
                  <button
                    type="button"
                    onClick={playVideo}
                    aria-label={t.walkthrough.play}
                    className="group absolute left-1/2 top-1/2 flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 aspect-square -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-emerald-400 text-[#07110D] shadow-[0_0_36px_rgba(52,211,153,0.55)] ring-4 ring-white/40 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-110 active:scale-95"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8 sm:h-9 sm:w-9 shrink-0" aria-hidden="true">
                      <path d="M6.5 5.25a1.25 1.25 0 0 1 1.93-1.04l10.5 6.75a1.25 1.25 0 0 1 0 2.08l-10.5 6.75A1.25 1.25 0 0 1 6.5 18.75V5.25Z" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Floating Liquid-Glass Island Control Dock */}
              <div className="mt-4 rounded-3xl bg-white/[0.03] p-2 ring-1 ring-white/10 backdrop-blur-2xl shadow-[0_16px_40px_rgba(0,0,0,0.6)]">
                <div className="rounded-[calc(1.5rem-0.125rem)] bg-gradient-to-b from-[#0C120F]/90 to-[#070B09]/95 p-3 sm:p-4 border border-white/[0.08]">
                  {/* Interactive Chapter Scrubber Rail */}
                  <div className="relative mb-3 flex h-7 items-center" aria-label={t.walkthrough.chaptersLabel}>
                    {/* Glowing Progress Track */}
                    <div className="relative h-2 sm:h-2.5 w-full rounded-full bg-white/[0.08] overflow-hidden ring-1 ring-white/10 shadow-inner">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-300 shadow-[0_0_12px_rgba(52,211,153,0.6)] transition-all duration-100 ease-out"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>

                    {/* Chapter Segment Markers */}
                    {chapters.map((chapter) => {
                      const posPercent = (chapter.seconds / (duration || 80)) * 100;
                      const isPassed = currentTime >= chapter.seconds;
                      return (
                        <div
                          key={`marker-${chapter.id}`}
                          className="pointer-events-none absolute z-20 -translate-x-1/2 flex flex-col items-center"
                          style={{ left: `${posPercent}%` }}
                        >
                          <span
                            className={`h-3 sm:h-3.5 w-1 rounded-full transition-all duration-300 ${
                              isPassed
                                ? "bg-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.9)]"
                                : "bg-white/40 ring-1 ring-black/40"
                            }`}
                          />
                        </div>
                      );
                    })}

                    {/* Native range input overlay for seamless scrub interaction */}
                    <input
                      type="range"
                      min={0}
                      max={Math.max(duration, 1)}
                      step={0.1}
                      value={Math.min(currentTime, duration || 80)}
                      onChange={(event) => handleSeek(Number(event.currentTarget.value))}
                      aria-label={t.walkthrough.seek}
                      className="walkthrough-seek absolute inset-0 z-30 h-full w-full cursor-pointer opacity-0"
                    />
                  </div>

                  {/* Playback Control Island Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    {/* Left: Concentric Master Play + Haptic Skip & Time Capsule */}
                    <div className="flex items-center gap-2 sm:gap-3">
                      {/* Concentric Master Play/Pause Island Button */}
                      <button
                        type="button"
                        onClick={togglePlayback}
                        aria-label={isPlaying ? t.walkthrough.pause : t.walkthrough.play}
                        className="group relative flex h-12 w-12 shrink-0 aspect-square items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600 text-[#07110D] shadow-[0_0_24px_rgba(52,211,153,0.45)] ring-2 ring-white/60 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-105 hover:shadow-[0_0_32px_rgba(52,211,153,0.65)] active:scale-95"
                      >
                        {isPlaying ? (
                          <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 shrink-0" aria-hidden="true">
                            <path d="M7 5.75A1.75 1.75 0 0 1 8.75 4h.5A1.75 1.75 0 0 1 11 5.75v12.5A1.75 1.75 0 0 1 9.25 20h-.5A1.75 1.75 0 0 1 7 18.25V5.75Zm6 0A1.75 1.75 0 0 1 14.75 4h.5A1.75 1.75 0 0 1 17 5.75v12.5A1.75 1.75 0 0 1 15.25 20h-.5A1.75 1.75 0 0 1 13 18.25V5.75Z" />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 shrink-0" aria-hidden="true">
                            <path d="M6.5 5.25a1.25 1.25 0 0 1 1.93-1.04l10.5 6.75a1.25 1.25 0 0 1 0 2.08l-10.5 6.75A1.25 1.25 0 0 1 6.5 18.75V5.25Z" />
                          </svg>
                        )}
                      </button>

                      {/* Quick Rewind -10s */}
                      <button
                        type="button"
                        onClick={() => skipTime(-10)}
                        title={locale === "vi" ? "Lùi lại 10 giây" : "Rewind 10s"}
                        aria-label="Rewind 10s"
                        className="flex h-9 w-9 shrink-0 aspect-square items-center justify-center rounded-full bg-white/[0.06] text-white/80 ring-1 ring-white/10 transition-all duration-200 hover:bg-white/[0.12] hover:text-white active:scale-90"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4 shrink-0">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12.5 8V4.5l-5 4 5 4V9c3 0 5.5 2.5 5.5 5.5s-2.5 5.5-5.5 5.5-5.5-2.5-5.5-5.5" />
                        </svg>
                      </button>

                      {/* Quick Forward +10s */}
                      <button
                        type="button"
                        onClick={() => skipTime(10)}
                        title={locale === "vi" ? "Tua tới 10 giây" : "Forward 10s"}
                        aria-label="Forward 10s"
                        className="flex h-9 w-9 shrink-0 aspect-square items-center justify-center rounded-full bg-white/[0.06] text-white/80 ring-1 ring-white/10 transition-all duration-200 hover:bg-white/[0.12] hover:text-white active:scale-90"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4 shrink-0">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11.5 8V4.5l5 4-5 4V9c-3 0-5.5 2.5-5.5 5.5s2.5 5.5 5.5 5.5 5.5-2.5 5.5-5.5" />
                        </svg>
                      </button>

                      {/* Time Capsule Pill */}
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 font-mono text-xs tabular-nums text-white/90 ring-1 ring-white/10 shadow-inner">
                        <span className="font-bold text-emerald-400">{formatTime(currentTime)}</span>
                        <span className="text-white/30">/</span>
                        <span className="text-white/50">{formatTime(duration || 80)}</span>
                      </div>
                    </div>

                    {/* Right: Soundwave Visualizer, Volume Track, Fullscreen */}
                    <div className="flex items-center gap-2 sm:gap-3">
                      {/* Soundwave Visualizer Toggle */}
                      <button
                        type="button"
                        onClick={toggleAudio}
                        disabled={!audioSrc}
                        aria-label={audioEnabled ? t.walkthrough.muteAudio : t.walkthrough.enableAudio}
                        title={!audioSrc ? t.walkthrough.audioUnavailable : audioEnabled ? t.walkthrough.muteAudio : t.walkthrough.enableAudio}
                        className={`group flex h-9 items-center gap-2 rounded-full px-3 text-xs font-medium ring-1 transition-all duration-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 ${
                          audioEnabled
                            ? "bg-emerald-500/20 text-emerald-300 ring-emerald-400/40 shadow-[0_0_12px_rgba(52,211,153,0.2)]"
                            : "bg-white/[0.06] text-white/70 ring-white/10 hover:bg-white/[0.12] hover:text-white"
                        }`}
                      >
                        {/* Miniature Equalizer Bars */}
                        <div className="flex items-center gap-0.5 h-3.5">
                          <span className={`w-0.5 rounded-full bg-emerald-400 transition-all ${isPlaying && audioEnabled ? "h-3 animate-pulse" : "h-1 bg-white/40"}`} />
                          <span className={`w-0.5 rounded-full bg-emerald-400 transition-all ${isPlaying && audioEnabled ? "h-3.5 animate-bounce" : "h-1.5 bg-white/40"}`} />
                          <span className={`w-0.5 rounded-full bg-emerald-400 transition-all ${isPlaying && audioEnabled ? "h-2 animate-pulse" : "h-1 bg-white/40"}`} />
                        </div>
                        <span className="hidden sm:inline font-mono text-[11px]">
                          {audioEnabled ? (locale === "vi" ? "Nhạc nền" : "Score On") : (locale === "vi" ? "Tắt tiếng" : "Muted")}
                        </span>
                      </button>

                      {/* Volume Slider Track */}
                      <label className="hidden sm:flex items-center gap-2" title={t.walkthrough.volume}>
                        <span className="sr-only">{t.walkthrough.volume}</span>
                        <input
                          type="range"
                          min={0}
                          max={1}
                          step={0.01}
                          value={volume}
                          disabled={!audioSrc || !audioEnabled}
                          onChange={(event) => setVolume(Number(event.currentTarget.value))}
                          aria-label={t.walkthrough.volume}
                          className="h-1.5 w-16 sm:w-20 cursor-pointer accent-emerald-400 disabled:cursor-not-allowed disabled:opacity-30 rounded-full bg-white/15"
                        />
                      </label>

                      {/* Fullscreen Button */}
                      <button
                        type="button"
                        onClick={toggleFullscreen}
                        aria-label={t.walkthrough.fullscreen}
                        title={t.walkthrough.fullscreen}
                        className="flex h-9 w-9 shrink-0 aspect-square items-center justify-center rounded-full bg-white/[0.06] text-white/80 ring-1 ring-white/10 transition-all duration-200 hover:bg-white/[0.12] hover:text-white active:scale-90"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4 shrink-0" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 4H4v4m12-4h4v4M4 16v4h4m12-4v4h-4" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Audio element for separate soundtrack stream if configured */}
              {audioSrc && <audio ref={audioRef} src={audioSrc} preload="metadata" className="hidden" />}

              {/* Chapter Navigator Header */}
              <div className="mb-2.5 mt-5 flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  {t.walkthrough.chaptersLabel}
                </span>
                <span className="text-[11px] text-white/40 font-mono">
                  {chapters.length} {locale === "vi" ? "phân đoạn câu chuyện" : "story chapters"}
                </span>
              </div>

              {/* 4 Chapter Bento Cards with Real 16:9 Thumbnail Previews */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                {chapters.map((chap, idx) => {
                  const isActive = activeChapter === idx;
                  return (
                    <div
                      key={chap.id}
                      onClick={() => seekToChapter(chap.seconds, idx)}
                      className={`group relative cursor-pointer rounded-2xl p-1 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ring-1 ${
                        isActive
                          ? "bg-gradient-to-br from-emerald-500/30 via-emerald-500/10 to-transparent ring-emerald-400/60 shadow-[0_0_30px_rgba(52,211,153,0.18)]"
                          : "bg-white/[0.02] ring-white/10 hover:bg-white/[0.06] hover:ring-white/25"
                      }`}
                    >
                      <div className="relative flex items-center gap-3 overflow-hidden rounded-[calc(1rem-0.0625rem)] bg-[#0C120F]/90 p-2 sm:p-2.5 backdrop-blur-md">
                        {/* 16:9 Live Screen Preview Thumbnail */}
                        <div className="relative h-12 w-20 sm:h-14 sm:w-24 shrink-0 overflow-hidden rounded-lg bg-black ring-1 ring-white/15">
                          {chap.previewImage ? (
                            <Image
                              src={chap.previewImage}
                              alt={chap.title}
                              fill
                              sizes="120px"
                              className={`object-cover transition-transform duration-500 ease-out group-hover:scale-105 ${
                                isActive ? "opacity-95" : "opacity-75"
                              }`}
                            />
                          ) : (
                            <div className="h-full w-full bg-emerald-950/40" />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                          
                          {/* Corner Timestamp Pill */}
                          <span className="absolute bottom-1 right-1 rounded px-1 text-[8px] font-mono font-bold bg-black/85 text-emerald-300 ring-1 ring-white/15">
                            {chap.time}
                          </span>

                          {/* Play overlay on active card */}
                          {isActive && (
                            <div className="absolute inset-0 flex items-center justify-center bg-emerald-950/30 text-emerald-300">
                              <span className="flex h-6 w-6 shrink-0 aspect-square items-center justify-center rounded-full bg-emerald-400 text-[#07110D] shadow-sm">
                                <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3 shrink-0">
                                  <path d="M6.5 5.25a1.25 1.25 0 0 1 1.93-1.04l10.5 6.75a1.25 1.25 0 0 1 0 2.08l-10.5 6.75A1.25 1.25 0 0 1 6.5 18.75V5.25Z" />
                                </svg>
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Card Details */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 text-[10px] font-mono">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider ${
                                isActive
                                  ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/40"
                                  : "bg-white/10 text-white/60"
                              }`}
                            >
                              {chap.role}
                            </span>
                            <span className="text-white/30 font-bold">#0{idx + 1}</span>
                          </div>

                          <p className={`mt-1 text-xs sm:text-[13px] font-bold tracking-tight line-clamp-1 ${isActive ? "text-white" : "text-white/85 group-hover:text-white"}`}>
                            {chap.title}
                          </p>
                          <p className={`mt-0.5 text-[11px] line-clamp-1 leading-snug ${isActive ? "text-white/70" : "text-white/45"}`}>
                            {chap.desc}
                          </p>
                        </div>

                        {/* Glowing Active Beam along bottom */}
                        {isActive && (
                          <span className="absolute bottom-0 inset-x-0 h-0.5 bg-gradient-to-r from-emerald-500 via-teal-300 to-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Data Privacy Note & Shortcut */}
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
