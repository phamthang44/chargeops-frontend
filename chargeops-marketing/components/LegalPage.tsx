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
        className="fixed inset-x-0 top-0 z-50 h-[3px] bg-line/40 print:hidden"
        aria-hidden="true"
      >
        <div
          className="h-full bg-gradient-to-r from-primary via-primary-light to-primary transition-all duration-150 ease-out"
          style={{ width: `${readProgress}%` }}
        />
      </div>

      <SiteHeader />

      <main className="min-h-screen bg-surface-alt pb-24 text-ink-body antialiased">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-line bg-white print:border-none print:pb-0">
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-primary-soft/40 blur-3xl" />
          <div className="pointer-events-none absolute left-10 top-1/2 h-56 w-56 -translate-y-1/2 rounded-full bg-surface-alt/60 blur-2xl" />

          <div className="container-x relative py-12 sm:py-16">
            {/* Breadcrumb */}
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-1.5 text-xs font-medium text-ink-muted print:hidden"
            >
              <Link href="/" className="transition hover:text-primary-dark">
                Trang chủ
              </Link>
              <ChevronRightIcon className="h-3 w-3 opacity-60" />
              <span className="text-ink-muted">Pháp lý & Chính sách</span>
              <ChevronRightIcon className="h-3 w-3 opacity-60" />
              <span className="text-ink-strong">{isTerms ? "Điều khoản dịch vụ" : "Chính sách bảo mật"}</span>
            </nav>

            {/* Document Switcher Segmented Tabs */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 print:hidden">
              <div className="inline-flex rounded-pill border border-line bg-surface-alt p-1 shadow-sm">
                <Link
                  href="/dieu-khoan"
                  className={`inline-flex items-center gap-2 rounded-pill px-4 py-2 text-xs font-semibold transition ${
                    isTerms
                      ? "bg-primary text-white shadow-sm"
                      : "text-ink-body hover:text-ink-strong"
                  }`}
                >
                  <DocumentIcon className="h-3.5 w-3.5" />
                  Điều khoản dịch vụ
                </Link>
                <Link
                  href="/chinh-sach-bao-mat"
                  className={`inline-flex items-center gap-2 rounded-pill px-4 py-2 text-xs font-semibold transition ${
                    !isTerms
                      ? "bg-primary text-white shadow-sm"
                      : "text-ink-body hover:text-ink-strong"
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
                  className="inline-flex items-center gap-1.5 rounded-pill border border-line bg-white px-3.5 py-1.5 text-xs font-medium text-ink-body shadow-sm transition hover:border-primary/40 hover:text-primary-dark"
                  title="Sao chép liên kết trang"
                >
                  <LinkIcon className="h-3.5 w-3.5" />
                  <span>{copiedId === "page" ? "Đã sao chép link!" : "Chia sẻ"}</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 rounded-pill border border-line bg-white px-3.5 py-1.5 text-xs font-medium text-ink-body shadow-sm transition hover:border-primary/40 hover:text-primary-dark"
                  title="In hoặc xuất file PDF"
                >
                  <PrinterIcon className="h-3.5 w-3.5" />
                  <span>In tài liệu</span>
                </button>
              </div>
            </div>

            {/* Title & Eyebrow */}
            <div className="mt-8 max-w-4xl">
              <div className="inline-flex items-center gap-2 rounded-pill bg-primary-soft/70 px-3 py-1 text-xs font-semibold text-primary-dark ring-1 ring-primary/20">
                <SparklesIcon className="h-3.5 w-3.5 text-primary" />
                <span>{content.eyebrow}</span>
              </div>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-ink-strong sm:text-5xl">
                {content.title}
              </h1>
              <p className="mt-4 text-base leading-relaxed text-ink-body sm:text-lg">
                {content.description}
              </p>
            </div>

            {/* Metadata Pills */}
            <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-line/60 pt-6 text-xs text-ink-muted">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-surface-alt px-2.5 py-1 font-medium text-ink-body">
                <ClockIcon className="h-3.5 w-3.5 text-primary" />
                Cập nhật lần cuối: <strong className="text-ink-strong">{content.updatedAt}</strong>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-md bg-surface-alt px-2.5 py-1 font-medium text-ink-body">
                <span>Ước tính:</span>
                <strong className="text-ink-strong">~{readingTime} phút đọc</strong>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-md bg-primary-soft/60 px-2.5 py-1 font-medium text-primary-dark ring-1 ring-primary/20">
                <CheckIcon className="h-3.5 w-3.5" />
                {isTerms ? "Quy chuẩn Booking v4.9" : "Chuẩn mã hóa Argon2id & RS256"}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-md bg-surface-alt px-2.5 py-1 font-medium text-ink-muted">
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
              <div className="sticky top-20 rounded-2xl border border-line bg-white p-5 shadow-card">
                {/* TOC Header */}
                <div className="flex items-center justify-between border-b border-line pb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary-soft text-primary-dark">
                      <DocumentIcon className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-ink-strong">
                      Mục lục tài liệu
                    </span>
                  </div>
                  <span className="rounded-full bg-surface-alt px-2 py-0.5 text-[11px] font-semibold text-ink-muted">
                    {filteredSections.length}/{content.sections.length}
                  </span>
                </div>

                {/* Quick Search */}
                <div className="relative mt-3">
                  <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-muted" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm trong điều khoản..."
                    className="w-full rounded-xl border border-line bg-surface-alt py-1.5 pl-8 pr-3 text-xs text-ink-strong outline-none transition placeholder:text-ink-muted focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-ink-muted hover:text-ink-strong"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* TOC Navigation Links */}
                <nav className="mt-3 max-h-[calc(100vh-320px)] space-y-1 overflow-y-auto pr-1 text-xs">
                  {filteredSections.map((section, idx) => {
                    const secSlug = slug(section.title);
                    const isActive = activeSection === secSlug;
                    return (
                      <a
                        key={section.title}
                        href={`#${secSlug}`}
                        className={`group flex items-start gap-2.5 rounded-xl px-3 py-2 font-medium transition ${
                          isActive
                            ? "bg-primary-soft text-primary-dark shadow-sm ring-1 ring-primary/20"
                            : "text-ink-body hover:bg-surface-alt hover:text-ink-strong"
                        }`}
                      >
                        <span
                          className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded text-[10px] font-bold ${
                            isActive
                              ? "bg-primary text-white"
                              : "bg-surface-alt text-ink-muted group-hover:text-ink-body"
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
                    <p className="py-4 text-center text-xs text-ink-muted">
                      Không tìm thấy nội dung khớp với từ khóa.
                    </p>
                  )}
                </nav>

                {/* Support & Contact Callout */}
                <div className="mt-5 border-t border-line pt-4">
                  <div className="rounded-xl bg-surface-alt p-3 text-[11px] leading-relaxed text-ink-muted">
                    <p className="font-semibold text-ink-strong">Cần hỗ trợ pháp lý?</p>
                    <p className="mt-1">
                      Mọi câu hỏi về điều khoản và dữ liệu cá nhân, vui lòng liên hệ:
                    </p>
                    <a
                      href="mailto:support@chargeops.vn"
                      className="mt-1.5 inline-block font-semibold text-primary-dark hover:underline"
                    >
                      support@chargeops.vn
                    </a>
                  </div>
                </div>
              </div>
            </aside>

            {/* Mobile TOC Quick-Jump Bar */}
            <div className="lg:hidden print:hidden">
              <div className="rounded-xl border border-line bg-white p-3 shadow-card">
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="flex w-full items-center justify-between text-xs font-semibold text-ink-strong"
                >
                  <span className="inline-flex items-center gap-2">
                    <DocumentIcon className="h-4 w-4 text-primary" />
                    <span>Mục lục điều khoản ({content.sections.length} phần)</span>
                  </span>
                  <span className="text-primary-dark">
                    {mobileMenuOpen ? "Đóng ▲" : "Xem nhanh ▼"}
                  </span>
                </button>

                {mobileMenuOpen && (
                  <nav className="mt-3 space-y-1 border-t border-line pt-3 text-xs">
                    {content.sections.map((section, idx) => (
                      <a
                        key={section.title}
                        href={`#${slug(section.title)}`}
                        onClick={() => setMobileMenuOpen(false)}
                        className="block rounded-lg px-2.5 py-1.5 font-medium text-ink-body hover:bg-primary-soft hover:text-primary-dark"
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
                    className="scroll-mt-24 rounded-2xl border border-line bg-white p-6 shadow-card transition duration-200 hover:border-primary/20 hover:shadow-glass sm:p-8"
                  >
                    {/* Section Header */}
                    <div className="flex items-start justify-between gap-4 border-b border-line/70 pb-4">
                      <div className="flex items-start gap-3">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-xs font-bold text-primary-dark ring-1 ring-primary/20">
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <h2 className="text-lg font-bold text-ink-strong sm:text-xl">
                          {section.title}
                        </h2>
                      </div>

                      {/* Anchor Link Button */}
                      <button
                        type="button"
                        onClick={() => handleCopyLink(secSlug)}
                        className="group shrink-0 rounded-lg p-1.5 text-ink-muted transition hover:bg-surface-alt hover:text-primary-dark print:hidden"
                        title="Sao chép liên kết mục này"
                        aria-label={`Sao chép liên kết ${section.title}`}
                      >
                        {copiedId === secSlug ? (
                          <span className="text-xs font-bold text-primary-dark">✓ Đã chép</span>
                        ) : (
                          <LinkIcon className="h-4 w-4 opacity-50 group-hover:opacity-100" />
                        )}
                      </button>
                    </div>

                    {/* Section Paragraphs & Smart Callout Rendering */}
                    <div className="mt-5 space-y-4 text-sm leading-relaxed text-ink-body sm:text-[15px]">
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
                              className="rounded-xl border border-primary/30 bg-primary-soft/40 p-4 text-ink-strong shadow-sm"
                            >
                              <div className="flex items-center gap-2 font-semibold text-primary-dark">
                                <CheckIcon className="h-4 w-4" />
                                <span>Quy chế ân hạn hủy & Hoàn tiền (Booking Rules v4.9)</span>
                              </div>
                              <p className="mt-1.5 text-sm leading-relaxed text-ink-body">
                                {line}
                              </p>
                            </div>
                          );
                        }

                        if (isSecurityArgon) {
                          return (
                            <div
                              key={lineIdx}
                              className="rounded-xl border border-primary/30 bg-emerald-50/50 p-4 text-ink-strong shadow-sm"
                            >
                              <div className="flex items-center gap-2 font-semibold text-emerald-800">
                                <ShieldCheckIcon className="h-4 w-4 text-emerald-600" />
                                <span>Cam kết bảo mật & Chuẩn mã hóa dữ liệu</span>
                              </div>
                              <p className="mt-1.5 text-sm leading-relaxed text-ink-body">
                                {line}
                              </p>
                            </div>
                          );
                        }

                        if (isCheckinWindow) {
                          return (
                            <div
                              key={lineIdx}
                              className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-ink-strong shadow-sm"
                            >
                              <div className="flex items-center gap-2 font-semibold text-amber-900">
                                <ClockIcon className="h-4 w-4 text-amber-600" />
                                <span>Thời hạn check-in QR & Xử lý vắng mặt</span>
                              </div>
                              <p className="mt-1.5 text-sm leading-relaxed text-ink-body">
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
              <div className="rounded-2xl border border-line bg-gradient-to-r from-surface to-surface-alt p-6 text-center text-xs text-ink-muted shadow-sm sm:p-8">
                <p className="font-semibold text-ink-strong">
                  Văn bản có giá trị pháp lý đầy đủ và ràng buộc trong hệ sinh thái ChargeOps.
                </p>
                <p className="mt-1">
                  Mọi sửa đổi, bổ sung quy chế sẽ được thông báo công khai trước khi có hiệu lực áp dụng.
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="inline-flex items-center gap-1.5 rounded-pill border border-line bg-white px-4 py-2 text-xs font-semibold text-ink-body shadow-sm hover:border-primary/40 hover:text-primary-dark"
                  >
                    <PrinterIcon className="h-3.5 w-3.5" /> In bản lưu trữ PDF
                  </button>
                  <Link
                    href="/"
                    className="inline-flex items-center gap-1.5 rounded-pill bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primary-dark"
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
