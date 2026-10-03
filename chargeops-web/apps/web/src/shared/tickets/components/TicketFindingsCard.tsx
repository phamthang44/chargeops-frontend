import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Card,
  DateTimeInput,
  FormField,
  IconAlertCircle,
  IconCheck,
  IconCheckCircle,
  IconClock,
  IconInfoCircle,
  IconLock,
  IconShield,
  IconShieldAlert,
  IconWrench,
  Select,
  StatusPill,
} from '@chargeops/ui';
import { formatDateVn, formatTimeVn, type TicketFinding } from '@chargeops/api';

const CONCLUSION_LABELS: Record<string, { label: string; tone: 'bad' | 'warn' | 'neutral' | 'brand' }> = {
  STATION_FAILURE: { label: 'Lỗi phía trạm sạc', tone: 'bad' },
  NOT_STATION_FAILURE: { label: 'Không phải lỗi phía trạm', tone: 'neutral' },
  HARDWARE_FAULT: { label: 'Lỗi phần cứng trụ sạc', tone: 'bad' },
  STATION_OFFLINE: { label: 'Trạm mất kết nối mạng', tone: 'bad' },
  SOFTWARE_BUG: { label: 'Sự cố phần mềm / firmware', tone: 'warn' },
  USER_ERROR: { label: 'Thao tác phía người dùng', tone: 'neutral' },
  OTHER: { label: 'Nguyên nhân khác', tone: 'neutral' },
};

export interface TicketFindingsCardProps {
  findings: TicketFinding[];
  canRecord?: boolean;
  isPending?: boolean;
  onRecord?: (conclusion: 'STATION_FAILURE' | 'NOT_STATION_FAILURE', affectedAt: string, reason: string) => Promise<void>;
  isClosed?: boolean;
  isResolved?: boolean;
  isEscalated?: boolean;
  escalatedAt?: string | null;
  admin?: boolean;
  accent?: 'brand' | 'owner';
}

