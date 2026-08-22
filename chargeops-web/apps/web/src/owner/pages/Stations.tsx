import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useApi, type Station } from '@chargeops/api';
import { Button, Card, IconPlusCircle, PageHeader, Skeleton } from '@chargeops/ui';
import { StationSummary } from '../features/stations/StationSummary';
import { StationCard } from '../features/stations/StationCard';
import { RegisterStationModal } from '../features/stations/RegisterStationModal';

/** FR12 — owner's stations with registration. */
export function Stations() {
  const { t } = useTranslation('owner');
  const api = useApi();
  const [modalOpen, setModalOpen] = useState(false);
  const { data, isLoading, error } = useQuery({
    queryKey: ['stations', 'mine'],
    queryFn: () => api.stations.mine(),
  });

  const stationList: Station[] =
    (Array.isArray(data) ? data : (data as { items?: Station[] } | undefined)?.items) ?? [];

  return (
    <>
      <PageHeader
        title={t('stations.title')}
        subtitle={t('stations.subtitle')}
        action={
          <Button accent="owner" icon={<IconPlusCircle size={16} strokeWidth={2} />} onClick={() => setModalOpen(true)}>
            {t('stations.registerBtn')}
          </Button>
        }
      />

      {error ? (
        <Card className="border-bad-border bg-bad-soft p-5 text-[13px] font-medium text-bad-deep">
          {t('stations.loadError', { message: (error as Error).message })}
        </Card>
      ) : isLoading || !data ? (
        <StationsSkeleton />
      ) : (
        <>
          <StationSummary stations={stationList} />
          <div className="grid gap-[13px] md:grid-cols-2">
            {stationList.map((st) => (
              <StationCard key={st.id} station={st} />
            ))}
          </div>
        </>
      )}

      <RegisterStationModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}

function StationsSkeleton() {
  return (
    <>
      <div className="mb-3.5 grid grid-cols-2 gap-[11px] md:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-[76px] rounded-[11px]" />
        ))}
      </div>
      <div className="grid gap-[13px] md:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-[210px] rounded-card" />
        ))}
      </div>
    </>
  );
}
