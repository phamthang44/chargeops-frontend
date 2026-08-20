import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, FormField, IconAlertTriangle, IconInfo, Modal } from '@chargeops/ui';
import { formatDateVn, type License } from '@chargeops/api';

export type LicenseActionType = 'suspend' | 'activate' | 'cancel';

export interface LicenseActionModalProps {
  open: boolean;
  type: LicenseActionType | null;
  license: License | null;
  pending: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
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
  const [reason, setReason] = useState('');
  const [err, setErr] = useState(false);

  // Reset reason and error state whenever modal opens or type/license changes
  useEffect(() => {
    if (open) {
      setReason('');
      setErr(false);
    }
  }, [open, type, license?.id]);

  if (!type || !license) return null;

  const expiry = license.expiresAt || license.expiryDate;
  const displayCode = license.licenseCode || license.id;
  const stationLabel = license.stationName || license.stationCode || license.stationId;

  const config = {
    suspend: {
      title: 'Tạm ngưng License',
      subtitle: `Tạm ngưng quyền vận hành của License ${displayCode} thuộc trạm ${stationLabel}.`,
      notice:
        'Lưu ý: Thời hạn gói License vẫn tiếp tục trôi trong thời gian tạm ngưng. Trạm sạc sẽ tạm thời bị ẩn khỏi ứng dụng tài xế và ngưng nhận đơn đặt chỗ mới. Các phiên sạc đang diễn ra và lịch đặt chỗ đã thanh toán trước đó vẫn tiếp tục hoàn thành bình thường.',
      confirmBtn: 'Xác nhận tạm ngưng',
      confirmVariant: 'danger' as const,
      tone: 'warn' as const,
      presets: [
        { key: 'safety', defaultText: 'Vi phạm quy chuẩn an toàn vận hành trạm sạc' },
        { key: 'compliance', defaultText: 'Chờ bổ sung/xác minh hồ sơ pháp lý và kiểm định an toàn' },
        { key: 'authority', defaultText: 'Yêu cầu tạm dừng từ cơ quan chức năng/chính quyền địa phương' },
        { key: 'ownerRequest', defaultText: 'Chủ trạm chủ động yêu cầu tạm ngưng quyền kinh doanh' },
        { key: 'dispute', defaultText: 'Tranh chấp quyền khai thác mặt bằng hoặc vi phạm thỏa thuận dịch vụ' },
      ],
    },
    activate: {
      title: 'Kích hoạt lại License',
      subtitle: `Khôi phục trạng thái hoạt động cho License ${displayCode} thuộc trạm ${stationLabel}.`,
      notice: `Thời hạn của gói tiếp tục có hiệu lực đến ${expiry ? formatDateVn(expiry) : 'hết hạn theo quy định'}. Trạm sẽ tự động hiển thị lại cho tài xế tìm kiếm và đặt chỗ nếu trạm đang ở trạng thái Hoạt động.`,
      confirmBtn: 'Xác nhận kích hoạt lại',
      confirmVariant: 'primary' as const,
      tone: 'good' as const,
      presets: [
        { key: 'safetyFixed', defaultText: 'Trạm đã khắc phục xong vi phạm và vượt qua kiểm định an toàn' },
        { key: 'complianceCompleted', defaultText: 'Đã bổ sung đầy đủ hồ sơ pháp lý và giấy phép liên quan' },
        { key: 'authorityApproved', defaultText: 'Cơ quan chức năng đã cho phép trạm hoạt động trở lại' },
        { key: 'ownerReopen', defaultText: 'Chủ trạm hoàn tất xử lý và đề nghị khôi phục quyền kinh doanh' },
      ],
    },
    cancel: {
      title: 'Hủy bỏ License (Không thể hoàn tác)',
      subtitle: `Chấm dứt hoàn toàn hiệu lực của License ${displayCode} thuộc trạm ${stationLabel}.`,
      notice:
        'CẢNH BÁO: Đây là thao tác vĩnh viễn (Terminal Action). License này sẽ không thể khôi phục lại. Trạm sẽ ngưng nhận đơn đặt chỗ mới ngay lập tức. Các phiên sạc đã thanh toán trước đó vẫn được bảo toàn.',
      confirmBtn: 'Xác nhận hủy License',
      confirmVariant: 'danger' as const,
      tone: 'bad' as const,
      presets: [
        { key: 'contractTerminated', defaultText: 'Chủ trạm chấm dứt hợp đồng hợp tác vận hành ChargeOps' },
        { key: 'siteClosed', defaultText: 'Trạm dừng hoạt động vĩnh viễn do giải tỏa/thu hồi mặt bằng' },
        { key: 'severeViolation', defaultText: 'Vi phạm nghiêm trọng chính sách không thể khắc phục' },
      ],
    },
  }[type];

