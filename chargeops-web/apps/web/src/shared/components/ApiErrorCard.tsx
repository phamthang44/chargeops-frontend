import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  IconAlertCircle,
  IconChevronDown,
  IconCopy,
  IconInfoCircle,
  IconRefreshCw,
} from '@chargeops/ui';
import { getApiErrorMessage } from '../../i18n';

export interface ApiErrorCardProps {
  error: unknown;
  onRetry?: () => void;
  isRetrying?: boolean;
  /** Headline override — defaults to the generic "could not load" copy. */
  title?: string;
  /** Tiny uppercase pill preceding the headline. */
  eyebrow?: string;
  /** Tighter padding for drawers/modals/tables. */
  compact?: boolean;
  className?: string;
}

interface ErrorFacts {
  code?: string;
  status?: number;
  message?: string;
}

function extractFacts(error: unknown): ErrorFacts {
  if (!error || typeof error !== 'object') return {};
  const e = error as Record<string, unknown>;
  return {
    code: typeof e.code === 'string' ? e.code : undefined,
    status: typeof e.status === 'number' ? e.status : undefined,
    message: typeof e.message === 'string' ? e.message : undefined,
  };
}

function hintKey(code?: string, status?: number): string {
  if (code === 'NETWORK') return 'network';
  if (code === 'TIMEOUT') return 'timeout';
  if (status === 401 || status === 403 || code?.startsWith('AUTH_')) return 'auth';
  if (status === 504) return 'timeout';
  if (status && status >= 500) return 'server';
  return 'default';
}

/**
 * High-end failure state: double-bezel shell, friendly localized headline,
 * actionable retry and a collapsed technical block for support hand-off.
 * The raw backend message (often an English string with UUIDs) never leads —
 * it stays tucked inside the technical details.
 */
export function ApiErrorCard({
  error,
  onRetry,
  isRetrying = false,
  title,
  eyebrow,
  compact = false,
  className = '',
}: ApiErrorCardProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const facts = extractFacts(error);
  const message = getApiErrorMessage(error);
  const hint = t(`errorCard.hint.${hintKey(facts.code, facts.status)}`, { defaultValue: '' });

  const handleCopy = () => {
    const payload = [
      `code: ${facts.code ?? 'N/A'}`,
      `status: ${facts.status ?? 'N/A'}`,
      `message: ${facts.message ?? message}`,
    ].join('\n');
    navigator.clipboard?.writeText(payload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const stagger = (delay: number) => ({
    animation: 'riseIn 560ms cubic-bezier(0.32,0.72,0,1) both',
    animationDelay: `${delay}ms`,
  });

  return (
    <div
      role="alert"
      className={`group relative rounded-2xl bg-bad/5 p-1 ring-1 ring-bad/20 transition-[box-shadow] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:ring-bad/35 ${className}`}
      style={{ animation: 'riseIn 560ms cubic-bezier(0.32,0.72,0,1) both' }}
    >
      <div
        className={`rounded-[calc(1rem-0.25rem)] border border-bad/20 bg-surface/95 shadow-sm ${
          compact ? 'p-3' : 'p-4 sm:p-5'
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-3" style={stagger(60)}>
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-bad/20 bg-bad/15 text-bad-deep">
              <IconAlertCircle size={16} />
            </span>
            <div className="min-w-0">
              <span className="inline-flex items-center rounded-full border border-bad/25 bg-bad-soft px-2.5 py-[3px] text-[9.5px] font-bold uppercase tracking-[0.18em] text-bad-deep">
                {eyebrow ?? t('errorCard.eyebrow', { defaultValue: 'Lỗi tải dữ liệu' })}
              </span>
              <div className="mt-1 text-[14.5px] font-bold leading-snug text-ink">
                {title ?? t('errorCard.title', { defaultValue: 'Không thể tải dữ liệu' })}
              </div>
            </div>
          </div>

          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              disabled={isRetrying}
              className="group/retry inline-flex shrink-0 items-center gap-2 rounded-full border border-bad/25 bg-bad-soft py-1.5 pl-4 pr-1.5 text-[11.5px] font-bold text-bad-deep transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-bad-soft-hover hover:shadow-xs active:scale-[0.97] disabled:pointer-events-none disabled:opacity-60"
            >
              <span>{isRetrying ? t('errorCard.retrying', { defaultValue: 'Đang thử lại…' }) : t('retry')}</span>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-bad/15 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover/retry:rotate-180 group-hover/retry:scale-110">
                <IconRefreshCw size={12} className={isRetrying ? 'animate-spin' : ''} />
              </span>
            </button>
          )}
        </div>

        <p className="mt-3 text-[12.5px] font-medium leading-relaxed text-body" style={stagger(140)}>
          {message}
        </p>

        {hint && (
          <div
            className="mt-2.5 flex items-start gap-2 rounded-xl border border-line/70 bg-canvas p-2.5 text-[11.5px] leading-relaxed text-muted"
            style={stagger(220)}
          >
            <IconInfoCircle size={14} className="mt-0.5 shrink-0 text-faint" />
            <span>{hint}</span>
          </div>
        )}

        {(facts.code || facts.status || facts.message) && (
          <div className="mt-3" style={stagger(300)}>
            <details className="group/details overflow-hidden rounded-xl border border-line/70 bg-canvas/70">
              <summary className="flex items-center justify-between gap-2 px-3 py-2 text-[11px] font-semibold text-muted transition-colors duration-300 hover:text-ink">
                <span>{t('errorCard.details', { defaultValue: 'Chi tiết kỹ thuật' })}</span>
                <span className="flex items-center gap-2">
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleCopy();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        e.stopPropagation();
                        handleCopy();
                      }
                    }}
                    className="inline-flex items-center gap-1 rounded-full border border-line bg-surface px-2 py-0.5 text-[10px] font-semibold text-muted transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-line-hover hover:text-ink active:scale-95"
                  >
                    <IconCopy size={10} />
                    {copied
                      ? t('errorCard.copied', { defaultValue: 'Đã sao chép' })
                      : t('errorCard.copy', { defaultValue: 'Sao chép' })}
                  </span>
                  <IconChevronDown
                    size={13}
                    className="text-faint transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-open/details:rotate-180"
                  />
                </span>
              </summary>
              <div className="space-y-1 border-t border-line/70 px-3 py-2.5 font-mono text-[11px] leading-relaxed text-faint">
                {facts.code && <div>code: <span className="font-bold text-bad-deep">{facts.code}</span></div>}
                {facts.status !== undefined && <div>status: <span className="font-bold text-ink">{facts.status}</span></div>}
                {facts.message && <div className="break-all">message: {facts.message}</div>}
              </div>
            </details>
            <div className="mt-1.5 text-[10.5px] text-faint">
              {t('errorCard.supportHint', {
                defaultValue: 'Cần hỗ trợ? Hãy gửi các thông tin trên cho bộ phận kỹ thuật.',
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
