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
  isEscalated?: boolean;
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
    isEscalated,
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

            {isEscalated && (
              <span className="inline-flex items-center gap-1 rounded bg-brand-soft px-2.5 py-0.5 text-[11px] font-bold text-brand border border-brand-line">
                <IconShieldAlert size={12} strokeWidth={2.2} />
                <span>{t('escalation.badge', 'Đang được Admin xem xét')}</span>
              </span>
            )}

            {isAdminStationSupervisory && !isEscalated && (
              <span className="inline-flex items-center gap-1 rounded bg-warn-soft px-2.5 py-0.5 text-[11px] font-semibold text-warn-deep border border-warn-border">
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

          <h1 className="mt-2 text-base font-bold text-ink sm:text-lg lg:text-xl break-words leading-snug">
            {ticket.subject || ticket.title || t('detail.defaultSubject', 'Phiếu hỗ trợ')}
          </h1>

          {ticket.description && (
            <p className="mt-1.5 text-[12.5px] sm:text-[13px] leading-relaxed text-body break-words">
              {ticket.description}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-chip px-2.5 py-1 text-[11px] font-medium text-muted">
              {t(`category.${categoryKey}`, categoryLabel)}
            </span>
            {ticket.stationName && (
              <span className="inline-flex items-center gap-1 rounded-full bg-chip px-2.5 py-1 text-[11px] font-medium text-muted truncate max-w-[240px] sm:max-w-none">
                <IconPin size={12} strokeWidth={2.2} /> <span className="truncate">{ticket.stationName}</span>
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
        <div className="w-full sm:w-auto pt-3 border-t border-hairline sm:pt-0 sm:border-0 shrink-0">
          <TicketActionDock {...props} />
        </div>
      </div>
    </Card>
  );
}
