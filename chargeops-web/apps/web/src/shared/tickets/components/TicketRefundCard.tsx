import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, IconCheckCircle } from '@chargeops/ui';
import type { Ticket } from '@chargeops/api';

export interface TicketRefundCardProps {
  ticket: Ticket;
  admin: boolean;
  hasRefund: boolean;
}

export function TicketRefundCard({ ticket, admin, hasRefund }: TicketRefundCardProps) {
  const { t } = useTranslation('tickets');

  return (
    <Card className="rounded-2xl p-4 shadow-sm">
      <div className="mb-2 flex items-center gap-1.5 text-[13px] font-bold text-ink">
        <IconCheckCircle size={15} className="text-good-deep" />
        <span>{t('detail.refund.title', 'Chính sách bồi hoàn cọc')}</span>
      </div>

      {hasRefund ? (
        <div className="rounded-xl border border-good-line bg-good-soft/30 p-3 text-[12px]">
          <div className="font-semibold text-good-deep">
            {t('detail.refund.autoGranted', 'Đã có hồ sơ hoàn tiền')}
          </div>
          <p className="mt-1 text-muted leading-relaxed">
            {t(
              'detail.refund.desc',
              'Xem trạng thái từng hồ sơ để biết nghĩa vụ đang chờ hay đã hoàn thành. Kết luận ticket không phải bằng chứng đã chuyển tiền.'
            )}
          </p>
          <div className="mt-2.5 space-y-1">
            {ticket.refundIds?.map((refId) => (
              <div key={refId} className="flex items-center justify-between text-[11px]">
                <span className="font-mono text-muted">#{refId.slice(0, 10)}...</span>
                {admin && (
                  <Link
                    to={`/admin/refunds?search=${refId}`}
                    className="font-medium text-brand hover:underline"
                  >
                    {t('detail.refund.viewDetail', 'Chi tiết hoàn tiền →')}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-[12px] leading-relaxed text-muted">
          {t(
            'detail.refund.policyNotice',
            'Nếu xác nhận lỗi phía trạm, Admin xem xét nghĩa vụ hoàn đủ giá gói theo chính sách. Ghi kết luận không tự chuyển tiền.'
          )}
        </p>
      )}
    </Card>
  );
}
