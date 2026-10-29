"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useMemo } from "react";
import { Logo } from "./Logo";
import { useTranslation } from "@/lib/i18n";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function SiteHeader() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const [active, setActive] = useState<string>("");
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const onStations = pathname.startsWith("/tram-sac");

  const navItems = useMemo(
    () => [
      { id: "cach-hoat-dong", label: t.nav.howItWorks, href: "/#cach-hoat-dong" },
      { id: "tinh-nang", label: t.nav.features, href: "/#tinh-nang" },
      { id: "kien-truc", label: t.nav.architecture, href: "/#kien-truc" },
      { id: "tram-sac", label: t.nav.stations, href: "/tram-sac" },
      { id: "doi-tac", label: t.nav.forOwners, href: "/#doi-tac" },
    ],
    [t]
  );

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
    const ids = [...navItems.map((n) => n.id), "tai-ung-dung"];
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
  }, [pathname, navItems]);

  const isActive = (id: string) =>
    onStations ? id === "tram-sac" : active === id;

  return (
    <>
      <div ref={sentinelRef} aria-hidden className="h-px w-full" />
      {open && (
        <button
          type="button"
          aria-label={t.nav.closeMenu}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
        />
      )}
      <header className="fixed top-3 sm:top-5 inset-x-0 z-50 px-3 sm:px-6 pointer-events-none transition-all duration-500 ease-haptic">
        <div className="mx-auto max-w-5xl pointer-events-auto">
          <div
            className={`island-nav transition-all duration-500 ease-haptic px-4 sm:px-6 py-2.5 ${
              open
                ? "rounded-[1.75rem] bg-[#0E1512]/95 border border-white/15 shadow-[0_24px_64px_-18px_rgba(0,0,0,0.85)]"
                : `rounded-full ${scrolled
                ? "bg-[#0B100D]/90 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.1)] scale-[0.99]"
                : "shadow-[0_12px_36px_-10px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.06)]"}`
            }`}
          >
            <div className="flex items-center justify-between gap-4">
              <Link href="/" aria-label={t.nav.homeAria} className="shrink-0 transition-transform duration-500 ease-haptic hover:scale-[1.02]">
                <Logo />
              </Link>

              {/* Desktop nav */}
              <nav className="hidden items-center gap-1 lg:gap-1.5 lg:flex" aria-label="Chính">
                {navItems.map((item) => {
                  const act = isActive(item.id);
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      aria-current={act ? "true" : undefined}
                      className={`relative px-3.5 py-1.5 text-xs lg:text-[13px] font-semibold rounded-full transition-all duration-500 ease-haptic ${
                        act
                          ? "bg-emerald-500/15 text-emerald-400 shadow-sm ring-1 ring-emerald-500/30"
                          : "text-white/70 hover:text-white hover:bg-white/[0.06]"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>

              <div className="flex items-center gap-2">
                <a
                  href="https://driver.chargeops.online/?demo=true"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-island-primary hidden lg:inline-flex text-xs font-semibold py-1.5 pl-4 pr-1.5"
                >
                  <span>{t.nav.tryDriverWeb}</span>
                  <span className="btn-icon-bubble !h-7 !w-7">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="h-3.5 w-3.5">
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                    </svg>
                  </span>
                </a>

                {/* Mobile menu toggle */}
                <button
                  type="button"
                  onClick={() => setOpen((v) => !v)}
                  aria-expanded={open}
                  aria-controls="mobile-menu"
                  aria-label={open ? t.nav.closeMenu : t.nav.toggleMenu}
                  className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition hover:border-emerald-500/50 lg:hidden"
                >
                  <Burger open={open} />
                </button>
              </div>
            </div>

            {/* Mobile menu panel */}
            <div
              id="mobile-menu"
              className={`overflow-x-hidden overflow-y-auto overscroll-contain transition-all duration-500 ease-haptic lg:hidden ${
                open
                  ? "max-h-[calc(100dvh_-_5rem)] opacity-100 pt-3 mt-2 border-t border-white/10"
                  : "max-h-0 opacity-0"
              }`}
            >
              <nav className="flex flex-col gap-1 pb-1" aria-label="Di động">
                {navItems.map((item, idx) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={isActive(item.id) ? "true" : undefined}
                    style={{ transitionDelay: `${idx * 40}ms` }}
                    className={`min-h-11 rounded-xl px-3.5 py-2 text-sm font-semibold transition-all duration-500 ease-haptic ${
                      isActive(item.id)
                        ? "bg-emerald-500/15 text-emerald-400 font-bold"
                        : "text-white/75 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}

                <div className="pt-2 border-t border-white/10 mt-1">
                  <LanguageSwitcher variant="drawer" />
                </div>

                <a
                  href="https://driver.chargeops.online/?demo=true"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                  className="btn-island-primary mt-2 justify-between py-2.5 pl-5 pr-2.5 text-sm"
                >
                  <span>{t.nav.tryDriverWebFull}</span>
                  <span className="btn-icon-bubble">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="h-4 w-4">
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                    </svg>
                  </span>
                </a>
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
