import { useTranslation } from 'react-i18next';
import { useMemo, useState, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CHARGE_POINT_STATUS,
  useApi,
  type ChargePoint,
  type Connector,
  type ConnectorType,
} from '@chargeops/api';
import {
  Button,
  Card,
  EmptyState,
  IconBolt,
  IconCheck,
  IconLock,
  IconPin,
  IconPlusCircle,
  Modal,
  PageHeader,
  QrGlyph,
  Select,
  Skeleton,
  StatusPill,
  useToast,
} from '@chargeops/ui';

const CONNECTORS = [
  { value: 'CCS2', label: 'CCS2' },
  { value: 'CHAdeMO', label: 'CHAdeMO' },
  { value: 'Type2AC', label: 'Type 2 AC' },
  { value: 'GBT', label: 'GB/T' },
];
const POWERS = [22, 50, 60, 120, 150].map((p) => ({ value: String(p), label: `${p} kW` }));

/**
 * FR14 — charger provisioning.
 *
 * Deliberately *not* a table: a Charge Point and a Connector carry different
 * attributes, so a shared column grid left half of every device row blank and
 * gave one column two meanings ("1 connector" vs "CCS2"). Each Charge Point is
 * a card instead, with its Connectors listed inside it.
 *
 * There is also no "which charge point?" dropdown. Adding a Connector is an
 * action *on* the card you are looking at, so the parent is established by
 * where you clicked rather than by a select the reader has to cross-reference.
 */
export function Provisioning() {
  const { t } = useTranslation('admin');
  const api = useApi();
  const qc = useQueryClient();
  const toast = useToast();

  const [stationId, setStationId] = useState('');
  /** Charge point currently receiving a connector (null = modal closed). */
  const [addingTo, setAddingTo] = useState<ChargePoint | null>(null);
  const [creatingCp, setCreatingCp] = useState(false);

  const directoryQ = useQuery({ queryKey: ['stations', 'directory'], queryFn: () => api.stations.directory() });
  const stationOptions = directoryQ.data?.map((s) => ({ value: s.id, label: s.name })) ?? [];
  const activeStationId = stationId || stationOptions[0]?.value || '';
  const stationName = stationOptions.find((s) => s.value === activeStationId)?.label ?? '';

  const chargePointsQ = useQuery({
    queryKey: ['chargePoints', 'provisioned', activeStationId],
    queryFn: () => api.chargePoints.list(activeStationId),
    enabled: !!activeStationId,
  });
  const connectorsQ = useQuery({ queryKey: ['connectors', 'all'], queryFn: () => api.connectors.list() });

  const groups = useMemo(
    () =>
      (chargePointsQ.data ?? []).map((cp) => ({
        chargePoint: cp,
        connectors: (connectorsQ.data ?? []).filter((c) => c.chargePointId === cp.id),
      })),
    [chargePointsQ.data, connectorsQ.data],
  );

  const isLoading = directoryQ.isLoading || chargePointsQ.isLoading || connectorsQ.isLoading;

  const activate = useMutation({
    mutationFn: (id: string) => api.chargePoints.activate(id),
    onSuccess: (cp) => {
      qc.invalidateQueries({ queryKey: ['chargePoints'] });
      toast(t('provisioning.activateSuccess', { id: cp.id }), 'success');
    },
    onError: (e) => toast((e as Error).message, 'error'),
  });

  return (
    <>
      <PageHeader title={t('console.nav.provisioning.title')} subtitle={t('console.nav.provisioning.subtitle')} />

      {/* ---- FR14 flow, stated once so the page explains its own sequence ---- */}
      <Card className="mb-[13px] flex flex-wrap items-center gap-x-2 gap-y-2 px-4 py-3">
        {[1, 2, 3, 4].map((n) => (
          <span key={n} className="flex items-center gap-2">
            {n > 1 && <span className="text-[12px] text-disabled">→</span>}
            <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-brand-soft text-[10px] font-bold text-brand">
              {n}
            </span>
            <span className="text-[11.5px] font-medium text-muted">{t(`provisioning.flow.step${n}`)}</span>
          </span>
        ))}
      </Card>

      {/* ---- station context: everything below belongs to this station ---- */}
      <Card className="mb-[13px] flex flex-wrap items-end justify-between gap-3 p-4">
        <div className="min-w-[220px] flex-1">
          <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.05em] text-faint">
            {t('provisioning.stationLabel')}
          </div>
          <Select value={activeStationId} onChange={setStationId} options={stationOptions} className="max-w-[280px]" />
        </div>
        <Button
          icon={<IconPlusCircle size={15} strokeWidth={2} />}
          onClick={() => setCreatingCp(true)}
          disabled={!activeStationId}
        >
          {t('provisioning.chargePoint.createBtn')}
        </Button>
      </Card>

      {/* ---- charge point cards ---- */}
      <div className="mb-[11px] flex items-center justify-between">
        <div className="text-[15px] font-semibold">{t('provisioning.listTitle', { station: stationName })}</div>
        <span className="text-[12px] font-medium text-muted">
          {t('provisioning.recordsCount', { count: groups.length })}
        </span>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-[11px]">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-[132px] rounded-card" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <Card>
          <EmptyState>{t('provisioning.empty', { station: stationName })}</EmptyState>
        </Card>
      ) : (
        <div className="flex flex-col gap-[11px]">
          {groups.map(({ chargePoint: cp, connectors }) => (
            <ChargePointCard
              key={cp.id}
              chargePoint={cp}
              connectors={connectors}
              activating={activate.isPending}
              onAddConnector={() => setAddingTo(cp)}
              onActivate={() => activate.mutate(cp.id)}
              onDownloadQr={(c) => toast(t('provisioning.toastDownloading', { id: c.id }), 'info')}
            />
          ))}
        </div>
      )}

      {creatingCp && (
        <CreateChargePointModal
          stationId={activeStationId}
          stationName={stationName}
          onClose={() => setCreatingCp(false)}
        />
      )}
      {addingTo && <AddConnectorModal chargePoint={addingTo} onClose={() => setAddingTo(null)} />}
    </>
  );
}

