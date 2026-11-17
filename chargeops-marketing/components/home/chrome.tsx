"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useLocale } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { WALKTHROUGH_VIDEO_URLS } from "@/lib/walkthrough-media";
import { DRIVER_DEMO_URL, SUPPORT_EMAIL } from "@/lib/home/content";
import {
  AppIcon,
  ArrowRightIcon,
  BoltIcon,
  ChevronIcon,
  CloseIcon,
  EASE_OUT,
  EASE_WIPE,
  ExternalIcon,
  MenuIcon,
  PillButton,
  Wordmark,
  useAnchorScroll,
  useHomeHref,
  useHomeCopy,
  useHomeState,
  useScrollLock,
} from "./core";

/* ------------------------------------------------------------------ */
/* Page loader: brand mark pops in, then the sheet wipes upward         */
/* ------------------------------------------------------------------ */

export function PageLoader({ onDone }: { onDone: () => void }) {
  const reduce = useReducedMotion();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (reduce) {
      setVisible(false);
      onDone();
      return;
    }
    const t = window.setTimeout(() => setVisible(false), 750);
    return () => window.clearTimeout(t);
  }, [reduce, onDone]);

  return (
    <AnimatePresence onExitComplete={onDone}>
      {visible && (
        <motion.div
          key="loader"
          className="home-loader fixed inset-0 z-[90] grid place-items-center bg-white"
          exit={{ clipPath: "inset(0% 0% 100% 0%)" }}
          initial={{ clipPath: "inset(0% 0% 0% 0%)" }}
          transition={{ duration: 0.85, ease: EASE_WIPE }}
          aria-hidden="true"
        >
          <motion.div
            initial={{ scale: 0.6, opacity: 0, rotate: -8 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: -30 }}
            transition={{ duration: 0.6, ease: EASE_OUT }}
          >
            <AppIcon size={76} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ */
/* Announcement bar                                                     */
/* ------------------------------------------------------------------ */

const BAR_KEY = "co_home_bar_closed";

export function AnnouncementBar() {
  const c = useHomeCopy();
  const [open, setOpen] = useState(true);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(BAR_KEY) === "1") setOpen(false);
    } catch {
      /* storage unavailable: keep the bar */
    }
  }, []);

  const close = () => {
    setOpen(false);
    try {
      sessionStorage.setItem(BAR_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          key="bar"
          initial={{ height: 0 }}
          animate={{ height: "auto" }}
          exit={{ height: 0 }}
          transition={{ duration: 0.5, ease: EASE_WIPE }}
          className="overflow-hidden bg-hm-ink text-white"
        >
          <div className="relative flex min-h-[44px] items-center justify-center px-12 py-2.5 text-center text-[13px] leading-snug sm:text-sm">
            <p>
              <span className="text-white/85">{c.announcement.text}</span>{" "}
              <a
                href={DRIVER_DEMO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[#6EE7B7] underline-offset-4 hover:underline"
              >
                {c.announcement.link} →
              </a>
            </p>
            <button
              type="button"
              onClick={close}
              aria-label={c.promo.close}
              className="absolute right-3 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              <CloseIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ */
/* Header: desktop dropdowns + full-screen mobile menu                  */
/* ------------------------------------------------------------------ */

function NavDropdown({
  index,
  openIndex,
  setOpenIndex,
}: {
  index: number;
  openIndex: number | null;
  setOpenIndex: (i: number | null) => void;
}) {
  const c = useHomeCopy();
  const anchorScroll = useAnchorScroll();
  const homeHref = useHomeHref();
  const group = c.nav.groups[index];
  const open = openIndex === index;
  const closeTimer = useRef<number | undefined>(undefined);

  return (
    <div
      className="relative"
      onMouseEnter={() => {
        window.clearTimeout(closeTimer.current);
        setOpenIndex(index);
      }}
      onMouseLeave={() => {
        closeTimer.current = window.setTimeout(() => setOpenIndex(null), 120);
      }}
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpenIndex(open ? null : index)}
        className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-2 text-[15px] transition ${
          open ? "bg-hm-mist text-hm-ink" : "text-hm-ink hover:bg-hm-mist"
        }`}
      >
        {group.label}
        <ChevronIcon
          className={`h-4 w-4 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.28, ease: EASE_OUT }}
            className="absolute left-1/2 top-full z-50 mt-2 w-[340px] -translate-x-1/2 rounded-[22px] bg-white p-2 shadow-[0_28px_60px_-24px_rgba(11,43,36,0.45)] ring-1 ring-hm-ink/5"
          >
            {group.links.map((l) => (
              <a
                key={l.label}
                href={homeHref(l.href)}
                {...(l.external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                onClick={(e) => {
                  if (anchorScroll(l.href)) e.preventDefault();
                  setOpenIndex(null);
                }}
                className="group/item flex items-start justify-between gap-3 rounded-2xl px-4 py-3 transition hover:bg-hm-paper"
              >
                <span>
                  <span className="block text-[15px] font-semibold text-hm-ink">
                    {l.label}
                  </span>
                  {l.desc && (
                    <span className="mt-0.5 block text-[13px] text-hm-body">
                      {l.desc}
                    </span>
                  )}
                </span>
                <span className="mt-1 text-hm-body/50 transition group-hover/item:translate-x-0.5 group-hover/item:text-hm-deep">
                  {l.external ? (
                    <ExternalIcon />
                  ) : (
                    <ArrowRightIcon className="h-4 w-4" />
                  )}
                </span>
              </a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function HomeHeader() {
  const c = useHomeCopy();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenIndex(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // The menu renders beside the header, not inside it: the header's z-40 stacking
  // context would otherwise trap the menu under the fixed mobile app bar.
  return (
    <>
      <header className="relative z-40 bg-white">
        <nav className="mx-auto flex h-[76px] max-w-[1440px] items-center justify-between gap-4 px-4 xl:grid xl:grid-cols-[auto_1fr_auto] xl:gap-6">
          <Link
            href="/"
            aria-label={c.nav.home}
            className="justify-self-start rounded-xl"
          >
            <Wordmark />
          </Link>

          <div className="hidden items-center justify-center gap-0.5 xl:flex">
            <Link
              href="/tram-sac"
              className="whitespace-nowrap rounded-full px-3 py-2 text-[15px] text-hm-ink transition hover:bg-hm-mist"
            >
              {c.nav.findStation}
            </Link>
            {c.nav.groups.map((_, i) => (
              <NavDropdown
                key={i}
                index={i}
                openIndex={openIndex}
                setOpenIndex={setOpenIndex}
              />
            ))}
          </div>

          <div className="hidden items-center justify-self-end gap-2 xl:flex">
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="whitespace-nowrap rounded-full px-2.5 py-1.5 text-[13px] text-hm-body transition hover:bg-hm-mist hover:text-hm-ink"
            >
              {c.nav.help}
            </a>
            <a
              href={DRIVER_DEMO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 inline-flex h-11 items-center gap-2 whitespace-nowrap rounded-full bg-hm-ink px-5 text-[15px] font-medium text-white transition hover:bg-hm-deep"
            >
              {c.nav.cta}
            </a>
          </div>

          <div className="flex items-center gap-2 xl:hidden">
            <a
              href={DRIVER_DEMO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden h-11 items-center whitespace-nowrap rounded-full bg-hm-ink px-5 text-[15px] font-medium text-white transition hover:bg-hm-deep md:inline-flex"
            >
              {c.nav.cta}
            </a>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label={c.nav.menu}
              aria-expanded={menuOpen}
              className="grid h-11 w-11 place-items-center rounded-full border border-hm-ink/15 text-hm-ink transition hover:bg-hm-mist"
            >
              <MenuIcon />
            </button>
          </div>
        </nav>
      </header>
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}

function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const c = useHomeCopy();
  const lock = useScrollLock();
  const anchorScroll = useAnchorScroll();
  const homeHref = useHomeHref();
  const [expanded, setExpanded] = useState<number | null>(0);

  useEffect(() => {
    lock(open);
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const go = (href: string, e: React.MouseEvent) => {
    if (href.startsWith("#") && document.querySelector(href)) {
      e.preventDefault();
      onClose();
      lock(false);
      window.setTimeout(() => anchorScroll(href), 80);
    } else {
      onClose();
    }
  };

  const item = {
    hidden: { opacity: 0, y: 24 },
    show: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: 0.18 + i * 0.06, duration: 0.6, ease: EASE_OUT },
    }),
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="menu"
          role="dialog"
          aria-modal="true"
          aria-label={c.nav.menu}
          initial={{ clipPath: "inset(0% 0% 100% 0%)" }}
          animate={{ clipPath: "inset(0% 0% 0% 0%)" }}
          exit={{ clipPath: "inset(0% 0% 100% 0%)" }}
          transition={{ duration: 0.6, ease: EASE_WIPE }}
          className="fixed inset-0 z-[70] flex flex-col bg-white xl:hidden"
          data-lenis-prevent
        >
          <div className="flex h-[76px] shrink-0 items-center justify-between px-4">
            <Wordmark />
            <button
              type="button"
              onClick={onClose}
              aria-label={c.nav.closeMenu}
              className="grid h-11 w-11 place-items-center rounded-full border border-hm-ink/15 text-hm-ink"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-6">
            <motion.div
              custom={0}
              variants={item}
              initial="hidden"
              animate="show"
            >
              <Link
                href="/tram-sac"
                onClick={onClose}
                className="flex items-center justify-between border-b border-hm-ink/10 py-5 text-2xl font-semibold"
              >
                {c.nav.findStation}
                <ArrowRightIcon className="h-5 w-5 text-hm-deep" />
              </Link>
            </motion.div>
            {c.nav.groups.map((g, gi) => {
              const isOpen = expanded === gi;
              return (
                <motion.div
                  key={g.label}
                  custom={gi + 1}
                  variants={item}
                  initial="hidden"
                  animate="show"
                  className="border-b border-hm-ink/10"
                >
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setExpanded(isOpen ? null : gi)}
                    className="flex w-full items-center justify-between py-5 text-left text-2xl font-semibold"
                  >
                    {g.label}
                    <ChevronIcon
                      className={`h-5 w-5 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.ul
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.4, ease: EASE_OUT }}
                        className="overflow-hidden"
                      >
                        {g.links.map((l) => (
                          <li key={l.label}>
                            <a
                              href={homeHref(l.href)}
                              {...(l.external
                                ? {
                                    target: "_blank",
                                    rel: "noopener noreferrer",
                                  }
                                : {})}
                              onClick={(e) => go(l.href, e)}
                              className="block rounded-2xl px-1 pb-4"
                            >
                              <span className="block text-[17px] font-medium text-hm-ink">
                                {l.label}
                              </span>
                              {l.desc && (
                                <span className="block text-sm text-hm-body">
                                  {l.desc}
                                </span>
                              )}
                            </a>
                          </li>
                        ))}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
            <motion.div
              custom={5}
              variants={item}
              initial="hidden"
              animate="show"
              className="mt-6 space-y-4"
            >
              <LanguageSwitcher variant="drawer" tone="light" />
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="inline-block text-sm text-hm-body underline-offset-4 hover:underline"
              >
                {c.nav.help}
              </a>
            </motion.div>
          </div>

          <motion.div
            custom={6}
            variants={item}
            initial="hidden"
            animate="show"
            className="shrink-0 border-t border-hm-ink/10 p-4"
          >
            <PillButton
              href={DRIVER_DEMO_URL}
              external
              label={c.nav.cta}
              icon={<BoltIcon />}
              tone="dark"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ */
/* Floating QR (desktop) + sticky app bar (mobile)                      */
/* ------------------------------------------------------------------ */

export function FloatingQr() {
  const c = useHomeCopy();
  const { introDone } = useHomeState();
  return (
    <motion.a
      href={DRIVER_DEMO_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={c.widget.scan}
      initial={{ opacity: 0, y: 30 }}
      animate={introDone ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.8, ease: EASE_OUT, delay: 0.9 }}
      className="fixed bottom-6 right-6 z-40 hidden w-[118px] flex-col items-center gap-2 rounded-[22px] bg-white/80 p-2.5 text-center shadow-[0_20px_50px_-20px_rgba(11,43,36,0.45)] ring-1 ring-hm-ink/5 backdrop-blur-xl transition-transform duration-300 hover:-translate-y-1 lg:flex"
    >
      <AppIcon size={40} />
      <span className="text-[12px] leading-tight text-hm-body">
        {c.widget.scan}
      </span>
      <span className="rounded-2xl bg-white p-2">
        <Image
          src="/home/qr-demo.svg"
          alt=""
          width={80}
          height={80}
          unoptimized
        />
      </span>
    </motion.a>
  );
}

export function MobileAppBar() {
  const c = useHomeCopy();
  const { introDone } = useHomeState();
  return (
    <motion.div
      initial={{ y: 140 }}
      animate={introDone ? { y: 0 } : undefined}
      transition={{ duration: 0.8, ease: EASE_OUT, delay: 0.7 }}
      className="fixed inset-x-3 bottom-3 z-40 rounded-[22px] bg-hm-ink/90 p-3 text-white shadow-[0_18px_40px_-16px_rgba(0,0,0,0.5)] backdrop-blur-xl lg:hidden"
    >
      <div className="flex items-center gap-3">
        <AppIcon size={44} />
        <div className="min-w-0">
          <p className="text-[15px] font-semibold leading-tight">
            {c.widget.barTitle}
          </p>
          <p className="text-[13px] text-white/70">{c.widget.barText}</p>
        </div>
      </div>
      <a
        href={DRIVER_DEMO_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 flex h-11 items-center justify-center rounded-full bg-white text-[15px] font-medium text-hm-ink transition active:scale-[0.98]"
      >
        {c.widget.barCta}
      </a>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Promo modal (once per session) and video modal                       */
/* ------------------------------------------------------------------ */

const PROMO_KEY = "co_home_promo_seen";

export function PromoModal() {
  const c = useHomeCopy();
  const { introDone } = useHomeState();
  const lock = useScrollLock();
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!introDone) return;
    let seen = false;
    try {
      seen = sessionStorage.getItem(PROMO_KEY) === "1";
    } catch {
      seen = false;
    }
    if (seen) return;
    const t = window.setTimeout(() => {
      // never stack on top of another open overlay
      if (document.querySelector('[role="dialog"]')) return;
      setOpen(true);
      try {
        sessionStorage.setItem(PROMO_KEY, "1");
      } catch {
        /* ignore */
      }
    }, 9000);
    return () => window.clearTimeout(t);
  }, [introDone]);

  useEffect(() => {
    lock(open);
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="promo"
          className="fixed inset-0 z-[80] grid place-items-center bg-hm-ink/45 p-3 backdrop-blur-[3px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          onClick={() => setOpen(false)}
          data-lenis-prevent
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="promo-title"
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.6, ease: EASE_OUT }}
            onClick={(e) => e.stopPropagation()}
            className="relative grid max-h-[calc(100svh-24px)] w-full max-w-[820px] overflow-y-auto rounded-[28px] bg-[#E8FBF2] md:grid-cols-[1fr_1.05fr] md:overflow-hidden"
          >
            <div className="relative aspect-[4/3] md:aspect-auto md:min-h-[400px]">
              <Image
                src="/home/booking.webp"
                alt={c.promo.imageAlt}
                fill
                sizes="(min-width: 768px) 400px, 100vw"
                className="object-cover object-[30%_50%]"
              />
              <span className="absolute left-4 top-4 rounded-full bg-[#BDF2DA] px-3.5 py-1.5 text-[13px] font-semibold text-hm-ink">
                {c.promo.badge}
              </span>
            </div>
            <div className="flex flex-col justify-center gap-4 p-6 md:p-10">
              <h2 id="promo-title" className="t-md text-hm-ink">
                {c.promo.title}
              </h2>
              <p className="t-body text-hm-body">{c.promo.body}</p>
              <div className="mt-2">
                <PillButton
                  href={DRIVER_DEMO_URL}
                  external
                  label={c.promo.cta}
                  icon={<BoltIcon />}
                  tone="dark"
                  onClick={() => setOpen(false)}
                />
              </div>
            </div>
            <button
              ref={closeRef}
              type="button"
              onClick={() => setOpen(false)}
              aria-label={c.promo.close}
              className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-hm-ink shadow-sm transition hover:bg-white"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function VideoModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const c = useHomeCopy();
  const { locale } = useLocale();
  const lock = useScrollLock();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    lock(open);
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="video"
          role="dialog"
          aria-modal="true"
          aria-label={c.video.title}
          className="fixed inset-0 z-[85] grid place-items-center bg-[#04120E]/90 p-3 backdrop-blur-sm md:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          data-lenis-prevent
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.6, ease: EASE_OUT }}
            className="relative w-full max-w-[1100px]"
            onClick={(e) => e.stopPropagation()}
          >
            <video
              className="aspect-video w-full rounded-[20px] bg-black"
              src={
                locale === "en"
                  ? WALKTHROUGH_VIDEO_URLS.en
                  : WALKTHROUGH_VIDEO_URLS.vi
              }
              controls
              autoPlay
              playsInline
              preload="metadata"
            />
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label={c.video.close}
              className="absolute -top-12 right-0 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
