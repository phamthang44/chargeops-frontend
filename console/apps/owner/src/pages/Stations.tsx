import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '@chargeops/api';
import { Card, IconPlusCircle, PageHeader, Skeleton } from '@chargeops/ui';
import { StationSummary } from '../features/stations/StationSummary';
import { StationCard } from '../features/stations/StationCard';
import { RegisterStationModal } from '../features/stations/RegisterStationModal';

/** FR12 — owner's stations with registration. */
export function Stations() {
  const api = useApi();
  const [modalOpen, setModalOpen] = useState(false);
  const { data, isLoading, error } = useQuery({
    queryKey: ['stations', 'mine'],
    queryFn: () => api.stations.mine(),
  });

  return (
    <>
      <PageHeader
        title="Trạm của tôi"
        subtitle="Đăng ký trạm mới và theo dõi trạng thái duyệt."
        action={
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-[7px] rounded-ctl bg-owner px-[15px] py-[9px] text-[13px] font-semibold text-white shadow-[0_1px_2px_rgba(18,161,80,.3)] hover:bg-owner-strong"
          >
            <IconPlusCircle size={16} strokeWidth={2} />
            Đăng ký trạm mới
          </button>
        }
      />

      {error ? (
        <Card className="border-bad-border bg-bad-soft p-5 text-[13px] font-medium text-bad-deep">
          Không tải được danh sách trạm: {(error as Error).message}
        </Card>
      ) : isLoading || !data ? (
        <StationsSkeleton />
      ) : (
        <>
          <StationSummary stations={data} />
          <div className="grid gap-[13px] md:grid-cols-2">
            {data.map((st) => (
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
