import { useTranslation } from 'react-i18next';
import { Card, IconClock, IconShield } from '@chargeops/ui';
import type { Ticket } from '@chargeops/api';

export interface PlatformDirectGuideCardProps {
  ticket: Ticket;
}

export function PlatformDirectGuideCard({ ticket }: PlatformDirectGuideCardProps) {
  const { t } = useTranslation('tickets');

  return (
    <Card className="rounded-2xl border border-brand-line/50 bg-surface p-4 shadow-xs space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-hairline pb-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-soft text-brand-deep">
            <IconShield size={14} />
          </div>
          <h2 className="text-[13px] font-bold text-ink">
            {t('platformQueue.guideTitle', 'Quy trình Chuyên viên Nền tảng')}
          </h2>
        </div>
        <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-bold text-brand-deep border border-brand-line">
          {t('platformQueue.guideBadge', 'Chuẩn SOP')}
        </span>
      </div>

      {/* Scope Explanation */}
      <p className="text-[12px] leading-relaxed text-muted">
        {t(
          'platformQueue.guideDesc',
          'Phiếu xử lý sự cố cấp Nền tảng & Cổng thanh toán (không gắn với trụ sạc hoặc thiết bị phần cứng tại trạm).'
        )}
      </p>

      {/* Recommended Workflow Steps */}
      <div className="space-y-2 rounded-xl bg-surface-2 p-3 text-[11.5px] border border-hairline">
        <div className="flex items-start gap-2">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand font-bold text-[10.5px] mt-0.5">
            1
          </span>
          <div className="leading-relaxed">
            <span className="font-semibold text-ink">
              {t('platformQueue.step1Title', 'Xác minh & Phản hồi:')}{' '}
            </span>
            <span className="text-muted">
              {t('platformQueue.step1Desc', 'Trao đổi qua luồng tin nhắn để thu thập mã giao dịch hoặc thông tin tài khoản người dùng.')}
            </span>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand font-bold text-[10.5px] mt-0.5">
            2
          </span>
          <div className="leading-relaxed">
            <span className="font-semibold text-ink">
              {t('platformQueue.step2Title', 'Điều chuyển chuyên trách:')}{' '}
            </span>
            <span className="text-muted">
              {t('platformQueue.step2Desc', 'Điều chuyển cho chuyên viên backend hoặc tài chính nếu cần thẩm tra sâu hơn.')}
            </span>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand font-bold text-[10.5px] mt-0.5">
            3
          </span>
          <div className="leading-relaxed">
            <span className="font-semibold text-ink">
              {t('platformQueue.step3Title', 'Đánh dấu Giải quyết:')}{' '}
            </span>
            <span className="text-muted">
              {t('platformQueue.step3Desc', 'Bấm nút "Đánh dấu Đã giải quyết" ở trên cùng để gửi giải pháp và kích hoạt chu kỳ 10 ngày tự đóng.')}
            </span>
          </div>
        </div>
      </div>

      {/* SLA / Auto-close Policy Note */}
      <div className="flex items-start gap-2 rounded-xl bg-canvas/80 p-2.5 text-[11px] text-faint">
        <IconClock size={13} className="shrink-0 mt-0.5 text-muted" />
        <p className="leading-relaxed">
          {t(
            'platformQueue.slaNote',
            'Sau khi đánh dấu giải quyết, người báo cáo có 10 ngày phản hồi trước khi phiếu được lưu trữ vĩnh viễn.'
          )}
        </p>
      </div>
    </Card>
  );
}
