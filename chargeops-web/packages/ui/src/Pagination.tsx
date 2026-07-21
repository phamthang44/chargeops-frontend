import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export interface PaginationProps {
  /** 0-based current page. */
  page: number;
  pageSize: number;
  total: number;
  onPage: (page: number) => void;
}

/** Windowed page list: 1 … around-current … last (all 0-based internally). */
function pageWindow(current: number, count: number): (number | 'gap')[] {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i);
  const wanted = new Set([0, count - 1, current - 1, current, current + 1]);
  const list = [...wanted].filter((p) => p >= 0 && p < count).sort((a, b) => a - b);
  const out: (number | 'gap')[] = [];
  let prev = -2;
  for (const p of list) {
    if (p - prev > 1) out.push('gap');
    out.push(p);
    prev = p;
  }
  return out[0] === 'gap' ? out.slice(1) : out;
}

/**
 * Numbered pagination with ellipsis + a "jump to page" input
 * (Enter or blur commits, value clamped to the valid range).
 */
export function Pagination({ page, pageSize, total, onPage }: PaginationProps) {
  const { t } = useTranslation('ui');
  const [jump, setJump] = useState('');
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : page * pageSize + 1;
  const to = Math.min((page + 1) * pageSize, total);

  const commitJump = () => {
    const n = parseInt(jump, 10);
    if (!Number.isNaN(n)) onPage(Math.min(Math.max(n, 1), pageCount) - 1);
    setJump('');
  };

  const navBtn = (enabled: boolean) =>
    `flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-surface text-[13px] font-semibold text-body transition ${
      enabled ? 'hover:border-line-hover hover:bg-canvas' : 'pointer-events-none opacity-40'
    }`;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-[11px] text-[12px] font-medium text-muted">
      <span>{t('pagination.showing', { from, to, total })}</span>

      <div className="flex flex-wrap items-center gap-3">
        {/* page numbers */}
        <div className="flex items-center gap-1.5">
          <button
            disabled={page <= 0}
            onClick={() => onPage(page - 1)}
            className={navBtn(page > 0)}
            aria-label={t('pagination.prevPage')}
          >
            ‹
          </button>
          {pageWindow(page, pageCount).map((p, i) =>
            p === 'gap' ? (
              <span key={`gap-${i}`} className="px-0.5 text-faint">
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onPage(p)}
                aria-current={p === page ? 'page' : undefined}
                className={`h-8 min-w-8 rounded-lg px-1 text-[12px] font-semibold transition ${
                  p === page
                    ? 'bg-solid text-solid-fg'
                    : 'border border-line bg-surface text-body hover:border-line-hover hover:bg-canvas'
                }`}
              >
                {p + 1}
              </button>
            ),
          )}
          <button
            disabled={page >= pageCount - 1}
            onClick={() => onPage(page + 1)}
            className={navBtn(page < pageCount - 1)}
            aria-label={t('pagination.nextPage')}
          >
            ›
          </button>
        </div>

        {/* jump to page */}
        {pageCount > 3 && (
          <label className="flex items-center gap-1.5">
            <span>{t('pagination.jumpToPage')}</span>
            <input
              value={jump}
              onChange={(e) => setJump(e.target.value.replace(/\D/g, ''))}
              onKeyDown={(e) => e.key === 'Enter' && commitJump()}
              onBlur={() => jump && commitJump()}
              inputMode="numeric"
              placeholder={String(page + 1)}
              className="h-8 w-12 rounded-lg border border-line bg-surface text-center text-[12px] font-semibold text-ink transition focus:border-brand focus:ring-2 focus:ring-brand/15"
              aria-label={t('pagination.jumpToPage')}
            />
            <span className="text-faint">/ {pageCount}</span>
          </label>
        )}
      </div>
    </div>
  );
}
