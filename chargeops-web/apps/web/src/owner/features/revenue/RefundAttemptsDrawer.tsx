import { useTranslation } from 'react-i18next';
import {
  Drawer,
  Button,
  StatusPill,
  IconCheck,
  IconCopy,
  IconClock,
  IconAlertTriangle,
  IconCheckCircle,
} from '@chargeops/ui';
import {
  formatDateTimeVn,
  formatVnd,
  type OwnerRefund,
} from '@chargeops/api';
import { useState } from 'react';

export interface RefundAttemptsDrawerProps {
  open: boolean;
  onClose: () => void;
  refund: OwnerRefund | null;
  onOpenRetry?: (refund: OwnerRefund) => void;
}

export function RefundAttemptsDrawer({
  open,
  onClose,
  refund,
  onOpenRetry,
}: RefundAttemptsDrawerProps) {
  const { t } = useTranslation('owner');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!refund) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const attempts = refund.attempts || [];

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={
        <div>
          <div className="text-[14px] font-bold text-ink">
            {t('finance.attemptsDrawer.title', 'Lịch sử lần thử hoàn tiền')}
          </div>
          <div className="text-[11px] font-medium text-muted">
            Refund #{refund.refundId} · Booking #{refund.bookingCode || refund.bookingId}
          </div>
        </div>
      }
      width="500px"
    >
      <div className="space-y-4 p-5">
        {/* Refund Status Overview */}
        <div className="rounded-2xl border border-line-2 bg-surface p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-muted">{t('finance.refunds.table.cols.amount', 'Số tiền hoàn')}:</span>
            <span className="font-mono font-bold text-good text-[15px]">+{formatVnd(refund.amount)}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[12px] text-muted">{t('finance.refunds.table.cols.status', 'Trạng thái nghĩa vụ')}:</span>
            <StatusPill
              tone={refund.status === 'SUCCEEDED' ? 'good' : refund.requiresOwnerAction ? 'bad' : 'warn'}
              label={refund.status === 'SUCCEEDED' ? 'SUCCEEDED' : refund.requiresOwnerAction ? 'CẦN RETRY' : 'PENDING'}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[12px] text-muted">{t('finance.refunds.table.cols.reason', 'Lý do phát sinh')}:</span>
            <span className="text-[12px] font-semibold text-ink">
              {refund.reason === 'VOLUNTARY_GRACE'
                ? 'Ân hạn 10 phút'
                : refund.reason === 'STATION_UNAVAILABLE'
                ? 'Trạm không phục vụ'
                : refund.reason}
            </span>
          </div>

          {refund.requiresOwnerAction && (
            <div className="mt-2 rounded-xl border border-bad/30 bg-bad-soft/40 p-2.5 text-[11.5px] text-bad flex items-start gap-2">
              <IconAlertTriangle size={15} className="shrink-0 mt-0.5" />
              <span>
                {t(
                  'finance.attemptsDrawer.actionRequiredNotice',
                  'Lần thử tự động qua cổng thanh toán đã thất bại. Vui lòng kiểm tra lý do lỗi và bấm "Thử lại hoàn tiền" để gửi yêu cầu mới.'
                )}
              </span>
            </div>
          )}
        </div>

        {/* Attempts Timeline */}
        <div>
          <h4 className="text-[12px] font-bold uppercase tracking-wider text-faint mb-3">
            {t('finance.attemptsDrawer.timelineTitle', 'Tiến trình các lần thử')} ({attempts.length})
          </h4>

          {attempts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-hairline py-8 text-center text-[12px] text-muted">
              {t('finance.attemptsDrawer.empty', 'Chưa có thông tin lần thử nào.')}
            </div>
          ) : (
            <div className="relative pl-5 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-line">
              {attempts.map((att, idx) => {
                const isFailed = att.status === 'FAILED';
                const isSuccess = att.status === 'SUCCEEDED';
                const isPending = att.status === 'PENDING';

                return (
                  <div key={att.attemptId || idx} className="relative">
                    {/* Timeline bullet */}
                    <div
                      className={`absolute -left-5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-surface ${
                        isSuccess
                          ? 'bg-good text-white'
                          : isFailed
                          ? 'bg-bad text-white'
                          : 'bg-warn text-white'
                      }`}
                    >
                      {isSuccess ? (
                        <IconCheck size={9} strokeWidth={3} />
                      ) : isFailed ? (
                        <IconAlertTriangle size={9} strokeWidth={3} />
                      ) : (
                        <IconClock size={9} strokeWidth={3} />
                      )}
                    </div>

                    {/* Attempt Card */}
                    <div className="rounded-xl border border-hairline bg-surface p-3.5 shadow-2xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[12.5px] text-ink">
                          Lần #{att.sequenceNo || idx + 1} · {att.executionMode === 'SIMULATOR' ? 'Tự động' : 'Thủ công'}
                        </span>
                        <StatusPill
                          tone={isSuccess ? 'good' : isFailed ? 'bad' : 'warn'}
                          label={att.status}
                        />
                      </div>

                      <div className="text-[11px] text-muted flex items-center gap-1 font-mono">
                        <IconClock size={11} className="text-faint" />
                        <span>Bắt đầu: {att.startedAt ? formatDateTimeVn(att.startedAt) : '—'}</span>
                      </div>

                      {att.completedAt && (
                        <div className="text-[11px] text-muted flex items-center gap-1 font-mono">
                          <IconCheckCircle size={11} className="text-good" />
                          <span>Hoàn tất: {formatDateTimeVn(att.completedAt)}</span>
                        </div>
                      )}

                      {att.failureReason && (
                        <div className="rounded-lg bg-bad-soft/40 p-2 text-[11px] text-bad font-mono">
                          Lý do lỗi: {att.failureReason}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Action Dock */}
        <div className="pt-2 flex items-center gap-2">
          {refund.requiresOwnerAction && onOpenRetry && (
            <Button
              variant="primary"
              onClick={() => {
                onClose();
                onOpenRetry(refund);
              }}
              className="flex-1"
            >
              {t('finance.refunds.table.retryBtn', 'Thử lại hoàn tiền')}
            </Button>
          )}
          <Button variant="secondary" onClick={onClose} className={refund.requiresOwnerAction ? '' : 'w-full'}>
            {t('common.close', 'Đóng')}
          </Button>
        </div>
      </div>
    </Drawer>
  );
}
