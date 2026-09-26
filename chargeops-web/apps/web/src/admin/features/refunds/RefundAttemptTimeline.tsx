import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  IconCheckCircle,
  IconAlertTriangle,
  IconCopy,
  IconCheck,
  StatusPill,
} from '@chargeops/ui';
import { formatDateTimeVn, type RefundAttemptItem } from '@chargeops/api';

export interface RefundAttemptTimelineProps {
  attempts?: RefundAttemptItem[];
}

export function RefundAttemptTimeline({ attempts = [] }: RefundAttemptTimelineProps) {
  const { t } = useTranslation('admin');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, keyId: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (!attempts || attempts.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-hairline p-4 text-center text-[12.5px] text-muted">
        {t(
          'refunds.timeline.empty',
          'Chưa có lần thực thi nào trước đó. Khoản hoàn tiền đang ở trạng thái sơ khởi (chờ Admin xử lý).'
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-semibold uppercase tracking-wider text-faint">
          {t('refunds.timeline.title', {
            count: attempts.length,
            defaultValue: `Lịch sử các lần thực thi (${attempts.length})`,
          })}
        </span>
        <span className="text-[11px] text-muted">
          {t('refunds.timeline.notice', 'Bảo lưu PENDING khi FAILED (BR-PAY-13)')}
        </span>
      </div>

      <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-line-3">
        {attempts.map((attempt) => {
          const isSuccess = attempt.status === 'SUCCEEDED';
          const isSimulator = attempt.executionMode === 'SIMULATOR';

          const attemptKey = attempt.attemptId || attempt.id || String(attempt.sequenceNo);

          return (
            <div key={attemptKey} className="relative group">
              {/* Dot icon */}
              <div
                className={`absolute -left-6 top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 bg-surface ${
                  isSuccess
                    ? 'border-good text-good'
                    : 'border-bad text-bad'
                }`}
              >
                {isSuccess ? (
                  <IconCheckCircle size={10} strokeWidth={3} />
                ) : (
                  <IconAlertTriangle size={10} strokeWidth={3} />
                )}
              </div>

              {/* Card content */}
              <div
                className={`rounded-lg border p-3 text-[12px] transition-all ${
                  isSuccess
                    ? 'border-good-soft bg-good-soft/20'
                    : 'border-bad-soft bg-bad-soft/20'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-body">
                      {t('refunds.timeline.attemptNum', {
                        seq: attempt.sequenceNo,
                        defaultValue: `Lần #${attempt.sequenceNo}`,
                      })}
                    </span>
                    <span
                      className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide ${
                        isSimulator
                          ? 'bg-brand/10 text-brand'
                          : 'bg-warn-soft text-warn-deep'
                      }`}
                    >
                      {isSimulator ? 'SIMULATOR' : 'MANUAL_RECORD'}
                    </span>
                  </div>

                  <StatusPill
                    tone={isSuccess ? 'good' : 'bad'}
                    label={isSuccess ? 'SUCCEEDED' : 'FAILED'}
                  />
                </div>

                <div className="space-y-1 text-muted text-[11.5px]">
                  {attempt.transferReference && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-faint">{t('refunds.timeline.reference', 'Mã tham chiếu:')}</span>
                      <span className="font-mono font-medium text-body">
                        {attempt.transferReference}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard(attempt.transferReference!, `ref-${attemptKey}`)
                        }
                        className="text-faint hover:text-body ml-0.5"
                        title={t('refunds.timeline.copyTitle', 'Sao chép')}
                      >
                        {copiedKey === `ref-${attemptKey}` ? (
                          <IconCheck size={12} className="text-good" />
                        ) : (
                          <IconCopy size={12} />
                        )}
                      </button>
                    </div>
                  )}

                  {attempt.failureCode && (
                    <div className="flex items-center gap-1.5 text-bad">
                      <span className="font-semibold">{t('refunds.timeline.errorCode', 'Mã lỗi:')}</span>
                      <span className="font-mono">{attempt.failureCode}</span>
                    </div>
                  )}

                  {attempt.requestKey && (
                    <div className="flex items-center gap-1.5 font-mono text-[10.5px] text-faint">
                      <span>Idempotency-Key:</span>
                      <span className="truncate max-w-[200px]">{attempt.requestKey}</span>
                    </div>
                  )}

                  {attempt.note && (
                    <div className="italic text-body/90 pt-0.5">
                      "{attempt.note}"
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1 border-t border-hairline/60 text-[10.5px] text-faint">
                    <span>
                      {attempt.performedBy || 'admin@chargeops.vn'}
                    </span>
                    <span>
                      {formatDateTimeVn(attempt.performedAt || attempt.completedAt || attempt.startedAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
