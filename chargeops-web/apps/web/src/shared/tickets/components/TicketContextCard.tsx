import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Avatar, Card, IconArrowRight, IconPhone, IconPin, IconShield } from '@chargeops/ui';
import { formatDateVn, formatTimeVn, type Ticket } from '@chargeops/api';

export interface TicketContextCardProps {
  ticket: Ticket;
  admin: boolean;
  isPlatformTicket: boolean;
}

export function TicketContextCard({ ticket, admin, isPlatformTicket }: TicketContextCardProps) {
  const { t } = useTranslation('tickets');

  return (
    <Card className="rounded-2xl p-4 shadow-sm">
      <h2 className="mb-3 text-[13px] font-bold text-ink">
        {t('detail.context.title', 'Bối cảnh liên quan')}
      </h2>

      <div className="space-y-3 text-[12.5px]">
        <div>
          <div className="text-[11px] font-medium text-muted">
            {t('detail.context.reporter', 'Người báo cáo')}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <Avatar
              name={ticket.reporterName || ticket.driverName || 'User'}
              size="sm"
              tone="neutral"
            />
            <div className="min-w-0">
              <div className="font-semibold text-ink truncate">
                {ticket.reporterName || ticket.driverName || t('actor.driver', 'Tài xế')}
              </div>
              {ticket.reporterPhone && (
                <div className="flex items-center gap-1 text-[11.5px] text-muted">
                  <IconPhone size={11} /> {ticket.reporterPhone}
                </div>
              )}
            </div>
          </div>
        </div>

        {isPlatformTicket ? (
          <div className="border-t border-hairline pt-2.5">
            <div className="text-[11px] font-medium text-muted">
              {t('detail.context.scope', 'Phạm vi')}
            </div>
            <div className="mt-1 flex items-center gap-1.5 font-medium text-brand">
              <IconShield size={13} className="text-brand shrink-0" />
              <span>{t('detail.context.platformScope', 'Cổng thanh toán & Nền tảng')}</span>
            </div>
          </div>
        ) : (
          <div className="border-t border-hairline pt-2.5">
            <div className="text-[11px] font-medium text-muted">
              {t('detail.context.station', 'Trạm sạc')}
            </div>
            <div className="mt-1 flex items-center gap-1.5 font-medium text-ink">
              <IconPin size={13} className="text-faint shrink-0" />
              <span className="truncate">
                {ticket.stationName || t('detail.context.unknownStation', 'Trạm sạc')}
              </span>
            </div>
          </div>
        )}

        {ticket.bookingId && (
          <div className="border-t border-hairline pt-2.5">
            <div className="text-[11px] font-medium text-muted">
              {t('detail.context.booking', 'Đơn sạc liên kết')}
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="font-mono text-[12px] font-semibold text-brand truncate">
                #{String(ticket.bookingId).slice(0, 12)}
              </span>
              <Link
                to={admin ? `/admin/bookings` : `/owner/bookings`}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-brand hover:underline"
              >
                <span>{t('detail.context.viewBooking', 'Xem đơn')}</span>
                <IconArrowRight size={11} />
              </Link>
            </div>
          </div>
        )}

        <div className="border-t border-hairline pt-2.5">
          <div className="text-[11px] font-medium text-muted">
            {t('detail.context.createdAt', 'Thời điểm khởi tạo')}
          </div>
          <div className="mt-0.5 text-muted">
            {t('detail.context.atTime', '{{date}} lúc {{time}}', {
              date: formatDateVn(ticket.createdAt),
              time: formatTimeVn(ticket.createdAt),
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}