export function TicketFindingsCard({
  findings,
  canRecord = false,
  isPending = false,
  onRecord,
  isClosed = false,
  isResolved = false,
  isEscalated = false,
  escalatedAt = null,
  admin = false,
  accent = 'owner',
}: TicketFindingsCardProps) {
  const { t } = useTranslation('tickets');
  const [conclusion, setConclusion] = useState<'STATION_FAILURE' | 'NOT_STATION_FAILURE'>('STATION_FAILURE');
  const [affectedAt, setAffectedAt] = useState(() =>
    new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16));
  const [reason, setReason] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const conclusionOptions = [
    {
      value: 'STATION_FAILURE',
      label: t('detail.findings.STATION_FAILURE', 'Lỗi phía trạm sạc (Trụ hỏng, mất kết nối, lỗi nguồn...)'),
    },
    {
      value: 'NOT_STATION_FAILURE',
      label: t('detail.findings.NOT_STATION_FAILURE', 'Không phải lỗi trạm (Thao tác người dùng, sự cố từ xe...)'),
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setValidationError(t('detail.findings.reasonRequired', 'Vui lòng cung cấp lý do và bằng chứng xác minh.'));
      return;
    }
    if (!affectedAt) {
      setValidationError(t('detail.findings.timeRequired', 'Vui lòng chọn thời điểm xảy ra sự cố.'));
      return;
    }
    const affectedDate = new Date(affectedAt);
    if (affectedDate.getTime() > Date.now()) {
      setValidationError(t('detail.findings.futureTimeInvalid', 'Thời điểm sự cố không thể ở tương lai.'));
      return;
    }
    setValidationError(null);
    if (onRecord) {
      await onRecord(conclusion, affectedDate.toISOString(), reason.trim());
      setReason('');
    }
  };

  const focusRing = accent === 'owner'
    ? 'focus:border-owner focus:ring-owner/15'
    : 'focus:border-brand focus:ring-brand/15';

  const isArbitrationForm = false;

  return (
    <Card className="rounded-2xl p-4 shadow-sm border border-line bg-surface">
      {/* Header */}
      <div className="mb-3.5 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-[13.5px] font-bold text-ink">
          <span className={`flex h-6 w-6 items-center justify-center rounded-lg ${
            accent === 'owner' ? 'bg-owner/10 text-owner' : 'bg-brand/10 text-brand'
          }`}>
            <IconWrench size={13.5} strokeWidth={2.2} />
          </span>
          <span>{t('detail.findings.title', 'Kết luận kỹ thuật')}</span>
        </h2>
        {findings.length > 0 && (
          <span className="rounded-full bg-chip px-2 py-0.5 text-[11px] font-semibold text-muted">
            {findings.length}
          </span>
        )}
      </div>

      {/* Findings List */}
      {findings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-canvas/40 px-3.5 py-4 text-center">
          <p className="text-[12px] text-muted leading-relaxed">
            {t('detail.findings.empty', 'Chưa có kết luận kỹ thuật nào được ghi nhận cho phiếu này.')}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {findings.map((f, idx) => {
            const metaConclusion = CONCLUSION_LABELS[f.conclusion] || {
              label: f.conclusion,
              tone: 'neutral' as const,
            };
            const isRecordedByAdminRole = (f as any).recordedByRole === 'ADMIN';
            const isAfterEscalation = Boolean(
              isEscalated && escalatedAt && new Date(f.recordedAt) >= new Date(escalatedAt)
            );
            const isAdminArbitrationFinding = isRecordedByAdminRole || isAfterEscalation;
            const isInitialStationFinding = !isAdminArbitrationFinding && idx === 0;

            return (
              <div
                key={f.id || f.findingId || idx}
                className={`rounded-xl border p-3 sm:p-3.5 transition shadow-2xs ${
                  isAdminArbitrationFinding
                    ? 'border-brand-line bg-brand-soft/25'
                    : 'border-line bg-surface hover:border-line-hover'
                }`}
              >
                {/* Meta Header Row: Status Pills on top, Time on right/next line */}
                <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5 border-b border-hairline/60 pb-2">
                  <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                    <span className="shrink-0 whitespace-nowrap">
                      <StatusPill
                        tone={metaConclusion.tone}
                        label={t(`detail.findings.${f.conclusion}`, metaConclusion.label)}
                      />
                    </span>
                    {isAdminArbitrationFinding ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-brand-soft border border-brand-line px-2 py-0.5 text-[10.5px] font-bold text-brand shrink-0 whitespace-nowrap">
                        <IconShieldAlert size={11} strokeWidth={2.2} />
                        <span>{t('detail.findings.adminArbitrationBadge', 'Ghi nhận kỹ thuật của Admin')}</span>
                      </span>
                    ) : isInitialStationFinding ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 border border-hairline px-2 py-0.5 text-[10.5px] font-medium text-muted shrink-0 whitespace-nowrap">
                        <IconWrench size={10.5} className="text-faint" />
                        <span>{t('detail.findings.initialStationBadge', 'Biên bản ban đầu (Trạm sạc)')}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 border border-hairline px-2 py-0.5 text-[10.5px] font-medium text-muted shrink-0 whitespace-nowrap">
                        <IconWrench size={10.5} className="text-faint" />
                        <span>{t('detail.findings.additionalStationBadge', `Biên bản bổ sung của Trạm (Lần #${idx + 1})`, { cycle: idx + 1 })}</span>
                      </span>
                    )}
                  </div>

                  <div className="inline-flex items-center gap-1 text-[10.5px] text-faint shrink-0 whitespace-nowrap">
                    <IconClock size={11} />
                    <span>
                      {formatDateVn(f.recordedAt)} {formatTimeVn(f.recordedAt)}
                    </span>
                  </div>
                </div>

                {f.affectedAt && (
                  <div className="mt-2 text-[11px] text-muted flex flex-wrap items-baseline gap-1">
                    <span className="text-faint shrink-0">{t('detail.findings.affectedAtLabel', 'Thời điểm sự cố:')}</span>
                    <span className="font-medium text-ink">
                      {formatDateVn(f.affectedAt)} {formatTimeVn(f.affectedAt)}
                    </span>
                  </div>
                )}

                {f.reason && (
                  <div className={`mt-2 rounded-lg p-2.5 text-[12px] leading-relaxed border-l-2 ${
                    isAdminArbitrationFinding
                      ? 'bg-brand-soft/30 text-body border-brand'
                      : 'bg-canvas/60 text-body border-line'
                  }`}>
                    <p className="whitespace-pre-wrap break-words">{f.reason}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Lock / Dispute / Resolved Explanations when canRecord is false */}
      {!canRecord && (
        <div className="mt-3.5 space-y-2.5">
          {isClosed ? (
            <div className="flex items-start gap-2.5 rounded-xl border border-line bg-canvas/60 p-3 text-[11.5px] text-muted">
              <IconLock size={15} className="text-faint shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-ink">
                  {t('detail.findings.closedTitle', 'Phiếu hỗ trợ đã đóng')}
                </span>
                <p className="mt-0.5 leading-relaxed text-faint">
                  {t('detail.findings.closedDesc', 'Biên bản kỹ thuật đã được lưu trữ vĩnh viễn vào nhật ký đối soát. Không thể cập nhật thêm.')}
                </p>
              </div>
            </div>
          ) : !admin && isEscalated ? (
            <div className="flex items-start gap-2.5 rounded-xl border border-brand-line bg-brand-soft/40 p-3 text-[11.5px] text-ink">
              <IconShieldAlert size={16} className="text-brand shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-ink">
                  {t('detail.findings.escalatedLockedTitle', 'Admin đang xem xét yêu cầu hỗ trợ')}
                </span>
                <p className="mt-0.5 leading-relaxed text-muted">
                  {t('detail.findings.escalatedLockedDesc', 'Trạm tạm dừng ghi kết luận kỹ thuật trong thời gian Admin xem xét. Sau khi trả lại trạm, việc xử lý được tiếp tục.')}
                </p>
              </div>
            </div>
          ) : !admin && isResolved ? (
            <div className="flex items-start gap-2.5 rounded-xl border border-warn-border bg-warn-soft p-3 text-[11.5px] text-ink">
              <IconCheckCircle size={15} className="text-warn-deep shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-warn-deep">
                  {t('detail.findings.resolvedLockedTitle', 'Phiếu đã đánh dấu giải quyết')}
                </span>
                <p className="mt-0.5 leading-relaxed text-muted">
                  {t('detail.findings.resolvedLockedDesc', 'Phiên làm việc của trạm đã hoàn tất. Quyền ghi kết luận được khóa để bảo vệ trạng thái giải quyết.')}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Form Recording Section using Design System Components */}
      {canRecord && onRecord && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 border-t border-hairline pt-3.5">
          {/* Header of form depending on Admin / Owner / Initial vs Additional */}
          <div className="flex flex-wrap items-center justify-between gap-1.5">
            <span className="text-[12px] font-bold text-ink">
              {isArbitrationForm
                ? t('detail.findings.adminArbitrationFormTitle', 'Ghi nhận kỹ thuật của Admin')
                : findings.length > 0
                ? t('detail.findings.formAddTitle', 'Ghi bổ sung kết luận kỹ thuật')
                : t('detail.findings.formTitle', 'Ghi nhận kết luận kỹ thuật sự cố')}
            </span>
            {isArbitrationForm ? (
              <span className="rounded-full bg-brand-soft border border-brand-line px-2 py-0.5 text-[10.5px] font-bold text-brand whitespace-nowrap">
                {t('detail.findings.adminArbiterRole', 'Xem xét hỗ trợ')}
              </span>
            ) : findings.length > 0 ? (
              <span className="rounded-full bg-surface-2 border border-hairline px-2 py-0.5 text-[10px] font-medium text-faint whitespace-nowrap">
                Lần #{findings.length + 1}
              </span>
            ) : null}
          </div>

          {/* Audit Rule Note */}
          <div className="flex items-start gap-2 rounded-xl bg-canvas/80 p-2.5 text-[11px] text-muted">
            <IconInfoCircle size={14} className="shrink-0 text-faint mt-0.5" />
            <p className="leading-relaxed">
              {isArbitrationForm
                ? t(
                    'detail.findings.adminArbitrationAuditNote',
                    'Ghi nhận kỹ thuật được lưu vào hồ sơ hỗ trợ và không quyết định trách nhiệm pháp lý.'
                  )
                : findings.length > 0
                ? t(
                    'detail.findings.auditNoteAdd',
                    'Biên bản bổ sung sẽ được ghi nhận tiếp nối vào hồ sơ sự cố trong lần xử lý này.'
                  )
                : t(
                    'detail.findings.auditNote',
                    'Kết luận được lưu vào audit đối soát, không tự quyết định hoặc tự thực hiện hoàn tiền.'
                  )}
            </p>
          </div>

          {/* Conclusion Select */}
          <FormField
            label={t('detail.findings.conclusionLabel', 'KẾT LUẬN SỰ CỐ')}
            required
            hint={
              isArbitrationForm
                ? t('detail.findings.adminConclusionHint', 'Ghi nhận bối cảnh kỹ thuật của sự cố')
                : t('detail.findings.conclusionHint', 'Chọn phân loại xác minh nguồn gốc sự cố từ trạm hoặc thao tác')
            }
          >
            <Select
              value={conclusion}
              onChange={(val) => setConclusion(val as typeof conclusion)}
              options={conclusionOptions}
              accent={accent}
              disabled={isPending}
            />
          </FormField>

          {/* DateTime Picker */}
          <DateTimeInput
            label={t('detail.findings.affectedAtLabelShort', 'THỜI ĐIỂM XẢY RA SỰ CỐ')}
            required
            value={affectedAt}
            onChange={(val) => {
              setAffectedAt(val);
              if (validationError) setValidationError(null);
            }}
            accent={accent}
            disabled={isPending}
            hint={t('detail.findings.affectedAtHint', 'Thời điểm ghi nhận trụ ngắt sạc hoặc bắt đầu sự cố')}
          />

          {/* Reason & Evidence Textarea */}
          <FormField
            label={t('detail.findings.reasonLabel', 'CĂN CỨ VÀ BẰNG CHỨNG XÁC MINH')}
            required
            hint={
              isArbitrationForm
                ? t('detail.findings.adminReasonHint', 'Mô tả dữ liệu kỹ thuật đã kiểm tra')
                : t('detail.findings.reasonHint', 'Ghi rõ mã lỗi OCPP, lịch sử log từ trụ hoặc biên bản kiểm tra tại trạm')
            }
            error={Boolean(validationError)}
          >
            <div className="relative">
              <textarea
                required
                maxLength={2000}
                rows={3}
                value={reason}
                onChange={(event) => {
                  setReason(event.target.value);
                  if (validationError) setValidationError(null);
                }}
                disabled={isPending}
                placeholder={
                  isArbitrationForm
                    ? t('detail.findings.adminReasonPlaceholder', 'Ghi rõ thông tin kỹ thuật đã kiểm tra...')
                    : t('detail.findings.reasonPlaceholder', 'Mô tả chi tiết nguyên nhân, mã lỗi, căn cứ chứng minh...')
                }
                className={`w-full rounded-[10px] border px-3 py-2.5 text-[13px] text-ink transition focus:ring-2 resize-y ${
                  validationError ? 'border-bad' : 'border-line'
                } bg-surface ${focusRing}`}
              />
              <div className="mt-1 flex items-center justify-between text-[10.5px]">
                {validationError ? (
                  <span className="flex items-center gap-1 text-bad font-medium">
                    <IconAlertCircle size={11} />
                    {validationError}
                  </span>
                ) : <span />}
                <span className="text-faint ml-auto font-mono">
                  {reason.length}/2000
                </span>
              </div>
            </div>
          </FormField>

          {/* Submit Button */}
          <Button
            type="submit"
            size="md"
            variant="primary"
            accent={isArbitrationForm ? 'brand' : accent}
            fullWidth
            disabled={isPending || !reason.trim() || !affectedAt}
            icon={isArbitrationForm ? <IconShield size={15} strokeWidth={2.2} /> : <IconCheck size={15} strokeWidth={2.2} />}
            className="w-full justify-center"
          >
            {isPending
              ? t('detail.findings.saving', 'Đang lưu...')
              : isArbitrationForm
                ? t('detail.findings.saveAdminArbitration', 'Lưu ghi nhận kỹ thuật')
                : findings.length > 0
                ? t('detail.findings.saveAdd', 'Lưu kết luận bổ sung')
                : t('detail.findings.save', 'Ghi kết luận kỹ thuật')}
          </Button>
        </form>
      )}
    </Card>
  );
}
