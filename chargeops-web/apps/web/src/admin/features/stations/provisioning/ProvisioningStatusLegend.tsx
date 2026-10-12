import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, IconBolt, IconInfoCircle, StatusPill } from '@chargeops/ui';

export function ProvisioningStatusLegend() {
  const { t } = useTranslation('admin');
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Card className="overflow-hidden border border-line-2 bg-surface-2 transition shadow-sm">
      <div
        className="flex cursor-pointer items-center justify-between px-4 py-3 select-none hover:bg-surface-3/30 transition"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
            <IconInfoCircle size={16} strokeWidth={2} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-bold text-ink">
                {t('provisioning.legend.title')}
              </span>
              <span className="rounded bg-brand-soft/60 px-1.5 py-0.5 text-[10px] font-semibold text-brand">
                {t('provisioning.legend.badge')}
              </span>
            </div>
            <p className="text-[11px] text-muted">
              {t('provisioning.legend.subtitle')}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen((prev) => !prev);
          }}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-[11.5px] font-semibold text-brand hover:bg-brand-soft/50 transition cursor-pointer"
        >
          <span>
            {isOpen
              ? t('provisioning.legend.toggleClose')
              : t('provisioning.legend.toggleOpen')}
          </span>
        </button>
      </div>

      {isOpen && (
        <div className="border-t border-hairline px-4 py-3.5 bg-surface/50 text-[12px] space-y-3.5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cột 1: Trụ sạc (Charge Point) */}
            <div className="flex flex-col gap-2 rounded-[8px] border border-line-2 bg-surface p-3">
              <div className="flex items-center gap-1.5 text-ink font-bold text-[12.5px] border-b border-hairline pb-1.5">
                <IconBolt size={15} className="text-brand" />
                <span>{t('provisioning.legend.cpSection')}</span>
              </div>

              {/* Tầng 1: Cấp phép */}
              <div className="space-y-1">
                <span className="text-[10.5px] font-bold text-muted uppercase tracking-wider">
                  {t('provisioning.legend.cpAdminGroup')}
                </span>
                <div className="grid grid-cols-1 gap-1 pl-1">
                  <div className="flex items-center gap-2">
                    <StatusPill tone="neutral" label={t('provisioning.pills.pending')} />
                    <span className="text-muted text-[11.5px]">
                      {t('provisioning.legend.cpPendingDesc')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusPill tone="good" label={t('provisioning.pills.active')} />
                    <span className="text-muted text-[11.5px]">
                      {t('provisioning.legend.cpActiveDesc')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusPill tone="warn" label={t('provisioning.pills.suspended')} />
                    <span className="text-muted text-[11.5px]">
                      {t('provisioning.legend.cpSuspendedDesc')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tầng 2: Kết nối Kỹ thuật */}
              <div className="space-y-1 mt-1 border-t border-hairline pt-2">
                <span className="text-[10.5px] font-bold text-muted uppercase tracking-wider">
                  {t('provisioning.legend.cpTechGroup')}
                </span>
                <div className="grid grid-cols-1 gap-1 pl-1">
                  <div className="flex items-center gap-2">
                    <StatusPill tone="good" label={t('provisioning.pills.available')} />
                    <span className="text-muted text-[11.5px]">
                      {t('provisioning.legend.cpAvailableDesc')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusPill tone="bad" label={t('provisioning.pills.offline')} />
                    <span className="text-muted text-[11.5px]">
                      {t('provisioning.legend.cpOfflineDesc')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusPill tone="warn" label={t('provisioning.pills.maintenance')} />
                    <span className="text-muted text-[11.5px]">
                      {t('provisioning.legend.cpMaintDesc')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Note tháo gỡ thắc mắc */}
              <div className="mt-1 rounded-[6px] border border-brand/20 bg-brand-soft/20 p-2.5 text-[11px] text-body leading-relaxed">
                <span className="font-bold text-brand">💡 {t('provisioning.legend.cpNoteTitle')}</span>
                <p className="mt-0.5 text-muted">
                  {t('provisioning.legend.cpNoteBody')}
                </p>
              </div>
            </div>

            {/* Cột 2: Súng sạc (Connector) */}
            <div className="flex flex-col gap-2 rounded-[8px] border border-line-2 bg-surface p-3">
              <div className="flex items-center gap-1.5 text-ink font-bold text-[12.5px] border-b border-hairline pb-1.5">
                <IconBolt size={15} className="text-cyan-600" />
                <span>{t('provisioning.legend.connectorSection')}</span>
              </div>

              <div className="space-y-1.5 pt-0.5">
                <span className="text-[10.5px] font-bold text-muted uppercase tracking-wider">
                  {t('provisioning.legend.connectorSectionSub')}
                </span>
                <div className="grid grid-cols-1 gap-1.5 pl-1">
                  <div className="flex items-center gap-2">
                    <StatusPill tone="good" label={t('provisioning.pills.available')} />
                    <span className="text-muted text-[11.5px]">
                      {t('provisioning.legend.connAvailableDesc')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusPill tone="brand" label={t('provisioning.pills.inUse')} />
                    <span className="text-muted text-[11.5px]">
                      {t('provisioning.legend.connInUseDesc')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusPill tone="bad" label={t('provisioning.pills.offline')} />
                    <span className="text-muted text-[11.5px]">
                      {t('provisioning.legend.connOfflineDesc')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusPill tone="neutral" label={t('provisioning.pills.sealed')} />
                    <span className="text-muted text-[11.5px]">
                      {t('provisioning.legend.connPendingDesc')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Note phân quyền */}
              <div className="mt-auto rounded-[6px] border border-line-2 bg-surface-2 p-2.5 text-[11px] text-body leading-relaxed">
                <span className="font-bold text-ink">⚡ {t('provisioning.legend.connRuleTitle')}</span>
                <p className="mt-0.5 text-muted">
                  {t('provisioning.legend.connRuleBody')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
