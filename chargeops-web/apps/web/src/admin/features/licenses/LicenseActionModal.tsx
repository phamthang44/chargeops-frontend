import { useTranslation } from 'react-i18next';
import { Button, IconAlertTriangle, IconInfo, Modal } from '@chargeops/ui';
import { formatDateVn, type License } from '@chargeops/api';

export type LicenseActionType = 'suspend' | 'activate' | 'cancel';

export interface LicenseActionModalProps {
  open: boolean;
  type: LicenseActionType | null;
  license: License | null;
  pending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function LicenseActionModal({
  open,
  type,
  license,
  pending,
  onClose,
  onConfirm,
}: LicenseActionModalProps) {
  const { t } = useTranslation('admin');

  if (!type || !license) return null;

  const expiry = license.expiresAt || license.expiryDate;

  const config = {
    suspend: {
      title: 'Tạm ngưng License',
      subtitle: `Tạm ngưng quyền vận hành của License ${license.id} thuộc trạm ${license.stationName || license.stationId}.`,
      notice: 'Lưu ý: Thời hạn hiệu lực của License vẫn tiếp tục chạy trong thời gian tạm ngưng. Trạm sạc sẽ tạm thời mất license gate.',
      confirmBtn: 'Xác nhận tạm ngưng',
      confirmVariant: 'danger' as const,
      tone: 'warn' as const,
    },
    activate: {
      title: 'Kích hoạt lại License',
      subtitle: `Khôi phục trạng thái hoạt động cho License ${license.id} thuộc trạm ${license.stationName || license.stationId}.`,
      notice: `Thời hạn của gói tiếp tục có hiệu lực đến ${expiry ? formatDateVn(expiry) : 'hết hạn theo quy định'}.`,
      confirmBtn: 'Xác nhận kích hoạt lại',
      confirmVariant: 'primary' as const,
      tone: 'good' as const,
    },
    cancel: {
      title: 'Hủy bỏ License (Không thể hoàn tác)',
      subtitle: `Chấm dứt hoàn toàn hiệu lực của License ${license.id} thuộc trạm ${license.stationName || license.stationId}.`,
      notice: 'CẢNH BÁO: Đây là thao tác vĩnh viễn (Terminal Action) và không thể khôi phục lại gói này. Nếu muốn sử dụng lại, cần ghi nhận một subscription mới.',
      confirmBtn: 'Xác nhận hủy License',
      confirmVariant: 'danger' as const,
      tone: 'bad' as const,
    },
  }[type];

  return (
    <Modal open={open} onClose={onClose} maxWidth={440}>
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
            config.tone === 'bad'
              ? 'bg-bad-soft text-bad'
              : config.tone === 'warn'
                ? 'bg-warn-soft text-warn'
                : 'bg-good-soft text-good'
          }`}
        >
          {config.tone === 'bad' ? <IconAlertTriangle size={22} /> : <IconInfo size={22} />}
        </div>
        <div className="flex-1">
          <div className="text-[17px] font-bold text-ink">{config.title}</div>
          <div className="mt-0.5 text-[12.5px] text-muted">{config.subtitle}</div>
        </div>
      </div>

      <div
        className={`mt-4 rounded-[9px] border p-3 text-[12px] leading-relaxed ${
          config.tone === 'bad'
            ? 'border-bad-border bg-bad-soft/40 text-bad-deep font-medium'
            : config.tone === 'warn'
              ? 'border-warn-border bg-warn-soft/40 text-warn-deep'
              : 'border-good-border bg-good-soft/40 text-good-deep'
        }`}
      >
        {config.notice}
      </div>

      <div className="mt-5 flex gap-2.5">
        <Button variant="secondary" className="flex-1" onClick={onClose} disabled={pending}>
          Hủy bỏ
        </Button>
        <Button variant={config.confirmVariant} className="flex-1" onClick={onConfirm} disabled={pending}>
          {pending ? 'Đang xử lý…' : config.confirmBtn}
        </Button>
      </div>
    </Modal>
  );
}
