import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  Button,
  Card,
  DateTimeInput,
  Drawer,
  IconBolt,
  IconCheck,
  IconClock,
  IconCopy,
  IconShield,
  IconTag,
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
  const [showTestTools, setShowTestTools] = useState(false);
  const [transferReference, setTransferReference] = useState('');
  const [performedAt, setPerformedAt] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Reset form when drawer opens or refund changes
  useEffect(() => {
    if (open && activeRefund) {
      const isAuto = activeRefund.status === 'PENDING' && activeRefund.reason === 'VOLUNTARY_GRACE' && !activeRefund.requiresAdminAction && !activeRefund.attempts?.some((a) => a.status === 'FAILED');
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
  const hasFailedAttempt = Boolean(
    activeRefund.attempts && activeRefund.attempts.some((a) => a.status === 'FAILED')
  );
  const isGrace = activeRefund.reason === 'VOLUNTARY_GRACE';
  const needsAdminAction = Boolean(activeRefund.requiresAdminAction || hasFailedAttempt);
  const isAutoProcessing = !isTerminalSuccess && isGrace && !needsAdminAction && (activeRefund.executionPolicy === 'AUTO_FIRST_ATTEMPT' || !activeRefund.executionPolicy);

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
            {t('refunds.reasons.VOLUNTARY_GRACE', 'Ân hạn 10 phút')}
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
              variant={isAutoProcessing ? 'secondary' : 'primary'}
              type="submit"
              form="refund-execute-form"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? t('refunds.drawer.submitting', 'Đang thực thi…')
                : executionMode === 'SIMULATOR'
                ? outcome === 'SUCCEEDED'
                  ? hasFailedAttempt
                    ? t('refunds.drawer.confirmRetry', 'Thử lại lệnh hoàn tiền')
                    : isAutoProcessing
                    ? t('refunds.drawer.confirmManualOverride', 'Can thiệp thực thi ngay')
                    : t('refunds.drawer.confirmSimulatorSuccess', 'Kích hoạt lệnh hoàn tiền')
                  : t('refunds.drawer.confirmSimulatorFailed', 'Mô phỏng Thất bại (Test Failure)')
                : t('refunds.drawer.confirmManual', 'Xác nhận Đã Chuyển Khoản & Đối Soát')}
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
              tone={
                isTerminalSuccess
                  ? 'good'
                  : needsAdminAction
                  ? 'bad'
                  : isAutoProcessing
                  ? 'brand'
                  : 'warn'
              }
              label={
                isTerminalSuccess
                  ? t('refunds.drawer.statusSucceeded', 'ĐÃ HOÀN TẤT (SUCCEEDED)')
                  : needsAdminAction
                  ? t('refunds.drawer.statusFailedAttempt', 'CẦN CAN THIỆP (LẦN THỬ LỖI)')
                  : isAutoProcessing
                  ? t('refunds.drawer.statusAutoProcessing', 'TỰ ĐỘNG XỬ LÝ (AUTO_FIRST_ATTEMPT)')
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

        {/* Grace Entitlement Callout */}
        {isGrace && (
          <div className="flex items-start gap-2.5 rounded-xl bg-good-soft/30 border border-good/25 p-3 text-[12px] text-body">
            <IconShield size={16} className="text-good shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-semibold text-good block">
                {t('refunds.drawer.graceEntitlementTitle', 'Đủ điều kiện hoàn 100% (Xác lập tự động theo BR-PAY-08)')}
              </span>
              <span className="text-[11.5px] text-muted leading-relaxed block">
                {t(
                  'refunds.drawer.graceEntitlementDesc',
                  'Tài xế đã hủy trong 10 phút ân hạn đầu tiên. Quyền hoàn 100% là quyền lợi mặc định đã được chốt bởi chính sách. Thao tác tại đây nhằm kích hoạt kênh chi trả hoặc ghi nhận đối soát chuyển khoản ngân hàng.'
                )}
              </span>
            </div>
          </div>
        )}

        {/* Auto Processing Notice */}
        {isAutoProcessing && (
          <div className="flex items-start gap-2.5 rounded-xl bg-brand/10 border border-brand/25 p-3 text-[12px] text-body">
            <IconBolt size={16} className="text-brand shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-semibold text-brand block">
                {t('refunds.drawer.autoProcessingBannerTitle', 'Hệ thống đang tự động điều phối thực thi (Auto First Attempt)')}
              </span>
              <span className="text-[11.5px] text-muted leading-relaxed block">
                {t(
                  'refunds.drawer.autoProcessingBannerDesc',
                  'Khoản hoàn tiền này thuộc chính sách tự động thực thi (AUTO_FIRST_ATTEMPT). Scheduler/worker hệ thống đang phát lệnh chi trả nền tảng. Admin không cần can thiệp trừ khi phát sinh lỗi.'
                )}
              </span>
            </div>
          </div>
        )}

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
              {t('refunds.drawer.modeLabel', 'Phương thức chi trả / Đối soát')}
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
                  <span>{t('refunds.drawer.modeSimulator', 'Kênh mô phỏng Sandbox')}</span>
                </div>
                <span className="text-[11px] text-muted mt-1">
                  {t('refunds.drawer.modeSimulatorDesc', 'Gửi lệnh qua kênh mô phỏng cổng thanh toán (Dev/Demo).')}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setExecutionMode('MANUAL_RECORD')}
                className={`flex flex-col items-start p-3 rounded-lg border text-left transition-all ${
                  executionMode === 'MANUAL_RECORD'
                    ? 'border-amber-500/80 dark:border-amber-400 bg-amber-500/10 dark:bg-amber-400/15 ring-1 ring-amber-500/40 shadow-xs'
                    : 'border-line-2 bg-surface hover:bg-surface-2'
                }`}
              >
                <div
                  className={`flex items-center gap-1.5 font-semibold text-[13px] ${
                    executionMode === 'MANUAL_RECORD'
                      ? 'text-amber-700 dark:text-amber-300 font-bold'
                      : 'text-body'
                  }`}
                >
                  <span>{t('refunds.drawer.modeManual', 'Ghi nhận chuyển khoản ngoài')}</span>
                </div>
                <span
                  className={`text-[11px] mt-1 ${
                    executionMode === 'MANUAL_RECORD'
                      ? 'text-amber-800/80 dark:text-amber-200/80 font-medium'
                      : 'text-muted'
                  }`}
                >
                  {t('refunds.drawer.modeManualDesc', 'Đã chuyển tiền ngoài qua ngân hàng. Cần mã UNC đối soát.')}
                </span>
              </button>
            </div>
          </div>

          {/* SIMULATOR Specific Fields */}
          {executionMode === 'SIMULATOR' && (
            <div className="rounded-xl border border-brand/20 bg-brand-soft/10 p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand/10 text-brand">
                    <IconShield size={13} />
                  </span>
                  <span className="text-[12.5px] font-bold text-ink">
                    {hasFailedAttempt
                      ? t('refunds.drawer.simTitleRetry', 'Kích hoạt thử lại lệnh hoàn tiền')
                      : t('refunds.drawer.simTitleDefault', 'Kích hoạt lệnh hoàn tiền mô phỏng')}
                  </span>
                </div>
                <span className="rounded-full bg-good-soft px-2 py-0.5 text-[10.5px] font-semibold text-good">
                  {outcome === 'SUCCEEDED' ? 'Mặc định: Thành công' : 'Đang ép lỗi giả lập'}
                </span>
              </div>

              <p className="text-[11.5px] text-muted leading-relaxed">
                {t(
                  'refunds.drawer.simDesc',
                  'Hệ thống sẽ gửi yêu cầu hoàn tiền qua adapter mô phỏng với Idempotency-Key chống trùng lặp. Kết quả hoàn thành công sẽ cập nhật thanh toán REFUNDED một lần duy nhất.'
                )}
              </p>

              <div>
                <label className="block text-[11.5px] text-muted mb-1 font-medium">
                  {t('refunds.drawer.simRefLabel', 'Mã tham chiếu mô phỏng (tùy chọn - tự sinh nếu để trống):')}
                </label>
                <input
                  type="text"
                  value={transferReference}
                  onChange={(e) => setTransferReference(e.target.value)}
                  placeholder={t('refunds.drawer.simRefPlaceholder', 'ví dụ: SIM-REF-902184')}
                  className="w-full rounded-lg border border-line-3 bg-surface px-3 py-1.5 font-mono text-[12px] text-body placeholder:text-faint focus:border-brand focus:outline-none"
                />
              </div>

              {/* Collapsible Test Failure Injection Panel */}
              <div className="pt-2 border-t border-brand/20">
                <button
                  type="button"
                  onClick={() => setShowTestTools(!showTestTools)}
                  className="flex items-center gap-1.5 text-[11px] font-semibold text-brand hover:underline transition"
                >
                  <span>🧪 {showTestTools ? 'Thu gọn công cụ giả lập kiểm thử' : 'Mở công cụ giả lập lỗi (Failure Injection)'}</span>
                  <span className="text-[10px]">{showTestTools ? '▲' : '▼'}</span>
                </button>

                {showTestTools && (
                  <div className="mt-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 space-y-2 text-[11.5px]">
                    <div className="font-semibold text-amber-800 dark:text-amber-200">
                      Tùy chọn kết quả mô phỏng (Chỉ dùng cho mục đích Demo / Kiểm thử ngoại lệ):
                    </div>
                    <p className="text-muted leading-relaxed">
                      Bạn có thể chọn kịch bản để kiểm tra xử lý lỗi. Lưu ý: dù lần thử có FAILED thì quyền hoàn tiền PENDING của tài xế vẫn được bảo lưu (BR-PAY-13).
                    </p>
                    <div className="flex gap-4 pt-1">
                      <label className="flex items-center gap-2 cursor-pointer font-medium">
                        <input
                          type="radio"
                          name="outcome"
                          value="SUCCEEDED"
                          checked={outcome === 'SUCCEEDED'}
                          onChange={() => setOutcome('SUCCEEDED')}
                          className="accent-good"
                        />
                        <span className="text-good font-semibold">Thành công (SUCCEEDED)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer font-medium">
                        <input
                          type="radio"
                          name="outcome"
                          value="FAILED"
                          checked={outcome === 'FAILED'}
                          onChange={() => setOutcome('FAILED')}
                          className="accent-bad"
                        />
                        <span className="text-bad font-semibold">Giả lập lỗi mạng/cổng (FAILED)</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* MANUAL_RECORD Specific Fields */}
          {executionMode === 'MANUAL_RECORD' && (
            <div className="rounded-xl border border-amber-500/30 dark:border-amber-400/30 bg-gradient-to-b from-amber-500/[0.08] to-amber-500/[0.02] dark:from-amber-400/[0.12] dark:to-amber-400/[0.03] p-4 space-y-4 shadow-xs backdrop-blur-xs">
              <div className="flex items-center gap-2.5 pb-2.5 border-b border-amber-500/20 dark:border-amber-400/20">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500/30">
                  <IconTag size={13} />
                </span>
                <div className="flex-1">
                  <div className="text-[12.5px] font-bold text-amber-900 dark:text-amber-100">
                    {t('refunds.drawer.manualSectionTitle', 'Ủy nhiệm chi / Chuyển khoản ngân hàng ngoài nền tảng')}
                  </div>
                  <div className="text-[11px] text-amber-800/80 dark:text-amber-300/80">
                    {t(
                      'refunds.drawer.manualSectionDesc',
                      'ChargeOps không tự chuyển tiền qua tài khoản này. Nhập mã giao dịch để đối soát khoản tiền đã chi trả thủ công cho tài xế.'
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-body mb-1">
                  {t('refunds.drawer.manualRefLabel', 'Mã giao dịch ngân hàng / UNC')}{' '}
                  <span className="text-bad font-bold">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={transferReference}
                  onChange={(e) => setTransferReference(e.target.value)}
                  placeholder={t('refunds.drawer.manualRefPlaceholder', 'ví dụ: FT260925987123 / VCB1982736')}
                  className="w-full rounded-xl border border-line-2 bg-surface px-3.5 py-2 font-mono text-[13px] font-medium text-ink placeholder:text-faint focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 shadow-2xs transition-all"
                />
                <span className="text-[11px] text-muted mt-1 block">
                  {t(
                    'refunds.drawer.manualRefHelp',
                    'Nhập mã tham chiếu từ sao kê ngân hàng đã thực hiện chuyển tiền cho tài xế.'
                  )}
                </span>
              </div>

              <DateTimeInput
                id="manual-performed-at"
                label={t('refunds.drawer.performedAtLabel', 'Thời điểm thực hiện chuyển khoản')}
                required
                accent="warn"
                value={performedAt}
                onChange={setPerformedAt}
                hint={t('refunds.drawer.performedAtHint', 'Thời gian ghi trên sao kê hoặc biên lai chuyển khoản')}
              />
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

          <div className="rounded-lg bg-surface-2 p-3 text-[11.5px] text-muted space-y-1.5">
            <div className="font-semibold text-body">
              {t('refunds.drawer.protectionTitle', 'Nguyên tắc vận hành & bảo vệ dữ liệu (BR-PAY-08 / BR-PAY-13):')}
            </div>
            <p>
              • {t('refunds.drawer.protectionPoint1', 'Mỗi thao tác gửi lệnh đi kèm Idempotency-Key tự sinh theo chuẩn BKG-034 để chống trùng lặp dòng tiền.')}
            </p>
            <p>
              • {t('refunds.drawer.protectionPoint2', 'Tách bạch Quyền lợi và Thực thi: Quyền hoàn tiền đã được chốt bởi chính sách. Nếu lần thử gặp lỗi (FAILED), khoản hoàn vẫn được giữ nguyên trạng thái PENDING. Quyền lợi của tài xế không bao giờ bị mất.')}
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
