import { useTranslation } from 'react-i18next';
import { Card } from './Card';
import { IconWrench } from './icons';

/** Placeholder for screens not yet ported from the design. */
export function ComingSoon({ title }: { title: string }) {
  const { t } = useTranslation('ui');
  return (
    <Card className="p-14 text-center">
      <div className="mx-auto mb-4 flex h-[54px] w-[54px] items-center justify-center rounded-panel bg-chip">
        <IconWrench size={26} strokeWidth={2} className="text-faint" />
      </div>
      <div className="text-[16px] font-semibold">{title}</div>
      <div className="mt-[5px] text-[13px] text-muted">{t('comingSoon.message')}</div>
    </Card>
  );
}
