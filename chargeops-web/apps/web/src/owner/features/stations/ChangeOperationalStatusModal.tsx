import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Button,
  IconAlertTriangle,
  IconCheck,
  IconClock,
  Modal,
  useToast,
} from '@chargeops/ui';
import {
  useApi,
  type Station,
  type StationOperationalStatus,
} from '@chargeops/api';
import { getApiErrorMessage } from '../../../i18n';

export interface ChangeOperationalStatusModalProps {
  open: boolean;
  station: Station | null;
  onClose: () => void;
  onSuccess?: () => void;
}

const QUICK_REASONS = [
  'Sự cố mất điện lưới khu vực',
  'Bảo trì định kỳ tủ trạm biến áp',
  'Sửa chữa nâng cấp mặt bằng bãi xe',
  'Kiểm định kỹ thuật an toàn điện',
  'Tạm dừng theo yêu cầu ban quản lý tòa nhà',
];

export function ChangeOperationalStatusModal({
  open,
  station,
  onClose,
  onSuccess,
}: ChangeOperationalStatusModalProps) {
  const { t } = useTranslation(['owner', 'common']);
  const api = useApi();
  const qc = useQueryClient();
  const toast = useToast();

  const currentStatus: StationOperationalStatus = station?.operationalStatus || 'OPERATING';
  const [selectedStatus, setSelectedStatus] = useState<StationOperationalStatus>(currentStatus);
  const [reason, setReason] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Sync state on open
  useEffect(() => {
    if (open && station) {
      const initStatus = station.operationalStatus || 'OPERATING';
      setSelectedStatus(initStatus);
      setReason(station.operationalStatusReason || '');
      setValidationError(null);
    }
  }, [open, station]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!station?.id) throw new Error('Không tìm thấy thông tin trạm');
      return api.stations.changeOperationalStatus(station.id, {
        operationalStatus: selectedStatus,
        reason: selectedStatus === 'OPERATING' ? undefined : reason.trim(),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stations'] });
      qc.invalidateQueries({ queryKey: ['owner-station'] });
      qc.invalidateQueries({ queryKey: ['admin', 'stations'] });
      toast(
        t('stations.operationalModal.successToast', {
          defaultValue: 'Cập nhật trạng thái vận hành trạm thành công.',
        }),
        'success',
      );
      onSuccess?.();
      onClose();
    },
    onError: (err) => {
      toast(getApiErrorMessage(err), 'error');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStatus !== 'OPERATING' && (!reason || reason.trim().length < 3)) {
      setValidationError(
        t('stations.operationalModal.reasonRequired', {
          defaultValue: 'Vui lòng nhập lý do tạm dừng hoặc bảo trì (tối thiểu 3 ký tự).',
        }),
      );
      return;
    }
    setValidationError(null);
    mutation.mutate();
  };

  if (!station) return null;

  return (
    <Modal open={open} onClose={onClose} maxWidth={520}>
      <form onSubmit={handleSubmit}>
        {/* Header */}
        <div className="mb-4 flex items-start gap-3 border-b border-hairline pb-3.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-owner-soft text-owner-deep">
            <IconClock size={20} strokeWidth={2.2} />
          </span>
          <div>
            <div className="text-[16px] font-bold text-ink">
              {t('stations.operationalModal.title', {
                defaultValue: 'Điều khiển trạng thái vận hành trạm',
              })}
            </div>
            <div className="mt-0.5 text-[12px] text-muted">
              {station.name} · <span className="font-mono">{station.stationCode || station.id}</span>
            </div>
          </div>
        </div>

        {/* Status Option Cards */}
        <div className="mb-4 flex flex-col gap-2.5">
          {/* Option 1: OPERATING */}
          <div
            onClick={() => {
              setSelectedStatus('OPERATING');
              setValidationError(null);
            }}
            className={`flex items-start gap-3 rounded-[10px] border p-3 cursor-pointer transition-all ${
              selectedStatus === 'OPERATING'
                ? 'border-emerald-500/70 bg-emerald-500/5 ring-1 ring-emerald-500/20'
                : 'border-line-2 bg-surface hover:bg-surface-2'
            }`}
          >
            <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-line-3">
              {selectedStatus === 'OPERATING' && <span className="h-2 w-2 rounded-full bg-emerald-500" />}
            </span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-bold text-ink">
                  {t('stations.operationalStatus.OPERATING', { defaultValue: 'Đang vận hành (Tiếp nhận khách)' })}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.2 text-[10.5px] font-bold text-emerald-600 border border-emerald-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Chuẩn
                </span>
              </div>
              <div className="mt-0.5 text-[11.5px] leading-relaxed text-muted">
                {t('stations.operationalModal.operatingDesc', {
                  defaultValue: 'Trạm mở cửa đón tài xế và nhận booking theo đúng khung giờ hoạt động đã cấu hình.',
                })}
              </div>
            </div>
          </div>

          {/* Option 2: PAUSED */}
          <div
            onClick={() => {
              setSelectedStatus('PAUSED');
              setValidationError(null);
            }}
            className={`flex items-start gap-3 rounded-[10px] border p-3 cursor-pointer transition-all ${
              selectedStatus === 'PAUSED'
                ? 'border-rose-500/70 bg-rose-500/5 ring-1 ring-rose-500/20'
                : 'border-line-2 bg-surface hover:bg-surface-2'
            }`}
          >
            <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-line-3">
              {selectedStatus === 'PAUSED' && <span className="h-2 w-2 rounded-full bg-rose-500" />}
            </span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-bold text-ink">
                  {t('stations.operationalStatus.PAUSED', { defaultValue: 'Tạm dừng đón khách (Paused)' })}
                </span>
                <span className="inline-flex items-center rounded-full bg-rose-500/10 px-2 py-0.2 text-[10.5px] font-bold text-rose-600 border border-rose-500/20">
                  Chủ động ngưng
                </span>
              </div>
              <div className="mt-0.5 text-[11.5px] leading-relaxed text-muted">
                {t('stations.operationalModal.pausedDesc', {
                  defaultValue: 'Tạm ngừng tiếp nhận booking mới. Các xe đang sạc hoặc đã đặt trước vẫn được bảo đảm quyền lợi.',
                })}
              </div>
            </div>
          </div>

          {/* Option 3: MAINTENANCE */}
          <div
            onClick={() => {
              setSelectedStatus('MAINTENANCE');
              setValidationError(null);
            }}
            className={`flex items-start gap-3 rounded-[10px] border p-3 cursor-pointer transition-all ${
              selectedStatus === 'MAINTENANCE'
                ? 'border-amber-500/70 bg-amber-500/5 ring-1 ring-amber-500/20'
                : 'border-line-2 bg-surface hover:bg-surface-2'
            }`}
          >
            <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-line-3">
              {selectedStatus === 'MAINTENANCE' && <span className="h-2 w-2 rounded-full bg-amber-500" />}
            </span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-bold text-ink">
                  {t('stations.operationalStatus.MAINTENANCE', { defaultValue: 'Đang bảo trì trạm (Maintenance)' })}
                </span>
                <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.2 text-[10.5px] font-bold text-amber-600 border border-amber-500/20">
                  Kỹ thuật
                </span>
              </div>
              <div className="mt-0.5 text-[11.5px] leading-relaxed text-muted">
                {t('stations.operationalModal.maintenanceDesc', {
                  defaultValue: 'Đang sửa chữa trụ sạc, bảo dưỡng điện lực hoặc nâng cấp cơ sở vật chất.',
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Reason Input when PAUSED or MAINTENANCE */}
        {selectedStatus !== 'OPERATING' && (
          <div className="mb-4 flex flex-col gap-2 rounded-[10px] border border-line-2 bg-surface-2/60 p-3">
            <div className="flex items-center justify-between">
              <label className="text-[12px] font-bold text-ink">
                {t('stations.operationalModal.reasonLabel', { defaultValue: 'Lý do thay đổi trạng thái (Bắt buộc):' })}
              </label>
              <span className="text-[11px] text-faint">{reason.length}/500</span>
            </div>

            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value.slice(0, 500));
                if (validationError) setValidationError(null);
              }}
              rows={3}
              placeholder={t('stations.operationalModal.reasonPlaceholder', {
                defaultValue: 'Nhập rõ nguyên nhân để hệ thống hiển thị thông báo chính xác cho tài xế…',
              })}
              className="w-full rounded-[8px] border border-line bg-surface p-2 text-[12.5px] text-ink placeholder:text-faint focus:border-owner focus:outline-none"
            />

            {/* Quick Reason Suggestions */}
            <div>
              <div className="mb-1 text-[11px] font-medium text-faint">
                {t('stations.operationalModal.quickSuggestions', { defaultValue: 'Gợi ý lý do nhanh:' })}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_REASONS.map((qr) => (
                  <button
                    key={qr}
                    type="button"
                    onClick={() => {
                      setReason(qr);
                      if (validationError) setValidationError(null);
                    }}
                    className="rounded-full border border-line bg-surface px-2 py-0.5 text-[11px] text-body transition hover:border-line-hover hover:bg-surface-2 cursor-pointer"
                  >
                    + {qr}
                  </button>
                ))}
              </div>
            </div>

            {validationError && (
              <div className="text-[11.5px] font-semibold text-rose-600">
                ⚠️ {validationError}
              </div>
            )}
          </div>
        )}

        {/* Reassurance Callout */}
        {selectedStatus === 'OPERATING' ? (
          <div className="mb-5 flex items-start gap-2 rounded-[9px] border border-emerald-500/20 bg-emerald-500/10 p-2.5 text-[11.5px] leading-relaxed text-emerald-800">
            <span className="shrink-0 text-emerald-600 font-bold">✓</span>
            <div>
              {t('stations.operationalModal.operatingNotice', {
                defaultValue:
                  'Khi chuyển sang "Đang vận hành", trạm sẽ lập tức sẵn sàng nhận lịch đặt của tài xế (yêu cầu trạm đã được duyệt, license còn hạn và đã lưu giờ mở cửa).',
              })}
            </div>
          </div>
        ) : (
          <div className="mb-5 flex items-start gap-2 rounded-[9px] border border-warn-border/60 bg-warn-soft/50 p-2.5 text-[11.5px] leading-relaxed text-warn-deep">
            <IconAlertTriangle size={15} className="text-warn shrink-0 mt-0.5" />
            <div>
              {t('stations.operationalModal.pausedNotice', {
                defaultValue:
                  'Tài xế sẽ nhìn thấy lý do tạm dừng trên ứng dụng di động. Trạm sẽ tạm thời không nhận thêm lượt sạc mới cho đến khi bạn mở lại.',
              })}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 border-t border-hairline pt-3.5">
          <Button variant="ghost" size="sm" type="button" onClick={onClose} disabled={mutation.isPending}>
            {t('common:cancel', { defaultValue: 'Hủy bỏ' })}
          </Button>
          <Button
            accent="owner"
            size="sm"
            type="submit"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              t('common:saving', { defaultValue: 'Đang lưu…' })
            ) : (
              <span className="flex items-center gap-1.5">
                <IconCheck size={14} strokeWidth={2.4} />
                <span>{t('common:save', { defaultValue: 'Lưu thay đổi' })}</span>
              </span>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
