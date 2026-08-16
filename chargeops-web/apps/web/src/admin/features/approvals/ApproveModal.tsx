import { useTranslation } from 'react-i18next';
import { Button, IconCheckCircle, IconInfo, Modal } from '@chargeops/ui';
import type { Station, StationApprovalSummary } from '@chargeops/api';

export interface ApproveModalProps {
  open: boolean;
  station: StationApprovalSummary | Station;
  pending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

/** Confirmation dialog when admin approves a pending station registration. */
export function ApproveModal({
  open,
  station,
  pending,
  onClose,
  onConfirm,
}: ApproveModalProps) {
  const { t } = useTranslation('admin');

  const s = station as any;
  const owner = station.ownerDisplayName || s.ownerName || '—';
  const location =
    s.address ||
    [s.addressLine, s.wardName, station.provinceName || s.city].filter(Boolean).join(', ') ||
    station.provinceName ||
    s.city ||
    '—';
  const chargers = station.plannedChargePointCount ?? s.chargerCount ?? 0;

  return (
    <Modal open={open} onClose={onClose} maxWidth={460}>
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-good-soft text-good">
          <IconCheckCircle size={22} />
        </div>
        <div className="flex-1">
          <div className="text-[17px] font-bold text-ink">
            {t('approveModal.title', { defaultValue: 'Xác nhận duyệt hồ sơ trạm' })}
          </div>
          <div className="mt-0.5 text-[12.5px] text-muted">
            {t('approveModal.subtitle', {
              defaultValue: 'Trạm sẽ được phê duyệt hành chính và cho phép tiếp tục cấu hình trụ sạc.',
            })}
          </div>
        </div>
      </div>

      {/* Station Summary Box */}
      <div className="mt-4 rounded-[10px] border border-line-2 bg-surface-2 p-3 text-[12px]">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-faint">
          {t('approveModal.stationInfoTitle', { defaultValue: 'THÔNG TIN TRẠM SẠC' })}
        </div>
        <div className="flex flex-col gap-1.5 font-medium">
          <div className="flex justify-between">
            <span className="text-muted">{station.name}</span>
            <span className="font-mono font-bold text-brand">{station.stationCode || station.id}</span>
          </div>
          <div className="flex justify-between border-t border-hairline pt-1.5">
            <span className="text-faint">{t('approveModal.ownerLabel', { defaultValue: 'Chủ sở hữu' })}:</span>
            <span className="text-ink">{owner}</span>
          </div>
          <div className="flex justify-between border-t border-hairline pt-1.5">
            <span className="text-faint">{t('approveModal.locationLabel', { defaultValue: 'Địa điểm' })}:</span>
            <span className="max-w-[240px] truncate text-right text-ink">{location}</span>
          </div>
          <div className="flex justify-between border-t border-hairline pt-1.5">
            <span className="text-faint">{t('approveModal.chargersLabel', { defaultValue: 'Số trụ dự kiến' })}:</span>
            <span className="font-semibold text-ink">
              {t('approveModal.chargersVal', { count: chargers, defaultValue: `${chargers} trụ` })}
            </span>
          </div>
        </div>
      </div>

      {/* Info Callout */}
      <div className="mt-3.5 flex items-start gap-2 rounded-[9px] border border-good-border bg-good-soft p-3 text-[12px] leading-relaxed text-good-deep">
        <IconInfo size={16} className="mt-0.5 shrink-0 text-good" />
        <div>
          <div>
            {t('approveModal.noteActive', {
              defaultValue: 'Duyệt hồ sơ xác nhận thông tin hành chính và giấy phép của trạm đã hợp lệ để tiếp tục cấu hình trụ sạc.',
            })}
          </div>
          <div className="mt-1 text-[11px] opacity-90">
            {t('approveModal.licenseCheck', {
              defaultValue: 'Lưu ý: Hệ thống yêu cầu trạm phải có gói Giấy phép (License) hợp lệ trước khi kích hoạt.',
            })}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-5 flex gap-2.5">
        <Button variant="secondary" className="flex-1" onClick={onClose} disabled={pending}>
          {t('approveModal.cancelBtn', { defaultValue: 'Hủy bỏ' })}
        </Button>
        <Button variant="primary" className="flex-1" onClick={onConfirm} disabled={pending}>
          {pending
            ? t('approveModal.processing', { defaultValue: 'Đang duyệt hồ sơ…' })
            : t('approveModal.confirmBtn', { defaultValue: 'Duyệt hồ sơ' })}
        </Button>
      </div>
    </Modal>
  );
}
