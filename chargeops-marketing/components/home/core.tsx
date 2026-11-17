"use client";

import {
  createContext,
  useContext,
  useRef,
  type ReactNode,
  type CSSProperties,
} from "react";
import Image from "next/image";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type Variants,
} from "motion/react";
import type Lenis from "lenis";
import { usePathname } from "next/navigation";
import { useLocale } from "@/lib/i18n";
import { HOME_COPY, type HomeCopy } from "@/lib/home/content";

/* ------------------------------------------------------------------ */
/* Tokens                                                              */
/* ------------------------------------------------------------------ */

/** Long, soft deceleration used for every reveal on the page. */
export const EASE_OUT = [0.16, 1, 0.3, 1] as const;
/** In-out curve used for wipes (clip-path reveals, loader exit). */
export const EASE_WIPE = [0.76, 0, 0.24, 1] as const;

export function useHomeCopy(): HomeCopy {
  const { locale } = useLocale();
  return HOME_COPY[locale === "en" ? "en" : "vi"];
}

/* ------------------------------------------------------------------ */
/* Page-level state: intro finished + smooth-scroll handle             */
/* ------------------------------------------------------------------ */

type HomeState = {
  introDone: boolean;
  lenis: React.RefObject<Lenis | null>;
  openVideo: () => void;
};
export const HomeStateContext = createContext<HomeState>({
  introDone: true,
  lenis: { current: null },
  openVideo: () => {},
});
export const useHomeState = () => useContext(HomeStateContext);

/** Pause/resume page scrolling while an overlay (menu, modal) is open. */
export function useScrollLock() {
  const { lenis } = useHomeState();
  return (locked: boolean) => {
    if (locked) lenis.current?.stop();
    else lenis.current?.start();
    document.documentElement.style.overflow = locked ? "hidden" : "";
  };
}

/** Smooth-scroll to an in-page anchor ("#id"); returns false for other hrefs. */
export function useAnchorScroll() {
  const { lenis } = useHomeState();
  return (href: string) => {
    if (!href.startsWith("#")) return false;
    // getElementById, not querySelector: legal section ids start with a digit ("#4-…").
    const el = document.getElementById(decodeURIComponent(href.slice(1)));
    if (!el) return false;
    if (lenis.current) lenis.current.scrollTo(el as HTMLElement, { offset: -24, duration: 1.4 });
    else el.scrollIntoView({ behavior: "smooth", block: "start" });
    return true;
  };
}

/**
 * Section anchors (#ban-do, #cau-hoi…) only exist on the home page; on any
 * other page they must point back to "/#…".
 */
export function useHomeHref() {
  const pathname = usePathname();
  return (href: string) => (href.startsWith("#") && pathname !== "/" ? `/${href}` : href);
}

/* ------------------------------------------------------------------ */
/* Reveal: fade + rise when the element enters the viewport            */
/* ------------------------------------------------------------------ */

export function Reveal({
  children,
  className,
  delay = 0,
  y = 40,
  amount = 0.25,
  style,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  amount?: number;
  style?: CSSProperties;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      style={style}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount }}
      transition={{ duration: 1, ease: EASE_OUT, delay }}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* SplitChars: per-character stagger (words never break mid-word)      */
/* ------------------------------------------------------------------ */

const charParent: Variants = {
  hidden: {},
  show: (stagger: number) => ({ transition: { staggerChildren: stagger } }),
  exit: { transition: { staggerChildren: 0.006 } },
};
const charChild: Variants = {
  hidden: { opacity: 0, y: "0.55em" },
  show: { opacity: 1, y: "0em", transition: { duration: 0.55, ease: EASE_OUT } },
  exit: { opacity: 0, y: "-0.45em", transition: { duration: 0.28, ease: EASE_WIPE } },
};

export function SplitChars({
  text,
  className,
  stagger = 0.014,
  as: Tag = "span",
}: {
  text: string;
  className?: string;
  stagger?: number;
  as?: "span" | "h2" | "h3" | "p";
}) {
  const words = text.normalize("NFC").split(" ");
  const MotionTag = motion[Tag] as typeof motion.span;
  return (
    <MotionTag
      className={className}
      aria-label={text}
      variants={charParent}
      custom={stagger}
      initial="hidden"
      animate="show"
      exit="exit"
    >
      {words.map((word, wi) => (
        <span key={wi} aria-hidden="true" className="inline-block whitespace-nowrap">
          {Array.from(word).map((ch, ci) => (
            <motion.span key={ci} variants={charChild} className="inline-block will-change-transform">
              {ch}
            </motion.span>
          ))}
          {wi < words.length - 1 ? <span className="inline-block">&nbsp;</span> : null}
        </span>
      ))}
    </MotionTag>
  );
}

/* ------------------------------------------------------------------ */
/* ParallaxImage: image drifts inside its rounded frame while scrolling */
/* ------------------------------------------------------------------ */

