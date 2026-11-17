"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion, useScroll, useSpring } from "motion/react";
import type { LegalPageContent } from "@/lib/legal";
import { useTranslation } from "@/lib/i18n";
import { SUPPORT_EMAIL } from "@/lib/home/content";
import { CheckIcon, CloseIcon, EASE_OUT, MailIcon, Reveal, SearchIcon, useAnchorScroll } from "./core";

/** Slug that keeps Vietnamese section titles readable in the URL. */
function slug(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
const stripNumber = (title: string) => title.replace(/^\d+[.:\s-]+\s*/, "");

/* Lines worth lifting out of the running text, with a short label. */
function calloutFor(line: string, en: boolean): string | null {
  if (line.includes("10 phút") && (line.includes("ân hạn") || line.includes("hoàn 100%")))
    return en ? "Cancelling and refunds" : "Hủy và hoàn tiền";
  if (line.includes("Check-in được phép")) return en ? "Check-in window" : "Thời hạn check-in";
  if (line.includes("Argon2id") || line.includes("PKCE")) return en ? "How sign-in is protected" : "Bảo vệ đăng nhập";
  return null;
}

export function LegalDoc({ content }: { content: LegalPageContent }) {
  const { locale } = useTranslation();
  const en = locale === "en";
  const reduce = useReducedMotion();
  const anchorScroll = useAnchorScroll();
  const isTerms = content.kind === "terms";
  const [active, setActive] = useState("");
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [tocOpen, setTocOpen] = useState(false);

  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.3 });

  const readingMinutes = useMemo(() => {
    const words = content.sections.reduce(
      (n, s) => n + s.title.split(/\s+/).length + s.body.join(" ").split(/\s+/).length,
      0,
    );
    return Math.max(3, Math.ceil(words / 180));
  }, [content]);

  const sections = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return content.sections;
    return content.sections.filter((s) => s.title.toLowerCase().includes(q) || s.body.some((b) => b.toLowerCase().includes(q)));
  }, [content.sections, query]);

  // Highlight the section being read.
  useEffect(() => {
    const els = content.sections.map((s) => document.getElementById(slug(s.title))).filter(Boolean) as HTMLElement[];
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.find((e) => e.isIntersecting);
        if (hit) setActive(hit.target.id);
      },
      { rootMargin: "-15% 0px -70% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [content.sections, sections]);

  const copyLink = async (id?: string) => {
    const url = new URL(window.location.href);
    url.hash = id ?? "";
    try {
      await navigator.clipboard.writeText(url.toString());
      setCopied(id ?? "page");
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      /* clipboard can be blocked; nothing else to do */
    }
  };

  const jump = (id: string, e: React.MouseEvent) => {
    if (anchorScroll(`#${id}`)) {
      e.preventDefault();
      history.replaceState(null, "", `#${id}`);
    }
    setTocOpen(false);
  };

  const rise = (delay: number) =>
    reduce ? {} : { initial: { opacity: 0, y: 36 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.9, ease: EASE_OUT, delay } };

  const tabs = [
    { href: "/dieu-khoan", label: en ? "Terms of service" : "Điều khoản dịch vụ", on: isTerms },
    { href: "/chinh-sach-bao-mat", label: en ? "Privacy policy" : "Chính sách bảo mật", on: !isTerms },
  ];

  const toc = (
    <nav aria-label={en ? "Contents" : "Mục lục"} className="space-y-0.5">
      {sections.map((s) => {
        const id = slug(s.title);
        const n = content.sections.indexOf(s) + 1;
        const on = active === id;
        return (
          <a
            key={id}
            href={`#${id}`}
            onClick={(e) => jump(id, e)}
            aria-current={on ? "location" : undefined}
            className={`flex items-start gap-3 rounded-2xl px-3 py-2.5 text-[15px] leading-snug transition ${
              on ? "bg-hm-mint text-hm-ink" : "text-hm-body hover:bg-hm-paper hover:text-hm-ink"
            }`}
          >
            <span className={`w-6 shrink-0 tabular-nums ${on ? "text-hm-deep" : "text-hm-body/60"}`}>
              {String(n).padStart(2, "0")}
            </span>
            <span>{stripNumber(s.title)}</span>
          </a>
        );
      })}
      {sections.length === 0 && (
        <p className="px-3 py-4 text-[15px] text-hm-body">{en ? "Nothing matches that word." : "Không có mục nào khớp."}</p>
      )}
    </nav>
  );

  return (
    <>
      <motion.div
        aria-hidden="true"
        className="fixed inset-x-0 top-0 z-50 h-[3px] origin-left bg-hm-brand print:hidden"
        style={{ scaleX: progress }}
      />

      {/* ------------------------------------------------------------ */}
      {/* Intro                                                         */}
      {/* ------------------------------------------------------------ */}
      <section className="px-4 pb-10 pt-4 lg:pb-14 lg:pt-8">
        <div className="mx-auto max-w-[1200px]">
          <motion.nav aria-label="Breadcrumb" {...rise(0.05)} className="flex items-center gap-2 text-sm text-hm-body print:hidden">
            <Link href="/" className="transition hover:text-hm-ink">
              {en ? "Home" : "Trang chủ"}
            </Link>
            <span aria-hidden="true" className="text-hm-body/40">
              /
            </span>
            <span className="text-hm-ink">{tabs.find((t) => t.on)?.label}</span>
          </motion.nav>

          <motion.div {...rise(0.1)} className="mt-6 flex flex-wrap items-center justify-between gap-4 print:hidden">
            <div className="inline-flex rounded-full bg-hm-paper p-1 ring-1 ring-hm-ink/5">
              {tabs.map((t) => (
                <Link
                  key={t.href}
                  href={t.href}
                  aria-current={t.on ? "page" : undefined}
                  className={`inline-flex h-11 items-center whitespace-nowrap rounded-full px-4 text-[15px] transition sm:px-5 ${
                    t.on ? "bg-hm-ink text-white" : "text-hm-ink hover:bg-white"
                  }`}
                >
                  {t.label}
                </Link>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => copyLink()}
                className="small-pill gap-2 text-hm-ink ring-1 ring-hm-ink/15 hover:bg-hm-paper"
              >
                {copied === "page" ? <CheckIcon /> : null}
                {copied === "page" ? (en ? "Link copied" : "Đã chép link") : en ? "Copy link" : "Chép link"}
              </button>
              <button type="button" onClick={() => window.print()} className="small-pill small-pill--dark">
                {en ? "Print" : "In"}
              </button>
            </div>
          </motion.div>

          <motion.h1 {...rise(0.18)} className="t-xl mt-10 max-w-4xl text-balance">
            {content.title}
          </motion.h1>
          <motion.p {...rise(0.26)} className="t-body-lg mt-5 max-w-3xl text-hm-body">
            {content.description}
          </motion.p>
          <motion.div {...rise(0.34)} className="mt-8 flex flex-wrap gap-2 text-[13px]">
            <span className="rounded-full bg-hm-mint px-3 py-1.5 text-hm-deep">
              {en ? "Updated" : "Cập nhật"} {content.updatedAt}
            </span>
            <span className="rounded-full bg-hm-paper px-3 py-1.5 ring-1 ring-hm-ink/5">
              ~{readingMinutes} {en ? "min read" : "phút đọc"}
            </span>
            <span className="rounded-full bg-hm-paper px-3 py-1.5 ring-1 ring-hm-ink/5">
              {content.sections.length} {en ? "sections" : "mục"}
            </span>
            {en && (
              <span className="rounded-full bg-hm-paper px-3 py-1.5 ring-1 ring-hm-ink/5">Written in Vietnamese</span>
            )}
          </motion.div>
        </div>
      </section>

      {/* ------------------------------------------------------------ */}
      {/* Contents + text                                               */}
      {/* ------------------------------------------------------------ */}
      <section className="px-4 pb-20 lg:pb-28">
        <div className="mx-auto grid max-w-[1200px] gap-10 lg:grid-cols-[300px_1fr] lg:gap-16">
          {/* Desktop contents */}
          <aside className="hidden lg:block print:hidden">
            <div className="sticky top-6 rounded-[20px] rounded-tr-[48px] bg-white p-4 ring-1 ring-hm-ink/10">
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-hm-body" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={en ? "Search this page" : "Tìm trong trang"}
                  aria-label={en ? "Search this page" : "Tìm trong trang"}
                  className="h-11 w-full rounded-full bg-hm-paper pl-10 pr-10 text-[15px] outline-none ring-1 ring-hm-ink/5 placeholder:text-hm-body/70 focus:ring-2 focus:ring-hm-brand"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    aria-label={en ? "Clear" : "Xóa"}
                    className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-hm-body hover:bg-hm-mist"
                  >
                    <CloseIcon />
                  </button>
                )}
              </div>
              <div data-lenis-prevent className="mt-3 max-h-[calc(100vh-300px)] overflow-y-auto no-scrollbar">
                {toc}
              </div>
              <div className="mt-4 border-t border-hm-ink/10 px-3 pt-4 text-[13px] leading-relaxed text-hm-body">
                {en ? "Questions about this page?" : "Có câu hỏi về nội dung này?"}{" "}
                <a href={`mailto:${SUPPORT_EMAIL}`} className="font-medium text-hm-deep hover:underline">
                  {SUPPORT_EMAIL}
                </a>
              </div>
            </div>
          </aside>

          {/* Mobile contents */}
          <div className="lg:hidden print:hidden">
            <button
              type="button"
              onClick={() => setTocOpen((v) => !v)}
              aria-expanded={tocOpen}
              className="flex h-14 w-full items-center justify-between rounded-full bg-hm-paper px-5 text-[15px] font-medium ring-1 ring-hm-ink/5"
            >
              {en ? "Contents" : "Mục lục"} · {content.sections.length}
              <span className={`transition-transform ${tocOpen ? "rotate-45" : ""}`} aria-hidden="true">
                +
              </span>
            </button>
            <motion.div
              initial={false}
              animate={{ height: tocOpen ? "auto" : 0, opacity: tocOpen ? 1 : 0 }}
              transition={{ duration: 0.45, ease: EASE_OUT }}
              className="overflow-hidden"
            >
              <div className="pt-3">{toc}</div>
            </motion.div>
          </div>

          {/* Sections */}
          <div className="min-w-0">
            {sections.map((s) => {
              const id = slug(s.title);
              const n = content.sections.indexOf(s) + 1;
              return (
                <article key={id} id={id} className="scroll-mt-8 border-t border-hm-ink/10 py-10 first:border-t-0 first:pt-0">
                  <Reveal y={24}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-baseline gap-4">
                        <span className="text-[15px] tabular-nums text-hm-deep">{String(n).padStart(2, "0")}</span>
                        <h2 className="t-md">{stripNumber(s.title)}</h2>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyLink(id)}
                        aria-label={en ? `Copy link to ${stripNumber(s.title)}` : `Chép link mục ${stripNumber(s.title)}`}
                        className="mt-1 shrink-0 rounded-full px-3 py-1.5 text-[13px] text-hm-body transition hover:bg-hm-paper hover:text-hm-ink print:hidden"
                      >
                        {copied === id ? (en ? "Copied" : "Đã chép") : "#"}
                      </button>
                    </div>
                    <div className="mt-6 space-y-4 pl-0 sm:pl-10">
                      {s.body.map((line, i) => {
                        const label = calloutFor(line, en);
                        return label ? (
                          <div key={i} className="rounded-[20px] bg-hm-mint/70 p-5">
                            <p className="text-[13px] font-semibold uppercase tracking-wide text-hm-deep">{label}</p>
                            <p className="t-body mt-2 text-hm-ink">{line}</p>
                          </div>
                        ) : (
                          <p key={i} className="t-body-lg text-hm-body">
                            {line}
                          </p>
                        );
                      })}
                    </div>
                  </Reveal>
                </article>
              );
            })}

            {sections.length === 0 && (
              <div className="rounded-[20px] bg-hm-paper p-10 text-center">
                <p className="text-lg font-semibold">{en ? "Nothing matches that word." : "Không có mục nào khớp."}</p>
                <button type="button" onClick={() => setQuery("")} className="small-pill small-pill--dark mt-5">
                  {en ? "Show everything" : "Hiện tất cả"}
                </button>
              </div>
            )}

            <Reveal className="mt-6 rounded-[20px] rounded-tr-[48px] bg-hm-ink p-6 text-white md:p-8">
              <p className="text-lg font-semibold">
                {en ? "Changes are announced before they apply." : "Mọi thay đổi sẽ được thông báo trước khi áp dụng."}
              </p>
              <p className="mt-2 text-white/70">
                {en ? "Questions about your data or these terms:" : "Câu hỏi về dữ liệu hoặc điều khoản, gửi về:"}{" "}
                <a href={`mailto:${SUPPORT_EMAIL}`} className="inline-flex items-center gap-1.5 font-medium text-white underline-offset-4 hover:underline">
                  <MailIcon className="h-4 w-4" />
                  {SUPPORT_EMAIL}
                </a>
              </p>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
