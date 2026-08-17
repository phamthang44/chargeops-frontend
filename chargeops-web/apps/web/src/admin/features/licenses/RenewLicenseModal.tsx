import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, IconClock, IconInfo, Modal } from '@chargeops/ui';
import { formatDateVn, type License } from '@chargeops/api';

export interface RenewLicenseModalProps {
  open: boolean;
  license: License | null;
  pending: boolean;
  onClose: () => void;
  onConfirm: (data: { stationId: string; plan: 'MONTHLY' | 'YEARLY'; feeAmount: number }) => void;
}

export function RenewLicenseModal({
  open,
  license,
  pending,
  onClose,
  onConfirm,
}: RenewLicenseModalProps) {
  const { t } = useTranslation('admin');
  const [plan, setPlan] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [verified, setVerified] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!license) return null;

  const currentExpiry = license.expiresAt || license.expiryDate;
  const isCurrentlyActive = license.status === 'ACTIVE' || license.status === 'active';
  const effectiveStartPreview = isCurrentlyActive && currentExpiry ? formatDateVn(currentExpiry) : 'Ngay sau khi xác nhận';

  const handlePlanChange = (newPlan: 'MONTHLY' | 'YEARLY') => {
    setPlan(newPlan);
  };

  const handleClose = () => {
    setError(null);
    setVerified(false);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verified) {
      setError('Vui lòng xác nhận đã đối chiếu thông tin gia hạn ngoài nền tảng.');
      return;
    }
    const fee = plan === 'YEARLY' ? 5000000 : 500000;
    setError(null);
    onConfirm({ stationId: license.stationId, plan, feeAmount: fee });
  };

  return (
    <Modal open={open} onClose={handleClose} maxWidth={480}>
      <form onSubmit={handleSubmit}>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
            <IconClock size={22} />
          </div>
          <div className="flex-1">
            <div className="text-[17px] font-bold text-ink">
              {t('renewModal.title', { defaultValue: 'Ghi nhận gia hạn License' })}
            </div>
            <div className="mt-0.5 text-[12.5px] text-muted">
              {t('renewModal.subtitle', {
                defaultValue: 'Tạo một kỳ hạn License mới sau khi xác minh thanh toán gia hạn ngoài nền tảng.',
              })}
            </div>
          </div>
        </div>

        {/* Current License Details Box (Read-only) */}
        <div className="mt-4 rounded-[10px] border border-line-2 bg-surface-2 p-3 text-[12px]">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-faint">
            {t('renewModal.currentInfoTitle', { defaultValue: 'THÔNG TIN LICENSE HIỆN TẠI' })}
          </div>
          <div className="flex flex-col gap-1.5 font-medium">
            <div className="flex justify-between">
              <span className="text-muted">Mã License:</span>
              <span className="font-mono text-ink">{license.id}</span>
            </div>
            <div className="flex justify-between border-t border-hairline pt-1.5">
              <span className="text-muted">Trạm sạc:</span>
              <span className="font-semibold text-ink">{license.stationName || license.stationId}</span>
            </div>
            <div className="flex justify-between border-t border-hairline pt-1.5">
              <span className="text-faint">Chủ sở hữu:</span>
              <span className="text-ink">{license.ownerName || '—'}</span>
            </div>
            <div className="flex justify-between border-t border-hairline pt-1.5">
              <span className="text-faint">Hạn hiện tại:</span>
              <span className="font-semibold text-warn-deep">{currentExpiry ? formatDateVn(currentExpiry) : '—'}</span>
            </div>
          </div>
        </div>

        {/* Plan Selection */}
        <div className="mt-4 flex flex-col gap-2">
          <label className="text-[11.5px] font-semibold uppercase tracking-wide text-faint">
            {t('renewModal.planLabel', { defaultValue: 'Gói gia hạn mới' })} <span className="text-bad">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => handlePlanChange('MONTHLY')}
              className={`flex flex-col items-start rounded-[9px] border p-3 text-left transition-all ${
                plan === 'MONTHLY'
                  ? 'border-brand bg-brand-soft/20 text-brand'
                  : 'border-line bg-surface-2 text-body hover:border-line-2'
              }`}
            >
              <div className="flex w-full items-center justify-between">
                <span className="text-[13px] font-bold">Gói Tháng</span>
                <span className="font-mono text-[11px] font-semibold text-faint">500k/tháng</span>
              </div>
              <span className="mt-0.5 text-[11px] text-muted">Hiệu lực 1 tháng lịch</span>
            </button>
            <button
              type="button"
              onClick={() => handlePlanChange('YEARLY')}
              className={`flex flex-col items-start rounded-[9px] border p-3 text-left transition-all ${
                plan === 'YEARLY'
                  ? 'border-brand bg-brand-soft/20 text-brand'
                  : 'border-line bg-surface-2 text-body hover:border-line-2'
              }`}
            >
              <div className="flex w-full items-center justify-between">
                <span className="text-[13px] font-bold">Gói Năm</span>
                <span className="rounded bg-good-soft px-1.5 py-0.2 text-[10px] font-bold text-good-deep">
                  -16.7% (Tiết kiệm 1tr)
                </span>
              </div>
              <span className="mt-0.5 text-[11px] text-muted">Hiệu lực 1 năm lịch · 5.000.000đ</span>
            </button>
          </div>
        </div>

        {/* Standard Fee Summary Box */}
        <div className="mt-3.5 flex items-center justify-between rounded-[9px] border border-line-2 bg-surface-2 p-3 text-[12.5px]">
          <span className="text-muted font-medium">Mức phí niêm yết theo gói:</span>
          <span className="font-mono font-bold text-ink text-[14px]">
            {plan === 'YEARLY' ? '5.000.000 đ' : '500.000 đ'}
          </span>
        </div>

        {/* Effective Start Notice */}
        <div className="mt-3.5 flex items-start gap-2 rounded-[9px] border border-brand-border bg-brand-soft/30 p-3 text-[12px] leading-relaxed text-ink">
          <IconInfo size={16} className="mt-0.5 shrink-0 text-brand" />
          <div>
            <div>
              <span className="font-semibold">Thời điểm bắt đầu hiệu lực mới: </span>
              <span className="font-bold text-brand-strong">{effectiveStartPreview}</span>
            </div>
            <div className="mt-1 text-[11px] text-muted">
              Thao tác tạo một License row mới trong lịch sử; không chỉnh sửa trực tiếp License hiện tại.
            </div>
          </div>
        </div>

        {/* Verification Checkbox */}
        <div className="mt-3.5 rounded-[9px] border border-line-2 bg-surface-2 p-3">
          <label className="flex cursor-pointer items-start gap-2.5">
            <input
              type="checkbox"
              checked={verified}
              onChange={(e) => {
                setVerified(e.target.checked);
                if (e.target.checked) setError(null);
              }}
              className="mt-0.5 h-4 w-4 rounded border-line text-brand focus:ring-brand"
            />
            <span className="text-[12px] leading-snug font-medium text-ink">
              Tôi đã đối chiếu và xác nhận thông tin mua/thanh toán gia hạn gói License của chủ trạm ngoài nền tảng.
            </span>
          </label>
          {error && !verified && (
            <div className="mt-1.5 text-[11.5px] font-medium text-bad">{error}</div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-5 flex gap-2.5">
          <Button variant="secondary" className="flex-1" onClick={handleClose} disabled={pending}>
            {t('renewModal.cancelBtn', { defaultValue: 'Hủy bỏ' })}
          </Button>
          <Button variant="primary" className="flex-1" type="submit" disabled={pending}>
            {pending
              ? t('renewModal.processing', { defaultValue: 'Đang ghi nhận…' })
              : t('renewModal.confirmBtn', { defaultValue: 'Xác nhận ghi nhận gia hạn' })}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
