"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Logo } from "./Logo";

const NAV = [
  { id: "cach-hoat-dong", label: "Cách hoạt động", href: "/#cach-hoat-dong" },
  { id: "tinh-nang", label: "Tính năng", href: "/#tinh-nang" },
  { id: "tram-sac", label: "Trạm sạc", href: "/tram-sac" },
  { id: "doi-tac", label: "Dành cho chủ trạm", href: "/#doi-tac" },
  { id: "bang-gia-license", label: "Bảng giá", href: "/#bang-gia-license" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [active, setActive] = useState<string>("");
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const onStations = pathname.startsWith("/tram-sac");

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  // Shadow once the page is scrolled — driven by a top sentinel leaving the
  // viewport (IntersectionObserver) rather than a scroll listener.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setScrolled(!entry.isIntersecting),
      { threshold: 0 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Scroll-spy: highlight the nav item for the section currently in view
  // (only the landing page has these sections).
  useEffect(() => {
    const ids = [...NAV.map((n) => n.id), "tai-ung-dung"];
    const els = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [pathname]);

  const isActive = (id: string) =>
    onStations ? id === "tram-sac" : active === id;

  return (
    <>
      <div ref={sentinelRef} aria-hidden className="h-px w-full" />
      {open && (
        <button
          type="button"
          aria-label="Đóng menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-ink-strong/20 backdrop-blur-[2px] lg:hidden"
        />
      )}
      <header className="fixed top-3 sm:top-5 inset-x-0 z-50 px-3 sm:px-6 pointer-events-none transition-all duration-500 ease-haptic">
        <div className="mx-auto max-w-5xl pointer-events-auto">
          <div
            className={`island-nav transition-all duration-500 ease-haptic px-4 sm:px-6 py-2.5 ${
              open
                ? "rounded-[1.75rem] bg-white shadow-[0_24px_64px_-18px_rgba(0,0,0,0.28)]"
                : `rounded-full ${scrolled
                ? "bg-white/95 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15),0_0_0_1px_rgba(0,0,0,0.06)] scale-[0.99]"
                : "shadow-[0_12px_36px_-10px_rgba(0,0,0,0.06),0_0_0_1px_rgba(0,0,0,0.03)]"}`
            }`}
          >
            <div className="flex items-center justify-between gap-4">
              <Link href="/" aria-label="ChargeOps trang chủ" className="shrink-0 transition-transform duration-500 ease-haptic hover:scale-[1.02]">
                <Logo />
              </Link>

              {/* Desktop nav */}
              <nav className="hidden items-center gap-1 lg:gap-1.5 lg:flex" aria-label="Chính">
                {NAV.map((item) => {
                  const act = isActive(item.id);
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      aria-current={act ? "true" : undefined}
                      className={`relative px-3.5 py-1.5 text-xs lg:text-[13px] font-semibold rounded-full transition-all duration-500 ease-haptic ${
                        act
                          ? "bg-primary-soft/90 text-primary-dark shadow-sm ring-1 ring-primary/20"
                          : "text-ink-body hover:text-ink-strong hover:bg-black/[0.04]"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>

              <div className="flex items-center gap-2">
                <Link
                  href="/#tai-ung-dung"
                  className="btn-island-primary hidden lg:inline-flex text-xs font-semibold py-1.5 pl-4 pr-1.5"
                >
                  <span>Tải ứng dụng</span>
                  <span className="btn-icon-bubble !h-7 !w-7">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="h-3.5 w-3.5">
                      <path d="M7 17L17 7M17 7H7M17 7V17" />
                    </svg>
                  </span>
                </Link>

                {/* Mobile menu toggle */}
                <button
                  type="button"
                  onClick={() => setOpen((v) => !v)}
                  aria-expanded={open}
                  aria-controls="mobile-menu"
                  aria-label={open ? "Đóng menu" : "Mở menu"}
                  className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-black/10 bg-white/80 text-ink-strong transition hover:border-primary/50 lg:hidden"
                >
                  <Burger open={open} />
                </button>
              </div>
            </div>

            {/* Mobile menu panel */}
            <div
              id="mobile-menu"
              className={`overflow-hidden transition-all duration-500 ease-haptic lg:hidden ${
                open ? "max-h-96 opacity-100 pt-3 mt-2 border-t border-black/5" : "max-h-0 opacity-0"
              }`}
            >
              <nav className="flex flex-col gap-1 pb-1" aria-label="Di động">
                {NAV.map((item, idx) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={isActive(item.id) ? "true" : undefined}
                    style={{ transitionDelay: `${idx * 40}ms` }}
                    className={`min-h-11 rounded-xl px-3.5 py-2 text-sm font-semibold transition-all duration-500 ease-haptic ${
                      isActive(item.id)
                        ? "bg-primary-soft text-primary-dark font-bold"
                        : "text-ink-body hover:bg-surface-alt hover:text-ink-strong"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
                <Link
                  href="/#tai-ung-dung"
                  onClick={() => setOpen(false)}
                  className="btn-island-primary mt-2 justify-between py-2.5 pl-5 pr-2.5 text-sm"
                >
                  <span>Tải ứng dụng ngay</span>
                  <span className="btn-icon-bubble">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="h-4 w-4">
                      <path d="M7 17L17 7M17 7H7M17 7V17" />
                    </svg>
                  </span>
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}

function Burger({ open }: { open: boolean }) {
  return (
    <span className="relative block h-4 w-5">
      <span
        className={`absolute left-0 block h-0.5 w-5 rounded-full bg-current transition-all duration-300 ${
          open ? "top-1.5 rotate-45" : "top-0"
        }`}
      />
      <span
        className={`absolute left-0 top-1.5 block h-0.5 w-5 rounded-full bg-current transition-all duration-300 ${
          open ? "opacity-0" : "opacity-100"
        }`}
      />
      <span
        className={`absolute left-0 block h-0.5 w-5 rounded-full bg-current transition-all duration-300 ${
          open ? "top-1.5 -rotate-45" : "top-3"
        }`}
      />
    </span>
  );
}
