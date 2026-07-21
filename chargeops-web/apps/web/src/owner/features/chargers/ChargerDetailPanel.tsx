import { useTranslation } from 'react-i18next';
import { useEffect, useState, type ReactNode } from 'react';
import type { Charger, ChargerStatus } from '@chargeops/api';
import { Button, Card, IconBolt, IconClock, IconLock, IconX, QrGlyph } from '@chargeops/ui';
import { CHARGER_PILL, OWNER_CYCLE } from './chargerStatus';

export interface ChargerDetailPanelProps {
  charger: Charger;
  saving: boolean;
  onClose: () => void;
  onSave: (id: string, patch: { name: string; status: ChargerStatus }) => void;
  onDownloadQr: (c: Charger) => void;
}

/** Right-hand editor: owner edits name + status; specs are read-only (admin-provisioned). */
export function ChargerDetailPanel({
  charger,
  saving,
  onClose,
  onSave,
  onDownloadQr,
}: ChargerDetailPanelProps) {
  const { t } = useTranslation('owner');
  const [name, setName] = useState(charger.name);
  const [status, setStatus] = useState<ChargerStatus>(charger.status);

  // Re-sync drafts when a different charger is selected.
  useEffect(() => {
    setName(charger.name);
    setStatus(charger.status);
  }, [charger.id, charger.name, charger.status]);

  return (
    <Card className="p-[18px]">
      <div className="mb-1.5 flex items-start justify-between">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.07em] text-owner">
            {t('chargers.panel.editTitle')}
          </div>
          <div className="mt-1 text-[17px] font-bold">{charger.name}</div>
        </div>
        <button
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-faint hover:bg-chip"
          aria-label={t('chargers.panel.close')}
        >
          <IconX size={16} strokeWidth={2} />
        </button>
      </div>

      {/* identity */}
      <SectionTitle icon={<IconBolt size={15} className="text-owner" />}>
        {t('chargers.panel.identityGroup')}
      </SectionTitle>
      <FieldLabel>{t('chargers.panel.chargerId')}</FieldLabel>
      <div className="mb-[5px] flex items-center gap-2 rounded-[10px] border border-line-3 bg-chip px-[13px] py-[11px]">
        <span className="flex-1 font-mono text-[13px] font-semibold text-body">{charger.id}</span>
        <IconLock size={14} className="text-disabled" />
      </div>
      <p className="mb-[15px] text-[11px] leading-[1.5] text-faint">
        {t('chargers.panel.idHelp')}
      </p>
      <FieldLabel>{t('chargers.panel.displayName')}</FieldLabel>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t('chargers.panel.namePlaceholder')}
        className="w-full rounded-[10px] border border-line px-[13px] py-[11px] text-[13.5px] font-medium focus:border-owner"
      />
      <p className="mt-[7px] text-[11px] leading-[1.5] text-faint">
        {t('chargers.panel.nameHelp')}
      </p>

      {/* locked specs */}
      <div className="mt-[18px] mb-3 flex items-center justify-between">
        <SectionTitleInline icon={<IconBolt size={15} className="text-owner" />}>
          {t('chargers.panel.specGroup')}
        </SectionTitleInline>
        <span className="flex items-center gap-[5px] rounded-full bg-warn-soft px-[9px] py-1 font-mono text-[10px] text-warn">
          <IconLock size={11} strokeWidth={2.1} />
          {t('chargers.panel.adminProvided')}
        </span>
      </div>
      <div className="mb-[5px] flex gap-[11px]">
        <LockedSpec label={t('chargers.panel.connector')} value={charger.connector} />
        <LockedSpec label={t('chargers.panel.power')} value={`${charger.powerKw} kW`} />
      </div>
      <p className="text-[11px] leading-[1.5] text-faint">
        {t('chargers.panel.specHelp')}
      </p>

      {/* status */}
      <SectionTitle className="mt-[18px]" icon={<IconClock size={15} className="text-owner" />}>
        {t('chargers.panel.operationGroup')}
      </SectionTitle>
      <div className="flex gap-[7px]">
        {OWNER_CYCLE.map((s) => {
          const pill = CHARGER_PILL[s];
          const on = s === status;
          return (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-[10px] border-[1.5px] px-1 py-2.5 text-[12px] font-semibold transition"
              style={{
                borderColor: on ? pill.fg : 'var(--color-line)',
                background: on ? pill.bg : 'var(--color-surface)',
                color: on ? pill.fg : 'var(--color-muted)',
              }}
            >
              <span className="h-[7px] w-[7px] rounded-full" style={{ background: pill.fg }} />
              {t(`chargers.status.${s}`)}
            </button>
          );
        })}
      </div>

      {/* today performance */}
      <SectionTitle className="mt-[18px]" icon={<IconBolt size={15} className="text-owner" />}>
        {t('chargers.panel.perfGroup')}
      </SectionTitle>
      <div className="grid grid-cols-2 gap-2.5">
        <PerfStat label={t('chargers.panel.utilization')} value={`${charger.utilizationPct}%`} />
        <PerfStat label="UPTIME 30N" value={`${charger.uptime30dPct}%`} />
        <PerfStat label={t('chargers.panel.sessions')} value={String(charger.sessionsToday)} />
        <PerfStat label={t('chargers.panel.kwh')} value={String(charger.kwhToday)} />
      </div>

      {/* QR */}
      <div className="mt-[18px] flex items-center gap-[13px] rounded-card border border-line-3 bg-surface-2 p-3.5">
        <span className="flex h-[74px] w-[74px] shrink-0 items-center justify-center rounded-[10px] border border-line-3 bg-surface">
          <QrGlyph size={56} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[12.5px] font-semibold">QR Check-in</div>
          <div className="mt-0.5 text-[11px] leading-[1.45] text-faint">
            {t('chargers.panel.qrHelp')}
          </div>
        </div>
        <button
          onClick={() => onDownloadQr(charger)}
          className="flex shrink-0 items-center gap-1.5 rounded-[9px] border-[1.5px] border-owner-border px-[13px] py-[9px] text-[12px] font-semibold text-owner-deep hover:bg-owner-soft"
        >
          {t('chargers.panel.downloadQrBtn')}
        </button>
      </div>

      <Button
        accent="owner"
        size="lg"
        fullWidth
        className="mt-4"
        onClick={() => onSave(charger.id, { name: name.trim() || charger.name, status })}
        disabled={saving}
      >
        {saving ? t('chargers.panel.saving') : t('chargers.panel.saveBtn')}
      </Button>
    </Card>
  );
}

function SectionTitle({
  icon,
  children,
  className = '',
}: {
  icon: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mb-3 flex items-center gap-2.5 ${className}`}>
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-owner-soft">
        {icon}
      </span>
      <span className="text-[13.5px] font-semibold">{children}</span>
    </div>
  );
}

function SectionTitleInline({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-owner-soft">
        {icon}
      </span>
      <span className="text-[13.5px] font-semibold">{children}</span>
    </div>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <div className="mb-[7px] text-[10px] font-semibold uppercase tracking-[0.07em] text-faint">
      {children}
    </div>
  );
}

function LockedSpec({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1">
      <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.05em] text-faint">{label}</div>
      <div className="rounded-[10px] border border-line-3 bg-chip px-3 py-2.5 text-[12.5px] font-semibold text-body">
        {value}
      </div>
    </div>
  );
}

function PerfStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[10px] border border-line-3 p-[11px]">
      <div className="text-[9px] font-semibold uppercase tracking-[0.05em] text-faint">{label}</div>
      <div className="mt-[3px] text-[17px] font-bold">{value}</div>
    </div>
  );
}
