import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDateVn, useApi, type Station } from '@chargeops/api';
import { Button, Card, IconClipboardCheck, IconShieldCheck, PageHeader, Skeleton, StatusPill, useToast } from '@chargeops/ui';
import { RejectModal } from '../features/approvals/RejectModal';

/** FR12 — admin reviews pending station registrations, approve or reject. */
export function Approvals() {
  const { t } = useTranslation('admin');
  const api = useApi();
  const qc = useQueryClient();
  const toast = useToast();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['approvals'],
    queryFn: () => api.stations.approvals(),
  });

  const approve = useMutation({
    mutationFn: (id: string) => api.stations.approve(id),
    onSuccess: (s) => {
      qc.invalidateQueries({ queryKey: ['approvals'] });
      toast(t('approvals.toastApproved', { name: s.name }), 'success');
      setSelectedId(null);
    },
    onError: (e) => toast((e as Error).message, 'error'),
  });
  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => api.stations.reject(id, reason),
    onSuccess: (s) => {
      qc.invalidateQueries({ queryKey: ['approvals'] });
      toast(t('approvals.toastRejected', { name: s.name }), 'success');
      setRejectOpen(false);
      setSelectedId(null);
    },
    onError: (e) => toast((e as Error).message, 'error'),
  });

  const rows = data ?? [];
  const selected = rows.find((s) => s.id === selectedId) ?? rows[0] ?? null;

  return (
    <>
      <PageHeader title={t('console.nav.approvals.title')} subtitle={t('console.nav.approvals.subtitle')} />

      {error ? (
        <Card className="border-bad-border bg-bad-soft p-5 text-[13px] font-medium text-bad-deep">
          {t('approvals.error', { message: (error as Error).message })}
        </Card>
      ) : isLoading || !data ? (
        <Skeleton className="h-[340px] rounded-card" />
      ) : rows.length === 0 ? (
        <Card className="p-14 text-center">
          <div className="mx-auto mb-4 flex h-[54px] w-[54px] items-center justify-center rounded-panel bg-good-soft">
            <IconShieldCheck size={26} className="text-good" />
          </div>
          <div className="text-[16px] font-semibold">{t('approvals.emptyTitle')}</div>
          <div className="mt-[5px] text-[13px] text-muted">{t('approvals.emptyDesc')}</div>
        </Card>
      ) : (
        <div className="grid items-start gap-[13px] lg:grid-cols-[1.4fr_1fr]">
          {/* queue table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <div className="min-w-[520px]">
                <div
                  className="grid bg-surface-2 px-3.5 py-[11px] text-[9.5px] font-semibold uppercase tracking-[0.05em] text-faint"
                  style={{ gridTemplateColumns: '0.9fr 1.5fr 1.4fr 1fr 0.6fr' }}
                >
                  <span>{t('approvals.table.cols.id')}</span>
                  <span>{t('approvals.table.cols.station')}</span>
                  <span>{t('approvals.table.cols.owner')}</span>
                  <span>{t('approvals.table.cols.city')}</span>
                  <span className="text-center">{t('approvals.table.cols.chargers')}</span>
                </div>
                {rows.map((s) => {
                  const on = s.id === selected?.id;
                  return (
                    <div
                      key={s.id}
                      onClick={() => setSelectedId(s.id)}
                      className="grid cursor-pointer items-center border-b border-hairline px-3.5 py-3 text-[12px] font-medium hover:bg-[#fafaff]"
                      style={{
                        gridTemplateColumns: '0.9fr 1.5fr 1.4fr 1fr 0.6fr',
                        background: on ? '#fafaff' : undefined,
                        borderLeft: `3px solid ${on ? '#5b54e8' : 'transparent'}`,
                      }}
                    >
                      <span className="font-mono text-[10.5px] font-semibold text-brand">{s.id}</span>
                      <span className="font-semibold">{s.name}</span>
                      <span className="text-muted">{s.ownerName}</span>
                      <span className="text-muted">{s.city}</span>
                      <span className="text-center text-muted">{s.chargerCount}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* detail panel */}
          {selected && <ApprovalDetail station={selected} approving={approve.isPending} onApprove={() => approve.mutate(selected.id)} onReject={() => setRejectOpen(true)} />}
        </div>
      )}

      {selected && (
        <RejectModal
          open={rejectOpen}
          stationName={selected.name}
          pending={reject.isPending}
          onClose={() => setRejectOpen(false)}
          onConfirm={(reason) => reject.mutate({ id: selected.id, reason })}
        />
      )}
    </>
  );
}

function ApprovalDetail({
  station,
  approving,
  onApprove,
  onReject,
}: {
  station: Station;
  approving: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  const { t } = useTranslation('admin');
  return (
    <Card className="p-[17px]">
      <div className="mb-1 flex items-center justify-between">
        <div className="text-[10px] font-semibold uppercase tracking-[0.05em] text-faint">{t('approvals.detail.title', { id: station.id })}</div>
        <StatusPill tone="warn" label={t('approvals.detail.statusPending')} />
      </div>
      <div className="mt-1.5 text-[17px] font-bold">{station.name}</div>
      <div className="mb-[15px] text-[13px] font-medium text-muted">
        {station.ownerName} · {station.city}
      </div>
      <div className="mb-[15px] flex flex-col gap-[9px] text-[12.5px] font-medium">
        <DetailRow label={t('approvals.detail.address')} value={station.address} border />
        <DetailRow label={t('approvals.detail.proposedChargers')} value={t('approvals.detail.proposedChargersVal', { count: station.chargerCount })} border />
        <DetailRow label={t('approvals.detail.license')} value={t('approvals.detail.submittedVal')} valueClass="font-semibold text-good" border />
        <DetailRow label={t('approvals.detail.submittedAt')} value={station.submittedAt ? formatDateVn(station.submittedAt) : '—'} />
      </div>
      <div className="mb-3.5 flex h-[60px] items-center justify-center gap-[7px] rounded-[9px] border border-dashed border-line font-mono text-[11px] text-ghost">
        <IconClipboardCheck size={15} className="text-ghost" />
        {t('approvals.detail.documents')}
      </div>
      <div className="flex flex-col gap-[9px]">
        <Button fullWidth onClick={onApprove} disabled={approving}>
          {approving ? t('approvals.detail.approving') : t('approvals.detail.approveBtn')}
        </Button>
        <Button variant="danger-soft" fullWidth onClick={onReject}>
          {t('approvals.detail.rejectBtn')}
        </Button>
      </div>
    </Card>
  );
}

function DetailRow({
  label,
  value,
  valueClass = '',
  border,
}: {
  label: string;
  value: string;
  valueClass?: string;
  border?: boolean;
}) {
  return (
    <div className={`flex justify-between ${border ? 'border-b border-hairline pb-2' : ''}`}>
      <span className="text-faint">{label}</span>
      <span className={`text-right ${valueClass}`}>{value}</span>
    </div>
  );
}
