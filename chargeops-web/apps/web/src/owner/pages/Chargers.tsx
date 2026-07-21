import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi, type Charger, type ChargerStatus } from '@chargeops/api';
import { Card, IconLock, PageHeader, Skeleton, useToast } from '@chargeops/ui';
import { ChargerStatsStrip } from '../features/chargers/ChargerStatsStrip';
import { ChargerTable } from '../features/chargers/ChargerTable';
import { ChargerDetailPanel } from '../features/chargers/ChargerDetailPanel';
import { nextStatus } from '../features/chargers/chargerStatus';

export function Chargers() {
  const { t } = useTranslation('owner');
  const api = useApi();
  const qc = useQueryClient();
  const toast = useToast();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['chargers', 'mine'],
    queryFn: () => api.chargers.list(),
  });

  const update = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: { name?: string; status?: ChargerStatus } }) =>
      api.chargers.update(id, patch),
    onSuccess: (c) => {
      qc.invalidateQueries({ queryKey: ['chargers'] });
      toast(t('chargers.updateSuccess', { id: c.id }), 'success');
    },
    onError: (e) => toast((e as Error).message, 'error'),
  });

  const downloadQr = (c: Charger) => toast(t('chargers.downloadToast', { id: c.id }), 'info');

  const selected = data?.find((c) => c.id === selectedId) ?? null;

  return (
    <>
      <PageHeader
        title={t('chargers.title')}
        subtitle={t('chargers.subtitle')}
      />

      {error ? (
        <Card className="border-bad-border bg-bad-soft p-5 text-[13px] font-medium text-bad-deep">
          {t('chargers.loadError', { message: (error as Error).message })}
        </Card>
      ) : isLoading || !data ? (
        <ChargersSkeleton />
      ) : (
        <>
          <ChargerStatsStrip chargers={data} />

          <div className="mb-[13px] flex items-center gap-2 text-[12px] font-medium text-muted">
            <IconLock size={15} className="shrink-0 text-warn" />
            <span>{t('chargers.description')}</span>
          </div>

          <div
            className="grid items-start gap-[13px]"
            style={{ gridTemplateColumns: selected ? 'minmax(0,1.5fr) minmax(0,1fr)' : '1fr' }}
          >
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <ChargerTable
                  chargers={data}
                  selectedId={selectedId}
                  onSelect={(c) => setSelectedId(c.id)}
                  onRename={(id, name) => update.mutate({ id, patch: { name } })}
                  onCycleStatus={(c) => update.mutate({ id: c.id, patch: { status: nextStatus(c.status) } })}
                  onDownloadQr={downloadQr}
                />
              </div>
            </Card>

            {selected && (
              <ChargerDetailPanel
                charger={selected}
                saving={update.isPending}
                onClose={() => setSelectedId(null)}
                onSave={(id, patch) => update.mutate({ id, patch })}
                onDownloadQr={downloadQr}
              />
            )}
          </div>
        </>
      )}
    </>
  );
}

function ChargersSkeleton() {
  return (
    <>
      <div className="mb-3.5 grid grid-cols-2 gap-[11px] md:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-[76px] rounded-[11px]" />
        ))}
      </div>
      <Skeleton className="h-[320px] rounded-card" />
    </>
  );
}
