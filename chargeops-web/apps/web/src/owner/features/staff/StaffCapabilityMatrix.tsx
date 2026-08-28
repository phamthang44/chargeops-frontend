import { useTranslation } from 'react-i18next';
import { Card, IconCheck, IconLock, IconX } from '@chargeops/ui';

export function StaffCapabilityMatrix() {
  const { t } = useTranslation('owner');

  const capabilities = [
    ['viewStation', true],
    ['toggleConnector', true],
    ['handleTickets', true],
    ['pricing', false],
    ['revenue', false],
    ['manageStaff', false],
  ] as const;

  return (
    <Card className="p-4 border border-line/60 shadow-subtle">
      <div className="mb-1.5 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-warn-soft text-warn-deep">
          <IconLock size={13} />
        </span>
        <span className="text-[13.5px] font-bold text-ink">{t('staff.matrix.title')}</span>
      </div>
      <p className="mb-3 text-[11.5px] leading-relaxed text-faint">{t('staff.matrix.help')}</p>

      <div className="overflow-hidden rounded-lg border border-hairline bg-surface">
        <div
          className="grid border-b border-hairline bg-surface-2 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-faint"
          style={{ gridTemplateColumns: '1fr 56px 56px' }}
        >
          <span>{t('staff.matrix.capability')}</span>
          <span className="text-center font-bold text-owner">{t('staff.matrix.owner')}</span>
          <span className="text-center font-bold text-muted">{t('staff.matrix.staff')}</span>
        </div>

        {capabilities.map(([key, staffAllowed]) => (
          <div
            key={key}
            className="grid items-center border-b border-hairline px-3 py-2.5 text-[12px] font-medium last:border-b-0 hover:bg-surface-2/40 transition-colors"
            style={{ gridTemplateColumns: '1fr 56px 56px' }}
          >
            <span className="text-ink pr-2">{t(`staff.matrix.rows.${key}`)}</span>
            <span className="flex justify-center">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-good-soft">
                <IconCheck size={13} className="text-good" strokeWidth={2.4} />
              </span>
            </span>
            <span className="flex justify-center">
              {staffAllowed ? (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-good-soft">
                  <IconCheck size={13} className="text-good" strokeWidth={2.4} />
                </span>
              ) : (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-disabled/15">
                  <IconX size={13} className="text-faint" strokeWidth={2.4} />
                </span>
              )}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
