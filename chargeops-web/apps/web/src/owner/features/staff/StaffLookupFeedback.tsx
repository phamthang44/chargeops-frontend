import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { StaffLookupResponse } from '@chargeops/api';
import {
  IconAlertCircle,
  IconAlertTriangle,
  IconCheck,
  IconCopy,
  IconInfoCircle,
  IconRefreshCw,
  IconShieldAlert,
} from '@chargeops/ui';
import { getApiErrorMessage } from '../../../i18n';

export interface StaffLookupFeedbackProps {
  isValidEmail: boolean;
  isSearching: boolean;
  isError: boolean;
  error: unknown;
  data?: StaffLookupResponse;
  onRetry?: () => void;
  isRetrying?: boolean;
}

interface ApiErrorDetails {
  code?: string;
  status?: number;
  message?: string;
  traceId?: string;
}

function extractErrorDetails(error: unknown): ApiErrorDetails {
  if (!error || typeof error !== 'object') return {};
  const e = error as Record<string, unknown>;
  const errObj = (e.error && typeof e.error === 'object' ? e.error : e) as Record<string, unknown>;

  return {
    code: (errObj.code as string) || (e.code as string) || undefined,
    status: (e.status as number) || undefined,
    message: (errObj.message as string) || (e.message as string) || undefined,
    traceId: (errObj.traceId as string) || (e.traceId as string) || undefined,
  };
}

function getResolutionHint(code?: string, status?: number): string | null {
  if (code === 'STATION_STAFF_010') {
    return 'Hệ thống định danh (Keycloak) từ chối xác thực vai trò quản trị. Vui lòng kiểm tra lại cấu hình client secret hoặc quyền service account trên Keycloak.';
  }
  if (code === 'TIMEOUT' || code === 'NETWORK') {
    return 'Không thể kết nối đến máy chủ API. Vui lòng kiểm tra đường truyền mạng hoặc kiểm tra xem máy chủ backend đã khởi động chưa.';
  }
  if (status === 502) {
    return 'Cổng kết nối trung gian (Bad Gateway) gặp sự cố khi giao tiếp với dịch vụ định danh ngoài.';
  }
  if (status === 500) {
    return 'Máy chủ gặp sự cố nội bộ trong quá trình tra cứu. Vui lòng thử lại sau vài giây.';
  }
  if (status === 401 || code === 'AUTH_001') {
    return 'Phiên đăng nhập đã hết hạn hoặc chưa được xác thực. Vui lòng làm mới trang để đăng nhập lại.';
  }
  return null;
}

function getErrorCategory(code?: string, status?: number): string {
  if (code === 'STATION_STAFF_010') return 'Lỗi định danh Keycloak';
  if (code === 'TIMEOUT') return 'Hết thời gian chờ kết nối';
  if (code === 'NETWORK') return 'Lỗi kết nối mạng';
  if (status === 502) return 'Bad Gateway (502)';
  if (status && status >= 500) return `Lỗi máy chủ (${status})`;
  if (status === 401 || code === 'AUTH_001') return 'Hết phiên đăng nhập';
  return 'Lỗi tra cứu tài khoản';
}

