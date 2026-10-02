import { useTranslation } from 'react-i18next';
import {
  Card,
  IconCalendar,
  IconCheckCircle,
  IconPin,
  IconShield,
  IconShieldAlert,
  StatusPill,
} from '@chargeops/ui';
import {
  type Ticket,
  type TicketPriority,
  type TicketStatus,
} from '@chargeops/api';
import { TicketActionDock, type TicketActionDockProps } from './TicketActionDock';

export interface TicketHeaderProps extends TicketActionDockProps {
  code: string;
  priorityKey: TicketPriority;
  priorityMeta: { label: string; tone: any };
  statusKey: TicketStatus;
  statusMeta: { label: string; tone: any };
  categoryKey: string;
  categoryLabel: string;
  hasRefund: boolean;
}

export function TicketHeader(props: TicketHeaderProps) {
  const { t } = useTranslation('tickets');
  const {
    ticket,
    code,
    priorityKey,
    priorityMeta,
    statusKey,
    statusMeta,
    categoryKey,
    categoryLabel,
    isAdminStationSupervisory,
    isAdminPlatformDirect,
    hasRefund,
  } = props;

  return (
    <Card className="rounded-2xl border border-line bg-surface p-4 sm:p-5 shadow-xs">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[13px] font-bold text-brand">{code}</span>
            <span className="text-[11px] text-faint">·</span>
            <span className="inline-flex items-center gap-1 text-[11.5px] font-medium text-muted">
              <span>{t('table.cols.priority', 'Ưu tiên')}:</span>
              <span className="font-semibold text-ink">
                {t(`priority.${priorityKey}`, priorityMeta.label)}
              </span>
            </span>
            <StatusPill tone={statusMeta.tone} label={t(`status.${statusKey}`, statusMeta.label)} />

            {isAdminStationSupervisory && (
              <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800 dark:text-amber-300 border border-amber-500/25">
                <IconShieldAlert size={12} strokeWidth={2.2} />
                <span>{t('supervisory.badge', 'Giám sát Vận hành Trạm')}</span>
              </span>
            )}

            {isAdminPlatformDirect && (
              <span className="inline-flex items-center gap-1 rounded bg-brand-soft px-2.5 py-0.5 text-[11px] font-semibold text-brand-deep border border-brand-line">
                <IconShield size={12} strokeWidth={2.2} />
                <span>{t('platformQueue.badge', 'Hàng chờ Nền tảng & Thanh toán')}</span>
              </span>
            )}

            {hasRefund && (
              <span className="inline-flex items-center gap-1 rounded bg-good-soft px-2 py-0.5 text-[11px] font-medium text-good-deep">
                <IconCheckCircle size={12} strokeWidth={2.2} />
                <span>{t('detail.refund.autoGrantedBadge', 'Có hồ sơ hoàn tiền')}</span>
              </span>
            )}
          </div>

          <h1 className="mt-2 text-lg font-bold text-ink sm:text-xl">
            {ticket.subject || ticket.title || t('detail.defaultSubject', 'Phiếu hỗ trợ')}
          </h1>

          {ticket.description && (
            <p className="mt-1.5 text-[13px] leading-relaxed text-body">
              {ticket.description}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-chip px-2.5 py-1 text-[11px] font-medium text-muted">
              {t(`category.${categoryKey}`, categoryLabel)}
            </span>
            {ticket.stationName && (
              <span className="inline-flex items-center gap-1 rounded-full bg-chip px-2.5 py-1 text-[11px] font-medium text-muted">
                <IconPin size={12} strokeWidth={2.2} /> {ticket.stationName}
              </span>
            )}
            {ticket.bookingId && (
              <span className="inline-flex items-center gap-1 rounded-full bg-chip px-2.5 py-1 text-[11px] font-medium text-muted">
                <IconCalendar size={12} strokeWidth={2.2} /> #{String(ticket.bookingId).slice(0, 8)}
              </span>
            )}
          </div>
        </div>

        {/* Action Dock */}
        <TicketActionDock {...props} />
      </div>
    </Card>
  );
}
