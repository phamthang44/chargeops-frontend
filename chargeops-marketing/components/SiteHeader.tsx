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
      <header
        className={`sticky top-0 z-50 transition-shadow ${scrolled ? "shadow-card" : ""}`}
      >
      <div className="glass">
        <div className="container-x flex h-16 items-center justify-between">
          <Link href="/" aria-label="ChargeOps trang chủ" className="rounded-lg">
            <Logo />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-7 md:flex" aria-label="Chính">
            {NAV.map((item) => {
              const act = isActive(item.id);
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  aria-current={act ? "true" : undefined}
                  className={`relative py-1 text-sm font-medium transition-colors ${
                    act ? "text-primary-dark" : "text-ink-body hover:text-primary-dark"
                  }`}
                >
                  {item.label}
                  <span
                    className={`absolute -bottom-0.5 left-0 h-0.5 rounded-full bg-primary transition-all duration-300 ${
                      act ? "w-full" : "w-0"
                    }`}
                  />
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/#tai-ung-dung" className="btn-primary hidden sm:inline-flex">
              Tải ứng dụng
            </Link>

            {/* Mobile menu toggle */}
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Đóng menu" : "Mở menu"}
              className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-line bg-white text-ink-strong transition hover:border-primary/40 md:hidden"
            >
              <Burger open={open} />
            </button>
          </div>
        </div>

        {/* Mobile menu panel */}
        <div
          id="mobile-menu"
          className={`overflow-hidden border-t border-line/70 transition-[max-height,opacity] duration-300 md:hidden ${
            open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <nav className="container-x flex flex-col gap-1 py-3" aria-label="Di động">
            {NAV.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setOpen(false)}
                aria-current={isActive(item.id) ? "true" : undefined}
                className={`rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive(item.id)
                    ? "bg-primary-soft text-primary-dark"
                    : "text-ink-body hover:bg-surface-alt"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <Link href="/#tai-ung-dung" onClick={() => setOpen(false)} className="btn-primary mt-2">
              Tải ứng dụng
            </Link>
          </nav>
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
