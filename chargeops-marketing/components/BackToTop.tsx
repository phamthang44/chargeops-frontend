"use client";

import { useEffect, useRef, useState } from "react";

/** Floating back-to-top button; fades in after the user scrolls down. */
export function BackToTop() {
  const [show, setShow] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Reveal once a sentinel ~700px down the page leaves the viewport
  // (IntersectionObserver instead of a scroll listener).
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setShow(!entry.isIntersecting),
      { threshold: 0 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <>
      <div
        ref={sentinelRef}
        aria-hidden
        className="pointer-events-none absolute left-0 top-[700px] h-px w-px"
      />
      <button
        type="button"
        aria-label="Lên đầu trang"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={`fixed bottom-6 right-6 z-40 flex h-11 w-11 items-center justify-center rounded-full
          border border-white/15 bg-[#0E1512]/95 text-white shadow-[0_8px_24px_-8px_rgba(0,0,0,0.8)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:text-emerald-400 hover:border-emerald-500/40 hover:shadow-glow-emerald ${
            show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
          }`}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
      </button>
    </>
  );
}
