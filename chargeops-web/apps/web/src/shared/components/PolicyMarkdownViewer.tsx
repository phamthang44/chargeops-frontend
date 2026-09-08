import React, { useMemo, useState } from 'react';
import {
  IconBook,
  IconCheck,
  IconClock,
  IconCopy,
  IconInfoCircle,
  IconSearch,
  IconX,
} from '@chargeops/ui';

export interface PolicyHeading {
  id: string;
  text: string;
  level: number;
}

interface PolicyMarkdownViewerProps {
  content: string;
  searchQuery?: string;
  showToc?: boolean;
  className?: string;
  onCopySuccess?: () => void;
}

export function PolicyMarkdownViewer({
  content,
  searchQuery = '',
  showToc = true,
  className = '',
  onCopySuccess,
}: PolicyMarkdownViewerProps) {
  const [copied, setCopied] = useState(false);
  const [fontSizeOffset, setFontSizeOffset] = useState<number>(0); // -1, 0, +1
  const [activeHeadingId, setActiveHeadingId] = useState<string>('');

  // 1. Calculate reading stats
  const stats = useMemo(() => {
    const words = content.trim().split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.ceil(words / 200));
    return { words, minutes };
  }, [content]);

  // 2. Extract Headings for Table of Contents
  const headings = useMemo(() => {
    const lines = content.split('\n');
    const list: PolicyHeading[] = [];
    let hIndex = 0;

    for (const line of lines) {
      const match = line.match(/^(#{1,3})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const rawText = match[2].replace(/\*\*/g, '').replace(/`/g, '').trim();
        const id = `heading-${++hIndex}-${rawText.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30)}`;
        list.push({ id, text: rawText, level });
      }
    }
    return list;
  }, [content]);

  // 3. Count in-document search matches
  const matchCount = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return 0;
    try {
      const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      const matches = content.match(regex);
      return matches ? matches.length : 0;
    } catch {
      return 0;
    }
  }, [content, searchQuery]);

  // 4. Highlight helper for text nodes
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    try {
      const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      const parts = text.split(regex);
      return parts.map((part, i) =>
        regex.test(part) ? (
          <mark
            key={i}
            className="rounded bg-amber-300 px-1 py-0.5 font-semibold text-slate-950 shadow-sm transition"
          >
            {part}
          </mark>
        ) : (
          part
        ),
      );
    } catch {
      return text;
    }
  };

  // 5. Parse inline formatting (bold, italic, code)
  const renderInline = (text: string, query: string) => {
    // Tokenize bold **text** and inline `code`
    const tokens: React.ReactNode[] = [];
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);

    parts.forEach((p, idx) => {
      if (p.startsWith('**') && p.endsWith('**')) {
        tokens.push(
          <strong key={idx} className="font-bold text-ink">
            {highlightText(p.slice(2, -2), query)}
          </strong>,
        );
      } else if (p.startsWith('`') && p.endsWith('`')) {
        tokens.push(
          <code
            key={idx}
            className="rounded bg-chip px-1.5 py-0.5 font-mono text-[12px] font-medium text-brand-strong"
          >
            {highlightText(p.slice(1, -1), query)}
          </code>,
        );
      } else if (p) {
        tokens.push(<React.Fragment key={idx}>{highlightText(p, query)}</React.Fragment>);
      }
    });

    return tokens;
  };

  // 6. Smooth scroll to a heading
  const scrollToHeading = (id: string) => {
    setActiveHeadingId(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // 7. Copy full markdown
  const handleCopyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      if (onCopySuccess) onCopySuccess();
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  // 8. Download as markdown file
  const handleDownloadMd = () => {
    const firstHeading = headings[0]?.text || 'chinh-sach';
    const filename = `${firstHeading.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`;
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 9. Structured line-by-line / block parser
  const renderDocumentBlocks = () => {
    const rawLines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let headingCounter = 0;
    let inTable = false;
    let tableRows: string[][] = [];
    let blockquoteLines: string[] = [];

    const flushTable = (key: string) => {
      if (!tableRows.length) return null;
      const headers = tableRows[0];
      const body = tableRows.slice(1);
      const node = (
        <div key={key} className="my-4 overflow-x-auto rounded-lg border border-line bg-surface">
          <table className="w-full text-left text-[12.5px]">
            <thead>
              <tr className="border-b border-line bg-surface-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
                {headers.map((h, i) => (
                  <th key={i} className="px-3.5 py-2.5">
                    {renderInline(h.trim(), searchQuery)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line-3 text-body">
              {body.map((row, rIdx) => (
                <tr key={rIdx} className="transition hover:bg-canvas/50">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-3.5 py-2">
                      {renderInline(cell.trim(), searchQuery)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableRows = [];
      inTable = false;
      return node;
    };

    const flushBlockquote = (key: string) => {
      if (!blockquoteLines.length) return null;
      const text = blockquoteLines.join(' ');
      const node = (
        <div
          key={key}
          className="my-4 flex items-start gap-3 rounded-xl border border-brand-line bg-brand-faint p-3.5 text-[13px] leading-relaxed text-body"
        >
          <IconInfoCircle size={18} className="mt-0.5 shrink-0 text-brand" />
          <div className="flex-1">{renderInline(text, searchQuery)}</div>
        </div>
      );
      blockquoteLines = [];
      return node;
    };

    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i];
      const trimmed = line.trim();

      // Check blockquote
      if (trimmed.startsWith('>')) {
        blockquoteLines.push(trimmed.replace(/^>\s*/, ''));
        continue;
      } else if (blockquoteLines.length > 0) {
        elements.push(flushBlockquote(`quote-${i}`));
      }

      // Check table
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        inTable = true;
        // ignore markdown table separator like |---|---|
        if (!/^\|(?:\s*-+\s*\|)+$/.test(trimmed)) {
          const cells = trimmed
            .slice(1, -1)
            .split('|')
            .map((c) => c.trim());
          tableRows.push(cells);
        }
        continue;
      } else if (inTable) {
        elements.push(flushTable(`tbl-${i}`));
      }

      // Empty line
      if (!trimmed) {
        continue;
      }

      // Horizontal rule
      if (/^---+$/.test(trimmed)) {
        elements.push(<hr key={`hr-${i}`} className="my-6 border-line-2" />);
        continue;
      }

      // Headings
      const hMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
      if (hMatch) {
        const level = hMatch[1].length;
        const text = hMatch[2].replace(/\*\*/g, '').replace(/`/g, '').trim();
        const headingObj = headings[headingCounter++];
        const id = headingObj?.id || `h-${i}`;

        if (level === 1) {
          elements.push(
            <div key={`h1-${i}`} id={id} className="mb-4 mt-2 border-b border-line pb-3 scroll-mt-6">
              <h1 className="text-[23px] font-extrabold tracking-tight text-ink">
                {renderInline(text, searchQuery)}
              </h1>
            </div>,
          );
        } else if (level === 2) {
          elements.push(
            <div key={`h2-${i}`} id={id} className="mb-3 mt-6 flex items-center gap-2.5 scroll-mt-6">
              <span className="h-4 w-1 rounded-full bg-brand" />
              <h2 className="text-[17px] font-bold text-ink">{renderInline(text, searchQuery)}</h2>
            </div>,
          );
        } else {
          elements.push(
            <div
              key={`h3-${i}`}
              id={id}
              className="mb-2 mt-5 flex items-center justify-between rounded-lg bg-surface-2/80 px-3 py-1.5 scroll-mt-6 border border-line-3"
            >
              <h3 className="text-[14px] font-bold text-body">{renderInline(text, searchQuery)}</h3>
              <a
                href={`#${id}`}
                onClick={(e) => {
                  e.preventDefault();
                  scrollToHeading(id);
                }}
                className="text-[11px] font-mono text-ghost hover:text-brand"
                title="Neo liên kết mục này"
              >
                #{id.split('-').slice(0, 2).join('-')}
              </a>
            </div>,
          );
        }
        continue;
      }

      // Bullet lists
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const itemText = trimmed.replace(/^[-*]\s+/, '');
        elements.push(
          <div key={`li-${i}`} className="my-1.5 flex items-start gap-2.5 pl-2 text-[13.5px] leading-relaxed text-body">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand/70" />
            <div className="flex-1">{renderInline(itemText, searchQuery)}</div>
          </div>,
        );
        continue;
      }

      // Numbered lists e.g. "1. ", "2. "
      const numMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
      if (numMatch) {
        const num = numMatch[1];
        const itemText = numMatch[2];
        elements.push(
          <div key={`num-${i}`} className="my-2 flex items-start gap-2.5 pl-1 text-[13.5px] leading-relaxed text-body">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-canvas text-[11px] font-bold text-muted border border-line-2">
              {num}
            </span>
            <div className="flex-1 pt-0.5">{renderInline(itemText, searchQuery)}</div>
          </div>,
        );
        continue;
      }

      // Indented sub-bullets
      if (line.startsWith('   - ') || line.startsWith('     - ')) {
        const itemText = trimmed.replace(/^[-*]\s+/, '');
        elements.push(
          <div key={`subli-${i}`} className="my-1 flex items-start gap-2 pl-8 text-[13px] leading-relaxed text-muted">
            <span className="mt-2 h-1.2 w-1.2 shrink-0 rounded-full bg-ghost" />
            <div className="flex-1">{renderInline(itemText, searchQuery)}</div>
          </div>,
        );
        continue;
      }

      // Standard paragraph
      elements.push(
        <p key={`p-${i}`} className="my-2 text-[13.5px] leading-relaxed text-body">
          {renderInline(trimmed, searchQuery)}
        </p>,
      );
    }

    if (blockquoteLines.length > 0) elements.push(flushBlockquote('quote-final'));
    if (inTable) elements.push(flushTable('tbl-final'));

    return elements;
  };

  const fontSizeClass =
    fontSizeOffset === 1
      ? 'text-[14.5px]'
      : fontSizeOffset === -1
        ? 'text-[12.5px]'
        : 'text-[13.5px]';

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {/* Top Utility Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-2.5 shadow-xs">
        {/* Left: Reading Stats */}
        <div className="flex items-center gap-4 text-[12px] text-muted">
          <div className="flex items-center gap-1.5">
            <IconClock size={14} className="text-brand" />
            <span>Ước tính: <strong className="text-ink font-semibold">{stats.minutes} phút đọc</strong></span>
          </div>
          <span className="text-line">•</span>
          <div className="flex items-center gap-1.5">
            <IconBook size={14} className="text-brand" />
            <span><strong className="text-ink font-semibold">{stats.words.toLocaleString()}</strong> từ</span>
          </div>
          <span className="text-line">•</span>
          <span><strong className="text-ink font-semibold">{headings.length}</strong> đề mục</span>

          {searchQuery && (
            <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-900 border border-amber-300">
              <IconSearch size={12} />
              {matchCount > 0 ? `${matchCount} kết quả khớp` : 'Không có kết quả khớp'}
            </span>
          )}
        </div>

        {/* Right: Actions (Font size, Copy, Download) */}
        <div className="flex items-center gap-1.5">
          {/* Font size toggles */}
          <div className="mr-1 flex items-center rounded-lg border border-line bg-canvas p-0.5">
            <button
              onClick={() => setFontSizeOffset((v) => Math.max(-1, v - 1))}
              disabled={fontSizeOffset === -1}
              className="rounded px-2 py-0.5 text-[11px] font-semibold text-muted hover:bg-surface disabled:opacity-40"
              title="Cỡ chữ nhỏ hơn"
            >
              A-
            </button>
            <button
              onClick={() => setFontSizeOffset(0)}
              className={`rounded px-2 py-0.5 text-[11px] font-semibold ${fontSizeOffset === 0 ? 'bg-surface text-ink shadow-xs' : 'text-muted hover:bg-surface'}`}
              title="Cỡ chữ chuẩn"
            >
              A
            </button>
            <button
              onClick={() => setFontSizeOffset((v) => Math.min(1, v + 1))}
              disabled={fontSizeOffset === 1}
              className="rounded px-2 py-0.5 text-[11px] font-semibold text-muted hover:bg-surface disabled:opacity-40"
              title="Cỡ chữ lớn hơn"
            >
              A+
            </button>
          </div>

          <button
            onClick={handleCopyMarkdown}
            className="flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1 text-[12px] font-medium text-body transition hover:border-line-2 hover:bg-canvas active:scale-98"
            title="Sao chép toàn bộ mã nguồn Markdown"
          >
            {copied ? (
              <>
                <IconCheck size={13} className="text-good" />
                <span className="text-good font-semibold">Đã chép!</span>
              </>
            ) : (
              <>
                <IconCopy size={13} className="text-muted" />
                <span>Sao chép Markdown</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownloadMd}
            className="flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1 text-[12px] font-medium text-body transition hover:border-line-2 hover:bg-canvas active:scale-98"
            title="Tải tệp .md về máy"
          >
            <span>Tải .md</span>
          </button>
        </div>
      </div>

      {/* Main Container: Split with Table of Contents if enabled */}
      <div className={`grid items-start gap-5 ${showToc && headings.length > 1 ? 'lg:grid-cols-[1fr_260px]' : 'grid-cols-1'}`}>
        {/* Document Content View */}
        <div className={`rounded-2xl border border-line bg-surface p-6 sm:p-8 shadow-xs ${fontSizeClass}`}>
          {renderDocumentBlocks()}
        </div>

        {/* Sticky Table of Contents (Mục lục điều khoản) */}
        {showToc && headings.length > 1 && (
          <div className="sticky top-6 flex flex-col gap-3">
            <div className="rounded-xl border border-line bg-surface p-4 shadow-xs">
              <div className="mb-2.5 flex items-center justify-between border-b border-line-3 pb-2 text-[12px]">
                <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-muted">
                  <IconBook size={13} className="text-brand" />
                  <span>Mục lục điều khoản</span>
                </div>
                <span className="font-mono text-[11px] text-ghost">({headings.length})</span>
              </div>

              <div className="max-h-[calc(80vh-160px)] overflow-y-auto pr-1">
                <nav className="flex flex-col gap-1">
                  {headings.map((h) => {
                    const isH1 = h.level === 1;
                    const isH2 = h.level === 2;
                    const isActive = activeHeadingId === h.id;

                    return (
                      <button
                        key={h.id}
                        onClick={() => scrollToHeading(h.id)}
                        className={`group flex w-full items-start text-left text-[12px] transition rounded-lg px-2 py-1.5 ${
                          isActive
                            ? 'bg-brand-soft font-semibold text-brand'
                            : 'text-body hover:bg-canvas hover:text-ink'
                        } ${isH1 ? 'font-bold text-ink' : isH2 ? 'font-medium pl-3' : 'pl-5 text-muted'}`}
                      >
                        <span className="line-clamp-2">{h.text}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
