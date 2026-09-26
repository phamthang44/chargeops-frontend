import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  Button,
  Card,
  Drawer,
  IconCheck,
  IconClock,
  IconCopy,
  SegmentedControl,
  StatusPill,
  useToast,
} from '@chargeops/ui';
import {
  formatDateVn,
  formatDateTimeVn,
  formatVnd,
  useApi,
  type ExecuteRefundRequest,
  type RefundDetail,
  type TransferExecutionMode,
} from '@chargeops/api';
import { RefundAttemptTimeline } from './RefundAttemptTimeline';

function generateUuidV4(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export interface RefundExecutionDrawerProps {
  open: boolean;
  refund: RefundDetail | null;
  onClose: () => void;
  onSuccess?: (updated: RefundDetail) => void;
}

export function RefundExecutionDrawer({
  open,
  refund,
  onClose,
  onSuccess,
}: RefundExecutionDrawerProps) {
  const { t } = useTranslation('admin');
  const api = useApi();
  const toast = useToast();

  const refundId = refund?.refundId || refund?.id;

  const detailQuery = useQuery({
    queryKey: ['refunds', 'detail', refundId],
    queryFn: () => api.refunds.get(refundId!),
    enabled: Boolean(open && refundId && Boolean(api.refunds)),
  });

  const activeRefund = detailQuery.data || refund;

  const [activeTab, setActiveTab] = useState<'execute' | 'history'>('execute');
  const [executionMode, setExecutionMode] = useState<TransferExecutionMode>('SIMULATOR');
  const [outcome, setOutcome] = useState<'SUCCEEDED' | 'FAILED'>('SUCCEEDED');
  const [transferReference, setTransferReference] = useState('');
  const [performedAt, setPerformedAt] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Reset form when drawer opens or refund changes
  useEffect(() => {
    if (open && activeRefund) {
      setActiveTab(activeRefund.status === 'SUCCEEDED' ? 'history' : 'execute');
      setExecutionMode('SIMULATOR');
      setOutcome('SUCCEEDED');
      setTransferReference('');
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      setPerformedAt(now.toISOString().slice(0, 16));
      setNote(
        activeRefund.reason === 'VOLUNTARY_GRACE'
          ? t('refunds.drawer.noteDefaultGrace', 'Hoàn tiền 100% tài xế hủy trong ân hạn 10 phút')
          : t('refunds.drawer.noteDefaultFailure', 'Hoàn tiền theo sự cố trạm sạc')
      );
      setErrorMessage(null);
    }
  }, [open, activeRefund?.refundId, activeRefund?.status, t]);

  if (!activeRefund) return null;

  const isTerminalSuccess = activeRefund.status === 'SUCCEEDED';

  const copyId = () => {
    navigator.clipboard?.writeText(activeRefund.refundId || activeRefund.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getReasonBadge = (reason: string) => {
    switch (reason) {
      case 'VOLUNTARY_GRACE':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-good-soft px-2 py-0.5 text-[11px] font-semibold text-good">
            {t('refunds.reasons.VOLUNTARY_GRACE', 'Ân hạn 10p (100%)')}
          </span>
        );
      case 'STATION_FAILURE':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-bad-soft px-2 py-0.5 text-[11px] font-semibold text-bad">
            {t('refunds.reasons.STATION_FAILURE', 'Sự cố trạm sạc')}
          </span>
        );
      case 'EXCESS_PAYMENT':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-line-3 px-2 py-0.5 text-[11px] font-semibold text-muted">
            {t('refunds.reasons.EXCESS_PAYMENT', 'Thanh toán thừa')}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded bg-line-3 px-2 py-0.5 text-[11px] font-semibold text-muted">
            {reason}
          </span>
        );
    }
  };

  const handleSubmit = async (e?: React.SyntheticEvent) => {
    e?.preventDefault();
    if (isSubmitting || isTerminalSuccess) return;

    setErrorMessage(null);

    // Validate for manual record
    if (executionMode === 'MANUAL_RECORD') {
      if (!transferReference.trim()) {
        setErrorMessage(
          t('refunds.drawer.validationManualRef', 'Vui lòng nhập Mã giao dịch ngân hàng / Ủy nhiệm chi.')
        );
        return;
      }
      if (!performedAt) {
        setErrorMessage(
          t('refunds.drawer.validationPerformedAt', 'Vui lòng chọn thời điểm thực hiện giao dịch.')
        );
        return;
      }
    }

    if (!note.trim()) {
      setErrorMessage(
        t('refunds.drawer.validationNote', 'Vui lòng nhập ghi chú thực thi / lý do đối soát.')
      );
      return;
    }

    setIsSubmitting(true);
    try {
      // Generate client idempotency key (BKG-034 requirement - UUID v4)
      const idempotencyKey = generateUuidV4();

      const payload: ExecuteRefundRequest = {
        expectedVersion: activeRefund.version,
        executionMode,
        outcome,
        transferReference: transferReference.trim() || undefined,
        performedAt: performedAt ? new Date(performedAt).toISOString() : undefined,
        note: note.trim(),
      };

      const updated = await api.refunds.execute(
        activeRefund.refundId || activeRefund.id,
        payload,
        idempotencyKey
      );

      if (updated.status === 'SUCCEEDED') {
        toast(
          t('refunds.drawer.toastSuccess', {
            ref: updated.transferReference || 'N/A',
            amount: formatVnd(updated.amount),
            defaultValue: `Hoàn tất hoàn tiền: Mã tham chiếu ${updated.transferReference || 'N/A'}. Đã ghi nhận hoàn trả ${formatVnd(updated.amount)}.`,
          }),
          'success',
        );
      } else {
        toast(
          t(
            'refunds.drawer.toastFailed',
            'Đã ghi nhận lần thử thất bại (FAILED). Khoản hoàn tiền vẫn được bảo lưu ở trạng thái PENDING (BR-PAY-13).'
          ),
          'info',
        );
      }

      onSuccess?.(updated);
      onClose();
    } catch (err: any) {
      const code = err?.code;
      let msg = err?.message || t('refunds.drawer.toastErrorDefault', 'Có lỗi xảy ra khi thực thi hoàn tiền.');
      if (code === 'VERSION_CONFLICT' || code === 'REF_VERSION_CONFLICT') {
        msg = t('refunds.drawer.errorVersionConflict', 'Dữ liệu khoản hoàn tiền đã thay đổi trên máy chủ. Đang làm mới dữ liệu...');
        detailQuery.refetch();
      } else if (code === 'EXECUTION_CONFLICT' || code === 'REF_EXECUTION_CONFLICT') {
        msg = t('refunds.drawer.errorAlreadySucceeded', 'Khoản hoàn tiền này đã được thực thi hoàn tất trước đó.');
        detailQuery.refetch();
      } else if (code === 'REQUEST_CONFLICT' || code === 'REF_REQUEST_CONFLICT') {
        msg = t('refunds.drawer.errorRequestConflict', 'Yêu cầu xung đột với lần thực thi trước đó.');
      }
      setErrorMessage(msg);
      toast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width="540px"
      title={
        <div className="flex items-center gap-2">
          <span className="font-semibold text-body">{t('refunds.drawer.title', 'Chi tiết Hoàn tiền')}</span>
          <span className="font-mono text-[12px] font-semibold text-brand">
            {activeRefund.refundId || activeRefund.id}
          </span>
          <button
            type="button"
            onClick={copyId}
            className="text-faint hover:text-body"
            title={t('refunds.drawer.copyIdTitle', 'Sao chép mã hoàn tiền')}
          >
            {copied ? (
              <IconCheck size={14} className="text-good" />
            ) : (
              <IconCopy size={14} />
            )}
          </button>
        </div>
      }
      footer={
        activeTab === 'execute' && !isTerminalSuccess ? (
          <div className="flex w-full items-center justify-between gap-3">
            <Button variant="ghost" type="button" onClick={onClose} disabled={isSubmitting}>
              {t('refunds.drawer.closeBtn', 'Đóng')}
            </Button>
            <Button
              variant="primary"
              type="submit"
              form="refund-execute-form"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? t('refunds.drawer.submitting', 'Đang thực thi…')
                : executionMode === 'SIMULATOR'
                ? outcome === 'SUCCEEDED'
                  ? t('refunds.drawer.confirmSimulatorSuccess', 'Thực thi Mô phỏng Thành công')
                  : t('refunds.drawer.confirmSimulatorFailed', 'Mô phỏng Thất bại')
                : t('refunds.drawer.confirmManual', 'Xác nhận Ghi nhận Chuyển khoản')}
            </Button>
          </div>
        ) : (
          <div className="flex w-full justify-end">
            <Button variant="ghost" type="button" onClick={onClose}>
              {t('refunds.drawer.closeBtn', 'Đóng')}
            </Button>
          </div>
        )
      }
    >
      {/* 1. Header Summary Card */}
      <Card className="p-4 space-y-3 bg-surface-2 border-hairline">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-faint">
              {t('refunds.drawer.amountLabel', 'Số tiền cần hoàn trả')}
            </span>
            <div className="text-[24px] font-bold text-good">
              {formatVnd(activeRefund.amount)}
            </div>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-faint block mb-1">
              {t('refunds.drawer.statusLabel', 'Trạng thái')}
            </span>
            <StatusPill
              tone={isTerminalSuccess ? 'good' : 'warn'}
              label={
                isTerminalSuccess
                  ? t('refunds.drawer.statusSucceeded', 'ĐÃ HOÀN TẤT (SUCCEEDED)')
                  : t('refunds.drawer.statusPending', 'CHỜ THỰC THI (PENDING)')
              }
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-hairline/60 text-[12px]">
          <div>
            <span className="text-faint block">{t('refunds.drawer.bookingCode', 'Mã đơn đặt chỗ:')}</span>
            <span className="font-mono font-medium text-body">
              {activeRefund.bookingCode || activeRefund.bookingId}
            </span>
          </div>
          <div>
            <span className="text-faint block">{t('refunds.drawer.driverName', 'Tài xế nhận hoàn:')}</span>
            <span className="font-medium text-body">
              {activeRefund.driverName || '—'}
            </span>
          </div>
          <div>
            <span className="text-faint block">{t('refunds.drawer.stationName', 'Trạm sạc:')}</span>
            <span className="text-body truncate block">
              {activeRefund.stationName || '—'}
            </span>
          </div>
          <div>
            <span className="text-faint block">{t('refunds.drawer.reasonLabel', 'Căn cứ hoàn:')}</span>
            <div>{getReasonBadge(activeRefund.reason)}</div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-hairline/60 text-[11px] text-faint">
          <span>
            {t('refunds.drawer.createdAt', {
              date: formatDateVn(activeRefund.decisionAt),
              defaultValue: `Khởi tạo: ${formatDateVn(activeRefund.decisionAt)}`,
            })}
          </span>
          <span>
            {t('refunds.drawer.version', {
              version: activeRefund.version,
              defaultValue: `Phiên bản: v${activeRefund.version}`,
            })}
          </span>
        </div>
      </Card>

      {/* 2. Success Banner if Terminal */}
      {isTerminalSuccess && (
        <div className="rounded-lg border border-good-soft bg-good-soft/20 p-3.5 text-[12.5px] text-body">
          <div className="flex items-center gap-2 font-semibold text-good mb-1">
            <IconCheck size={16} />
            {t(
              'refunds.drawer.terminalBanner',
              'Khoản hoàn tiền đã được hoàn tất thành công (Terminal State)'
            )}
          </div>
          <p className="text-muted leading-relaxed">
            {t('refunds.drawer.terminalDesc', {
              ref: activeRefund.transferReference || 'N/A',
              time: formatDateTimeVn(activeRefund.completedAt || activeRefund.decisionAt),
              defaultValue: `Mã tham chiếu ngân hàng: ${activeRefund.transferReference || 'N/A'}. Hoàn tất lúc: ${formatDateTimeVn(activeRefund.completedAt || activeRefund.decisionAt)}. Hệ thống không cho phép thực thi thêm lệnh mới trên bản ghi này.`,
            })}
          </p>
        </div>
      )}

      {/* 3. Tab Switcher (Execute vs History) */}
      <div className="mt-1">
        <SegmentedControl<'execute' | 'history'>
          active={activeTab}
          onChange={setActiveTab}
          segments={[
            {
              key: 'execute',
              label: isTerminalSuccess
                ? t('refunds.drawer.tabInfo', 'Thông tin thực thi')
                : t('refunds.drawer.tabExecute', 'Thực thi hoàn tiền'),
            },
            {
              key: 'history',
              label: t('refunds.drawer.tabHistory', {
                count: activeRefund.attempts?.length || 0,
                defaultValue: `Lịch sử các lần thử (${activeRefund.attempts?.length || 0})`,
              }),
            },
          ]}
        />
      </div>

      {/* 4. Tab Content: Execute Form */}
      {activeTab === 'execute' && !isTerminalSuccess && (
        <form id="refund-execute-form" onSubmit={handleSubmit} className="space-y-4 pt-1">
          {errorMessage && (
            <div className="rounded-lg border border-bad-soft bg-bad-soft/20 p-3 text-[12px] text-bad font-medium">
              {errorMessage}
            </div>
          )}

          {/* Mode Selector */}
          <div>
            <label className="block text-[12px] font-semibold text-body mb-1.5">
              {t('refunds.drawer.modeLabel', 'Chế độ thực thi (Execution Mode)')}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setExecutionMode('SIMULATOR')}
                className={`flex flex-col items-start p-3 rounded-lg border text-left transition-all ${
                  executionMode === 'SIMULATOR'
                    ? 'border-brand bg-brand-soft/20 ring-1 ring-brand'
                    : 'border-hairline bg-surface hover:bg-surface-2'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-[13px] text-brand">
                  <span>{t('refunds.drawer.modeSimulator', 'Mô phỏng Sandbox')}</span>
                </div>
                <span className="text-[11px] text-muted mt-1">
                  {t('refunds.drawer.modeSimulatorDesc', 'Dành cho dev / test / demo. Không gọi ngân hàng thật.')}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setExecutionMode('MANUAL_RECORD')}
                className={`flex flex-col items-start p-3 rounded-lg border text-left transition-all ${
                  executionMode === 'MANUAL_RECORD'
                    ? 'border-warn bg-warn-soft ring-1 ring-warn'
                    : 'border-hairline bg-surface hover:bg-surface-2'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-[13px] text-warn">
                  <span>{t('refunds.drawer.modeManual', 'Ghi nhận thủ công')}</span>
                </div>
                <span className="text-[11px] text-muted mt-1">
                  {t('refunds.drawer.modeManualDesc', 'Đã chuyển khoản ngoài nền tảng. Cần mã đối soát.')}
                </span>
              </button>
            </div>
          </div>

          {/* SIMULATOR Specific Fields */}
          {executionMode === 'SIMULATOR' && (
            <div className="rounded-lg border border-brand/20 bg-brand-soft/10 p-3.5 space-y-3">
              <div className="text-[12px] text-brand font-medium">
                {t('refunds.drawer.outcomeConfig', 'Cấu hình kết quả mô phỏng (Test Outcome):')}
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-[12.5px] cursor-pointer">
                  <input
                    type="radio"
                    name="outcome"
                    value="SUCCEEDED"
                    checked={outcome === 'SUCCEEDED'}
                    onChange={() => setOutcome('SUCCEEDED')}
                    className="accent-good"
                  />
                  <span className="font-semibold text-good">
                    {t('refunds.drawer.outcomeSucceeded', 'Thành công (SUCCEEDED)')}
                  </span>
                </label>
                <label className="flex items-center gap-2 text-[12.5px] cursor-pointer">
                  <input
                    type="radio"
                    name="outcome"
                    value="FAILED"
                    checked={outcome === 'FAILED'}
                    onChange={() => setOutcome('FAILED')}
                    className="accent-bad"
                  />
                  <span className="font-semibold text-bad">
                    {t('refunds.drawer.outcomeFailed', 'Lỗi mô phỏng (FAILED)')}
                  </span>
                </label>
              </div>

              <div>
                <label className="block text-[11.5px] text-muted mb-1">
                  {t('refunds.drawer.simRefLabel', 'Mã tham chiếu mô phỏng (Tự động sinh nếu để trống):')}
                </label>
                <input
                  type="text"
                  value={transferReference}
                  onChange={(e) => setTransferReference(e.target.value)}
                  placeholder={t('refunds.drawer.simRefPlaceholder', 'ví dụ: SIM-REF-902184')}
                  className="w-full rounded border border-line-3 bg-surface px-3 py-1.5 font-mono text-[12px] text-body placeholder:text-faint focus:border-brand focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* MANUAL_RECORD Specific Fields */}
          {executionMode === 'MANUAL_RECORD' && (
            <div className="rounded-lg border border-warn-border bg-warn-soft/60 p-3.5 space-y-3">
              <div>
                <label className="block text-[12px] font-semibold text-body mb-1">
                  {t('refunds.drawer.manualRefLabel', 'Mã giao dịch ngân hàng / UNC')}{' '}
                  <span className="text-bad">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={transferReference}
                  onChange={(e) => setTransferReference(e.target.value)}
                  placeholder={t('refunds.drawer.manualRefPlaceholder', 'ví dụ: FT260925987123 / VCB1982736')}
                  className="w-full rounded border border-line-3 bg-surface px-3 py-1.5 font-mono text-[12.5px] text-body placeholder:text-faint focus:border-brand focus:outline-none"
                />
                <span className="text-[11px] text-muted mt-1 block">
                  {t(
                    'refunds.drawer.manualRefHelp',
                    'Nhập mã tham chiếu từ sao kê ngân hàng đã thực hiện chuyển tiền cho tài xế.'
                  )}
                </span>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-body mb-1">
                  {t('refunds.drawer.performedAtLabel', 'Thời điểm thực hiện chuyển khoản')}{' '}
                  <span className="text-bad">*</span>
                </label>
                <input
                  type="datetime-local"
                  required
                  value={performedAt}
                  onChange={(e) => setPerformedAt(e.target.value)}
                  className="w-full rounded border border-line-3 bg-surface px-3 py-1.5 text-[12.5px] text-body focus:border-brand focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Common Note */}
          <div>
            <label className="block text-[12px] font-semibold text-body mb-1">
              {t('refunds.drawer.noteLabel', 'Ghi chú thực thi / Đối soát')}{' '}
              <span className="text-bad">*</span>
            </label>
            <textarea
              rows={2}
              required
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t('refunds.drawer.notePlaceholder', 'Nhập ghi chú giải trình hoặc lý do xử lý hoàn tiền…')}
              className="w-full rounded border border-line-3 bg-surface px-3 py-2 text-[12.5px] text-body placeholder:text-faint focus:border-brand focus:outline-none"
            />
          </div>

          <div className="rounded-lg bg-surface-2 p-3 text-[11.5px] text-muted space-y-1">
            <div className="font-semibold text-body">
              {t('refunds.drawer.protectionTitle', 'Nguyên tắc bảo vệ dữ liệu (BR-PAY-13):')}
            </div>
            <p>
              • {t('refunds.drawer.protectionPoint1', 'Mỗi thao tác gửi lệnh đi kèm Idempotency-Key để chống bấm đúp hoặc gửi trùng lặp.')}
            </p>
            <p>
              • {t('refunds.drawer.protectionPoint2', 'Nếu lần thử gặp lỗi (FAILED), khoản hoàn tiền vẫn được giữ nguyên trạng thái PENDING. Quyền lợi của tài xế không bị mất.')}
            </p>
          </div>
        </form>
      )}

      {/* 5. Tab Content: Attempt History */}
      {activeTab === 'history' && (
        <div className="pt-1">
          <RefundAttemptTimeline attempts={activeRefund.attempts} />
        </div>
      )}
    </Drawer>
  );
}
