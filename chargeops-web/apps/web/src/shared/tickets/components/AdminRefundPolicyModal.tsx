import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  DateTimeInput,
  IconAlertTriangle,
  IconCheckCircle,
  IconInfoCircle,
  IconShieldAlert,
  IconShieldCheck,
  IconX,
  Modal,
  useToast,
} from '@chargeops/ui';
import {
  formatVnd,
  useApi,
  type Ticket,
  type TicketEscalation,
  type AdminRefundPolicyContext,
} from '@chargeops/api';

export interface AdminRefundPolicyModalProps {
  open: boolean;
  onClose: () => void;
  ticket: Ticket;
  escalation: TicketEscalation | null;
  context?: AdminRefundPolicyContext | null;
  onSuccess?: () => void;
}

export function AdminRefundPolicyModal({
  open,
  onClose,
  ticket,
  escalation,
  context,
  onSuccess,
}: AdminRefundPolicyModalProps) {
  const { t } = useTranslation('tickets');
  const api = useApi();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [outcome, setOutcome] = useState<'GRANT_FULL_REFUND' | 'INSUFFICIENT_EVIDENCE'>('GRANT_FULL_REFUND');
  const [affectedAt, setAffectedAt] = useState(() =>
    new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)
  );
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const escalationId = escalation?.escalationId;

  const contextQuery = useQuery({
    queryKey: ['ticketEscalations', 'refundPolicyContext', ticket.id, escalationId],
    queryFn: () => api.ticketEscalations.getRefundPolicyContext(ticket.id, escalationId!),
    enabled: Boolean(open && ticket.bookingId && escalationId && !context),
  });

  if (!open) return null;

  const effectiveContext = context || contextQuery.data;
  const isGrant = outcome === 'GRANT_FULL_REFUND';
  const refundAmount = effectiveContext?.eligibleRefundAmountVnd;
  const matchesCase = Boolean(effectiveContext && effectiveContext.ticketId === ticket.id
    && effectiveContext.escalationId === escalationId);
  const selectedEligibility = isGrant ? effectiveContext?.grantEligibility : effectiveContext?.insufficientEligibility;
  const canSubmit = Boolean(matchesCase && !contextQuery.isFetching && !contextQuery.isError
    && ticket.status !== 'CLOSED' && effectiveContext?.reviewEligibility.allowed && selectedEligibility?.allowed);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !effectiveContext || !escalationId) return;
    const cleanReason = reason.trim();
    if (cleanReason.length < 5) {
      setValidationError(
        t('escalation.refundPolicy.modal.reasonRequired', 'Vui lòng cung cấp lý do giải trình phán quyết (tối thiểu 5 ký tự).')
      );
      return;
    }
    if (cleanReason.length > 2000) {
      setValidationError(
        t('escalation.refundPolicy.modal.reasonTooLong', 'Lý do giải trình không được vượt quá 2000 ký tự.')
      );
      return;
    }

    let affectedIso: string | null = null;
    if (isGrant) {
      if (!affectedAt) {
        setValidationError(
          t('escalation.refundPolicy.modal.affectedAtRequired', 'Vui lòng chọn thời điểm xảy ra sự cố kỹ thuật của trạm.')
        );
        return;
      }
      const affectedDate = new Date(affectedAt);
      if (affectedDate.getTime() > Date.now()) {
        setValidationError(
          t('escalation.refundPolicy.modal.futureAffectedAt', 'Thời điểm sự cố không thể ở tương lai.')
        );
        return;
      }
      affectedIso = affectedDate.toISOString();
    }

    setValidationError(null);
    setIsSubmitting(true);

    try {
      const idempotencyKey =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `idemp-admin-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      const ticketVersion = effectiveContext.ticketVersion;
      const expectedBookingVersion = effectiveContext.bookingVersion;
      const expectedDecisionVersion = effectiveContext.decisionVersion;

      await api.ticketEscalations.reviewRefundPolicy(
        ticket.id,
        escalationId,
        {
          expectedVersion: ticketVersion,
          expectedBookingVersion,
          expectedDecisionVersion,
          outcome,
          affectedAt: affectedIso,
          reason: cleanReason,
        },
        idempotencyKey
      );

      toast(
        t(
          'escalation.refundPolicy.modal.successToast',
          'Đã ban hành phán quyết chính sách hoàn tiền tranh chấp thành công!'
        ),
        'success'
      );

      // Invalidate relevant queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['tickets'] }),
        queryClient.invalidateQueries({ queryKey: ['ticketEscalations'] }),
        queryClient.invalidateQueries({ queryKey: ['ownerFinance'] }),
        queryClient.invalidateQueries({ queryKey: ['ownerRefunds'] }),
        queryClient.invalidateQueries({ queryKey: ['ownerBookings'] }),
      ]);

      setReason('');
      onSuccess?.();
      onClose();
    } catch (err: any) {
      const message = err?.message || err?.error || t('escalation.refundPolicy.modal.genericError', 'Có lỗi xảy ra khi ban hành quyết định chính sách.');
      if (err?.code === 'VERSION_CONFLICT' || message.includes('VERSION_CONFLICT')) {
        toast(
          t(
            'escalation.refundPolicy.modal.versionConflict',
            'Hồ sơ hoặc chuỗi quyết định đã thay đổi. Đang làm mới dữ liệu...'
          ),
          'warning'
        );
        queryClient.invalidateQueries({ queryKey: ['ticketEscalations', 'refundPolicyContext', ticket.id, escalationId] });
      } else {
        toast(message, 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} maxWidth={540}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-hairline pb-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand-line bg-brand-soft text-brand">
              <IconShieldCheck size={20} strokeWidth={2.2} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[15px] font-bold tracking-tight text-ink">
                  {t('escalation.refundPolicy.modal.title', 'Rà soát chính sách hoàn tiền tranh chấp')}
                </h3>
                <span className="rounded-md border border-brand-line bg-brand-soft px-1.5 py-0.5 text-[9.5px] font-bold text-brand uppercase tracking-wider">
                  BKG-057
                </span>
              </div>
              <p className="mt-0.5 text-[11.5px] text-muted">
                {t('escalation.refundPolicy.modal.ticketBookingSub', {
                  ticketCode: ticket.ticketCode || ticket.id,
                  bookingId: effectiveContext?.bookingCode || ticket.bookingCode || ticket.bookingId,
                  defaultValue: `Phiếu: #${ticket.ticketCode || ticket.id} · Booking: #${effectiveContext?.bookingCode || ticket.bookingCode || ticket.bookingId}`,
                })}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-ink transition-colors"
          >
            <IconX size={15} strokeWidth={2.2} />
          </button>
        </div>

        {/* Arbiter Mandate Context Banner */}
        <div className="flex items-start gap-2.5 rounded-xl border border-brand-line bg-brand-soft/40 p-3 text-[11.5px] leading-relaxed text-muted">
          <IconInfoCircle size={16} className="mt-0.5 shrink-0 text-brand" />
          <div>
            <div className="font-semibold text-ink mb-0.5">
              {t('escalation.refundPolicy.modal.mandateTitle', 'Thẩm quyền phán quyết chính sách')}
            </div>
            <p>
              {t(
                'escalation.refundPolicy.modal.mandateDesc',
                'Quản trị viên rà soát dựa trên biên bản kỹ thuật và dữ liệu đo đạc của trạm. Quyết định áp dụng hoàn đủ gói có hiệu lực thi hành ngay lập tức dù Chủ trạm không đồng ý.'
              )}
            </p>
          </div>
        </div>

        {(!matchesCase || contextQuery.isError) && <div role="alert" className="rounded-xl border border-bad bg-bad-soft p-3 text-xs text-bad">
          {t('escalation.refundPolicy.contextUnavailable', 'Không tải được hồ sơ rà soát. Chưa thể xác định khoản hoàn hoặc ban hành quyết định.')}
        </div>}
        {matchesCase && !selectedEligibility?.allowed && <p role="status" className="text-xs text-muted">
          {t('escalation.refundPolicy.actionUnavailable', 'Kết quả đã chọn chưa được phép áp dụng:')} {selectedEligibility?.reason}
        </p>}
        {/* Outcome Selector Radio Group */}
        <div className="space-y-2">
          <label className="text-[12.5px] font-semibold text-ink">
            {t('escalation.refundPolicy.modal.outcomeLabel', 'Kết quả rà soát chính sách')} <span className="text-bad">*</span>
          </label>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {/* Option 1: GRANT_FULL_REFUND */}
            <div
              onClick={() => {
                setOutcome('GRANT_FULL_REFUND');
                if (validationError) setValidationError(null);
              }}
              className={`cursor-pointer rounded-xl border p-3.5 transition shadow-2xs space-y-1.5 ${
                outcome === 'GRANT_FULL_REFUND'
                  ? 'border-good-border bg-good-soft/30 ring-2 ring-good/20'
                  : 'border-line bg-surface hover:border-line-hover'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-[13px] text-good-deep flex items-center gap-1.5">
                  <IconCheckCircle size={15} />
                  <span>{t('escalation.refundPolicy.modal.grantTitle', 'Hoàn đủ 100% gói')}</span>
                </span>
                <span className="rounded-full h-3.5 w-3.5 border border-good flex items-center justify-center">
                  {outcome === 'GRANT_FULL_REFUND' && <span className="h-2 w-2 rounded-full bg-good" />}
                </span>
              </div>
              <p className="text-[11px] text-muted leading-relaxed">
                {t('escalation.refundPolicy.modal.grantDesc', {
                  amount: refundAmount != null ? formatVnd(refundAmount) : t('escalation.refundPolicy.unknownAmount', 'Chưa có dữ liệu'),
                  defaultValue: `Đủ căn cứ lỗi trạm. Hệ thống tự động thiết lập nghĩa vụ hoàn đủ 100% giá gói (${refundAmount != null ? formatVnd(refundAmount) : t('escalation.refundPolicy.unknownAmount', 'Chưa có dữ liệu')}).`,
                })}
              </p>
            </div>

            {/* Option 2: INSUFFICIENT_EVIDENCE */}
            <div
              onClick={() => {
                setOutcome('INSUFFICIENT_EVIDENCE');
                if (validationError) setValidationError(null);
              }}
              className={`cursor-pointer rounded-xl border p-3.5 transition shadow-2xs space-y-1.5 ${
                outcome === 'INSUFFICIENT_EVIDENCE'
                  ? 'border-warn-border bg-warn-soft/40 ring-2 ring-warn/20'
                  : 'border-line bg-surface hover:border-line-hover'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-[13px] text-warn-deep flex items-center gap-1.5">
                  <IconAlertTriangle size={15} />
                  <span>{t('escalation.refundPolicy.modal.insufficientTitle', 'Chưa đủ căn cứ')}</span>
                </span>
                <span className="rounded-full h-3.5 w-3.5 border border-warn flex items-center justify-center">
                  {outcome === 'INSUFFICIENT_EVIDENCE' && <span className="h-2 w-2 rounded-full bg-warn" />}
                </span>
              </div>
              <p className="text-[11px] text-muted leading-relaxed">
                {t(
                  'escalation.refundPolicy.modal.insufficientDesc',
                  'Chưa đủ chứng cứ lỗi trạm. Ghi nhận kết quả rà soát, không sinh hoàn tiền và không hủy nghĩa vụ cũ.'
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Affected At (Only when GRANT_FULL_REFUND) */}
        {isGrant && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[12.5px] font-semibold text-ink">
                {t('escalation.refundPolicy.modal.affectedAtLabel', 'Thời điểm xác nhận sự cố trạm')} <span className="text-bad">*</span>
              </label>
              <span className="text-[10.5px] font-medium text-faint">
                {t('escalation.refundPolicy.modal.affectedAtHint', 'Thời điểm diễn ra lỗi kỹ thuật')}
              </span>
            </div>
            <DateTimeInput
              value={affectedAt}
              onChange={(val) => {
                setAffectedAt(val);
                if (validationError) setValidationError(null);
              }}
              accent="brand"
            />
          </div>
        )}

        {/* Mandatory Justification Reason */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[12.5px] font-semibold text-ink">
              {t('escalation.refundPolicy.modal.reasonLabel', 'Căn cứ phán quyết (Lý do giải trình)')} <span className="text-bad">*</span>
            </label>
            <span className="text-[10.5px] font-medium text-faint">
              {t('escalation.refundPolicy.modal.reasonHint', 'Biên bản lưu vết vĩnh viễn')}
            </span>
          </div>

          <textarea
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (validationError) setValidationError(null);
            }}
            placeholder={t(
              'escalation.refundPolicy.modal.reasonPlaceholder',
              'Trình bày chi tiết căn cứ dựa trên biên bản kỹ thuật, log trao đổi và dữ liệu sạc của vụ việc...'
            )}
            rows={3}
            disabled={isSubmitting}
            className={`w-full rounded-xl border bg-surface px-3 py-2 text-[12.5px] text-ink placeholder:text-faint transition focus:outline-none focus:ring-2 ${
              validationError
                ? 'border-bad focus:border-bad focus:ring-bad/20'
                : 'border-line focus:border-brand focus:ring-brand/15'
            }`}
          />

          {validationError && (
            <p className="text-[11.5px] font-medium text-bad flex items-center gap-1">
              <IconAlertTriangle size={12} />
              <span>{validationError}</span>
            </p>
          )}
        </div>

        {/* Operational Independence Notice */}
        <div className="rounded-xl border border-hairline bg-surface-2 p-3 text-[11px] text-muted flex items-start gap-2">
          <IconAlertTriangle size={14} className="mt-0.5 shrink-0 text-faint" />
          <span>
            {t(
              'escalation.refundPolicy.modal.independenceNotice',
              'Lưu ý: Phán quyết chính sách hoàn tiền không thay thế các thao tác đóng hồ sơ hỗ trợ (CLOSE_SUPPORT_CASE) hoặc trả case về trạm (RETURN_TO_STATION).'
            )}
          </span>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 border-t border-hairline pt-3.5">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            {t('escalation.refundPolicy.modal.closeBtn', 'Đóng')}
          </Button>
          <Button
            type="submit"
            variant="primary"
            accent="brand"
            disabled={isSubmitting || !reason.trim() || !canSubmit}
          >
            {isSubmitting
              ? t('escalation.refundPolicy.modal.submitting', 'Đang ban hành...')
              : t('escalation.refundPolicy.modal.confirmBtn', 'Ban hành phán quyết chính sách')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
