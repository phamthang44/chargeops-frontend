import { useTranslation } from 'react-i18next';
import { Button, Card, IconArrowLeft, IconShieldAlert } from '@chargeops/ui';

export interface TicketScopeWarningProps {
  onBack: () => void;
}

export function TicketScopeWarning({ onBack }: TicketScopeWarningProps) {
  const { t } = useTranslation('tickets');

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        type="button"
        className="inline-flex cursor-pointer items-center gap-1.5 text-[12.5px] font-medium text-muted transition-colors hover:text-ink"
      >
        <IconArrowLeft size={14} strokeWidth={2.2} />
        {t('errors.backToList', 'Quay lại danh sách phiếu')}
      </button>

      <Card className="rounded-2xl p-6 sm:p-8 border border-warn-border bg-surface text-center shadow-xs">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-warn-pill text-warn-deep border border-warn-border">
          <IconShieldAlert size={28} strokeWidth={2} />
        </div>

        <div className="mt-4 flex items-center justify-center gap-2">
          <h2 className="text-lg font-bold text-ink sm:text-xl">
            {t('errors.platformScopeOwnerWarningTitle', 'Phiếu thuộc phạm vi Nền tảng ChargeOps')}
          </h2>
        </div>

        <p className="mt-2 text-[13.5px] leading-relaxed text-muted max-w-lg mx-auto">
          {t(
            'errors.platformScopeOwnerWarning',
            'Sự cố này liên quan đến Cổng thanh toán, Tài khoản hoặc Hạ tầng hệ thống do Ban Quản trị ChargeOps tiếp nhận và xử lý trực tiếp. Chủ trạm không quản lý phiếu này.'
          )}
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button variant="primary" accent="owner" size="sm" onClick={onBack}>
            {t('errors.backToList', 'Quay lại danh sách phiếu')}
          </Button>
        </div>
      </Card>
    </div>
  );
}
