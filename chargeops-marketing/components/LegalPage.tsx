"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { BackToTop } from "@/components/BackToTop";
import {
  CheckIcon,
  ShieldCheckIcon,
  DocumentIcon,
  PrinterIcon,
  LinkIcon,
  SearchIcon,
  ClockIcon,
  SparklesIcon,
  ChevronRightIcon,
} from "@/components/LegalIcons";
import type { LegalPageContent } from "@/lib/legal";

export function LegalPage({ content }: { content: LegalPageContent }) {
  const [activeSection, setActiveSection] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [readProgress, setReadProgress] = useState<number>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const isTerms = content.kind === "terms" || content.title.toLowerCase().includes("điều khoản");

  // Calculate estimated reading time (~180 words per minute)
  const readingTime = useMemo(() => {
    const totalWords = content.sections.reduce((acc, sec) => {
      return acc + sec.title.split(/\s+/).length + sec.body.join(" ").split(/\s+/).length;
    }, 0);
    return Math.max(3, Math.ceil(totalWords / 180));
  }, [content]);

  // Track window scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const el = document.documentElement;
      const scrollTop = el.scrollTop || document.body.scrollTop;
      const scrollHeight = el.scrollHeight - el.clientHeight;
      if (scrollHeight > 0) {
        setReadProgress(Math.min(100, Math.round((scrollTop / scrollHeight) * 100)));
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ScrollSpy via IntersectionObserver
  useEffect(() => {
    const sectionElements = content.sections
      .map((s) => document.getElementById(slug(s.title)))
      .filter(Boolean) as HTMLElement[];

    if (sectionElements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          setActiveSection(visible[0].target.id);
        }
      },
      {
        rootMargin: "-15% 0px -70% 0px",
        threshold: 0,
      }
    );

    sectionElements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [content.sections]);

  // Filter sections by search query
  const filteredSections = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return content.sections;
    return content.sections.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.body.some((b) => b.toLowerCase().includes(q))
    );
  }, [content.sections, searchQuery]);

  const handleCopyLink = (sectionId?: string) => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (sectionId) {
      url.hash = sectionId;
    } else {
      url.hash = "";
    }
    navigator.clipboard.writeText(url.toString());
    setCopiedId(sectionId || "page");
    setTimeout(() => setCopiedId(null), 2200);
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <>
      {/* Top Reading Progress Bar */}
      <div
        className="fixed inset-x-0 top-0 z-50 h-[3px] bg-white/10 print:hidden"
        aria-hidden="true"
      >
        <div
          className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 transition-all duration-150 ease-out"
          style={{ width: `${readProgress}%` }}
        />
      </div>

      <SiteHeader />

      <main className="min-h-screen bg-[#070A08] text-white pt-24 sm:pt-28 pb-24 antialiased">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-white/10 bg-[#0B100D] print:border-none print:pb-0">
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="pointer-events-none absolute left-10 top-1/2 h-56 w-56 -translate-y-1/2 rounded-full bg-emerald-500/5 blur-2xl" />

          <div className="container-x relative py-12 sm:py-16">
            {/* Breadcrumb */}
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-1.5 text-xs font-medium text-white/60 print:hidden"
            >
              <Link href="/" className="transition hover:text-emerald-400">
                Trang chủ
              </Link>
              <ChevronRightIcon className="h-3 w-3 opacity-60" />
              <span className="text-white/60">Pháp lý & Chính sách</span>
              <ChevronRightIcon className="h-3 w-3 opacity-60" />
              <span className="text-emerald-400 font-semibold">{isTerms ? "Điều khoản dịch vụ" : "Chính sách bảo mật"}</span>
            </nav>

            {/* Document Switcher Segmented Tabs */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 print:hidden">
              <div className="inline-flex rounded-full border border-white/10 bg-white/[0.04] p-1 shadow-glass backdrop-blur-md">
                <Link
                  href="/dieu-khoan"
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition ${
                    isTerms
                      ? "bg-emerald-500 text-white font-bold shadow-glow-emerald"
                      : "text-white/70 hover:text-white"
                  }`}
                >
                  <DocumentIcon className="h-3.5 w-3.5" />
                  Điều khoản dịch vụ
                </Link>
                <Link
                  href="/chinh-sach-bao-mat"
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition ${
                    !isTerms
                      ? "bg-emerald-500 text-white font-bold shadow-glow-emerald"
                      : "text-white/70 hover:text-white"
                  }`}
                >
                  <ShieldCheckIcon className="h-3.5 w-3.5" />
                  Chính sách bảo mật
                </Link>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyLink()}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs font-semibold text-white/90 shadow-sm transition hover:border-emerald-500/40 hover:bg-white/10 hover:text-emerald-400"
                  title="Sao chép liên kết trang"
                >
                  <LinkIcon className="h-3.5 w-3.5" />
                  <span>{copiedId === "page" ? "Đã sao chép link!" : "Chia sẻ"}</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs font-semibold text-white/90 shadow-sm transition hover:border-emerald-500/40 hover:bg-white/10 hover:text-emerald-400"
                  title="In hoặc xuất file PDF"
                >
                  <PrinterIcon className="h-3.5 w-3.5" />
                  <span>In tài liệu</span>
                </button>
              </div>
            </div>

            {/* Title & Eyebrow */}
            <div className="mt-8 max-w-4xl">
              <span className="eyebrow-tag">
                <SparklesIcon className="h-3.5 w-3.5 text-emerald-400" />
                <span>{content.eyebrow}</span>
              </span>
              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-5xl leading-[1.24] sm:leading-[1.26]">
                {content.title}
              </h1>
              <p className="mt-4 text-base leading-relaxed text-white/70 sm:text-lg">
                {content.description}
              </p>
            </div>

            {/* Metadata Pills */}
            <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-white/10 pt-6 text-xs text-white/60">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] border border-white/10 px-3 py-1 font-medium text-white/80">
                <ClockIcon className="h-3.5 w-3.5 text-emerald-400" />
                Cập nhật lần cuối: <strong className="text-white ml-1">{content.updatedAt}</strong>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] border border-white/10 px-3 py-1 font-medium text-white/80">
                <span>Ước tính:</span>
                <strong className="text-white ml-1">~{readingTime} phút đọc</strong>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 font-medium text-emerald-400">
                <CheckIcon className="h-3.5 w-3.5" />
                {isTerms ? "Quy chuẩn Booking v4.9" : "Chuẩn mã hóa Argon2id & RS256"}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] border border-white/10 px-3 py-1 font-medium text-white/60">
                {content.sections.length} điều khoản chính thức
              </span>
            </div>
          </div>
        </section>

        {/* Content Section: Sidebar TOC + Main Clauses */}
        <section className="container-x py-10 sm:py-14">
          <div className="grid gap-8 lg:grid-cols-[290px_1fr] xl:gap-10">
            {/* Desktop Sticky Table of Contents */}
            <aside className="hidden lg:block print:hidden">
              <div className="sticky top-24 rounded-2xl border border-white/10 bg-[#0E1512] p-5 shadow-diffusion-dark">
                {/* TOC Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-400">
                      <DocumentIcon className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-white">
                      Mục lục tài liệu
                    </span>
                  </div>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-white/70">
                    {filteredSections.length}/{content.sections.length}
                  </span>
                </div>

                {/* Quick Search */}
                <div className="relative mt-3">
                  <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm trong điều khoản..."
                    className="w-full rounded-xl border border-white/10 bg-[#121A16] py-1.5 pl-8 pr-3 text-xs text-white outline-none transition placeholder:text-white/40 focus:border-emerald-500/50 focus:bg-[#16201B] focus:ring-1 focus:ring-emerald-500/30"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-white/50 hover:text-white"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* TOC Navigation Links */}
                <nav className="mt-3 max-h-[calc(100vh-320px)] space-y-1 overflow-y-auto pr-1 text-xs no-scrollbar">
                  {filteredSections.map((section, idx) => {
                    const secSlug = slug(section.title);
                    const isActive = activeSection === secSlug;
                    return (
                      <a
                        key={section.title}
                        href={`#${secSlug}`}
                        className={`group flex items-start gap-2.5 rounded-xl px-3 py-2 font-medium transition ${
                          isActive
                            ? "bg-emerald-500/15 text-emerald-400 shadow-sm ring-1 ring-emerald-500/30 font-semibold"
                            : "text-white/70 hover:bg-white/[0.04] hover:text-white"
                        }`}
                      >
                        <span
                          className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded text-[10px] font-bold ${
                            isActive
                              ? "bg-emerald-500 text-white"
                              : "bg-white/10 text-white/60 group-hover:text-white"
                          }`}
                        >
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <span className="line-clamp-2 leading-relaxed">
                          {stripNumberPrefix(section.title)}
                        </span>
                      </a>
                    );
                  })}

                  {filteredSections.length === 0 && (
                    <p className="py-4 text-center text-xs text-white/50">
                      Không tìm thấy nội dung khớp với từ khóa.
                    </p>
                  )}
                </nav>

                {/* Support & Contact Callout */}
                <div className="mt-5 border-t border-white/10 pt-4">
                  <div className="rounded-xl bg-[#121A16] border border-white/10 p-3 text-[11px] leading-relaxed text-white/70">
                    <p className="font-semibold text-white">Cần hỗ trợ pháp lý?</p>
                    <p className="mt-1">
                      Mọi câu hỏi về điều khoản và dữ liệu cá nhân, vui lòng liên hệ:
                    </p>
                    <a
                      href="mailto:support@chargeops.online"
                      className="mt-1.5 inline-block font-semibold text-emerald-400 hover:underline"
                    >
                      support@chargeops.online
                    </a>
                  </div>
                </div>
              </div>
            </aside>

            {/* Mobile TOC Quick-Jump Bar */}
            <div className="lg:hidden print:hidden">
              <div className="rounded-xl border border-white/10 bg-[#0E1512] p-3 shadow-diffusion-dark">
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="flex w-full items-center justify-between text-xs font-semibold text-white"
                >
                  <span className="inline-flex items-center gap-2">
                    <DocumentIcon className="h-4 w-4 text-emerald-400" />
                    <span>Mục lục điều khoản ({content.sections.length} phần)</span>
                  </span>
                  <span className="text-emerald-400">
                    {mobileMenuOpen ? "Đóng ▲" : "Xem nhanh ▼"}
                  </span>
                </button>

                {mobileMenuOpen && (
                  <nav className="mt-3 space-y-1 border-t border-white/10 pt-3 text-xs">
                    {content.sections.map((section, idx) => (
                      <a
                        key={section.title}
                        href={`#${slug(section.title)}`}
                        onClick={() => setMobileMenuOpen(false)}
                        className="block rounded-lg px-2.5 py-1.5 font-medium text-white/70 hover:bg-emerald-500/15 hover:text-emerald-400"
                      >
                        {String(idx + 1).padStart(2, "0")}. {stripNumberPrefix(section.title)}
                      </a>
                    ))}
                  </nav>
                )}
              </div>
            </div>

            {/* Main Articles List */}
            <div className="space-y-6">
              {filteredSections.map((section, idx) => {
                const secSlug = slug(section.title);
                return (
                  <article
                    key={section.title}
                    id={secSlug}
                    className="scroll-mt-28 rounded-2xl border border-white/10 bg-[#0E1512] p-6 shadow-diffusion-dark transition duration-300 hover:border-emerald-500/30 sm:p-8"
                  >
                    {/* Section Header */}
                    <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
                      <div className="flex items-start gap-3">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-xs font-bold text-emerald-400 ring-1 ring-emerald-500/30">
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <h2 className="text-lg font-bold text-white sm:text-xl">
                          {section.title}
                        </h2>
                      </div>

                      {/* Anchor Link Button */}
                      <button
                        type="button"
                        onClick={() => handleCopyLink(secSlug)}
                        className="group shrink-0 rounded-lg p-1.5 text-white/40 transition hover:bg-white/5 hover:text-emerald-400 print:hidden"
                        title="Sao chép liên kết mục này"
                        aria-label={`Sao chép liên kết ${section.title}`}
                      >
                        {copiedId === secSlug ? (
                          <span className="text-xs font-bold text-emerald-400">✓ Đã chép</span>
                        ) : (
                          <LinkIcon className="h-4 w-4 opacity-50 group-hover:opacity-100" />
                        )}
                      </button>
                    </div>

                    {/* Section Paragraphs & Smart Callout Rendering */}
                    <div className="mt-5 space-y-4 text-sm leading-relaxed text-white/80 sm:text-[15px]">
                      {section.body.map((line, lineIdx) => {
                        const isBookingGracePeriod =
                          line.includes("10 phút") && (line.includes("ân hạn") || line.includes("hoàn 100%"));
                        const isSecurityArgon =
                          line.includes("Argon2id") || line.includes("PKCE") || line.includes("RS256");
                        const isCheckinWindow =
                          line.includes("Check-in được phép") || line.includes("15 phút");

                        if (isBookingGracePeriod) {
                          return (
                            <div
                              key={lineIdx}
                              className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 text-white shadow-sm"
                            >
                              <div className="flex items-center gap-2 font-semibold text-emerald-400">
                                <CheckIcon className="h-4 w-4" />
                                <span>Quy chế ân hạn hủy & Hoàn tiền (Booking Rules v4.9)</span>
                              </div>
                              <p className="mt-1.5 text-sm leading-relaxed text-white/80">
                                {line}
                              </p>
                            </div>
                          );
                        }

                        if (isSecurityArgon) {
                          return (
                            <div
                              key={lineIdx}
                              className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 text-white shadow-sm"
                            >
                              <div className="flex items-center gap-2 font-semibold text-emerald-400">
                                <ShieldCheckIcon className="h-4 w-4 text-emerald-400" />
                                <span>Cam kết bảo mật & Chuẩn mã hóa dữ liệu</span>
                              </div>
                              <p className="mt-1.5 text-sm leading-relaxed text-white/80">
                                {line}
                              </p>
                            </div>
                          );
                        }

                        if (isCheckinWindow) {
                          return (
                            <div
                              key={lineIdx}
                              className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 text-white shadow-sm"
                            >
                              <div className="flex items-center gap-2 font-semibold text-amber-400">
                                <ClockIcon className="h-4 w-4 text-amber-400" />
                                <span>Thời hạn check-in QR & Xử lý vắng mặt</span>
                              </div>
                              <p className="mt-1.5 text-sm leading-relaxed text-white/80">
                                {line}
                              </p>
                            </div>
                          );
                        }

                        return (
                          <p key={lineIdx} className="leading-relaxed">
                            {line}
                          </p>
                        );
                      })}
                    </div>
                  </article>
                );
              })}

              {/* Bottom Notice Card */}
              <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-[#0E1512] to-[#080D0B] p-6 text-center text-xs text-white/70 shadow-diffusion-dark sm:p-8">
                <p className="font-bold text-white text-sm">
                  Văn bản có giá trị pháp lý đầy đủ và ràng buộc trong hệ sinh thái ChargeOps.
                </p>
                <p className="mt-1 text-white/60">
                  Mọi sửa đổi, bổ sung quy chế sẽ được thông báo công khai trước khi có hiệu lực áp dụng.
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:border-emerald-500/40 hover:bg-white/10"
                  >
                    <PrinterIcon className="h-3.5 w-3.5" /> In bản lưu trữ PDF
                  </button>
                  <Link
                    href="/"
                    className="btn-primary text-xs py-2 px-5"
                  >
                    Quay lại Trang chủ
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
      <BackToTop />
    </>
  );
}

/** Slug generator supporting Vietnamese diacritics */
function slug(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Helper to remove leading numbering like "1. ", "02. " from titles in TOC */
function stripNumberPrefix(title: string): string {
  return title.replace(/^\d+[\.\:\s\-]+\s*/, "");
}
