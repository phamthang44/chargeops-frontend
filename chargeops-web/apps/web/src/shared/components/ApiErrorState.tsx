import { useTranslation } from 'react-i18next';
import { ApiErrorCard, type ApiErrorCardProps } from './ApiErrorCard';
import { ResourceRetryButton, ResourceStateCard } from './ResourceStateCard';

/** Codes/statuses that mean "this resource (or endpoint) simply isn't there". */
const MISSING_STATUSES = new Set([404, 405, 501]);
const MISSING_CODES = new Set(['HTTP_404', 'HTTP_405', 'HTTP_501', 'NOT_IMPLEMENTED', 'ENDPOINT_NOT_FOUND']);

export function isMissingResourceError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const e = error as { status?: unknown; code?: unknown; message?: unknown };
  if (typeof e.status === 'number' && MISSING_STATUSES.has(e.status)) return true;
  if (typeof e.code === 'string' && MISSING_CODES.has(e.code)) return true;
  if (typeof e.message === 'string' && /\bnot\s+found\b/i.test(e.message)) return true;
  return false;
}

export interface ApiErrorStateProps {
  error: unknown;
  onRetry?: () => void;
  isRetrying?: boolean;
  /** Failure-branch overrides. */
  eyebrow?: ApiErrorCardProps['eyebrow'];
  title?: ApiErrorCardProps['title'];
  /** Missing-resource branch overrides — use the resource's own wording. */
  missingEyebrow?: string;
  missingTitle?: string;
  missingDescription?: string;
  missingHint?: string;
  /** Tighter padding for drawers/modals/tables. */
  compact?: boolean;
  className?: string;
}

/**
 * Single entry point for query failures:
 * - resource/endpoint missing (404/405/501, "not found") → calm ResourceStateCard
 * - anything else → ApiErrorCard (friendly message, retry, technical details)
 */
export function ApiErrorState({
  error,
  onRetry,
  isRetrying = false,
  eyebrow,
  title,
  missingEyebrow,
  missingTitle,
  missingDescription,
  missingHint,
  compact = false,
  className = '',
}: ApiErrorStateProps) {
  const { t } = useTranslation();

  if (isMissingResourceError(error)) {
    return (
      <ResourceStateCard
        tone="neutral"
        compact={compact}
        className={className}
        eyebrow={
          missingEyebrow ?? t('errorCard.missing.eyebrow', { defaultValue: 'Chưa khả dụng' })
        }
        title={missingTitle ?? t('errorCard.missing.title', { defaultValue: 'Chưa có dữ liệu cho mục này' })}
        description={
          missingDescription ??
          t('errorCard.missing.description', {
            defaultValue:
              'Máy chủ chưa cung cấp endpoint tương ứng (chức năng chưa được triển khai) nên chưa có dữ liệu để hiển thị.',
          })
        }
        hint={
          missingHint ??
          t('errorCard.missing.hint', {
            defaultValue: 'Dữ liệu sẽ tự động hiển thị ngay khi chức năng này sẵn sàng. Bạn có thể thử lại hoặc chuyển sang mục khác.',
          })
        }
        action={<ResourceRetryButton onClick={onRetry} isRetrying={isRetrying} />}
      />
    );
  }

  return (
    <ApiErrorCard
      error={error}
      onRetry={onRetry}
      isRetrying={isRetrying}
      eyebrow={eyebrow}
      title={title}
      compact={compact}
      className={className}
    />
  );
}
