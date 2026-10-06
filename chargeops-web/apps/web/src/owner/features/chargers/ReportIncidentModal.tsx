import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import {
  Button,
  DateTimeInput,
  IconAlertTriangle,
  IconBolt,
  IconLock,
  IconShieldAlert,
  Modal,
  useToast,
} from '@chargeops/ui';
import {
  useApi,
  type ChargePoint,
  type Connector,
  type ConnectorIncidentResponse,
} from '@chargeops/api';

export interface ReportIncidentModalProps {
  open: boolean;
  onClose: () => void;
  stationId: string;
  /**
   * Structural types so the staff console can reuse this modal: the staff
   * equipment DTOs expose the fields read here (name / id / code / type /
   * version) but not the full owner `ChargePoint` / `Connector` records.
   */
  chargePoint: Pick<ChargePoint, 'name'>;
  connector: Pick<Connector, 'id' | 'connectorCode' | 'connectorType'> & {
    powerKw?: number;
    version?: number;
  };
  onSuccess?: (incident: ConnectorIncidentResponse) => void;
}

export function ReportIncidentModal({
  open,
  onClose,
  stationId,
  chargePoint,
  connector,
  onSuccess,
}: ReportIncidentModalProps) {
  const { t } = useTranslation('owner');
  const api = useApi();
  const toast = useToast();
  const queryClient = useQueryClient();

  const presets = (t('incidents.report.presets', { returnObjects: true }) as string[]) || [];

  const now = new Date();
  const localIsoNow = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

  const [occurredAt, setOccurredAt] = useState(localIsoNow);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!open) return null;

  const connectorLabel = connector.connectorCode || connector.id;
  const isReasonValid = reason.trim().length >= 5;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isReasonValid) {
      setErrorMsg(t('incidents.report.reasonTooShort', 'Lý do sự cố phải có tối thiểu 5 ký tự.'));
      return;
    }

    const occurredDate = new Date(occurredAt);
    if (occurredDate.getTime() > Date.now() + 60_000) {
      setErrorMsg(t('incidents.report.futureOccurredAt', 'Thời điểm xảy ra sự cố không được ở tương lai.'));
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      const connVersion = (connector as any).version ?? 0;
      const res = await api.incidents.report(stationId, connector.id, {
        expectedConnectorVersion: connVersion,
        reason: reason.trim(),
        occurredAt: occurredDate.toISOString(),
      });

      toast(
        t('incidents.report.success', {
          defaultValue: 'Đã kích hoạt sự cố khẩn cấp và ngắt cổng OFFLINE.',
        }),
        'success',
      );

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['connectors'] });
      queryClient.invalidateQueries({ queryKey: ['chargePoints'] });
      queryClient.invalidateQueries({ queryKey: ['ownerBookings'] });

      onSuccess?.(res);
      onClose();
    } catch (err: any) {
      const msg = err?.message || err?.error?.message || t('incidents.report.genericError', 'Có lỗi xảy ra khi báo cáo sự cố.');
      if (err?.code === 'VERSION_CONFLICT' || msg.includes('VERSION_CONFLICT')) {
        toast(
          t('incidents.report.versionConflict', 'Phiên bản cổng sạc đã thay đổi. Đang làm mới dữ liệu...'),
          'warning',
        );
        queryClient.invalidateQueries({ queryKey: ['connectors'] });
      } else {
        setErrorMsg(msg);
        toast(msg, 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal open onClose={onClose} maxWidth={540}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] bg-bad-soft text-bad">
            <IconShieldAlert size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[16px] font-bold leading-snug text-ink">
              {t('incidents.report.title', 'Báo cáo sự cố khẩn cấp (Emergency Incident)')}
            </div>
            <div className="mt-0.5 text-[12px] font-medium text-muted">
              {chargePoint.name} · {connectorLabel} ({connector.connectorType})
            </div>
          </div>
        </div>

        {/* Invariant Warning Banner */}
        <div className="rounded-xl border border-bad-border bg-bad-soft p-3.5 text-[12px] leading-relaxed text-bad-deep">
          <div className="flex items-center gap-1.5 font-bold text-bad">
            <IconAlertTriangle size={15} />
            <span>{t('incidents.report.warningTitle', 'Cảnh báo an toàn & nghiệp vụ:')}</span>
          </div>
          <ul className="mt-1.5 list-disc pl-4 space-y-1">
            <li>{t('incidents.report.warningOffline', 'Cổng sạc sẽ lập tức chuyển sang OFFLINE và khóa tiếp nhận mọi lượt đặt chỗ mới.')}</li>
            <li>{t('incidents.report.warningSnapshot', 'Hệ thống chụp snapshot bất biến các lượt đặt chỗ bị ảnh hưởng để phục vụ dừng phiên an toàn.')}</li>
            <li>{t('incidents.report.warningNoAutoRefund', 'Không tự động hoàn tiền: Báo sự cố là thao tác an toàn kỹ thuật hiện trường. Hoàn tiền nếu có sẽ thực hiện qua luồng Nhận lỗi trạm (BKG-056) hoặc Admin xét duyệt (BKG-057).')}</li>
          </ul>
        </div>

        {/* Connector Details Box */}
        <div className="flex items-center justify-between rounded-lg border border-line-2 bg-surface-2 px-3 py-2 text-[12px]">
          <div className="flex items-center gap-2">
            <IconBolt size={14} className="text-owner" />
            <span className="font-semibold text-body">{t('incidents.report.connectorCodeLabel', 'Mã cổng sạc:')}</span>
            <span className="font-mono font-bold text-ink">{connectorLabel}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted">
            <IconLock size={12} />
            {connector.powerKw != null && (
              <span>{t('incidents.report.powerKw', { power: connector.powerKw, defaultValue: `Công suất: ${connector.powerKw} kW` })}</span>
            )}
          </div>
        </div>

        {/* Occurred At Input */}
        <div>
          <DateTimeInput
            label={t('incidents.report.occurredAtLabel', 'Thời điểm phát sinh sự cố *')}
            value={occurredAt}
            onChange={(val) => {
              setOccurredAt(val);
              if (errorMsg) setErrorMsg(null);
            }}
            accent="brand"
          />
          <p className="mt-1 text-[11px] text-faint">
            {t('incidents.report.occurredAtHint', 'Thời gian sự cố xảy ra thực tế tại trạm sạc (không được ở tương lai).')}
          </p>
        </div>

        {/* Reason Presets & Input */}
        <div className="space-y-1.5">
          <label className="text-[12px] font-bold text-ink">
            {t('incidents.report.reasonLabel', 'Lý do / Mô tả chi tiết sự cố')} <span className="text-bad">*</span>
          </label>
          <div className="flex flex-wrap gap-1.5 mb-1">
            {presets.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  setReason(p);
                  if (errorMsg) setErrorMsg(null);
                }}
                className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
                  reason === p
                    ? 'border-bad bg-bad text-white font-semibold'
                    : 'border-line-2 bg-surface text-body hover:border-line-3'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <textarea
            rows={3}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (errorMsg) setErrorMsg(null);
            }}
            placeholder={t(
              'incidents.report.reasonPlaceholder',
              'Mô tả chi tiết sự cố hiện trường (tối thiểu 5 ký tự, tối đa 2000 ký tự)...',
            )}
            className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-[12.5px] font-medium text-ink focus:border-bad focus:outline-none"
          />
        </div>

        {errorMsg && (
          <div className="rounded-lg bg-bad-soft px-3 py-2 text-[12px] font-medium text-bad">
            {errorMsg}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 border-t border-hairline pt-3">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            {t('incidents.report.cancelBtn', 'Đóng')}
          </Button>
          <Button
            type="submit"
            variant="danger"
            disabled={isSubmitting || !isReasonValid}
          >
            {isSubmitting
              ? t('incidents.report.submitting', 'Đang kích hoạt...')
              : t('incidents.report.confirmBtn', 'Kích hoạt sự cố khẩn cấp')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