function ChargePointCard({
  chargePoint: cp,
  connectors,
  activating,
  onAddConnector,
  onActivate,
  onDownloadQr,
}: {
  chargePoint: ChargePoint;
  connectors: Connector[];
  activating: boolean;
  onAddConnector: () => void;
  onActivate: () => void;
  onDownloadQr: (c: Connector) => void;
}) {
  const { t } = useTranslation('admin');
  const meta = CHARGE_POINT_STATUS[cp.status];
  const canActivate = cp.status === 'unclaimed' && connectors.length > 0;

  return (
    <Card className="overflow-hidden">
      {/* device identity */}
      <div className="flex items-start gap-3 px-4 py-[13px]">
        <span className="mt-px flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-brand-soft">
          <IconBolt size={17} className="text-brand" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-[14.5px] font-bold">{cp.name}</span>
            <span className="font-mono text-[11px] font-semibold text-faint">{cp.id}</span>
          </div>
          <div className="mt-[3px] flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11.5px] font-medium text-faint">
            {cp.zoneLabel && (
              <span className="flex items-center gap-1">
                <IconPin size={11} strokeWidth={2} />
                {cp.zoneLabel}
              </span>
            )}
            <span>{t('provisioning.connectorCount', { count: connectors.length })}</span>
          </div>
        </div>
        <StatusPill tone={meta.tone} label={t(`provisioning.status.${cp.status}`, { defaultValue: meta.label })} />
      </div>

      {/* connectors — each carries its own Charger ID + QR label (FR14) */}
      <div className="border-t border-hairline bg-surface-2 px-3 py-2.5">
        {connectors.length === 0 ? (
          <div className="flex items-start gap-2 rounded-[9px] border border-warn-border bg-warn-soft px-3 py-2.5 text-[11.5px] leading-[1.5] font-medium text-warn-deep">
            <IconLock size={13} strokeWidth={2} className="mt-px shrink-0" />
            <span>{t('provisioning.noConnectors')}</span>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {connectors.map((c) => (
              <div
                key={c.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-[10px] border border-line-3 bg-surface px-3 py-2.5"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] border border-line-3 bg-surface-2">
                  <QrGlyph size={22} />
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="font-mono text-[11.5px] font-semibold text-brand">{c.id}</span>
                  <span className="truncate text-[11.5px] font-medium text-muted">{c.name}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-chip px-2.5 py-1 text-[11px] font-semibold text-body">
                  {c.connectorType} · {c.powerKw} kW
                  <IconLock size={10} strokeWidth={2.2} className="text-disabled" />
                </span>
                <Button variant="secondary" size="sm" className="ml-auto" onClick={() => onDownloadQr(c)}>
                  {t('provisioning.downloadQr')}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* actions live on the card they act upon */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-hairline px-4 py-3">
        <Button
          variant="secondary"
          size="sm"
          icon={<IconPlusCircle size={14} strokeWidth={2} />}
          onClick={onAddConnector}
        >
          {t('provisioning.connector.addBtn')}
        </Button>

        {cp.status === 'unclaimed' ? (
          <span className="flex items-center gap-2.5">
            {!canActivate && (
              <span className="text-[11px] font-medium text-faint">{t('provisioning.activateHint')}</span>
            )}
            <Button size="sm" disabled={!canActivate || activating} onClick={onActivate}>
              {activating ? t('provisioning.activating') : t('provisioning.activateBtn')}
            </Button>
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-[11.5px] font-medium text-good">
            <IconCheck size={14} strokeWidth={2.4} />
            {t('provisioning.liveForDrivers')}
          </span>
        )}
      </div>
    </Card>
  );
}

function CreateChargePointModal({
  stationId,
  stationName,
  onClose,
}: {
  stationId: string;
  stationName: string;
  onClose: () => void;
}) {
  const { t } = useTranslation('admin');
  const api = useApi();
  const qc = useQueryClient();
  const toast = useToast();
  const [name, setName] = useState('');
  const [zoneLabel, setZoneLabel] = useState('');

  const create = useMutation({
    mutationFn: () =>
      api.chargePoints.provision({
        stationId,
        name: name.trim() || undefined,
        zoneLabel: zoneLabel.trim() || undefined,
      }),
    onSuccess: (cp) => {
      qc.invalidateQueries({ queryKey: ['chargePoints'] });
      toast(t('provisioning.chargePoint.toastSuccess', { id: cp.id }), 'success');
      onClose();
    },
    onError: (e) => toast((e as Error).message, 'error'),
  });

  return (
    <Modal open onClose={onClose}>
      <div className="mb-1 text-[16px] font-bold">{t('provisioning.chargePoint.createTitle')}</div>
      <p className="mb-[17px] text-[12px] leading-[1.5] text-muted">
        {t('provisioning.chargePoint.createSub', { station: stationName })}
      </p>

      <div className="flex flex-col gap-[13px]">
        <Field label={t('provisioning.chargePoint.nameLabel')}>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('provisioning.chargePoint.namePlaceholder')}
            className="w-full rounded-[9px] border border-line px-[11px] py-[9px] text-[13px] focus:border-brand"
          />
        </Field>
        <Field label={t('provisioning.chargePoint.zoneLabel')}>
          <input
            value={zoneLabel}
            onChange={(e) => setZoneLabel(e.target.value)}
            placeholder={t('provisioning.chargePoint.zonePlaceholder')}
            className="w-full rounded-[9px] border border-line px-[11px] py-[9px] text-[13px] focus:border-brand"
          />
        </Field>
        <p className="rounded-[9px] bg-chip px-3 py-2.5 text-[11.5px] leading-[1.5] text-muted">
          {t('provisioning.chargePoint.createHelp')}
        </p>
      </div>

      <div className="mt-[18px] flex justify-end gap-2.5">
        <Button variant="secondary" onClick={onClose}>
          {t('provisioning.cancel')}
        </Button>
        <Button onClick={() => create.mutate()} disabled={create.isPending}>
          {create.isPending ? t('provisioning.submitting') : t('provisioning.chargePoint.submitBtn')}
        </Button>
      </div>
    </Modal>
  );
}

function AddConnectorModal({ chargePoint, onClose }: { chargePoint: ChargePoint; onClose: () => void }) {
  const { t } = useTranslation('admin');
  const api = useApi();
  const qc = useQueryClient();
  const toast = useToast();
  const [connectorType, setConnectorType] = useState<ConnectorType>('CCS2');
  const [powerKw, setPowerKw] = useState(60);
  const [name, setName] = useState('');

  const create = useMutation({
    mutationFn: () =>
      api.connectors.provision({
        chargePointId: chargePoint.id,
        connectorType,
        powerKw,
        name: name.trim() || undefined,
      }),
    onSuccess: (c) => {
      qc.invalidateQueries({ queryKey: ['connectors'] });
      qc.invalidateQueries({ queryKey: ['chargePoints'] });
      toast(t('provisioning.connector.toastSuccess', { id: c.id }), 'success');
      onClose();
    },
    onError: (e) => toast((e as Error).message, 'error'),
  });

  return (
    <Modal open onClose={onClose}>
      <div className="mb-1 text-[16px] font-bold">{t('provisioning.connector.createTitle')}</div>
      {/* The parent is stated, not selected — you opened this from its card. */}
      <p className="mb-[17px] flex flex-wrap items-center gap-1.5 text-[12px] text-muted">
        {t('provisioning.connector.createSub')}
        <span className="inline-flex items-center gap-1.5 rounded-full bg-chip px-2.5 py-1 text-[11px] font-semibold text-body">
          <IconBolt size={11} className="text-brand" />
          {chargePoint.id} · {chargePoint.name}
        </span>
      </p>

      <div className="flex flex-col gap-[13px]">
        <Field label={t('provisioning.connector.connectorLabel')}>
          <Select value={connectorType} onChange={(v) => setConnectorType(v as ConnectorType)} options={CONNECTORS} />
        </Field>
        <Field label={t('provisioning.connector.powerLabel')}>
          <Select value={String(powerKw)} onChange={(v) => setPowerKw(Number(v))} options={POWERS} />
        </Field>
        <Field label={t('provisioning.connector.displayNameLabel')}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('provisioning.connector.displayNamePlaceholder')}
            className="w-full rounded-[9px] border border-line px-[11px] py-[9px] text-[13px] focus:border-brand"
          />
        </Field>
        <p className="rounded-[9px] bg-chip px-3 py-2.5 text-[11.5px] leading-[1.5] text-muted">
          {t('provisioning.connector.createHelp')}
        </p>
      </div>

      <div className="mt-[18px] flex justify-end gap-2.5">
        <Button variant="secondary" onClick={onClose}>
          {t('provisioning.cancel')}
        </Button>
        <Button onClick={() => create.mutate()} disabled={create.isPending}>
          {create.isPending ? t('provisioning.submitting') : t('provisioning.connector.submitBtn')}
        </Button>
      </div>
    </Modal>
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
