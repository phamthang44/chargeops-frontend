import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Ticket, TicketStatus } from '@chargeops/api';
import { IconCheck, IconClock, IconLock, IconShieldAlert, IconUsers, IconWrench } from '@chargeops/ui';

interface TicketLifecycleStepperProps {
  ticket: Ticket;
  className?: string;
  resolvedHandlerName?: string | null;
}

interface StepItem {
  id: number;
  key: string;
  stepNumber: string;
  label: string;
  sublabel: string;
  isCompleted: boolean;
  isActive: boolean;
  Icon: any;
}

export function TicketLifecycleStepper({
  ticket,
  className = '',
  resolvedHandlerName,
}: TicketLifecycleStepperProps) {
  const { t } = useTranslation('tickets');
  const status = (String(ticket.status || 'OPEN').toUpperCase()) as TicketStatus;

  const steps = useMemo<StepItem[]>(() => {
    const isClosed = status === 'CLOSED';
    const isResolved = status === 'RESOLVED';
    const isInProgress = status === 'IN_PROGRESS';
    const isOpen = status === 'OPEN';

    const handler =
      resolvedHandlerName ||
      ticket.assignedHandlerName ||
      ticket.assignedToName ||
      (ticket.assignedHandlerId ? t('detail.handlerCard.stationTechFallback', 'Kỹ thuật viên trạm') : null);

    return [
      {
        id: 1,
        key: 'created',
        stepNumber: '01',
        label: t('stepper.created', 'Tiếp nhận yêu cầu'),
        sublabel: isOpen
          ? t('stepper.createdWaiting', 'Hệ thống đã ghi nhận')
          : t('stepper.createdDone', 'Đã tiếp nhận'),
        isCompleted: !isOpen,
        isActive: isOpen,
        Icon: IconShieldAlert,
      },
      {
        id: 2,
        key: 'in_progress',
        stepNumber: '02',
        label: t('stepper.inProgress', 'Phân công & Xử lý'),
        sublabel: isInProgress
          ? handler || t('stepper.handlingActive', 'Đang xử lý kỹ thuật')
          : isResolved || isClosed
            ? handler || t('stepper.handledDone', 'Đã khắc phục xong')
            : t('stepper.unassignedWait', 'Chờ phân công'),
        isCompleted: isResolved || isClosed,
        isActive: isInProgress,
        Icon: isInProgress ? IconWrench : IconUsers,
      },
      {
        id: 3,
        key: 'resolved',
        stepNumber: '03',
        label: t('stepper.resolved', 'Khắc phục & Theo dõi'),
        sublabel: isResolved
          ? t('stepper.resolvingWatch', 'Chờ tài xế (10 ngày)')
          : isClosed
            ? t('stepper.verifiedDone', 'Đã nghiệm thu')
            : t('stepper.resolvedSub', '10 ngày phản hồi'),
        isCompleted: isClosed,
        isActive: isResolved,
        Icon: IconClock,
      },
      {
        id: 4,
        key: 'closed',
        stepNumber: '04',
        label: t('stepper.closed', 'Hoàn tất & Đóng'),
        sublabel: isClosed
          ? ticket.closeReason === 'AUTO_CLOSED_NO_RESPONSE'
            ? t('closeReason.auto', 'Tự đóng sau 10 ngày')
            : t('closeReason.confirmed', 'Tài xế xác nhận')
          : t('stepper.closedSub', 'Lưu trữ hồ sơ'),
        isCompleted: isClosed,
        isActive: isClosed,
        Icon: IconLock,
      },
    ];
  }, [status, ticket, resolvedHandlerName, t]);

  return (
    <div
      className={`rounded-2xl border border-line bg-surface px-4 py-4 sm:px-6 sm:py-5 shadow-xs ${className}`}
      aria-label={t('stepper.ariaLabel', 'Tiến trình xử lý phiếu hỗ trợ')}
    >
      {/* Desktop / Large Screen Fluid Stepper (Continuous Track Line) */}
        <div className="hidden lg:flex items-center justify-between w-full min-w-0">
          {steps.map((step, idx) => {
            const isLast = idx === steps.length - 1;

            let badgeClasses = 'bg-surface-2 text-muted border-hairline';
            let titleClasses = 'text-muted';
            let connectorProgress = 'bg-line';

            if (step.isCompleted) {
              badgeClasses = 'bg-good-soft text-good-deep border-good/25 shadow-xs';
              titleClasses = 'text-ink font-semibold';
              connectorProgress = 'bg-good/70';
            } else if (step.isActive) {
              badgeClasses = 'bg-brand text-white border-brand ring-4 ring-brand/15 shadow-sm';
              titleClasses = 'text-brand font-bold';
            }

            return (
              <div key={step.key} className="flex items-center flex-1 last:flex-none min-w-0">
                {/* Node info item */}
                <div className="flex items-center gap-2.5 lg:gap-3 min-w-0">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-[13px] font-bold transition-all duration-300 ${badgeClasses}`}
                  >
                    {step.isCompleted ? (
                      <IconCheck size={16} strokeWidth={2.8} />
                    ) : (
                      <step.Icon size={16} strokeWidth={2.2} />
                    )}
                  </div>

                  <div className="min-w-0 pr-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] font-bold text-faint uppercase tracking-wider">
                        {step.stepNumber}
                      </span>
                      <span className={`text-[12.5px] tracking-tight ${titleClasses}`}>
                        {step.label}
                      </span>
                    </div>
                    <div className="truncate text-[11px] text-muted font-normal mt-0.5 max-w-[130px] lg:max-w-[170px]">
                      {step.sublabel}
                    </div>
                  </div>
                </div>

                {/* Continuous Fluid Track Connector Line */}
                {!isLast && (
                  <div className="flex-1 mx-2 lg:mx-4 h-0.5 relative rounded-full overflow-hidden bg-line min-w-3">
                    <div
                      className={`absolute inset-0 rounded-full transition-all duration-500 ${connectorProgress}`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Mobile / Tablet Horizontal Snap Stepper (Smooth touch scrolling without truncated text) */}
        <div className="flex lg:hidden items-center gap-2.5 overflow-x-auto pb-1 -mx-1 px-1 no-scrollbar overscroll-contain snap-x snap-mandatory">
          {steps.map((step) => {
            let badgeClasses = 'bg-surface-2 text-muted border-hairline';
            let titleClasses = 'text-muted';
            let cardBorder = 'border-hairline bg-surface-2/40';

            if (step.isCompleted) {
              badgeClasses = 'bg-good-soft text-good-deep border-good/25 shadow-xs';
              titleClasses = 'text-ink font-semibold';
              cardBorder = 'border-good/25 bg-good-soft/20';
            } else if (step.isActive) {
              badgeClasses = 'bg-brand text-white border-brand ring-4 ring-brand/15 shadow-sm';
              titleClasses = 'text-brand font-bold';
              cardBorder = 'border-brand/40 bg-brand/5 shadow-2xs';
            }

            return (
              <div
                key={step.key}
                className={`flex shrink-0 min-w-[195px] max-w-[220px] snap-start items-center gap-2.5 p-2.5 rounded-xl border transition-all ${cardBorder}`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-[11px] font-bold ${badgeClasses}`}
                >
                  {step.isCompleted ? (
                    <IconCheck size={14} strokeWidth={2.8} />
                  ) : (
                    <step.Icon size={14} strokeWidth={2.2} />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[9.5px] font-bold text-faint">{step.stepNumber}</span>
                    <span className={`text-[12px] font-medium leading-tight ${titleClasses}`}>{step.label}</span>
                  </div>
                  <div className="text-[11px] text-muted mt-0.5 leading-snug line-clamp-1">{step.sublabel}</div>
                </div>
              </div>
            );
          })}
        </div>
    </div>
  );
}
