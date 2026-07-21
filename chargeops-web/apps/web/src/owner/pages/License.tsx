import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { formatDateVn, formatVnd, LICENSE_STATUS, useApi, type License } from '@chargeops/api';
import { Card, IconClock, IconShield, PageHeader, Skeleton, StatusPill } from '@chargeops/ui';

/**
 * FR12 — owner license, status display only. Purchase/renewal happens
 * off-platform; the admin records status manually (BR-STA-01 on expiry).
 */
export function License() {
  const { t } = useTranslation('owner');
  const api = useApi();
  const { data, isLoading, error } = useQuery({
    queryKey: ['license', 'mine'],
    queryFn: () => api.licenses.mine(),
  });

  return (
    <>
      <PageHeader title={t('license.title')} subtitle={t('license.subtitle')} />
      {error ? (
        <Card className="border-bad-border bg-bad-soft p-5 text-[13px] font-medium text-bad-deep">
          {t('license.loadError', { message: (error as Error).message })}
        </Card>
      ) : isLoading || !data ? (
        <div className="grid gap-[13px] md:grid-cols-2">
          <Skeleton className="h-[190px] rounded-card" />
          <Skeleton className="h-[190px] rounded-card" />
        </div>
      ) : (
        <Body license={data} />
      )}
    </>
  );
}

function Body({ license }: { license: License }) {
  const { t } = useTranslation('owner');
  const meta = LICENSE_STATUS[license.status];
  const priceLabel = t('license.priceLabel', {
    price: formatVnd(license.priceVnd),
    period: license.plan === 'yearly' ? t('license.periodYear') : t('license.periodMonth'),
  });

  const planLabel = license.plan === 'yearly' ? t('license.plans.yearly') : t('license.plans.monthly');

  return (
    <div className="grid gap-[13px] md:grid-cols-2">
      {/* license card */}
      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-[38px] w-[38px] items-center justify-center rounded-[10px] bg-brand-soft">
              <IconShield size={20} className="text-brand" />
            </span>
            <div>
              <div className="text-[16px] font-bold">{planLabel}</div>
              <div className="text-[12px] font-medium text-muted">{priceLabel}</div>
            </div>
          </div>
          <StatusPill tone={meta.tone} label={meta.label} />
        </div>
        <div className="flex flex-col gap-2.5 text-[13px] font-medium text-body">
          <Row label={t('license.labels.start')} value={formatDateVn(license.startDate)} border />
          <Row label={t('license.labels.expiry')} value={formatDateVn(license.expiryDate)} bold border />
          <Row label={t('license.labels.remaining')} value={t('license.labels.remainingVal', { days: license.daysLeft })} warn />
        </div>
      </Card>

      {/* notes */}
      <div className="flex flex-col gap-[13px]">
        <div className="flex gap-[9px] rounded-card border border-warn-border bg-warn-soft p-4">
          <IconClock size={17} className="mt-px shrink-0 text-warn" />
          <div className="text-[12.5px] leading-[1.55] font-medium text-warn-deep">
            <b className="font-semibold">{t('license.helpTitle', { days: license.daysLeft })}</b>{' '}
            {t('license.helpBody')}
          </div>
        </div>
        <Card className="p-4">
          <div className="mb-2 text-[13px] font-semibold">{t('license.warningTitle')}</div>
          <div className="text-[12.5px] leading-[1.6] text-muted">
            {t('license.warningBody')}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
  warn,
  border,
}: {
  label: string;
  value: string;
  bold?: boolean;
  warn?: boolean;
  border?: boolean;
}) {
  return (
    <div className={`flex justify-between ${border ? 'border-b border-hairline pb-[9px]' : ''}`}>
      <span className="text-faint">{label}</span>
      <span className={`${bold || warn ? 'font-semibold' : ''} ${warn ? 'text-warn' : ''}`}>{value}</span>
    </div>
  );
}
