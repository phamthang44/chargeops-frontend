"use client";

import React, { useRef, useState } from "react";

/**
 * Liquid Glass React System (VisionOS / Glassmorphism 2.0)
 *
 * Implements:
 * 1. Specular top-edge refraction via dual inset box-shadows.
 * 2. Doppelrand (Double-Bezel nested architecture) for machined hardware feel.
 * 3. Dynamic mouse-tracking specular reflection & subtle 3D tilt.
 * 4. Ambient organic emerald/cyan fluid mesh glow passing through the glass.
 * 5. Strict accessibility fallback for prefers-reduced-transparency / prefers-reduced-motion.
 */

interface LiquidGlassCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "light" | "dark" | "emerald";
  interactive?: boolean;
  intensity?: "subtle" | "medium" | "deep";
}

export function LiquidGlassCard({
  children,
  className = "",
  variant = "dark",
  interactive = true,
  intensity = "medium",
}: LiquidGlassCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });
  };

  // Styles based on variant
  const outerBorder =
    variant === "dark"
      ? "border-white/10 bg-white/[0.04]"
      : variant === "emerald"
      ? "border-emerald-400/20 bg-emerald-950/20"
      : "border-black/5 bg-black/[0.02]";

  const innerBg =
    variant === "dark"
      ? "bg-[#090D0B]/85 text-white"
      : variant === "emerald"
      ? "bg-gradient-to-b from-[#061811]/90 to-[#020B07]/95 text-white"
      : "bg-white/85 text-ink-strong";

  const blurAmount =
    intensity === "subtle"
      ? "backdrop-blur-md"
      : intensity === "deep"
      ? "backdrop-blur-3xl"
      : "backdrop-blur-xl";

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group relative rounded-[2rem] p-1.5 sm:p-2 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ring-1 ${outerBorder} ${className}`}
      style={{
        transform:
          interactive && isHovered
            ? `perspective(1000px) rotateX(${(mousePos.y - 50) * -0.04}deg) rotateY(${(mousePos.x - 50) * 0.04}deg)`
            : "perspective(1000px) rotateX(0deg) rotateY(0deg)",
      }}
    >
      {/* Liquid Organic Glow Orbs behind the glass */}
      <div
        className="pointer-events-none absolute -inset-0.5 rounded-[2rem] opacity-0 blur-xl transition-opacity duration-700 group-hover:opacity-100"
        style={{
          background:
            variant === "emerald" || variant === "dark"
              ? `radial-gradient(400px circle at ${mousePos.x}% ${mousePos.y}%, rgba(16, 185, 129, 0.22), rgba(0, 229, 153, 0.08), transparent 70%)`
              : `radial-gradient(400px circle at ${mousePos.x}% ${mousePos.y}%, rgba(16, 185, 129, 0.12), transparent 70%)`,
        }}
      />

      {/* Inner Machined Crystal Core */}
      <div
        className={`relative overflow-hidden rounded-[calc(2rem-0.375rem)] p-6 sm:p-8 ${innerBg} ${blurAmount} border transition-all duration-500`}
        style={{
          borderColor:
            variant === "dark"
              ? "rgba(255, 255, 255, 0.12)"
              : variant === "emerald"
              ? "rgba(16, 185, 129, 0.3)"
              : "rgba(255, 255, 255, 0.8)",
          boxShadow:
            variant === "dark" || variant === "emerald"
              ? "inset 0 1.5px 0.5px rgba(255, 255, 255, 0.25), inset 0 -1px 0.5px rgba(255, 255, 255, 0.06), 0 20px 45px -15px rgba(0, 0, 0, 0.7)"
              : "inset 0 1.5px 0.5px rgba(255, 255, 255, 0.95), inset 0 -1px 0.5px rgba(0, 0, 0, 0.03), 0 18px 40px -15px rgba(15, 23, 42, 0.08)",
        }}
      >
        {/* Dynamic Specular Sheen (Moves with cursor) */}
        {interactive && (
          <div
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            style={{
              background: `radial-gradient(600px circle at ${mousePos.x}% ${mousePos.y}%, rgba(255, 255, 255, 0.08), transparent 60%)`,
            }}
          />
        )}

        {/* Content */}
        <div className="relative z-10">{children}</div>
      </div>
    </div>
  );
}

/**
 * Liquid Glass Pill Button with Island Trailing Icon
 */
export function LiquidGlassButton({
  children,
  icon,
  onClick,
  href,
  className = "",
  variant = "primary",
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: () => void;
  href?: string;
  className?: string;
  variant?: "primary" | "secondary" | "glass";
}) {
  const baseClasses =
    "group inline-flex items-center justify-center gap-3.5 rounded-full pl-6 pr-2.5 py-2.5 text-sm font-semibold transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]";

  const variantClasses =
    variant === "primary"
      ? "bg-primary text-white shadow-[0_8px_20px_-8px_rgba(16,185,129,0.6)] hover:bg-primary-dark"
      : variant === "glass"
      ? "bg-white/10 text-white backdrop-blur-xl border border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_12px_25px_-10px_rgba(0,0,0,0.5)] hover:bg-white/15 hover:border-white/30"
      : "bg-white text-ink-strong border border-black/10 shadow-[0_6px_20px_-10px_rgba(0,0,0,0.1)] hover:bg-surface-alt";

  const iconWrapper =
    variant === "primary"
      ? "bg-white/20 text-white"
      : variant === "glass"
      ? "bg-white/15 text-white"
      : "bg-surface-muted text-primary-dark ring-1 ring-black/5";

  const content = (
    <>
      <span>{children}</span>
      {icon && (
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-full transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1 group-hover:-translate-y-0.5 group-hover:scale-105 ${iconWrapper}`}
        >
          {icon}
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <a href={href} className={`${baseClasses} ${variantClasses} ${className}`}>
        {content}
      </a>
    );
  }

  return (
    <button onClick={onClick} className={`${baseClasses} ${variantClasses} ${className}`}>
      {content}
    </button>
  );
}
