import { useTranslation } from 'react-i18next';
import { useMemo, useState, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CHARGE_POINT_STATUS,
  useApi,
  type ChargePoint,
  type Connector,
  type ConnectorType,
  type Station,
} from '@chargeops/api';
import {
  Button,
  Card,
  EmptyState,
  FilterTabs,
  IconArrowLeft,
  IconBolt,
  IconCheck,
  IconLock,
  IconPin,
  IconPlusCircle,
  Modal,
  PageHeader,
  Pagination,
  QrGlyph,
  SearchInput,
  Select,
  Skeleton,
  StatusPill,
  useToast,
  type FilterTab,
} from '@chargeops/ui';

const CONNECTORS = [
  { value: 'CCS2', label: 'CCS2' },
  { value: 'CHAdeMO', label: 'CHAdeMO' },
  { value: 'Type2AC', label: 'Type 2 AC' },
  { value: 'GBT', label: 'GB/T' },
];
const POWERS = [22, 50, 60, 120, 150].map((p) => ({ value: String(p), label: `${p} kW` }));
const PAGE_SIZE = 8;

type ProvFilter = 'all' | 'needsSetup' | 'inProgress' | 'live';

interface StationRow {
  station: Station;
  chargePoints: number;
  unclaimed: number;
}

/**
 * FR14 — charger provisioning, station-first.
 *
 * A dropdown of stations does not survive a national footprint: with a few
 * hundred approved sites there is nothing to scroll toward, no way to tell two
 * "Trạm Hải Châu" apart, and no sane default to preselect. Admin does not browse
 * stations anyway — they arrive with a job ("this site was just approved, it
 * needs charge points"). So the station list *is* the screen: searchable by
 * name/city/address/operator and filterable by provisioning state, with the
 * charge-point workspace one click in.
 */
export function Provisioning() {
  const { t } = useTranslation('admin');
  const api = useApi();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  /**
   * Browse state lives here, not in StationPicker: drilling into a station
   * unmounts the picker, and losing your search/filter every time you finish
   * provisioning one site is exactly the friction this screen exists to remove.
   */
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ProvFilter>('all');
  const [page, setPage] = useState(0);

  const stationsQ = useQuery({ queryKey: ['stations', 'all'], queryFn: () => api.stations.all() });
  const chargePointsQ = useQuery({ queryKey: ['chargePoints', 'all'], queryFn: () => api.chargePoints.list() });
  const connectorsQ = useQuery({ queryKey: ['connectors', 'all'], queryFn: () => api.connectors.list() });

  const isLoading = stationsQ.isLoading || chargePointsQ.isLoading;

  /** Provisioning state per station, joined client-side. */
  const rows: StationRow[] = useMemo(() => {
    const cps = chargePointsQ.data ?? [];
    return (stationsQ.data ?? []).map((station) => {
      const mine = cps.filter((cp) => cp.stationId === station.id);
      return {
        station,
        chargePoints: mine.length,
        unclaimed: mine.filter((cp) => cp.status === 'unclaimed').length,
      };
    });
  }, [stationsQ.data, chargePointsQ.data]);

  const selected = rows.find((r) => r.station.id === selectedId) ?? null;

  if (selected) {
    return (
      <StationProvisioning
        station={selected.station}
        chargePoints={(chargePointsQ.data ?? []).filter((cp) => cp.stationId === selected.station.id)}
        connectors={connectorsQ.data ?? []}
        onBack={() => setSelectedId(null)}
      />
    );
  }

  return (
    <>
      <PageHeader title={t('console.nav.provisioning.title')} subtitle={t('console.nav.provisioning.subtitle')} />
      <FlowStrip />
      <StationPicker
        rows={rows}
        loading={isLoading}
        onSelect={setSelectedId}
        search={search}
        onSearch={setSearch}
        filter={filter}
        onFilter={setFilter}
        page={page}
        onPage={setPage}
      />
    </>
  );
}

/** FR14 sequence, stated once so the screen explains its own workflow. */
function FlowStrip() {
  const { t } = useTranslation('admin');
  return (
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
  );
}

