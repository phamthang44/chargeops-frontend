import { useTranslation } from 'react-i18next';
import { Button, IconAlertTriangle, IconClock, Modal } from '@chargeops/ui';

export interface Open247WarningModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function Open247WarningModal({
  open,
  onClose,
  onConfirm,
}: Open247WarningModalProps) {
  const { t } = useTranslation('owner');

  return (
    <Modal open={open} onClose={onClose} maxWidth={520}>
      <div>
        {/* Header */}
        <div className="mb-4 flex items-start gap-3 border-b border-hairline pb-3.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-owner-soft text-owner-deep">
            <IconClock size={20} strokeWidth={2.2} />
          </span>
          <div>
            <div className="text-[17px] font-bold text-ink">
              {t('pricing.open247.title', { defaultValue: 'Kích hoạt chế độ mở cửa liên tục 24/7?' })}
            </div>
            <div className="mt-0.5 text-[12px] leading-relaxed text-muted">
              {t('pricing.open247.subtitle', {
                defaultValue:
                  'Trạm sẽ tiếp nhận lịch sạc xuyên đêm (00:00 – 24:00) cả 7 ngày trong tuần. Vui lòng rà soát các cam kết vận hành dưới đây:',
              })}
            </div>
          </div>
        </div>

        {/* Commitment Checklist */}
        <div className="mb-5 flex flex-col gap-2.5">
          {/* Item 1: Access */}
          <div className="flex items-start gap-3 rounded-[10px] border border-line-2 bg-surface-2 p-3 text-[12px] leading-relaxed">
            <span className="shrink-0 text-base leading-none mt-0.5">🚗</span>
            <div>
              <div className="font-semibold text-ink">
                {t('pricing.open247.item1Title', { defaultValue: 'Lối vào & barie tiếp cận xuyên đêm' })}
              </div>
              <div className="mt-0.5 text-muted">
                {t('pricing.open247.item1Desc', {
                  defaultValue:
                    'Đảm bảo cổng vào bãi xe và khu vực trụ sạc không bị khóa cổng hay rào chắn sau 22:00. Tài xế có thể đặt lịch và tự do tiếp cận vào ban đêm (01:00 – 05:00 sáng).',
                })}
              </div>
            </div>
          </div>

          {/* Item 2: SLA Breach Risk */}
          <div className="flex items-start gap-3 rounded-[10px] border border-warn-border/70 bg-warn-soft/50 p-3 text-[12px] leading-relaxed text-warn-deep">
            <span className="shrink-0 mt-0.5">
              <IconAlertTriangle size={17} className="text-warn shrink-0" />
            </span>
            <div>
              <div className="font-bold text-ink">
                {t('pricing.open247.item2Title', { defaultValue: 'Cam kết khả dụng & Xử lý vi phạm SLA' })}
              </div>
              <div className="mt-0.5 text-muted">
                {t('pricing.open247.item2Desc', {
                  defaultValue:
                    'Nếu tài xế đến sạc theo booking hợp lệ nhưng trạm đóng cửa hoặc không tiếp cận được, trạm sẽ bị tính vi phạm SLA và bồi hoàn điểm uy tín trên sàn ChargeOps.',
                })}
              </div>
            </div>
          </div>

          {/* Item 3: TOU Pricing Recommendation */}
          <div className="flex items-start gap-3 rounded-[10px] border border-line-2 bg-surface-2 p-3 text-[12px] leading-relaxed">
            <span className="shrink-0 text-base leading-none mt-0.5">⚡</span>
            <div>
              <div className="font-semibold text-ink">
                {t('pricing.open247.item3Title', { defaultValue: 'Khuyến nghị biểu giá sạc giờ thấp điểm (TOU)' })}
              </div>
              <div className="mt-0.5 text-muted">
                {t('pricing.open247.item3Desc', {
                  defaultValue:
                    'Khung giờ đêm (22:00 – 04:00) có giá điện lưới EVN rẻ nhất. Bạn nên cấu hình thêm khung giá TOU ca đêm ở Bước 3 để thu hút khách và tối ưu biên lợi nhuận.',
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5">
          <Button variant="secondary" size="md" onClick={onClose}>
            {t('pricing.open247.cancelBtn', { defaultValue: 'Để tôi kiểm tra lại' })}
          </Button>
          <Button
            accent="owner"
            size="md"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {t('pricing.open247.confirmBtn', { defaultValue: 'Tôi hiểu & Bật chế độ 24/7' })}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