  const handleClose = () => {
    setReason('');
    setErr(false);
    onClose();
  };

  const handleSelectPreset = (presetText: string) => {
    setReason(presetText);
    setErr(false);
  };

  const handleSubmit = () => {
    const trimmed = reason.trim();
    if (!trimmed || trimmed.length < 5) {
      setErr(true);
      return;
    }
    onConfirm(trimmed);
  };

  return (
    <Modal open={open} onClose={handleClose} maxWidth={500}>
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

      {/* Preset Suggestions & Reason Input */}
      <div className="mt-4 flex flex-col gap-2">
        <div className="text-[11.5px] font-medium text-muted">
          {t('licenses.actionModal.presetSuggestions', 'Gợi ý lý do chuẩn theo thẩm quyền vận hành:')}
        </div>

        {/* Preset Quick Chips */}
        <div className="flex flex-wrap gap-1.5">
          {config.presets.map((p) => {
            const translatedText = t(`licenses.actionModal.presets.${type}.${p.key}`, p.defaultText);
            const isSelected = reason === translatedText;
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => handleSelectPreset(translatedText)}
                className={`rounded-full border px-2.5 py-1 text-[11.5px] transition text-left ${
                  isSelected
                    ? 'border-brand bg-brand-soft font-semibold text-brand ring-1 ring-brand'
                    : 'border-line bg-surface text-body hover:border-brand/40 hover:bg-surface-2'
                }`}
              >
                + {translatedText}
              </button>
            );
          })}
        </div>

        {/* Textarea Input */}
        <div className="mt-1">
          <FormField
            label={t('licenses.actionModal.reasonLabel', 'Lý do thao tác (Bắt buộc)')}
            error={err}
            hint={
              err
                ? t(
                    'licenses.actionModal.reasonRequired',
                    'Vui lòng nhập lý do thực hiện thao tác này (tối thiểu 5 ký tự).'
                  )
                : undefined
            }
          >
            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (err && e.target.value.trim().length >= 5) {
                  setErr(false);
                }
              }}
              placeholder={t(
                'licenses.actionModal.reasonPlaceholder',
                'Nhập lý do chi tiết hoặc chọn nhanh từ các gợi ý bên trên…'
              )}
              className={`h-[76px] w-full resize-none rounded-[9px] border px-3 py-2 text-[12.5px] leading-relaxed transition ${
                err ? 'border-bad bg-bad-soft/10 ring-1 ring-bad' : 'border-line bg-surface focus:border-brand'
              }`}
            />
          </FormField>
        </div>
      </div>

      <div className="mt-5 flex gap-2.5">
        <Button variant="secondary" className="flex-1" onClick={handleClose} disabled={pending}>
          Hủy bỏ
        </Button>
        <Button
          variant={config.confirmVariant}
          className="flex-1"
          onClick={handleSubmit}
          disabled={pending}
        >
          {pending ? 'Đang xử lý…' : config.confirmBtn}
        </Button>
      </div>
    </Modal>
  );
}
