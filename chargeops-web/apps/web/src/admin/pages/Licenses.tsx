import { useTranslation } from 'react-i18next';
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  formatDateVn,
  formatVnd,
  formatVndCompact,
  LICENSE_STATUS,
  useApi,
  type License,
  type LicenseStatus,
} from '@chargeops/api';
import {
  Button,
  Card,
  EmptyState,
  FilterTabs,
  IconAlertTriangle,
  IconCheckCircle,
  IconClock,
  IconInfo,
  IconRefreshCw,
  IconShield,
  IconX,
  MetricCard,
  MoreMenu,
  PageHeader,
  SearchInput,
  Skeleton,
  StatusPill,
  useToast,
  type FilterTab,
  type MoreMenuItem,
} from '@chargeops/ui';
import { RenewLicenseModal } from '../features/licenses/RenewLicenseModal';
import { LicenseActionModal, type LicenseActionType } from '../features/licenses/LicenseActionModal';
import { LicenseHistoryDrawer } from '../features/licenses/LicenseHistoryDrawer';
import { getApiErrorMessage } from '../../i18n';

type FilterKey = 'all' | 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'EXPIRED' | 'CANCELLED';

const GRID_COLS = '1.3fr 1.6fr 1.1fr 1fr 1.4fr 1fr 0.9fr 0.9fr';