export const StaffLookupFeedback = memo(function StaffLookupFeedback({
  isValidEmail,
  isSearching,
  isError,
  error,
  data,
  onRetry,
  isRetrying = false,
}: StaffLookupFeedbackProps) {
  const { t } = useTranslation('owner');
  const [copied, setCopied] = useState(false);

  // If email is invalid, do not render any feedback
  if (!isValidEmail) return null;

  // 1. In-flight Live Searching Shimmer State
  if (isSearching) {
    return (
      <div className="group relative rounded-2xl bg-surface-2 p-1 ring-1 ring-line/80 animate-fadeIn">
        <div className="flex items-center gap-3 rounded-[calc(1rem-0.25rem)] border border-line/60 bg-surface p-3.5 shadow-xs">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-owner-soft text-owner">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-owner border-t-transparent" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[12.5px] font-semibold text-ink flex items-center gap-2">
              <span>{t('staff.lookup.searching', { defaultValue: 'Đang kiểm tra thông tin tài khoản…' })}</span>
            </div>
            <div className="mt-1 text-[11px] text-faint">
              Truy vấn dịch vụ định danh và xác thực điều kiện phân công
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. API / Network Error State
  if (isError) {
    const errorDetails = extractErrorDetails(error);
    const errorCode = errorDetails.code;
    const errorStatus = errorDetails.status;
    const category = getErrorCategory(errorCode, errorStatus);
    const primaryMessage = getApiErrorMessage(error);
    const hint = getResolutionHint(errorCode, errorStatus);

    const handleCopy = () => {
      const parts = [
        `Code: ${errorCode || 'N/A'}`,
        `Status: ${errorStatus || 'N/A'}`,
        `Message: ${primaryMessage}`,
        errorDetails.traceId ? `TraceId: ${errorDetails.traceId}` : null,
      ].filter(Boolean);

      navigator.clipboard?.writeText(parts.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    return (
      <div className="group relative rounded-2xl bg-bad/5 p-1 ring-1 ring-bad/20 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:ring-bad/35 animate-fadeIn">
        <div className="relative rounded-[calc(1rem-0.25rem)] border border-bad/20 bg-surface/95 p-3.5 shadow-sm backdrop-blur-sm">
          {/* Header row: Icon, Category Badge, Code Chip & Retry Action */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0 flex-wrap">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-bad/15 text-bad-deep border border-bad/20">
                <IconAlertCircle size={15} />
              </div>
              <span className="text-[12.5px] font-bold text-bad-deep">
                {category}
              </span>
              {errorCode && (
                <span className="inline-flex items-center gap-1 font-mono text-[10.5px] font-bold text-bad-deep bg-bad-soft border border-bad/25 px-2 py-0.5 rounded-md shadow-2xs">
                  {errorCode}
                </span>
              )}
            </div>

            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                disabled={isRetrying}
                className="inline-flex items-center gap-1.5 rounded-full bg-bad-soft hover:bg-bad/20 active:scale-95 px-3 py-1 text-[11px] font-bold text-bad-deep border border-bad/25 transition-all duration-200 cursor-pointer disabled:opacity-50 shrink-0"
              >
                <IconRefreshCw
                  size={11}
                  className={isRetrying ? 'animate-spin' : 'transition-transform duration-300 group-hover:rotate-180'}
                />
                <span>{isRetrying ? 'Đang thử lại…' : t('common.retry', { defaultValue: 'Thử lại' })}</span>
              </button>
            )}
          </div>

          {/* Primary Translated Message */}
          <div className="mt-2.5 pl-9">
            <p className="text-[12px] font-medium text-ink leading-relaxed">
              {primaryMessage}
            </p>

            {/* Resolution Hint / Troubleshooting Box */}
            {hint && (
              <div className="mt-2 flex items-start gap-2 rounded-xl bg-canvas p-2.5 text-[11.5px] text-muted border border-line/60">
                <IconInfoCircle size={14} className="text-faint shrink-0 mt-0.5" />
                <span className="leading-relaxed">{hint}</span>
              </div>
            )}

            {/* Technical Copy Bar */}
            {errorCode && (
              <div className="mt-2.5 flex items-center justify-between text-[10.5px] text-faint">
                <span>Cần chuyển tiếp bộ phận hỗ trợ kỹ thuật?</span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1 font-medium hover:text-ink transition-colors cursor-pointer text-muted hover:underline"
                >
                  <IconCopy size={11} />
                  <span>{copied ? 'Đã sao chép chi tiết!' : 'Sao chép mã lỗi'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 3. Candidate Business States (data returned from 200 OK)
  if (!data) return null;

  return (
    <div className="animate-fadeIn transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]">
      {/* ELIGIBLE */}
      {data.status === 'ELIGIBLE' && (
        <div className="group relative rounded-2xl bg-good/5 p-1 ring-1 ring-good/25 hover:ring-good/40 transition-all duration-200">
          <div className="flex items-start gap-3.5 rounded-[calc(1rem-0.25rem)] border border-good/25 bg-surface/95 p-3.5 shadow-sm backdrop-blur-sm min-w-0">
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-good text-[14px] font-bold text-white shadow-xs">
              {(data.displayName || data.email || 'U').charAt(0).toUpperCase()}
              <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-surface p-0.5">
                <span className="block h-full w-full rounded-full bg-good animate-pulse" />
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="truncate text-[14px] font-bold text-ink max-w-[200px] sm:max-w-none">
                  {data.displayName || data.email}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-good-soft px-2.5 py-0.5 text-[11px] font-bold text-good-deep border border-good/25 whitespace-nowrap shadow-2xs">
                  <IconCheck size={11} strokeWidth={3} /> {t('staff.assign.userFound', { defaultValue: 'Đã xác thực tài khoản' })}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11.5px] text-muted">
                <span className="break-all font-mono text-ink/80">{data.email}</span>
                {data.maskedPhone && <span>• {data.maskedPhone}</span>}
                <span className="rounded-md bg-surface-3/80 px-2 py-0.5 text-[10px] font-semibold text-body border border-line/60">
                  {t('staff.assign.driverRole', { defaultValue: 'Tài xế / Người dùng' })}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NOT_FOUND */}
      {data.status === 'NOT_FOUND' && (
        <div className="group relative rounded-2xl bg-warn/5 p-1 ring-1 ring-warn/25">
          <div className="rounded-[calc(1rem-0.25rem)] border border-warn/25 bg-surface/95 p-3.5 shadow-sm backdrop-blur-sm">
            <div className="flex items-center gap-2.5 font-bold text-warn-deep">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-warn-soft text-warn-deep border border-warn/20">
                <IconAlertCircle size={15} />
              </div>
              <span className="text-[13px]">{t('staff.lookup.notFound')}</span>
            </div>
            <p className="mt-2 pl-9.5 text-[11.5px] text-muted leading-relaxed">
              {t('staff.lookup.notFoundHelp')}
            </p>
            <div className="mt-2.5 ml-9.5 rounded-xl bg-warn-soft/40 p-2.5 text-[11px] text-warn-deep border border-warn/15 flex items-start gap-2">
              <IconInfoCircle size={13} className="shrink-0 mt-0.5 text-warn-deep" />
              <span className="leading-relaxed">
                Nhân viên có thể tải ứng dụng hoặc truy cập cổng thông tin ChargeOps để đăng ký tài khoản miễn phí bằng email này.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* SELF_ASSIGNMENT */}
      {data.status === 'SELF_ASSIGNMENT' && (
        <div className="group relative rounded-2xl bg-bad/5 p-1 ring-1 ring-bad/25">
          <div className="rounded-[calc(1rem-0.25rem)] border border-bad/25 bg-surface/95 p-3.5 shadow-sm backdrop-blur-sm">
            <div className="flex items-center gap-2.5 font-bold text-bad-deep">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-bad-soft text-bad-deep border border-bad/20">
                <IconAlertTriangle size={15} />
              </div>
              <span className="text-[13px]">{t('staff.lookup.selfAssignment')}</span>
            </div>
            <p className="mt-2 pl-9.5 text-[11.5px] text-muted leading-relaxed">
              {t('staff.lookup.selfAssignmentHelp')}
            </p>
          </div>
        </div>
      )}

      {/* ALREADY_ASSIGNED */}
      {data.status === 'ALREADY_ASSIGNED' && (
        <div className="group relative rounded-2xl bg-warn/5 p-1 ring-1 ring-warn/25">
          <div className="rounded-[calc(1rem-0.25rem)] border border-warn/25 bg-surface/95 p-3.5 shadow-sm backdrop-blur-sm">
            <div className="flex items-center gap-2.5 font-bold text-warn-deep">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-warn-soft text-warn-deep border border-warn/20">
                <IconAlertTriangle size={15} />
              </div>
              <span className="text-[13px]">{t('staff.lookup.alreadyAssigned')}</span>
            </div>
            <p className="mt-2 pl-9.5 text-[11.5px] text-muted leading-relaxed">
              {t('staff.lookup.alreadyAssignedHelp')}
            </p>
          </div>
        </div>
      )}

      {/* ROLE_NOT_ALLOWED */}
      {data.status === 'ROLE_NOT_ALLOWED' && (
        <div className="group relative rounded-2xl bg-bad/5 p-1 ring-1 ring-bad/25">
          <div className="rounded-[calc(1rem-0.25rem)] border border-bad/25 bg-surface/95 p-3.5 shadow-sm backdrop-blur-sm">
            <div className="flex items-center gap-2.5 font-bold text-bad-deep">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-bad-soft text-bad-deep border border-bad/20">
                <IconShieldAlert size={15} />
              </div>
              <span className="text-[13px]">{t('staff.lookup.roleNotAllowed')}</span>
            </div>
            <p className="mt-2 pl-9.5 text-[11.5px] text-muted leading-relaxed">
              {t('staff.lookup.roleNotAllowedHelp')}
            </p>
          </div>
        </div>
      )}

      {/* ACCOUNT_INACTIVE */}
      {data.status === 'ACCOUNT_INACTIVE' && (
        <div className="group relative rounded-2xl bg-bad/5 p-1 ring-1 ring-bad/25">
          <div className="rounded-[calc(1rem-0.25rem)] border border-bad/25 bg-surface/95 p-3.5 shadow-sm backdrop-blur-sm">
            <div className="flex items-center gap-2.5 font-bold text-bad-deep">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-bad-soft text-bad-deep border border-bad/20">
                <IconAlertTriangle size={15} />
              </div>
              <span className="text-[13px]">{t('staff.lookup.accountInactive')}</span>
            </div>
            <p className="mt-2 pl-9.5 text-[11.5px] text-muted leading-relaxed">
              {t('staff.lookup.accountInactiveHelp')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
});
