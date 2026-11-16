"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  AnimatePresence,
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import { STATIONS } from "@/components/stations";
import { DRIVER_DEMO_URL, OWNER_REGISTER_URL, SUPPORT_EMAIL } from "@/lib/home/content";
import {
  ArrowRightIcon,
  BoltIcon,
  CheckIcon,
  ChevronIcon,
  EASE_OUT,
  EASE_WIPE,
  MailIcon,
  ParallaxImage,
  PillButton,
  PlayIcon,
  Reveal,
  SmallPill,
  SplitChars,
  useHomeCopy,
  useHomeState,
} from "./core";

/* ================================================================== */
/* Hero                                                                */
/* ================================================================== */

export function Hero() {
  const c = useHomeCopy();
  const { introDone } = useHomeState();
  const reduce = useReducedMotion();
  const play = introDone || reduce;

  const rise = (delay: number) => ({
    initial: reduce ? false : { opacity: 0, y: 60 },
    animate: play ? { opacity: 1, y: 0 } : undefined,
    transition: { duration: 1.1, ease: EASE_OUT, delay },
  });

  return (
    <section className="relative px-4 pb-4" aria-labelledby="hero-title">
      <motion.div
        className="frame-tr relative h-[calc(100svh-150px)] min-h-[560px] max-h-[820px] overflow-hidden bg-hm-ink"
        initial={reduce ? false : { clipPath: "inset(7% 5% 7% 5% round 28px)" }}
        animate={play ? { clipPath: "inset(0% 0% 0% 0% round 0px)" } : undefined}
        transition={{ duration: 1.4, ease: EASE_WIPE }}
      >
        <motion.div
          className="absolute inset-0"
          initial={reduce ? false : { scale: 1.2 }}
          animate={play ? { scale: 1 } : undefined}
          transition={{ duration: 1.8, ease: EASE_OUT }}
        >
          <Image
            src="/home/hero.webp"
            alt={c.hero.imageAlt}
            fill
            preload
            loading="eager"
            fetchPriority="high"
            sizes="100vw"
            className="object-cover object-[50%_62%]"
          />
        </motion.div>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,22,17,0.55)_0%,rgba(4,22,17,0.34)_45%,rgba(4,22,17,0.6)_100%)]" />

        <div className="relative flex h-full flex-col items-center justify-center px-5 text-center text-white">
          <motion.svg
            viewBox="0 0 64 64"
            className="mb-6 h-14 w-14 md:h-16 md:w-16"
            aria-hidden="true"
            {...rise(0.1)}
          >
            <path d="M37 4 19 35h12l-3 25 19-32H35l2-24z" fill="#fff" />
          </motion.svg>
          <motion.h1 id="hero-title" className="t-xl max-w-[15ch] text-balance" {...rise(0.2)}>
            {c.hero.title}
          </motion.h1>
          <motion.p className="mt-5 max-w-xl text-base text-white/90 md:text-lg" {...rise(0.32)}>
            {c.hero.subtitle}
          </motion.p>
          <motion.div className="mt-9 w-full max-w-[340px] md:w-auto md:max-w-none" {...rise(0.44)}>
            <PillButton href={DRIVER_DEMO_URL} external label={c.hero.cta} icon={<BoltIcon />} tone="light" />
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}

/* ================================================================== */
/* Statement (illustration + two-line headline)                        */
/* ================================================================== */

export function Statement({ illo, line1, line2, width, height }: { illo: string; line1: string; line2: string; width: number; height: number }) {
  const reduce = useReducedMotion();
  return (
    <section className="px-4 py-14 md:py-20 lg:py-24">
      <div className="mx-auto grid max-w-[1200px] items-center gap-6 md:gap-10 lg:grid-cols-12">
        <motion.div
          className="mx-auto w-[150px] md:w-[190px] lg:col-span-3 lg:col-start-2 lg:mr-0"
          initial={reduce ? false : { opacity: 0, scale: 0.8, rotate: -10, y: 20 }}
          whileInView={{ opacity: 1, scale: 1, rotate: 0, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 1, ease: EASE_OUT }}
        >
          <Image src={illo} alt="" width={width} height={height} className="h-auto w-full" />
        </motion.div>
        <div className="text-center lg:col-span-7 lg:text-left">
          <h2 className="t-md text-hm-ink">
            <Reveal y={30} className="block">
              {line1}
            </Reveal>
            <Reveal y={30} delay={0.12} className="block">
              {line2}
            </Reveal>
          </h2>
        </div>
      </div>
    </section>
  );
}

