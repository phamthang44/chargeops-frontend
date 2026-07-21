import { useTranslation } from 'react-i18next';
import { useState, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CHARGER_STATUS, useApi, type ConnectorType } from '@chargeops/api';
import { Button, Card, IconCard, PageHeader, Select, Skeleton, StatusPill, useToast } from '@chargeops/ui';

const CONNECTORS = [
  { value: 'CCS2', label: 'CCS2' },
  { value: 'CHAdeMO', label: 'CHAdeMO' },
  { value: 'Type2AC', label: 'Type 2 AC' },
  { value: 'GBT', label: 'GB/T' },
];
const POWERS = [22, 50, 60, 120, 150].map((p) => ({ value: String(p), label: `${p} kW` }));
const PROV_STATION = 'ST-1042';

/** FR14 — admin creates charger records (UNCLAIMED until installed + linked). */
export function Provisioning() {
  const { t } = useTranslation('admin');
  const api = useApi();
  const qc = useQueryClient();
  const toast = useToast();
  const [connector, setConnector] = useState<ConnectorType>('CCS2');
  const [powerKw, setPowerKw] = useState(60);
  const [name, setName] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['chargers', 'provisioned', PROV_STATION],
    queryFn: () => api.chargers.list(PROV_STATION),
  });

  const provision = useMutation({
    mutationFn: () => api.chargers.provision({ connector, powerKw, name: name.trim() || undefined }),
    onSuccess: (c) => {
      qc.invalidateQueries({ queryKey: ['chargers'] });
      toast(
        t('provisioning.toastSuccess', {
          id: c.id,
          status: t(`provisioning.status.${c.status}`, { defaultValue: CHARGER_STATUS[c.status].label }),
        }),
        'success',
      );
      setName('');
    },
    onError: (e) => toast((e as Error).message, 'error'),
  });

  const rows = data ?? [];

  return (
    <>
      <PageHeader title={t('console.nav.provisioning.title')} subtitle={t('console.nav.provisioning.subtitle')} />

      <div className="grid items-start gap-[13px] lg:grid-cols-[1fr_1.4fr]">
        {/* create form */}
        <Card className="p-[17px]">
          <div className="mb-[15px] text-[15px] font-semibold">{t('provisioning.createTitle')}</div>
          <div className="flex flex-col gap-[13px]">
            <Field label={t('provisioning.connectorLabel')}>
              <Select
                value={connector}
                onChange={(v) => setConnector(v as ConnectorType)}
                options={CONNECTORS}
              />
            </Field>
            <Field label={t('provisioning.powerLabel')}>
              <Select value={String(powerKw)} onChange={(v) => setPowerKw(Number(v))} options={POWERS} />
            </Field>
            <Field label={t('provisioning.displayNameLabel')}>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('provisioning.displayNamePlaceholder')}
                className="w-full rounded-[9px] border border-line px-[11px] py-[9px] text-[13px]"
              />
            </Field>
            <Button fullWidth onClick={() => provision.mutate()} disabled={provision.isPending}>
              {provision.isPending ? t('provisioning.submitting') : t('provisioning.submitBtn')}
            </Button>
            <div className="flex gap-2 rounded-[9px] border border-warn-border bg-warn-soft px-[13px] py-[11px] text-[11.5px] leading-[1.5] text-warn-deep">
              <span>
                {t('provisioning.helpNote')}
              </span>
            </div>
          </div>
        </Card>

        {/* provisioned table */}
        <div>
          <div className="mb-[11px] flex items-center justify-between">
            <div className="text-[15px] font-semibold">{t('provisioning.listTitle')}</div>
            <span className="text-[12px] font-medium text-muted">{t('provisioning.recordsCount', { count: rows.length })}</span>
          </div>
          <Card className="overflow-hidden">
            {isLoading ? (
              <div className="p-4">
                {Array.from({ length: 4 }, (_, i) => (
                  <Skeleton key={i} className="mb-2 h-10 w-full" />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="min-w-[520px]">
                  <div
                    className="grid bg-surface-2 px-3.5 py-[11px] text-[9.5px] font-semibold uppercase tracking-[0.05em] text-faint"
                    style={{ gridTemplateColumns: '1fr 1fr 1fr 0.8fr 1.1fr 0.7fr' }}
                  >
                    <span>{t('provisioning.table.cols.id')}</span>
                    <span>{t('provisioning.table.cols.name')}</span>
                    <span>{t('provisioning.table.cols.connector')}</span>
                    <span>{t('provisioning.table.cols.power')}</span>
                    <span>{t('provisioning.table.cols.status')}</span>
                    <span className="text-right">{t('provisioning.table.cols.qr')}</span>
                  </div>
                  {rows.map((c) => {
                    const meta = CHARGER_STATUS[c.status];
                    return (
                      <div
                        key={c.id}
                        className="grid items-center border-b border-hairline px-3.5 py-3 text-[12px] font-medium"
                        style={{ gridTemplateColumns: '1fr 1fr 1fr 0.8fr 1.1fr 0.7fr' }}
                      >
                        <span className="font-mono text-[10.5px] font-semibold text-brand">{c.id}</span>
                        <span className="text-body">{c.name}</span>
                        <span className="text-muted">{c.connector}</span>
                        <span className="text-muted">{c.powerKw}</span>
                        <span>
                          <StatusPill tone={meta.tone} label={t(`provisioning.status.${c.status}`, { defaultValue: meta.label })} />
                        </span>
                        <span className="text-right">
                          <button
                            onClick={() => toast(t('provisioning.toastDownloading', { id: c.id }), 'info')}
                            className="inline-flex text-brand"
                            aria-label={t('provisioning.downloadQr')}
                          >
                            <IconCard size={15} strokeWidth={1.9} />
                          </button>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.05em] text-faint">{label}</div>
      {children}
    </div>
  );
}