/** Admin license monitoring + manual renewal recording (purchase is off-platform). */
export function Licenses() {
  const { t } = useTranslation('admin');
  const api = useApi();
  const qc = useQueryClient();
  const toast = useToast();
  const [filter, setFilter] = useState<FilterKey>('all');
  const [search, setSearch] = useState('');

  // Modal states
  const [renewLicense, setRenewLicense] = useState<License | null>(null);
  const [actionState, setActionState] = useState<{ type: LicenseActionType; license: License } | null>(null);
  const [historyStation, setHistoryStation] = useState<{ id: string; name?: string } | null>(null);

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['licenses'],
    queryFn: () => api.licenses.list(),
  });

  const recordRenewal = useMutation({
    mutationFn: ({ stationId, plan, feeAmount }: { stationId: string; plan: 'MONTHLY' | 'YEARLY'; feeAmount: number }) =>
      api.licenses.recordRenewal(stationId, { plan, feeAmount }),
    onSuccess: (l) => {
      qc.invalidateQueries({ queryKey: ['licenses'] });
      qc.invalidateQueries({ queryKey: ['licenses', 'history', l.stationId] });
      toast(t('licenses.toastRenewal', { name: l.stationName || l.stationId, defaultValue: `Đã ghi nhận gia hạn License cho ${l.stationName || l.stationId}` }), 'success');
      setRenewLicense(null);
    },
    onError: (e) => {
      qc.invalidateQueries({ queryKey: ['licenses'] });
      toast(getApiErrorMessage(e), 'error');
    },
  });

  const executeAction = useMutation({
    mutationFn: async () => {
      if (!actionState) return;
      const { type, license } = actionState;
      if (type === 'suspend') return api.licenses.suspend(license.stationId, license.id);
      if (type === 'activate') return api.licenses.activate(license.stationId, license.id);
      if (type === 'cancel') return api.licenses.cancel(license.stationId, license.id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['licenses'] });
      if (actionState) {
        qc.invalidateQueries({ queryKey: ['licenses', 'history', actionState.license.stationId] });
        qc.invalidateQueries({ queryKey: ['approvals'] });
      }
      toast('Thao tác cập nhật trạng thái License thành công.', 'success');
      setActionState(null);
    },
    onError: (e) => {
      qc.invalidateQueries({ queryKey: ['licenses'] });
      toast(getApiErrorMessage(e), 'error');
      setActionState(null);
    },
  });

  const all = data ?? [];

  const normalizeStatus = (status: LicenseStatus): 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'EXPIRED' | 'CANCELLED' => {
    const s = String(status).toUpperCase();
    if (s === 'ACTIVE') return 'ACTIVE';
    if (s === 'PENDING') return 'PENDING';
    if (s === 'SUSPENDED') return 'SUSPENDED';
    if (s === 'CANCELLED') return 'CANCELLED';
    if (s === 'EXPIRED' || s === 'EXPIRING') return 'EXPIRED';
    return 'ACTIVE';
  };

  const q = search.trim().toLowerCase();
  const rows = all.filter((l) => {
    const st = normalizeStatus(l.status);
    const matchesFilter = filter === 'all' || st === filter;
    const matchesSearch =
      !q ||
      l.id.toLowerCase().includes(q) ||
      l.stationId.toLowerCase().includes(q) ||
      (l.stationName && l.stationName.toLowerCase().includes(q)) ||
      (l.ownerName && l.ownerName.toLowerCase().includes(q));
    return matchesFilter && matchesSearch;
  });

  // Renewal queue: ONLY active <= 30 days and expired licenses! (Section 3, 5.1, 12)
  const renewalQueue = all.filter((l) => {
    const st = normalizeStatus(l.status);
    if (st === 'EXPIRED') return true;
    if (st === 'ACTIVE') {
      const days = l.daysLeft ?? 999;
      return l.expiringSoon || days <= 30;
    }
    return false;
  });

  const totalFeeRecorded = useMemo(
    () => all.reduce((sum, l) => sum + (l.feeAmount ?? l.priceVnd ?? 0), 0),
    [all],
  );

  const activeCount = all.filter((l) => normalizeStatus(l.status) === 'ACTIVE').length;

  const tabs = useMemo<FilterTab<FilterKey>[]>(() => {
    const count = (k: FilterKey) =>
      k === 'all' ? all.length : all.filter((l) => normalizeStatus(l.status) === k).length;
    return [
      { key: 'all', label: 'Tất cả', count: count('all') },
      { key: 'ACTIVE', label: 'Hoạt động', count: count('ACTIVE') },
      { key: 'PENDING', label: 'Chờ hiệu lực', count: count('PENDING') },
      { key: 'SUSPENDED', label: 'Tạm ngưng', count: count('SUSPENDED') },
      { key: 'EXPIRED', label: 'Hết hạn', count: count('EXPIRED') },
      { key: 'CANCELLED', label: 'Đã hủy', count: count('CANCELLED') },
    ];
  }, [all]);

  return (
    <>
      <div className="flex flex-col gap-4">
        {/* Page Header with Action Button */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <PageHeader
            title={t('console.nav.licenses.title', { defaultValue: 'Quản lý Giấy phép (License)' })}
            subtitle={t('console.nav.licenses.subtitle', {
              defaultValue: 'Quản lý subscription License theo trạm, theo dõi hiệu lực và ghi nhận mua/gia hạn đã được xác minh ngoài nền tảng.',
            })}
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-1.5"
          >
            <IconRefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
            <span>Làm mới</span>
          </Button>
        </div>

        {error ? (
          <Card className="border-bad-border bg-bad-soft p-5 text-[13px] font-medium text-bad-deep">
            {t('licenses.error', { message: (error as Error).message })}
          </Card>
        ) : isLoading || !data ? (
          <div className="grid gap-3.5">
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-[96px] rounded-card" />
              ))}
            </div>
            <Skeleton className="h-[360px] rounded-card" />
          </div>
        ) : (
          <>
            {/* Top Metric Cards */}
            <div className="grid grid-cols-2 gap-[13px] xl:grid-cols-4">
              <MetricCard
                label="Tổng số License"
                value={String(all.length)}
                accent="#5b54e8"
              />
              <MetricCard
                label="Đang hoạt động"
                value={String(activeCount)}
                accent="#0d8a5a"
              />
              <MetricCard
                label="Cần gia hạn / Xử lý"
                value={String(renewalQueue.length)}
                accent="#9a6b16"
              />
              <MetricCard
                label="Phí License đã ghi nhận"
                value={formatVndCompact(totalFeeRecorded)}
                accent="#10111a"
              />
            </div>

            {/* Operational Panel & Renewal Queue */}
            <div className="grid gap-[13px] lg:grid-cols-[1.5fr_1fr]">
              {/* Renewal Queue */}
              <Card className="p-4 flex flex-col justify-between">
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <IconClock size={16} className="text-warn" />
                      <span className="text-[13px] font-semibold text-ink">Hàng đợi gia hạn</span>
                    </div>
                    <span className="rounded-full bg-warn-soft px-2 py-0.5 text-[10.5px] font-bold text-warn-deep">
                      {renewalQueue.length} trạm
                    </span>
                  </div>
                  <div className="mb-3 text-[11.5px] text-muted">
                    Các License đang hoạt động còn ≤ 30 ngày hoặc đã hết hạn cần tạo kỳ hạn mới.
                  </div>

                  {renewalQueue.length === 0 ? (
                    <div className="py-8 text-center text-[12.5px] font-medium text-faint">
                      Tất cả các trạm đang hoạt động đều có hạn trên 30 ngày.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
                      {renewalQueue.map((l) => {
                        const isYear = String(l.plan).toUpperCase() === 'YEARLY';
                        const days = l.daysLeft ?? 0;
                        const isExpired = normalizeStatus(l.status) === 'EXPIRED';

                        return (
                          <div
                            key={l.id}
                            className="flex items-center justify-between gap-2.5 rounded-[9px] border border-line-2 bg-surface-2 p-2.5 transition-colors hover:border-line"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="truncate text-[12.5px] font-semibold text-ink">
                                  {l.stationName || l.stationId}
                                </span>
                                <span className="font-mono text-[10.5px] text-faint">({l.stationId})</span>
                              </div>
                              <div className="mt-0.5 text-[11px] text-muted">
                                {l.ownerName || 'Chủ trạm'} · {isYear ? 'Gói Năm' : 'Gói Tháng'}
                              </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              <StatusPill
                                tone={isExpired ? 'bad' : 'warn'}
                                label={isExpired ? 'Đã hết hạn' : `Còn ${days} ngày`}
                              />
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => setRenewLicense(l)}
                                className="h-[30px] px-2.5 text-[11.5px]"
                              >
                                Gia hạn
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </Card>

              {/* Policy & Operational Guidance Card */}
              <Card className="p-4 flex flex-col justify-between bg-surface">
                <div>
                  <div className="flex items-center gap-2 text-[13px] font-semibold text-ink">
                    <IconInfo size={16} className="text-brand" />
                    <span>Quy định Subscription License</span>
                  </div>
                  <div className="mt-3 flex flex-col gap-2 text-[12px] leading-relaxed text-body">
                    <div className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                      <span>
                        <b>Ngoài nền tảng:</b> Chủ trạm thanh toán mua hoặc gia hạn gói trực tiếp với đơn vị vận hành.
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                      <span>
                        <b>Trong ChargeOps:</b> Admin xác minh thông tin và ghi nhận gói để kích hoạt quyền vận hành trạm.
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-warn" />
                      <span>
                        <b>Hiệu lực:</b> Trạm hết hạn License sẽ tự động ngưng nhận đặt chỗ mới theo quy định BR-STA-01.
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 rounded-[8px] border border-hairline bg-surface-2 p-2.5 text-[11px] text-faint">
                  Tổng phí đã ghi nhận: <span className="font-semibold text-ink">{formatVnd(totalFeeRecorded)}</span>
                </div>
              </Card>
            </div>

            {/* Filter Tabs & Search Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <FilterTabs tabs={tabs} active={filter} onChange={setFilter} accent="brand" />
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Tìm theo trạm, chủ trạm, mã license…"
                className="w-[280px]"
              />
            </div>

            {/* Data Table */}
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <div className="min-w-[860px]">
                  <div
                    className="grid bg-surface-2 px-4 py-[11px] text-[10px] font-semibold uppercase tracking-[0.07em] text-faint"
                    style={{ gridTemplateColumns: GRID_COLS }}
                  >
                    <span>MÃ LICENSE</span>
                    <span>TRẠM SẠC</span>
                    <span>CHỦ SỞ HỮU</span>
                    <span>GÓI</span>
                    <span>THỜI HẠN HIỆU LỰC</span>
                    <span>PHÍ GHI NHẬN</span>
                    <span>TRẠNG THÁI</span>
                    <span className="text-right">THAO TÁC</span>
                  </div>

                  {rows.length === 0 ? (
                    <EmptyState
                      title="Không tìm thấy License"
                      description={
                        search
                          ? `Không có kết quả nào khớp với từ khóa "${search}".`
                          : 'Chưa có gói giấy phép nào trong mục này.'
                      }
                      className="py-12"
                    />
                  ) : (
                    rows.map((l) => (
                      <LicenseRow
                        key={l.id}
                        license={l}
                        onRenew={() => setRenewLicense(l)}
                        onViewHistory={() => setHistoryStation({ id: l.stationId, name: l.stationName })}
                        onSuspend={() => setActionState({ type: 'suspend', license: l })}
                        onActivate={() => setActionState({ type: 'activate', license: l })}
                        onCancel={() => setActionState({ type: 'cancel', license: l })}
                      />
                    ))
                  )}
                </div>
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Renew Modal */}
      {renewLicense && (
        <RenewLicenseModal
          open={Boolean(renewLicense)}
          license={renewLicense}
          pending={recordRenewal.isPending}
          onClose={() => setRenewLicense(null)}
          onConfirm={(data) => recordRenewal.mutate(data)}
        />
      )}

      {/* Action Confirmation Modal (Suspend, Reactivate, Cancel) */}
      {actionState && (
        <LicenseActionModal
          open={Boolean(actionState)}
          type={actionState.type}
          license={actionState.license}
          pending={executeAction.isPending}
          onClose={() => setActionState(null)}
          onConfirm={() => executeAction.mutate()}
        />
      )}

      {/* History Drawer Modal */}
      {historyStation && (
        <LicenseHistoryDrawer
          open={Boolean(historyStation)}
          stationId={historyStation.id}
          stationName={historyStation.name}
          onClose={() => setHistoryStation(null)}
        />
      )}
    </>
  );
}

function LicenseRow({
  license: l,
  onRenew,
  onViewHistory,
  onSuspend,
  onActivate,
  onCancel,
}: {
  license: License;
  onRenew: () => void;
  onViewHistory: () => void;
  onSuspend: () => void;
  onActivate: () => void;
  onCancel: () => void;
}) {
  const meta = LICENSE_STATUS[l.status] || { label: l.status, tone: 'neutral' };
  const isYear = String(l.plan).toUpperCase() === 'YEARLY';
  const start = l.startAt || l.startDate;
  const expiry = l.expiresAt || l.expiryDate;
  const fee = l.feeAmount ?? l.priceVnd ?? 0;
  const normStatus = String(l.status).toUpperCase();
  const isExpired = normStatus === 'EXPIRED';
  const isActive = normStatus === 'ACTIVE';
  const isSuspended = normStatus === 'SUSPENDED';
  const isPending = normStatus === 'PENDING';
  const days = l.daysLeft ?? 999;
  const canRenew = isExpired || (isActive && (days <= 30 || l.expiringSoon));

  const menuItems = useMemo<MoreMenuItem[]>(() => {
    const items: MoreMenuItem[] = [
      {
        key: 'history',
        label: 'Lịch sử trạm',
        icon: <IconShield size={15} />,
        onClick: onViewHistory,
      },
    ];

    if (isActive) {
      items.push({
        key: 'suspend',
        label: 'Tạm ngưng License',
        icon: <IconAlertTriangle size={15} />,
        onClick: onSuspend,
      });
    }

    if (isSuspended) {
      items.push({
        key: 'activate',
        label: 'Kích hoạt lại License',
        icon: <IconCheckCircle size={15} />,
        onClick: onActivate,
      });
    }

    if (isActive || isPending || isSuspended) {
      items.push({
        key: 'cancel',
        label: 'Hủy bỏ License',
        icon: <IconX size={15} />,
        tone: 'danger',
        onClick: onCancel,
      });
    }

    return items;
  }, [isActive, isPending, isSuspended, onViewHistory, onSuspend, onActivate, onCancel]);

  return (
    <div
      className="grid items-center border-b border-hairline px-4 py-3 text-[12.5px] font-medium transition-colors hover:bg-row-hover"
      style={{ gridTemplateColumns: GRID_COLS }}
    >
      {/* License Code */}
      <div>
        <span className="font-mono text-[11.5px] font-bold text-brand">{l.id}</span>
      </div>

      {/* Station Name & Code */}
      <div className="min-w-0 pr-2">
        <div className="truncate font-semibold text-ink">{l.stationName || l.stationId}</div>
        <div className="font-mono text-[11px] text-faint">{l.stationId}</div>
      </div>

      {/* Owner Name */}
      <div className="truncate text-muted pr-2">{l.ownerName || '—'}</div>

      {/* Plan */}
      <div>
        <span className="rounded-[6px] bg-surface-2 px-2 py-0.5 text-[11.5px] font-semibold text-body">
          {isYear ? 'Gói Năm' : 'Gói Tháng'}
        </span>
      </div>

      {/* Validity Period */}
      <div className="text-[11.5px]">
        <div className="text-body font-medium">
          {start ? formatDateVn(start) : '—'} → <span className="font-semibold text-ink">{expiry ? formatDateVn(expiry) : '—'}</span>
        </div>
        {isActive && days <= 30 && (
          <div className="mt-0.5 text-[10.5px] font-semibold text-warn-deep">
            {days < 0 ? `Quá hạn ${-days} ngày` : `Còn ${days} ngày`}
          </div>
        )}
      </div>

      {/* Fee Amount */}
      <div className="font-mono font-bold text-ink">
        {fee > 0 ? formatVnd(fee) : '—'}
      </div>

      {/* Status */}
      <div>
        <StatusPill tone={meta.tone} label={meta.label} />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-1.5">
        {canRenew && (
          <Button
            size="sm"
            variant="primary"
            onClick={onRenew}
            className="h-[28px] px-2.5 text-[11.5px]"
          >
            Gia hạn
          </Button>
        )}

        <MoreMenu items={menuItems} align="right" />
      </div>
    </div>
  );
}
