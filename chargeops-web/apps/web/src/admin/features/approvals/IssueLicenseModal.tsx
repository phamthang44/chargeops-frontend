import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Checkbox, IconInfo, IconShield, Modal } from '@chargeops/ui';
import type { StationApprovalSummary, Station } from '@chargeops/api';

export interface IssueLicenseModalProps {
  open: boolean;
  station: StationApprovalSummary | Station;
  pending: boolean;
  onClose: () => void;
  onConfirm: (data: { plan: 'MONTHLY' | 'YEARLY' }) => void;
}

export function IssueLicenseModal({
  open,
  station,
  pending,
  onClose,
  onConfirm,
}: IssueLicenseModalProps) {
  const { t } = useTranslation('admin');
  const [plan, setPlan] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [verified, setVerified] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const s = station as any;
  const owner = station.ownerDisplayName || s.ownerName || '—';

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
      setError(t('issueLicenseModal.errVerificationRequired', {
        defaultValue: 'Vui lòng xác nhận đã đối chiếu thông tin mua/thanh toán ngoài nền tảng.',
      }));
      return;
    }
    setError(null);
    onConfirm({ plan });
  };

  return (
    <Modal open={open} onClose={handleClose} maxWidth={480}>
      <form onSubmit={handleSubmit}>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
            <IconShield size={22} />
          </div>
          <div className="flex-1">
            <div className="text-[17px] font-bold text-ink">
              {t('issueLicenseModal.title', { defaultValue: 'Ghi nhận & Kích hoạt License' })}
            </div>
            <div className="mt-0.5 text-[12.5px] text-muted">
              {t('issueLicenseModal.subtitle', {
                defaultValue: 'Ghi nhận gói subscription sau khi đã xác minh thông tin mua/thanh toán của chủ trạm ngoài nền tảng.',
              })}
            </div>
          </div>
        </div>

        {/* Station Summary Box */}
        <div className="mt-4 rounded-[10px] border border-line-2 bg-surface-2 p-3 text-[12px]">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-faint">
            {t('issueLicenseModal.stationInfoTitle', { defaultValue: 'THÔNG TIN TRẠM SẠC' })}
          </div>
          <div className="flex flex-col gap-1.5 font-medium">
            <div className="flex justify-between">
              <span className="text-muted">{station.name}</span>
              <span className="font-mono font-bold text-brand">{station.stationCode || station.id}</span>
            </div>
            <div className="flex justify-between border-t border-hairline pt-1.5">
              <span className="text-faint">{t('issueLicenseModal.ownerLabel', { defaultValue: 'Chủ sở hữu' })}:</span>
              <span className="text-ink">{owner}</span>
            </div>
          </div>
        </div>

        {/* Plan Selection */}
        <div className="mt-4 flex flex-col gap-2">
          <label className="text-[11.5px] font-semibold uppercase tracking-wide text-faint">
            {t('issueLicenseModal.planLabel', { defaultValue: 'Gói subscription' })} <span className="text-bad">*</span>
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
                <span className="text-[13px] font-bold">
                  {t('issueLicenseModal.planMonthly', { defaultValue: 'Gói Tháng' })}
                </span>
                <span className="font-mono text-[11px] font-semibold text-faint">500k/tháng</span>
              </div>
              <span className="mt-0.5 text-[11px] text-muted">
                {t('issueLicenseModal.planMonthlyDesc', { defaultValue: 'Hiệu lực 1 tháng lịch' })}
              </span>
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
                <span className="text-[13px] font-bold">
                  {t('issueLicenseModal.planYearly', { defaultValue: 'Gói Năm' })}
                </span>
                <span className="rounded bg-good-soft px-1.5 py-0.2 text-[10px] font-bold text-good-deep">
                  -16.7% (Tiết kiệm 1tr)
                </span>
              </div>
              <span className="mt-0.5 text-[11px] text-muted">
                {t('issueLicenseModal.planYearlyDesc', { defaultValue: 'Hiệu lực 1 năm lịch · 5.000.000đ' })}
              </span>
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

        {/* Info Callout */}
        <div className="mt-3.5 flex items-start gap-2 rounded-[9px] border border-brand-border bg-brand-soft/30 p-3 text-[12px] leading-relaxed text-ink">
          <IconInfo size={16} className="mt-0.5 shrink-0 text-brand" />
          <div>
            <div>
              {t('issueLicenseModal.noticeImmediate', {
                defaultValue: 'License sẽ có hiệu lực ngay sau khi kích hoạt và chuyển sang trạng thái ACTIVE.',
              })}
            </div>
            <div className="mt-1 text-[11px] text-muted">
              {t('issueLicenseModal.noticeApproveReady', {
                defaultValue: 'Sau khi kích hoạt license thành công, hồ sơ trạm sẽ đủ điều kiện để phê duyệt.',
              })}
            </div>
          </div>
        </div>

        {/* Verification Checkbox */}
        <div className="mt-3.5 rounded-[9px] border border-line-2 bg-surface-2 p-3">
          <Checkbox
            checked={verified}
            onChange={(checked) => {
              setVerified(checked);
              if (checked) setError(null);
            }}
            accent="brand"
          >
            {t('issueLicenseModal.verificationCheckbox', {
              defaultValue: 'Tôi đã đối chiếu và xác nhận thông tin mua/thanh toán gói License của chủ trạm ngoài nền tảng.',
            })}
          </Checkbox>
          {error && !verified && (
            <div className="mt-1.5 text-[11.5px] font-medium text-bad">{error}</div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-5 flex gap-2.5">
          <Button variant="secondary" className="flex-1" onClick={handleClose} disabled={pending}>
            {t('issueLicenseModal.cancelBtn', { defaultValue: 'Hủy bỏ' })}
          </Button>
          <Button variant="primary" className="flex-1" type="submit" disabled={pending}>
            {pending
              ? t('issueLicenseModal.processing', { defaultValue: 'Đang ghi nhận…' })
              : t('issueLicenseModal.confirmBtn', { defaultValue: 'Xác nhận & kích hoạt' })}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
