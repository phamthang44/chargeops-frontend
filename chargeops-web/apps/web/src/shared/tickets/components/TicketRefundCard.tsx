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
              'Khoản hoàn được hạch toán trong Sổ đối chiếu tài chính của Chủ trạm. Simulator tự động hoàn cọc theo chính sách hệ thống.'
            )}
          </p>
          <div className="mt-2.5 space-y-1">
            {ticket.refundIds?.map((refId) => (
              <div key={refId} className="flex items-center justify-between text-[11px] py-1 border-b border-hairline last:border-0">
                <span className="font-mono text-muted">ID: #{refId.slice(0, 14)}...</span>
                <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[10px] font-mono text-faint">
                  {t('detail.refund.ownerLedgerBadge', 'Sổ trạm')}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-[12px] leading-relaxed text-muted">
          {t(
            'detail.refund.policyNotice',
            'Khi xác nhận lỗi thuộc phía trạm (STATION_FAILURE), hệ thống tự động ghi nhận nghĩa vụ hoàn 100% trên Sổ đối chiếu tài chính của trạm sạc.'
          )}
        </p>
      )}
    </Card>
  );
}