function StationPicker({
  rows,
  loading,
  onSelect,
  search,
  onSearch,
  filter,
  onFilter,
  page,
  onPage,
}: {
  rows: StationRow[];
  loading: boolean;
  onSelect: (id: string) => void;
  search: string;
  onSearch: (v: string) => void;
  filter: ProvFilter;
  onFilter: (f: ProvFilter) => void;
  page: number;
  onPage: (p: number) => void;
}) {
  const { t } = useTranslation('admin');

  const matches = (r: StationRow, f: ProvFilter) =>
    f === 'all' ? true
    : f === 'needsSetup' ? r.chargePoints === 0
    : f === 'inProgress' ? r.unclaimed > 0
    : r.chargePoints > 0 && r.unclaimed === 0;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (!matches(r, filter)) return false;
      if (!q) return true;
      const { name, city, address, ownerName, id, stationCode } = r.station;
      return [name, city, address, ownerName, id, stationCode].filter(Boolean).some((v) => (v as string).toLowerCase().includes(q));
    });
  }, [rows, search, filter]);

  const tabs = useMemo<FilterTab<ProvFilter>[]>(
    () =>
      (['all', 'needsSetup', 'inProgress', 'live'] as const).map((k) => ({
        key: k,
        label: t(`provisioning.filters.${k}`),
        count: rows.filter((r) => matches(r, k)).length,
      })),
    [rows, t],
  );

  const reset = (fn: () => void) => {
    onPage(0);
    fn();
  };
  const pageRows = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <SearchInput
          value={search}
          onChange={(v) => reset(() => onSearch(v))}
          placeholder={t('provisioning.searchPlaceholder')}
          className="min-w-[240px] max-w-[380px] flex-1"
        />
        <span className="text-[12px] font-medium text-muted">
          {t('provisioning.resultCount', { count: filtered.length })}
        </span>
      </div>

      <div className="mb-3.5">
        <FilterTabs tabs={tabs} active={filter} onChange={(k) => reset(() => onFilter(k))} accent="brand" />
      </div>

      {loading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-[66px] rounded-card" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState>{t('provisioning.noStations')}</EmptyState>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          {pageRows.map(({ station, chargePoints, unclaimed }) => (
            <button
              key={station.id}
              onClick={() => onSelect(station.id)}
              className="flex w-full items-center gap-3 border-b border-hairline px-4 py-3 text-left last:border-b-0 hover:bg-row-hover"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-brand-soft">
                <IconPin size={16} className="text-brand" />
              </span>

              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-[13.5px] font-semibold">{station.name}</span>
                  <span className="font-mono text-[10.5px] font-semibold text-faint">{station.stationCode || station.id}</span>
                </span>
                {/* City + operator are what actually disambiguate near-identical names. */}
                <span className="mt-0.5 block truncate text-[11.5px] font-medium text-muted">
                  {station.city} · {station.address} · {station.ownerName}
                </span>
              </span>

              <span className="hidden shrink-0 text-right sm:block">
                <span className="block text-[12px] font-semibold text-body">
                  {t('provisioning.cpCount', { count: chargePoints })}
                </span>
                {unclaimed > 0 ? (
                  <span className="text-[11px] font-medium text-warn">
                    {t('provisioning.unclaimedCount', { count: unclaimed })}
                  </span>
                ) : chargePoints === 0 ? (
                  <span className="text-[11px] font-medium text-faint">{t('provisioning.filters.needsSetup')}</span>
                ) : (
                  <span className="flex items-center justify-end gap-1 text-[11px] font-medium text-good">
                    <IconCheck size={12} strokeWidth={2.4} />
                    {t('provisioning.allLive')}
                  </span>
                )}
              </span>
            </button>
          ))}
          <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onPage={onPage} />
        </Card>
      )}
    </>
  );
}

function StationProvisioning({
  station,
  chargePoints,
  connectors,
  onBack,
}: {
  station: Station;
  chargePoints: ChargePoint[];
  connectors: Connector[];
  onBack: () => void;
}) {
  const { t } = useTranslation('admin');
  const api = useApi();
  const qc = useQueryClient();
  const toast = useToast();
  const [addingTo, setAddingTo] = useState<ChargePoint | null>(null);
  const [creatingCp, setCreatingCp] = useState(false);

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
      <button
        onClick={onBack}
        className="mb-2.5 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-muted hover:text-body"
      >
        <IconArrowLeft size={14} strokeWidth={2.2} />
        {t('provisioning.backToStations')}
      </button>

      <Card className="mb-[13px] flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-[17px] font-bold">{station.name}</span>
            <span className="font-mono text-[11px] font-semibold text-faint">{station.stationCode || station.id}</span>
          </div>
          <div className="mt-1 truncate text-[12px] font-medium text-muted">
            {station.city} · {station.address} · {station.ownerName}
          </div>
        </div>
        <Button icon={<IconPlusCircle size={15} strokeWidth={2} />} onClick={() => setCreatingCp(true)}>
          {t('provisioning.chargePoint.createBtn')}
        </Button>
      </Card>

      <div className="mb-[11px] flex items-center justify-between">
        <div className="text-[15px] font-semibold">{t('provisioning.cpListTitle')}</div>
        <span className="text-[12px] font-medium text-muted">
          {t('provisioning.recordsCount', { count: chargePoints.length })}
        </span>
      </div>

      {chargePoints.length === 0 ? (
        <Card>
          <EmptyState>{t('provisioning.empty', { station: station.name })}</EmptyState>
        </Card>
      ) : (
        <div className="flex flex-col gap-[11px]">
          {chargePoints.map((cp) => (
            <ChargePointCard
              key={cp.id}
              chargePoint={cp}
              connectors={connectors.filter((c) => c.chargePointId === cp.id)}
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
          stationId={station.id}
          stationName={station.name}
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

      <div className="border-t border-hairline bg-surface-2 px-3 py-2.5">
        {connectors.length === 0 ? (
          <div className="flex items-start gap-2 rounded-[9px] border border-warn-border bg-warn-soft px-3 py-2.5 text-[11.5px] font-medium leading-[1.5] text-warn-deep">
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
