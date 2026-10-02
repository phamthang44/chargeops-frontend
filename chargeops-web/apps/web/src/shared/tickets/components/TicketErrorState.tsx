import { useTranslation } from 'react-i18next';
import { Button, Card, IconArrowLeft, IconShieldAlert } from '@chargeops/ui';
import { getTicketErrorMeta } from '../utils/ticketErrors';

export interface TicketErrorStateProps {
  error: any;
  accent?: 'brand' | 'owner';
  onBack: () => void;
  onRetry: () => void;
}

export function TicketErrorState({
  error,
  accent = 'brand',
  onBack,
  onRetry,
}: TicketErrorStateProps) {
  const { t } = useTranslation('tickets');
  const errMeta = getTicketErrorMeta(error, t);

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

      <Card className="rounded-2xl p-6 sm:p-8 border border-red-500/25 bg-surface text-center shadow-xs">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
          <IconShieldAlert size={28} strokeWidth={2} />
        </div>

        <div className="mt-4 flex items-center justify-center gap-2">
          <h2 className="text-lg font-bold text-ink sm:text-xl">{errMeta.title}</h2>
          {errMeta.code && (
            <span className="font-mono text-[11px] font-semibold uppercase px-2 py-0.5 rounded bg-chip text-muted border border-hairline">
              {errMeta.code}
            </span>
          )}
        </div>

        <p className="mt-2 text-[13.5px] leading-relaxed text-muted max-w-lg mx-auto">
          {errMeta.message}
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button variant="secondary" size="sm" onClick={onBack}>
            {t('errors.backToList', 'Quay lại danh sách phiếu')}
          </Button>
          <Button variant="primary" accent={accent} size="sm" onClick={onRetry}>
            {t('errors.refreshAction', 'Tải lại trang')}
          </Button>
        </div>
      </Card>
    </div>
  );
}
