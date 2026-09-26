import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, FormField, IconAlertTriangle, IconCheckCircle, Modal } from '@chargeops/ui';
import type { AdminStationDetail, AdminStationListItem } from '@chargeops/api';

export type StationActionType = 'suspend' | 'reactivate';

export interface StationActionModalProps {
  open: boolean;
  type: StationActionType | null;
  station: AdminStationDetail | AdminStationListItem | null;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  loading?: boolean;
}

export function StationActionModal({
  open,
  type,
  station,
  onClose,
  onConfirm,
  loading = false,
}: StationActionModalProps) {
  const { t } = useTranslation('admin');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!type || !station) return null;

  const isSuspend = type === 'suspend';

  const title = isSuspend
    ? t('stations.modal.suspendTitle', 'Tạm ngưng vận hành trạm sạc')
    : t('stations.modal.reactivateTitle', 'Kích hoạt lại trạm sạc');
  const confirmLabel = isSuspend
    ? t('stations.modal.suspendConfirm', 'Xác nhận tạm ngưng')
    : t('stations.modal.reactivateConfirm', 'Xác nhận kích hoạt');
  const confirmTone = isSuspend ? 'destructive' : 'primary';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSuspend && (!reason.trim() || reason.trim().length < 5)) {
      setError(t('stations.modal.validationReason', 'Vui lòng nhập lý do tạm ngưng trạm (tối thiểu 5 ký tự).'));
      return;
    }
    setError(null);
    try {
      await onConfirm(reason.trim());
      setReason('');
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Có lỗi xảy ra khi thực hiện thao tác.');
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        setReason('');
        setError(null);
        onClose();
      }}
      maxWidth={520}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-[13px] text-body">
        <div className="flex items-center justify-between border-b border-hairline pb-3">
          <h3 className="text-[16px] font-bold text-ink">{title}</h3>
        </div>

        <div className="flex items-start gap-3 rounded-[10px] border border-line-2 bg-surface-2 p-3.5">
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
              isSuspend ? 'bg-warn-soft text-warn-deep' : 'bg-good-soft text-good'
            }`}
          >
            {isSuspend ? <IconAlertTriangle size={18} /> : <IconCheckCircle size={18} />}
          </div>
          <div>
            <div className="font-bold text-ink">{station.name}</div>
            <div className="font-mono text-[11px] text-faint">
              {t('stations.modal.stationCode', {
                code: station.stationCode || station.id,
                owner: station.ownerDisplayName || '—',
                defaultValue: `Mã trạm: ${station.stationCode || station.id} · Chủ trạm: ${station.ownerDisplayName || '—'}`
              })}
            </div>
            <div className="mt-1 text-[12px] leading-relaxed text-muted">
              {isSuspend
                ? t('stations.modal.suspendNotice', 'Khi tạm ngưng, trạm sạc sẽ bị ẩn khỏi ứng dụng tìm kiếm của tài xế và tạm dừng mọi lượt đặt chỗ mới.')
                : t('stations.modal.reactivateNotice', 'Trạm sạc sẽ được mở lại trạng thái hoạt động công khai nếu trạm có giấy phép License còn hiệu lực.')}
            </div>
          </div>
        </div>

        <FormField
          label={isSuspend ? t('stations.modal.suspendReasonLabel', 'Lý do tạm ngưng vận hành *') : t('stations.modal.reactivateReasonLabel', 'Ghi chú / Lý do kích hoạt')}
          hint={isSuspend ? t('stations.modal.suspendReasonHint', 'Bắt buộc nhập từ 5 - 500 ký tự') : t('stations.modal.optionalHint', 'Không bắt buộc')}
        >
          <textarea
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError(null);
            }}
            placeholder={
              isSuspend
                ? t('stations.modal.suspendPlaceholder', 'Ví dụ: Tạm ngưng do sự cố trạm biến áp, bảo trì hệ thống định kỳ...')
                : t('stations.modal.reactivatePlaceholder', 'Ví dụ: Đã hoàn tất sửa chữa và kiểm định an toàn điện...')
            }
            rows={3}
            className="w-full rounded-[8px] border border-line-2 bg-surface p-2.5 text-[12.5px] text-ink focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            disabled={loading}
          />
        </FormField>

        {error && (
          <div className="rounded-[6px] border border-bad-border bg-bad-soft p-2.5 text-[12px] text-bad-deep">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-2.5 border-t border-hairline pt-3 mt-1">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setReason('');
              setError(null);
              onClose();
            }}
            disabled={loading}
          >
            {t('stations.modal.cancelBtn', 'Hủy bỏ')}
          </Button>
          <Button
            type="submit"
            variant={confirmTone as any}
            disabled={loading}
            className="px-4"
          >
            {loading ? t('provisioning.submitting', 'Đang xử lý...') : confirmLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