export function ParallaxImage({
  src,
  alt,
  className,
  sizes,
  strength = 14,
  priority,
  imgClassName,
}: {
  src: string;
  alt: string;
  className?: string;
  sizes: string;
  strength?: number;
  priority?: boolean;
  imgClassName?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [`-${strength}%`, `${strength}%`]);
  return (
    <div ref={ref} className={`relative overflow-hidden ${className ?? ""}`}>
      <motion.div
        className="absolute inset-x-0"
        style={{ y: reduce ? 0 : y, top: `-${strength + 2}%`, bottom: `-${strength + 2}%` }}
      >
        <Image src={src} alt={alt} fill sizes={sizes} preload={priority} className={`object-cover ${imgClassName ?? ""}`} />
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* PillButton: the round icon slides across the pill on hover          */
/* ------------------------------------------------------------------ */

type PillTone = "light" | "dark" | "white";

export function PillButton({
  href,
  onClick,
  label,
  icon,
  tone = "dark",
  external,
  className,
  fullOnMobile = true,
  expanded,
  controls,
}: {
  href?: string;
  onClick?: () => void;
  label: string;
  icon: ReactNode;
  tone?: PillTone;
  external?: boolean;
  className?: string;
  fullOnMobile?: boolean;
  /** For disclosure buttons: sets aria-expanded / aria-controls. */
  expanded?: boolean;
  controls?: string;
}) {
  const anchorScroll = useAnchorScroll();
  const cls = `pill pill--${tone} ${fullOnMobile ? "pill--full" : ""} ${className ?? ""}`;
  const inner = (
    <>
      <span className="pill__icon" aria-hidden="true">
        {icon}
      </span>
      <span className="pill__label">{label}</span>
    </>
  );
  if (href) {
    return (
      <a
        href={href}
        className={cls}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        onClick={(e) => {
          if (anchorScroll(href)) e.preventDefault();
          onClick?.();
        }}
      >
        {inner}
      </a>
    );
  }
  return (
    <button type="button" className={cls} onClick={onClick} aria-expanded={expanded} aria-controls={controls}>
      {inner}
    </button>
  );
}

/** Small solid pill without the sliding icon (secondary actions). */
export function SmallPill({
  href,
  label,
  external,
  tone = "dark",
  onClick,
}: {
  href?: string;
  label: string;
  external?: boolean;
  tone?: "dark" | "light";
  onClick?: () => void;
}) {
  const anchorScroll = useAnchorScroll();
  const cls = `small-pill small-pill--${tone}`;
  if (!href)
    return (
      <button type="button" className={cls} onClick={onClick}>
        {label}
      </button>
    );
  return (
    <a
      href={href}
      className={cls}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      onClick={(e) => {
        if (anchorScroll(href)) e.preventDefault();
        onClick?.();
      }}
    >
      {label}
    </a>
  );
}

/* ------------------------------------------------------------------ */
/* Icons (stroke icons, 24px grid)                                     */
/* ------------------------------------------------------------------ */

type IconProps = { className?: string };
const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
  "aria-hidden": true,
};

export const BoltIcon = ({ className = "h-5 w-5" }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" />
  </svg>
);
export const PinIcon = ({ className = "h-5 w-5" }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </svg>
);
export const PlayIcon = ({ className = "h-5 w-5" }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M7 4.5v15l12-7.5-12-7.5z" fill="currentColor" stroke="none" />
  </svg>
);
export const ArrowRightIcon = ({ className = "h-5 w-5" }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);
export const ChevronIcon = ({ className = "h-4 w-4" }: IconProps) => (
  <svg {...base} className={className}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);
export const CloseIcon = ({ className = "h-4 w-4" }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);
export const SearchIcon = ({ className = "h-5 w-5" }: IconProps) => (
  <svg {...base} className={className}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);
export const MailIcon = ({ className = "h-5 w-5" }: IconProps) => (
  <svg {...base} className={className}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </svg>
);
export const GlobeIcon = ({ className = "h-4 w-4" }: IconProps) => (
  <svg {...base} className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" />
  </svg>
);
export const MenuIcon = ({ className = "h-5 w-5" }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M4 8h16M4 16h16" />
  </svg>
);
export const CheckIcon = ({ className = "h-4 w-4" }: IconProps) => (
  <svg {...base} className={className}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);
export const ExternalIcon = ({ className = "h-3.5 w-3.5" }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
  </svg>
);

/** The ChargeOps bolt in a rounded square (same geometry as components/Logo). */
export function AppIcon({ size = 44, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} aria-hidden="true">
      <rect x="0" y="0" width="100" height="100" rx="26" fill="#10B981" />
      <path d="M58 8 L30 55 L49 55 L44 92 L73 43 L54 43 Z" transform="translate(14,11) scale(0.72)" fill="#fff" />
    </svg>
  );
}

/** Wordmark used in the header and footer. */
export function Wordmark({ className, tone = "ink" }: { className?: string; tone?: "ink" | "white" }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <AppIcon size={30} />
      <span
        className={`font-display text-[22px] font-bold leading-none tracking-[-0.03em] ${
          tone === "ink" ? "text-hm-ink" : "text-white"
        }`}
      >
        chargeops
      </span>
    </span>
  );
}
