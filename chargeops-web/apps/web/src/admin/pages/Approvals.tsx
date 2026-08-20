import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDateVn, formatDateTimeVn, useApi, type StationApprovalSummary } from '@chargeops/api';
import { Button, Card, IconClipboardCheck, IconInfo, IconShieldCheck, PageHeader, Skeleton, StatusPill, useToast } from '@chargeops/ui';
import { RejectModal } from '../features/approvals/RejectModal';
import { ApproveModal } from '../features/approvals/ApproveModal';
import { IssueLicenseModal } from '../features/approvals/IssueLicenseModal';

import { getApiErrorMessage } from '../../i18n';

/** FR12 — admin reviews pending station registrations, approve or reject. */
export function Approvals() {
  const { t } = useTranslation('admin');
  const api = useApi();
  const qc = useQueryClient();
  const toast = useToast();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [issueOpen, setIssueOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['approvals'],
    queryFn: () => api.stations.approvals(),
  });

  const rows = data ?? [];
  const selected = rows.find((s) => s.id === selectedId) ?? rows[0] ?? null;

  const approve = useMutation({
    mutationFn: (id: string) => api.stations.approve(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['approvals'] });
      qc.invalidateQueries({ queryKey: ['approvals', 'detail'] });
      toast(t('approvals.toastApproved', { name: selected?.name || 'Trạm' }), 'success');
      setApproveOpen(false);
      setSelectedId(null);
    },
    onError: (e) => toast(getApiErrorMessage(e), 'error'),
  });

  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => api.stations.reject(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['approvals'] });
      qc.invalidateQueries({ queryKey: ['approvals', 'detail'] });
      toast(t('approvals.toastRejected', { name: selected?.name || 'Trạm' }), 'success');
      setRejectOpen(false);
      setSelectedId(null);
    },
    onError: (e) => toast(getApiErrorMessage(e), 'error'),
  });

  const issueLicense = useMutation({
    mutationFn: ({ stationId, plan }: { stationId: string; plan: 'MONTHLY' | 'YEARLY' }) =>
      api.licenses.issue(stationId, { plan }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['approvals'] });
      qc.invalidateQueries({ queryKey: ['approvals', 'detail', selected?.id] });
      qc.invalidateQueries({ queryKey: ['licenses'] });
      toast(t('approvals.toastIssued', { name: selected?.name || 'trạm', defaultValue: `Đã ghi nhận & kích hoạt License thành công cho ${selected?.name || 'trạm'}` }), 'success');
      setIssueOpen(false);
    },
    onError: (e) => toast(getApiErrorMessage(e), 'error'),
  });

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
                  const owner = s.ownerDisplayName || s.ownerName || '—';
                  const city = s.provinceName || s.city || '—';
                  const count = s.plannedChargePointCount ?? s.chargerCount ?? 0;
                  return (
                    <div
                      key={s.id}
                      onClick={() => setSelectedId(s.id)}
                      className="grid cursor-pointer items-center border-b border-hairline px-3.5 py-3 text-[12px] font-medium hover:bg-row-hover"
                      style={{
                        gridTemplateColumns: '0.9fr 1.5fr 1.4fr 1fr 0.6fr',
                        background: on ? 'var(--color-row-hover)' : undefined,
                        borderLeft: `3px solid ${on ? '#5b54e8' : 'transparent'}`,
                      }}
                    >
                      <span className="font-mono text-[10.5px] font-semibold text-brand">{s.stationCode || s.id}</span>
                      <span className="font-semibold">{s.name}</span>
                      <span className="text-muted">{owner}</span>
                      <span className="text-muted">{city}</span>
                      <span className="text-center text-muted">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* detail panel */}
          {selected && (
            <ApprovalDetail
              station={selected}
              approving={approve.isPending}
              issuing={issueLicense.isPending}
              onApprove={() => setApproveOpen(true)}
              onReject={() => setRejectOpen(true)}
              onIssue={() => setIssueOpen(true)}
            />
          )}
        </div>
      )}

      {selected && (
        <IssueLicenseModal
          open={issueOpen}
          station={selected}
          pending={issueLicense.isPending}
          onClose={() => setIssueOpen(false)}
          onConfirm={({ plan }) =>
            issueLicense.mutate({ stationId: selected.id, plan })
          }
        />
      )}

      {selected && (
        <ApproveModal
          open={approveOpen}
          station={selected}
          pending={approve.isPending}
          onClose={() => setApproveOpen(false)}
          onConfirm={() => approve.mutate(selected.id)}
        />
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
  issuing,
  onApprove,
  onReject,
  onIssue,
}: {
  station: StationApprovalSummary;
  approving: boolean;
  issuing: boolean;
  onApprove: () => void;
  onReject: () => void;
  onIssue: () => void;
}) {
  const { t } = useTranslation('admin');
  const api = useApi();
  const [showHistory, setShowHistory] = useState(false);

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ['approvals', 'detail', station.id],
    queryFn: () => api.stations.approvalDetail(station.id),
  });

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ['stations', 'history', station.id],
    queryFn: () => api.stations.statusHistory(station.id),
    enabled: showHistory,
  });

  const owner = detail?.ownerDisplayName || station.ownerDisplayName || station.ownerName || '—';
  const city = detail?.provinceName || station.provinceName || station.city || '';
  const fullAddress = detail
    ? [detail.addressLine, detail.wardName, detail.provinceName].filter(Boolean).join(', ')
    : detailLoading
      ? 'Đang tải địa chỉ…'
      : [station.provinceName || station.city].filter(Boolean).join(', ') || '—';
  const count = detail?.plannedChargePointCount ?? station.plannedChargePointCount ?? station.chargerCount ?? 0;
  const hasActiveLicense = Boolean(detail?.licenseSubmitted);

  const licenseValue = detailLoading
    ? 'Đang kiểm tra…'
    : hasActiveLicense
      ? t('approvals.detail.submittedVal', { defaultValue: 'Đang hoạt động ✓' })
      : 'Chưa có license đang hiệu lực';
  const licenseClass = detailLoading
    ? 'font-medium text-faint'
    : hasActiveLicense
      ? 'font-semibold text-good'
      : 'font-semibold text-warn';

  return (
    <Card className="p-[17px]">
      <div className="mb-1 flex items-center justify-between">
        <div className="text-[10px] font-semibold uppercase tracking-[0.05em] text-faint">{t('approvals.detail.title', { id: station.stationCode || station.id })}</div>
        <StatusPill tone="warn" label={t('approvals.detail.statusPending')} />
      </div>
      <div className="mt-1.5 text-[17px] font-bold">{detail?.name || station.name}</div>
      <div className="mb-[15px] text-[13px] font-medium text-muted">
        {owner} {city ? `· ${city}` : ''}
      </div>
      <div className="mb-[15px] flex flex-col gap-[9px] text-[12.5px] font-medium">
        <DetailRow label={t('approvals.detail.address')} value={fullAddress} border />
        <DetailRow label={t('approvals.detail.proposedChargers')} value={t('approvals.detail.proposedChargersVal', { count })} border />
        <DetailRow
          label={t('approvals.detail.license')}
          value={licenseValue}
          valueClass={licenseClass}
          border
        />
        <DetailRow
          label={t('approvals.detail.submittedAt')}
          value={detail?.submittedAt ? formatDateVn(detail.submittedAt) : station.submittedAt ? formatDateVn(station.submittedAt) : '—'}
        />
      </div>

      {/* Assets / Documents */}
      <div className="mb-3.5 flex flex-col gap-2">
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.05em] text-faint">
          {t('approvals.detail.documents', { defaultValue: 'Hồ sơ & Tài liệu đính kèm' })}
          {detail?.assets?.length ? ` (${detail.assets.length})` : ''}
        </div>
        {detailLoading ? (
          <div className="flex h-[54px] items-center justify-center gap-[7px] rounded-[9px] border border-line-2 bg-surface-2 font-mono text-[11px] text-faint">
            <span>Đang tải danh sách tài liệu...</span>
          </div>
        ) : detail?.assets && detail.assets.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {detail.assets.map((asset, idx) => (
              <a
                key={idx}
                href={asset.assetUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-[8px] border border-line bg-surface-2 p-2 text-[11.5px] transition-colors hover:border-brand hover:bg-surface-3"
              >
                {asset.assetType === 'IMAGE' ? (
                  <img
                    src={asset.assetUrl}
                    alt={asset.altText || 'Station asset'}
                    className="h-10 w-10 shrink-0 rounded object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-brand/10 text-brand">
                    <IconClipboardCheck size={18} />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold text-ink">{asset.altText || asset.assetType}</div>
                  <div className="text-[10px] text-faint">{asset.isPrimary ? 'Ảnh chính' : asset.assetType}</div>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="flex h-[54px] items-center justify-center gap-[7px] rounded-[9px] border border-dashed border-line font-mono text-[11px] text-ghost">
            <IconClipboardCheck size={15} className="text-ghost" />
            <span>Chưa có tài liệu đính kèm</span>
          </div>
        )}
      </div>

      {/* Audit & Status History Expandable Section */}
      <div className="mb-4 border-t border-hairline pt-3">
        <button
          type="button"
          onClick={() => setShowHistory(!showHistory)}
          className="flex w-full items-center justify-between text-[12px] font-semibold text-brand hover:underline"
        >
          <span>{t('approvals.detail.auditHistory', { defaultValue: 'Lịch sử thay đổi trạng thái' })}</span>
          <span className="text-[11px] text-faint">{showHistory ? '▲' : '▼'}</span>
        </button>

        {showHistory && (
          <div className="mt-2.5 flex flex-col gap-2 rounded-[8px] border border-line-2 bg-surface-2 p-2.5 text-[11.5px]">
            {historyLoading ? (
              <div className="py-2 text-center text-faint">Đang tải lịch sử...</div>
            ) : !history || history.length === 0 ? (
              <div className="py-2 text-center text-faint">Chưa có lịch sử trạng thái</div>
            ) : (
              history.map((h) => {
                const eventLabels: Record<string, { label: string; tone: string }> = {
                  SUBMITTED: { label: 'Đã nộp hồ sơ', tone: 'text-brand' },
                  APPROVED: { label: 'Đã phê duyệt', tone: 'text-good' },
                  REJECTED: { label: 'Từ chối duyệt', tone: 'text-bad-deep' },
                  RESUBMITTED: { label: 'Đã nộp lại', tone: 'text-brand' },
                  SUSPENDED: { label: 'Tạm ngưng', tone: 'text-warn-deep' },
                  REACTIVATED: { label: 'Kích hoạt lại', tone: 'text-good' },
                  WITHDRAWN: { label: 'Rút đơn', tone: 'text-faint' },
                };
                const ev = eventLabels[h.eventType] ?? { label: h.eventType, tone: 'text-ink' };

                return (
                  <div key={h.id} className="border-b border-hairline pb-2.5 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <span className={`font-bold ${ev.tone}`}>{ev.label}</span>
                      <span className="font-mono text-[10.5px] text-faint">{formatDateTimeVn(h.performedAt)}</span>
                    </div>
                    <div className="mt-0.5 text-[11px] text-muted">
                      <span>Bởi: </span>
                      <span className="font-semibold text-ink">{h.performedByName}</span>
                      {h.performedByEmail && <span className="text-faint"> ({h.performedByEmail})</span>}
                      {h.performedByRole && (
                        <span className="ml-1 rounded bg-surface px-1.5 py-0.5 text-[10px] font-medium text-faint">
                          {h.performedByRole}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-1 font-mono text-[10.5px] text-faint">
                      <span>{h.fromStatus || '—'}</span>
                      <span>→</span>
                      <span className="font-bold text-ink">{h.toStatus}</span>
                    </div>
                    {h.reason && (
                      <div className="mt-1.5 rounded bg-bad-soft p-2 text-[11px] text-bad-deep">
                        <span className="font-semibold">Lý do: </span>
                        {h.reason}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Action Buttons Matrix per 4.1 & 9.1 */}
      <div className="flex flex-col gap-[9px]">
        {hasActiveLicense ? (
          <>
            <Button fullWidth onClick={onApprove} disabled={approving || detailLoading}>
              {approving ? t('approvals.detail.approving') : t('approvals.detail.approveBtn')}
            </Button>
            <Button variant="danger-soft" fullWidth onClick={onReject}>
              {t('approvals.detail.rejectBtn')}
            </Button>
          </>
        ) : (
          <>
            <Button fullWidth variant="primary" onClick={onIssue} disabled={issuing || detailLoading}>
              {issuing ? t('approvals.detail.issuing', { defaultValue: 'Đang ghi nhận…' }) : t('approvals.detail.issueBtn', { defaultValue: 'Ghi nhận & kích hoạt license' })}
            </Button>
            <div className="rounded-[8px] border border-warn-border bg-warn-soft/40 p-2.5 text-[11.5px] leading-relaxed text-warn-deep">
              <div className="flex items-center gap-1.5 font-semibold">
                <IconInfo size={14} className="shrink-0 text-warn" />
                <span>Trạm chưa có active license</span>
              </div>
              <div className="mt-0.5 text-[11px] opacity-90">
                {t('approvals.detail.licenseRequiredHint', {
                  defaultValue: 'Cần cấp gói Giấy phép (License) trước khi có thể duyệt hồ sơ trạm.',
                })}
              </div>
            </div>
            <Button variant="danger-soft" fullWidth onClick={onReject}>
              {t('approvals.detail.rejectBtn')}
            </Button>
          </>
        )}
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