/* ================================================================== */
/* Feature slider: rail + split text + clip-path video wipe            */
/* ================================================================== */

const CLIPS = [
  { video: "/home/clip1.mp4", poster: "/home/clip1-poster.webp" },
  { video: "/home/clip2.mp4", poster: "/home/clip2-poster.webp" },
  { video: "/home/clip3.mp4", poster: "/home/clip3-poster.webp" },
];

export function FeatureSlider() {
  const c = useHomeCopy();
  const { openVideo } = useHomeState();
  const reduce = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const near = useInView(sectionRef, { margin: "400px 0px", once: true });
  const visible = useInView(sectionRef, { amount: 0.2 });
  const layers = useRef<(HTMLDivElement | null)[]>([]);
  const videos = useRef<(HTMLVideoElement | null)[]>([]);
  const [index, setIndex] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const n = c.slider.slides.length;

  const go = (next: number) => {
    if (next < 0 || next >= n || next === index) return;
    const dir = next > index ? 1 : -1;
    const el = layers.current[next];
    setPrev(index);
    setIndex(next);
    if (el && !reduce) {
      animate(
        el,
        { clipPath: [dir > 0 ? "inset(100% 0% 0% 0%)" : "inset(0% 0% 100% 0%)", "inset(0% 0% 0% 0%)"] },
        { duration: 1.1, ease: EASE_WIPE },
      );
      const img = el.querySelector("video");
      if (img) animate(img, { scale: [1.15, 1] }, { duration: 1.4, ease: EASE_OUT });
    }
  };

  // Only the visible layers play; everything pauses off-screen.
  useEffect(() => {
    videos.current.forEach((v, i) => {
      if (!v) return;
      const shouldPlay = visible && near && (i === index || i === prev);
      if (shouldPlay) v.play().catch(() => {});
      else v.pause();
    });
  }, [index, prev, visible, near]);

  const fill = `${((index + 1) / n) * 100}%`;
  const arrowBtn =
    "grid h-10 w-10 shrink-0 place-items-center rounded-full border border-hm-ink/20 text-hm-ink transition hover:border-transparent hover:bg-hm-ink/10 disabled:pointer-events-none disabled:opacity-20";

  return (
    <section
      id="trai-nghiem"
      ref={sectionRef}
      aria-roledescription="carousel"
      aria-label={c.slider.label}
      className="px-4 py-4 lg:h-screen lg:min-h-[680px] lg:max-h-[960px]"
      onKeyDown={(e) => {
        if (e.key === "ArrowDown" || e.key === "ArrowRight") go(index + 1);
        if (e.key === "ArrowUp" || e.key === "ArrowLeft") go(index - 1);
      }}
    >
      <div className="mx-auto grid h-full max-w-[1440px] gap-8 lg:grid-cols-12 lg:gap-4">
        {/* Media */}
        <div
          className="frame-tr relative h-[58svh] min-h-[380px] overflow-hidden bg-hm-ink lg:order-2 lg:col-span-6 lg:col-start-7 lg:h-full"
          onTouchStart={(e) => (touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY })}
          onTouchEnd={(e) => {
            if (!touch.current) return;
            const dx = e.changedTouches[0].clientX - touch.current.x;
            const dy = e.changedTouches[0].clientY - touch.current.y;
            if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(index + (dx < 0 ? 1 : -1));
            touch.current = null;
          }}
        >
          {CLIPS.map((clip, i) => (
            <div
              key={clip.video}
              ref={(el) => {
                layers.current[i] = el;
              }}
              className="absolute inset-0 overflow-hidden"
              style={{ zIndex: i === index ? 2 : i === prev ? 1 : 0 }}
              aria-hidden={i !== index}
            >
              <video
                ref={(el) => {
                  videos.current[i] = el;
                }}
                className="h-full w-full object-cover"
                src={near ? clip.video : undefined}
                poster={clip.poster}
                muted
                loop
                playsInline
                preload={i === 0 ? "auto" : "metadata"}
                aria-label={c.slider.slides[i].alt}
              />
            </div>
          ))}
          <div className="absolute inset-x-3 bottom-3 z-10 md:inset-x-auto md:bottom-4 md:right-4">
            <PillButton onClick={openVideo} label={c.slider.cta} icon={<PlayIcon className="h-4 w-4" />} tone="light" />
          </div>
        </div>

        {/* Text + rail */}
        <div className="relative flex flex-col items-center gap-8 pb-4 lg:order-1 lg:col-span-6 lg:flex-row lg:items-center lg:gap-0 lg:pb-0">
          <div className="hidden h-full items-center lg:flex lg:w-[16.66%] lg:justify-center">
            <div className="flex flex-col items-center gap-4">
              <button type="button" className={arrowBtn} onClick={() => go(index - 1)} disabled={index === 0} aria-label={c.slider.prev}>
                <ChevronIcon className="h-4 w-4 rotate-180" />
              </button>
              <div className="relative h-[220px] w-1 rounded-full bg-hm-mist">
                <div className="absolute left-0 top-0 w-1 rounded-full bg-hm-brand transition-[height] duration-500 ease-out" style={{ height: fill }} />
              </div>
              <button type="button" className={arrowBtn} onClick={() => go(index + 1)} disabled={index === n - 1} aria-label={c.slider.next}>
                <ChevronIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="relative w-full max-w-[560px] text-center lg:pl-[4%] lg:text-left" aria-live="polite">
            <div className="min-h-[3.6em] t-lg text-hm-ink">
              <AnimatePresence mode="wait" initial={false}>
                <SplitChars key={index} text={c.slider.slides[index].title} as="h3" className="block" />
              </AnimatePresence>
            </div>
          </div>

          {/* Mobile rail */}
          <div className="flex w-full max-w-[420px] items-center gap-4 lg:hidden">
            <button type="button" className={arrowBtn} onClick={() => go(index - 1)} disabled={index === 0} aria-label={c.slider.prev}>
              <ChevronIcon className="h-4 w-4 rotate-90" />
            </button>
            <div className="relative h-1 flex-1 rounded-full bg-hm-mist">
              <div className="absolute left-0 top-0 h-1 rounded-full bg-hm-brand transition-[width] duration-500 ease-out" style={{ width: fill }} />
            </div>
            <button type="button" className={arrowBtn} onClick={() => go(index + 1)} disabled={index === n - 1} aria-label={c.slider.next}>
              <ChevronIcon className="h-4 w-4 -rotate-90" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ================================================================== */
/* Stats showcase: charger cutout + floating figure cards              */
/* ================================================================== */

function CountUp({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(reduce ? value : 0);
  useEffect(() => {
    if (!inView || reduce) return;
    const ctl = animate(0, value, { duration: 1.6, ease: EASE_OUT, onUpdate: (v) => setShown(Math.round(v)) });
    return () => ctl.stop();
  }, [inView, value, reduce]);
  return <span ref={ref}>{shown}</span>;
}

export function StatsShowcase() {
  const c = useHomeCopy();
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const yA = useTransform(scrollYProgress, [0, 1], [70, -70]);
  const yB = useTransform(scrollYProgress, [0, 1], [-30, 60]);
  const stations = STATIONS.length;
  const connectors = STATIONS.reduce((s, st) => s + st.total, 0);

  return (
    <section className="relative overflow-hidden px-4 pb-8 pt-20 lg:pb-16 lg:pt-32">
      <div ref={ref} className="relative mx-auto h-[500px] max-w-[1100px] md:h-[600px]">
        <motion.div
          className="frame-tr absolute inset-x-[8%] bottom-0 top-[22%] bg-hm-mint md:inset-x-[24%]"
          initial={reduce ? false : { opacity: 0, scale: 0.92 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 1.1, ease: EASE_OUT }}
        />
        <motion.div
          className="absolute bottom-0 left-1/2 h-[104%] w-[62%] max-w-[380px] -translate-x-1/2"
          initial={reduce ? false : { opacity: 0, y: 80 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 1.3, ease: EASE_OUT, delay: 0.1 }}
        >
          <Image src="/home/charger.webp" alt={c.stats.chargerAlt} fill sizes="380px" className="object-contain object-bottom" />
        </motion.div>

        <motion.div style={{ y: reduce ? 0 : yA }} className="absolute left-0 top-[6%] md:left-[4%]">
          <Reveal className="w-[150px] rounded-[24px] bg-white p-4 shadow-[0_24px_50px_-24px_rgba(11,43,36,0.45)] ring-1 ring-hm-ink/5 md:w-[210px] md:p-6">
            <Image src="/home/illo-kiosk.webp" alt="" width={440} height={421} className="h-14 w-auto md:h-[72px]" />
            <p className="t-lg mt-3 text-hm-ink">
              <CountUp value={stations} />
            </p>
            <p className="mt-1 text-[13px] leading-snug text-hm-body md:text-sm">{c.stats.stationsLabel}</p>
          </Reveal>
        </motion.div>

        <motion.div style={{ y: reduce ? 0 : yB }} className="absolute right-0 top-[42%] md:right-[4%]">
          <Reveal delay={0.15} className="w-[150px] rounded-[24px] bg-hm-ink/85 p-4 text-white shadow-[0_24px_50px_-24px_rgba(11,43,36,0.6)] backdrop-blur-md md:w-[210px] md:p-6">
            <Image src="/home/illo-calendar.webp" alt="" width={440} height={396} className="h-14 w-auto md:h-[72px]" />
            <p className="t-lg mt-3">
              <CountUp value={connectors} />
            </p>
            <p className="mt-1 text-[13px] leading-snug text-white/75 md:text-sm">{c.stats.connectorsLabel}</p>
          </Reveal>
        </motion.div>
      </div>
      <p className="mt-5 text-center text-xs text-hm-body/70">{c.stats.note}</p>
    </section>
  );
}

/* ================================================================== */
/* Booking split + About split                                          */
/* ================================================================== */

export function BookingSplit() {
  const c = useHomeCopy();
  return (
    <section className="px-4 py-16 lg:py-24">
      <div className="mx-auto grid max-w-[1320px] items-center gap-10 lg:grid-cols-12 lg:gap-4">
        <Reveal className="lg:col-span-4 lg:col-start-2">
          <h2 className="t-lg text-hm-ink">{c.booking.title}</h2>
          <p className="t-body-lg mt-6 text-hm-body">{c.booking.p1}</p>
          <p className="t-body-lg mt-3 font-semibold text-hm-ink">{c.booking.p2}</p>
          <div className="mt-8">
            <SmallPill href={DRIVER_DEMO_URL} external label={c.booking.cta} />
          </div>
        </Reveal>
        <Reveal delay={0.1} className="lg:col-span-6 lg:col-start-7">
          <ParallaxImage
            src="/home/booking.webp"
            alt={c.booking.imageAlt}
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="frame-tr aspect-[4/3]"
            imgClassName="object-[35%_50%]"
          />
        </Reveal>
      </div>
    </section>
  );
}

export function AboutSplit() {
  const c = useHomeCopy();
  const { openVideo } = useHomeState();
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const yB = useTransform(scrollYProgress, [0, 1], [90, -60]);

  return (
    <section id="ve-chargeops" className="px-4 py-16 lg:py-24">
      <div className="mx-auto grid max-w-[1320px] items-center gap-12 lg:grid-cols-12 lg:gap-4">
        <Reveal className="lg:col-span-4 lg:col-start-2">
          <h2 className="t-lg text-hm-ink">{c.about.title}</h2>
          <p className="t-body-lg mt-6 text-hm-body">{c.about.body}</p>
          <div className="mt-9">
            <PillButton onClick={openVideo} label={c.about.cta} icon={<PlayIcon className="h-4 w-4" />} tone="dark" />
          </div>
        </Reveal>
        <div ref={ref} className="relative h-[460px] md:h-[620px] lg:col-span-6 lg:col-start-7">
          <Reveal className="absolute right-0 top-0 w-[64%] md:right-[6%] md:w-[56%]">
            <ParallaxImage src="/home/about1.webp" alt={c.about.altA} sizes="(min-width: 1024px) 30vw, 60vw" className="frame-tr aspect-square" />
          </Reveal>
          <motion.div style={{ y: reduce ? 0 : yB }} className="absolute bottom-0 left-0 w-[46%] md:left-[4%] md:w-[38%]">
            <Reveal delay={0.15}>
              <ParallaxImage src="/home/about2.webp" alt={c.about.altB} sizes="(min-width: 1024px) 22vw, 46vw" className="frame-tr aspect-[3/4]" strength={10} />
            </Reveal>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ================================================================== */
/* Dark bands: license plans (expandable) + partner                     */
/* ================================================================== */

export function PlansBand() {
  const c = useHomeCopy();
  const [open, setOpen] = useState(false);
  return (
    <section id="goi-license" className="px-4 py-4">
      <div className="frame-tr relative overflow-hidden bg-hm-ink px-5 py-16 text-center text-white md:px-10 md:py-20 lg:py-24">
        <div className="pointer-events-none absolute -right-40 -top-40 h-[480px] w-[480px] rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.28),transparent_65%)]" />
        <Reveal className="relative mx-auto max-w-3xl">
          <h2 className="t-lg">{c.plans.title}</h2>
          <p className="t-body-lg mx-auto mt-5 max-w-2xl text-white/75">{c.plans.body}</p>
          <div className="mt-9 flex justify-center">
            <PillButton
              onClick={() => setOpen((v) => !v)}
              expanded={open}
              controls="goi-license-plans"
              label={open ? c.plans.ctaClose : c.plans.cta}
              icon={<ArrowRightIcon className={`h-5 w-5 transition-transform duration-500 ${open ? "-rotate-90" : "rotate-90"}`} />}
              tone="light"
            />
          </div>
        </Reveal>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              key="plans"
              id="goi-license-plans"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.7, ease: EASE_OUT }}
              className="relative overflow-hidden"
            >
              <div className="mx-auto mt-12 grid max-w-4xl gap-4 text-left md:grid-cols-2">
                {c.plans.items.map((p, i) => (
                  <motion.div
                    key={p.name}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, ease: EASE_OUT, delay: 0.1 + i * 0.1 }}
                    className={`rounded-[24px] p-6 ring-1 md:p-8 ${i === 1 ? "bg-white text-hm-ink ring-white" : "bg-white/[0.06] ring-white/15"}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-lg font-semibold">{p.name}</p>
                      {p.badge && <span className="rounded-full bg-hm-mint px-3 py-1 text-xs font-semibold text-hm-deep">{p.badge}</span>}
                    </div>
                    <p className="mt-4">
                      <span className="t-md">{p.price}</span>
                      <span className={`ml-1.5 text-sm ${i === 1 ? "text-hm-body" : "text-white/60"}`}>{p.unit}</span>
                    </p>
                    <ul className="mt-6 space-y-3">
                      {p.features.map((f) => (
                        <li key={f} className="flex gap-3 text-[15px]">
                          <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full ${i === 1 ? "bg-hm-mint text-hm-deep" : "bg-white/10 text-[#6EE7B7]"}`}>
                            <CheckIcon className="h-3 w-3" />
                          </span>
                          <span className={i === 1 ? "text-hm-body" : "text-white/80"}>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-8">
                      <a
                        href={OWNER_REGISTER_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`small-pill ${i === 1 ? "small-pill--dark" : "small-pill--light"}`}
                      >
                        {p.cta}
                      </a>
                    </div>
                  </motion.div>
                ))}
              </div>
              <p className="mx-auto mt-6 max-w-3xl text-xs leading-relaxed text-white/55">{c.plans.note}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

export function PartnerBand() {
  const c = useHomeCopy();
  return (
    <section id="doi-tac" className="px-4 py-4">
      <div className="frame-tr relative overflow-hidden bg-hm-ink px-5 py-16 text-center text-white md:px-10 md:py-20 lg:py-24">
        <div className="pointer-events-none absolute -bottom-48 -left-40 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.22),transparent_65%)]" />
        <Reveal className="relative mx-auto max-w-3xl">
          <h2 className="t-lg text-balance">{c.partner.title}</h2>
          <p className="t-body-lg mx-auto mt-5 max-w-2xl text-white/75">{c.partner.body}</p>
          <div className="mt-9 flex flex-col items-center gap-5">
            <PillButton href={OWNER_REGISTER_URL} external label={c.partner.cta} icon={<ArrowRightIcon />} tone="light" />
            <a href={`mailto:${SUPPORT_EMAIL}`} className="inline-flex items-center gap-2 text-sm text-white/70 underline-offset-4 transition hover:text-white hover:underline">
              <MailIcon className="h-4 w-4" />
              {c.partner.mail} · {SUPPORT_EMAIL}
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ================================================================== */
/* Giving you back                                                     */
/* ================================================================== */

const GIVING_ILLOS = [
  { src: "/home/illo-stopwatch.webp", w: 361, h: 440 },
  { src: "/home/illo-coffee.webp", w: 289, h: 440 },
  { src: "/home/illo-leaf-plug.webp", w: 390, h: 440 },
];

export function GivingBack() {
  const c = useHomeCopy();
  const reduce = useReducedMotion();
  return (
    <section className="px-4 py-16 lg:py-24">
      <div className="mx-auto max-w-[1320px]">
        <Reveal y={20}>
          <p className="pb-6 text-sm font-medium text-hm-body">{c.givingBack.label}</p>
        </Reveal>
        {c.givingBack.rows.map((row, i) => (
          <motion.div
            key={row.title}
            className="group relative grid grid-cols-[72px_1fr] items-center gap-x-5 gap-y-3 py-8 md:grid-cols-[140px_1fr_1fr] md:py-10"
            initial={reduce ? false : { opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.9, ease: EASE_OUT, delay: i * 0.05 }}
          >
            <motion.span
              aria-hidden="true"
              className="absolute left-0 top-0 h-px w-full origin-left bg-hm-ink/15"
              initial={reduce ? false : { scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, ease: EASE_OUT }}
            />
            <Image
              src={GIVING_ILLOS[i].src}
              alt=""
              width={GIVING_ILLOS[i].w}
              height={GIVING_ILLOS[i].h}
              className="h-16 w-auto justify-self-center transition-transform duration-500 ease-out group-hover:-rotate-6 group-hover:scale-110 md:h-24"
            />
            <h3 className="t-md text-hm-ink">{row.title}</h3>
            <p className="col-span-2 max-w-md text-[15px] leading-relaxed text-hm-body md:col-span-1 md:justify-self-end">{row.text}</p>
          </motion.div>
        ))}
        <div className="h-px w-full bg-hm-ink/15" />
      </div>
    </section>
  );
}

/* ================================================================== */
/* App section: hand + QR + feature cards                              */
/* ================================================================== */

const APP_ILLOS = [
  { src: "/home/illo-calendar.webp", w: 440, h: 396 },
  { src: "/home/illo-phone-qr.webp", w: 347, h: 440 },
  { src: "/home/illo-bell.webp", w: 440, h: 427 },
];

export function AppDownload() {
  const c = useHomeCopy();
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [60, -40]);

  return (
    <section id="ung-dung" className="px-4 py-16 lg:py-20">
      <div className="mx-auto grid max-w-[1320px] items-center gap-12 lg:grid-cols-12 lg:gap-4">
        <div ref={ref} className="relative order-2 h-[440px] md:h-[560px] lg:order-1 lg:col-span-6">
          <div className="frame-tr absolute inset-x-0 bottom-0 top-[16%] bg-hm-ink" />
          <motion.div style={{ y: reduce ? 0 : y }} className="absolute bottom-0 left-[26%] h-[100%] w-[70%] md:left-[30%]">
            <Image src="/home/apphand.webp" alt={c.app.handAlt} fill sizes="(min-width: 1024px) 30vw, 70vw" className="object-contain object-bottom" />
          </motion.div>
          <Reveal className="absolute left-4 top-[22%] w-[120px] rounded-[20px] bg-white p-3 text-center shadow-[0_20px_40px_-18px_rgba(0,0,0,0.5)] md:left-8 md:w-[150px]">
            <Image src="/home/qr-demo.svg" alt="" width={126} height={126} unoptimized className="h-auto w-full" />
            <p className="mt-2 text-[12px] leading-tight text-hm-body">{c.app.qrLabel}</p>
          </Reveal>
        </div>

        <div className="order-1 lg:order-2 lg:col-span-5 lg:col-start-8">
          <Reveal>
            <p className="inline-flex items-center gap-2 text-sm text-hm-body">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-hm-mint text-hm-deep">
                <BoltIcon className="h-3.5 w-3.5" />
              </span>
              {c.app.eyebrow}
            </p>
            <h2 className="t-lg mt-4 text-hm-ink">{c.app.title}</h2>
            <div className="mt-4 space-y-1 text-hm-body">
              {c.app.lines.map((l) => (
                <p key={l}>{l}</p>
              ))}
            </div>
          </Reveal>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {c.app.features.map((f, i) => (
              <Reveal key={f} delay={0.08 * i} y={30}>
                <div className="flex h-full items-center gap-4 rounded-[20px] rounded-tr-[48px] bg-hm-mint p-4 transition-transform duration-500 ease-out hover:-translate-y-1.5 sm:min-h-[200px] sm:flex-col sm:items-start sm:justify-between sm:p-5">
                  <Image src={APP_ILLOS[i].src} alt="" width={APP_ILLOS[i].w} height={APP_ILLOS[i].h} className="h-16 w-auto sm:h-20" />
                  <p className="text-[15px] font-semibold leading-snug text-hm-ink">{f}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ================================================================== */
/* Gallery carousel: drag, arrows, progress thumb                       */
/* ================================================================== */

const GALLERY = ["hero", "slide1", "slide2", "slide3", "about1", "about2", "hanoi", "danang", "booking"];

export function Gallery() {
  const c = useHomeCopy();
  const viewport = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const [cardW, setCardW] = useState(0);
  const [perView, setPerView] = useState(1.3);
  const [index, setIndex] = useState(0);
  const GAP = 16;
  const total = GALLERY.length;
  const maxIndex = Math.max(0, Math.ceil(total - perView));

  useLayoutEffect(() => {
    const measure = () => {
      const w = viewport.current?.clientWidth ?? 0;
      const pv = w >= 1024 ? 5 : w >= 640 ? 3 : 1.3;
      setPerView(pv);
      setCardW((w - GAP * (Math.ceil(pv) - 1)) / pv);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (viewport.current) ro.observe(viewport.current);
    return () => ro.disconnect();
  }, []);

  const step = cardW + GAP;
  const maxX = -Math.max(0, total * step - GAP - (viewport.current?.clientWidth ?? 0));

  const goTo = (i: number) => {
    const clamped = Math.max(0, Math.min(maxIndex, i));
    setIndex(clamped);
    animate(x, Math.max(maxX, -clamped * step), { duration: 0.7, ease: EASE_OUT });
  };

  useEffect(() => {
    x.set(Math.max(maxX, -index * step));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardW]);

  const thumbW = Math.min(100, (perView / total) * 100);
  const thumbLeft = maxIndex ? (index / maxIndex) * (100 - thumbW) : 0;
  const arrow =
    "grid h-10 w-10 place-items-center rounded-full border border-hm-ink/20 text-hm-ink transition hover:bg-hm-ink/10 disabled:pointer-events-none disabled:opacity-20";

  return (
    <section className="overflow-hidden py-20 lg:py-28" aria-roledescription="carousel" aria-label={c.gallery.title}>
      <Reveal>
        <h2 className="t-lg px-4 text-center text-hm-ink">{c.gallery.title}</h2>
      </Reveal>
      <div ref={viewport} className="mx-4 mt-12 overflow-visible">
        <motion.div
          className="flex cursor-grab touch-pan-y active:cursor-grabbing"
          style={{ x, gap: GAP }}
          drag="x"
          dragConstraints={{ left: maxX, right: 0 }}
          dragElastic={0.08}
          onDragEnd={() => {
            const i = Math.round(-x.get() / step);
            goTo(i);
          }}
        >
          {GALLERY.map((name, i) => (
            <Reveal key={name} delay={Math.min(i, 5) * 0.06} className="shrink-0" style={{ width: cardW || undefined }}>
              <div className="group relative aspect-[4/5] overflow-hidden rounded-[16px] rounded-tr-[56px] bg-hm-mist lg:rounded-tr-[72px]">
                <Image
                  src={`/home/${name}.webp`}
                  alt={c.gallery.alts[i]}
                  fill
                  draggable={false}
                  sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 75vw"
                  className="pointer-events-none select-none object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
              </div>
            </Reveal>
          ))}
        </motion.div>
      </div>
      <div className="mt-10 flex items-center justify-center gap-5 px-4">
        <button type="button" className={arrow} onClick={() => goTo(index - 1)} disabled={index === 0} aria-label={c.gallery.prev}>
          <ChevronIcon className="h-4 w-4 rotate-90" />
        </button>
        <div className="relative h-1 w-40 rounded-full bg-hm-mist md:w-56">
          <div
            className="absolute top-0 h-1 rounded-full bg-hm-deep transition-[left] duration-700 ease-out"
            style={{ width: `${thumbW}%`, left: `${thumbLeft}%` }}
          />
        </div>
        <button type="button" className={arrow} onClick={() => goTo(index + 1)} disabled={index >= maxIndex} aria-label={c.gallery.next}>
          <ChevronIcon className="h-4 w-4 -rotate-90" />
        </button>
      </div>
    </section>
  );
}

/* ================================================================== */
/* FAQ accordion                                                       */
/* ================================================================== */

export function Faq() {
  const c = useHomeCopy();
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section id="cau-hoi" className="px-4 py-16 lg:py-28">
      <Reveal>
        <h2 className="t-lg mx-auto max-w-2xl text-balance text-center text-hm-ink">{c.faq.title}</h2>
      </Reveal>
      <Reveal delay={0.1} className="mx-auto mt-12 max-w-3xl">
        <ul className="border-t border-hm-ink/15">
          {c.faq.items.map((item, i) => {
            const isOpen = open === i;
            return (
              <li key={item.q} className="border-b border-hm-ink/15">
                <button
                  type="button"
                  id={`faq-q-${i}`}
                  aria-expanded={isOpen}
                  aria-controls={`faq-a-${i}`}
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-6 py-5 text-left text-[16px] font-medium text-hm-ink md:text-[17px]"
                >
                  {item.q}
                  <span
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border transition-all duration-300 ${
                      isOpen ? "rotate-180 border-hm-ink bg-hm-ink text-white" : "border-hm-ink/20"
                    }`}
                  >
                    <ChevronIcon className="h-4 w-4" />
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={`faq-a-${i}`}
                      role="region"
                      aria-labelledby={`faq-q-${i}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.45, ease: EASE_OUT }}
                      className="overflow-hidden"
                    >
                      <p className="max-w-2xl pb-6 pr-12 text-[15px] leading-relaxed text-hm-body">{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      </Reveal>
    </section>
  );
}

/* ================================================================== */
/* Tech strip                                                          */
/* ================================================================== */

export function TechStrip() {
  const c = useHomeCopy();
  const { openVideo } = useHomeState();
  return (
    <section className="px-4 pb-8">
      <Reveal className="mx-auto flex max-w-[1320px] flex-col items-center gap-5 rounded-[24px] bg-hm-paper px-6 py-6 text-center ring-1 ring-hm-ink/5 md:flex-row md:gap-8 md:px-8 md:text-left">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full border-2 border-hm-deep text-[11px] font-bold tracking-wide text-hm-deep">
          OCPP
        </span>
        <p className="flex-1 text-[15px] leading-relaxed text-hm-body">{c.strip.text}</p>
        <SmallPill onClick={openVideo} label={c.strip.cta} />
      </Reveal>
    </section>
  );
}
