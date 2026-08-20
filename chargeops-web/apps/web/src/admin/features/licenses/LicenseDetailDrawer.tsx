import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  Button,
  Card,
  Drawer,
  EmptyState,
  IconAlertTriangle,
  IconCheck,
  IconCheckCircle,
  IconClock,
  IconCopy,
  IconRefreshCw,
  IconX,
  SegmentedControl,
  Skeleton,
  StatusPill,
  useToast,
} from '@chargeops/ui';
import {
  formatDateVn,
  formatVnd,
  LICENSE_STATUS,
  useApi,
  type License,
  type LicenseStatus,
  type LicenseStatusEventDto,
} from '@chargeops/api';

export interface LicenseDetailDrawerProps {
  open: boolean;
  licenseId: string | null;
  initialData?: License | null;
  onClose: () => void;
  onRenew?: (license: License) => void;
  onSuspend?: (license: License) => void;
  onActivate?: (license: License) => void;
  onCancel?: (license: License) => void;
}

type HistoryTab = 'status-events' | 'station-periods';

export function LicenseDetailDrawer({
  open,
  licenseId,
  initialData,
  onClose,
  onRenew,
  onSuspend,
  onActivate,
  onCancel,
}: LicenseDetailDrawerProps) {
  const { t } = useTranslation('admin');
  const api = useApi();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<HistoryTab>('status-events');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Fetch full detail of the selected license
  const {
    data: licenseData,
    isLoading: isLicenseLoading,
  } = useQuery({
    queryKey: ['licenses', 'detail', licenseId],
    queryFn: () => (licenseId ? api.licenses.detail(licenseId) : Promise.reject('No ID')),
    enabled: Boolean(licenseId) && open,
    initialData: initialData && initialData.id === licenseId ? initialData : undefined,
  });

  const license = licenseData || initialData;

  // Fetch status event audit timeline
  const {
    data: statusEvents,
    isLoading: isEventsLoading,
  } = useQuery({
    queryKey: ['licenses', 'statusEvents', licenseId],
    queryFn: () => (licenseId ? api.licenses.statusEvents(licenseId) : Promise.resolve([])),
    enabled: Boolean(licenseId) && open,
  });

  // Fetch station subscription periods
  const {
    data: stationPeriods,
    isLoading: isPeriodsLoading,
  } = useQuery({
    queryKey: ['licenses', 'history', license?.stationId],
    queryFn: () => (license?.stationId ? api.licenses.history(license.stationId) : Promise.resolve([])),
    enabled: Boolean(license?.stationId) && open,
  });

  if (!licenseId) return null;

  const copyToClipboard = (text: string, key: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast(`Đã sao chép ${label}`, 'success');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const normStatus = String(license?.status || 'ACTIVE').toUpperCase() as LicenseStatus;
  const meta = LICENSE_STATUS[normStatus] || { label: normStatus, tone: 'neutral' };
  const isYear = String(license?.plan).toUpperCase() === 'YEARLY';
  const start = license?.startAt || license?.startDate;
  const expiry = license?.expiresAt || license?.expiryDate;
  const fee = license?.feeAmount ?? license?.priceVnd ?? (isYear ? 5000000 : 500000);
  const days = license?.daysLeft ?? 0;
  const canRenew = normStatus === 'EXPIRED' || (normStatus === 'ACTIVE' && (days <= 30 || license?.expiringSoon));

  const displayCode = license?.licenseCode || license?.id || '—';

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width="540px"
      title={
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[16px] font-bold text-brand">{displayCode}</span>
            <button
              type="button"
              onClick={() => copyToClipboard(displayCode, 'code', 'Mã License')}
              className="flex h-6 w-6 items-center justify-center rounded border border-line bg-surface text-faint hover:bg-chip hover:text-ink transition"
              title="Sao chép mã License"
            >
              {copiedKey === 'code' ? <IconCheck size={13} className="text-good" /> : <IconCopy size={13} />}
            </button>
            <StatusPill tone={meta.tone} label={meta.label} />
          </div>
          <div className="text-[12px] text-muted">
            {license?.stationName || 'Trạm sạc'} ·{' '}
            <span className="font-mono font-medium text-faint">({license?.stationCode || license?.stationId})</span>
          </div>
        </div>
      }
    >
      {isLicenseLoading && !license ? (
        <div className="flex flex-col gap-3 py-4">
          <Skeleton className="h-28 w-full rounded-[10px]" />
          <Skeleton className="h-40 w-full rounded-[10px]" />
          <Skeleton className="h-32 w-full rounded-[10px]" />
        </div>
      ) : !license ? (
        <EmptyState title="Không tìm thấy thông tin" description="Giấy phép này không tồn tại hoặc đã bị xóa." />
      ) : (
        <div className="flex flex-col gap-4">
          {/* Section 1: Overview & Financial Snapshot */}
          <div className="rounded-[10px] border border-line-2 bg-surface-2 p-3.5">
            <div className="mb-2.5 flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-faint">
                Thông tin gói & Hiệu lực
              </span>
              <span className="rounded bg-surface px-2 py-0.5 text-[11px] font-semibold text-body">
                {isYear ? 'Gói Năm (12 tháng)' : 'Gói Tháng (1 tháng)'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-[12.5px]">
              <div>
                <div className="text-[11px] text-faint">Chủ sở hữu</div>
                <div className="font-semibold text-ink truncate">{license.ownerName || '—'}</div>
              </div>
              <div>
                <div className="text-[11px] text-faint">Mức phí niêm yết (Snapshot)</div>
                <div className="font-mono font-bold text-brand">{formatVnd(fee)}</div>
              </div>
              <div>
                <div className="text-[11px] text-faint">Ngày bắt đầu hiệu lực</div>
                <div className="font-medium text-body">{start ? formatDateVn(start) : '—'}</div>
              </div>
              <div>
                <div className="text-[11px] text-faint">Ngày hết hạn</div>
                <div className="font-semibold text-ink">{expiry ? formatDateVn(expiry) : '—'}</div>
              </div>
            </div>

            {/* Derived Remaining Days Banner */}
            <div className="mt-3 flex items-center justify-between rounded-[8px] border border-hairline bg-surface px-3 py-2 text-[12px]">
              <div className="flex items-center gap-1.5 text-muted">
                <IconClock size={14} className={normStatus === 'EXPIRED' ? 'text-bad' : days <= 30 ? 'text-warn' : 'text-good'} />
                <span>Thời hạn vận hành:</span>
              </div>
              <div className="font-semibold">
                {normStatus === 'EXPIRED' ? (
                  <span className="text-bad-deep">Đã hết hạn ({Math.abs(days)} ngày trước)</span>
                ) : normStatus === 'SUSPENDED' ? (
                  <span className="text-warn-deep">Đang tạm ngưng (còn {days} ngày khi khôi phục)</span>
                ) : normStatus === 'PENDING' ? (
                  <span className="text-faint">Chưa đến thời điểm hiệu lực</span>
                ) : days <= 30 ? (
                  <span className="text-warn-deep font-bold">Sắp hết hạn (Còn {days} ngày)</span>
                ) : (
                  <span className="text-good-deep">Còn {days} ngày</span>
                )}
              </div>
            </div>

            {/* Audit / Technical Info */}
            <div className="mt-3 border-t border-hairline pt-2.5 flex flex-col gap-1 text-[11px] text-faint">
              <div className="flex justify-between items-center">
                <span>Ghi nhận ngày: {license.createdAt ? formatDateVn(license.createdAt) : '—'}</span>
                <span>Người ghi nhận: <b className="text-body">{license.recordedByName || 'Hệ thống'}</b></span>
              </div>
              <div className="flex justify-between items-center mt-0.5">
                <span className="text-[10px]">Technical ID (UUID):</span>
                <div className="flex items-center gap-1">
                  <span className="font-mono text-[10px] text-muted truncate max-w-[180px]">{license.id}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(license.id, 'uuid', 'UUID kỹ thuật')}
                    className="text-faint hover:text-ink"
                    title="Sao chép UUID"
                  >
                    {copiedKey === 'uuid' ? <IconCheck size={11} className="text-good" /> : <IconCopy size={11} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Contextual Lifecycle Actions */}
          <div className="rounded-[10px] border border-line-2 bg-surface p-3.5">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-faint">
              Thao tác vòng đời (Lifecycle Actions)
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {canRenew && onRenew && (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => onRenew(license)}
                  className="flex items-center gap-1.5 text-[12px]"
                >
                  <IconRefreshCw size={13} />
                  <span>Gia hạn kỳ mới</span>
                </Button>
              )}

              {normStatus === 'PENDING' && onActivate && (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => onActivate(license)}
                  className="flex items-center gap-1.5 text-[12px]"
                >
                  <IconCheckCircle size={13} />
                  <span>Kích hoạt License</span>
                </Button>
              )}

              {normStatus === 'ACTIVE' && onSuspend && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => onSuspend(license)}
                  className="flex items-center gap-1.5 text-[12px] text-warn-deep border-warn-border hover:bg-warn-soft"
                >
                  <IconAlertTriangle size={13} />
                  <span>Tạm ngưng License</span>
                </Button>
              )}

              {normStatus === 'SUSPENDED' && onActivate && (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => onActivate(license)}
                  className="flex items-center gap-1.5 text-[12px]"
                >
                  <IconCheckCircle size={13} />
                  <span>Kích hoạt lại License</span>
                </Button>
              )}

              {(normStatus === 'ACTIVE' || normStatus === 'SUSPENDED' || normStatus === 'PENDING') && onCancel && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onCancel(license)}
                  className="flex items-center gap-1.5 text-[12px] text-bad hover:bg-bad-soft"
                >
                  <IconX size={13} />
                  <span>Hủy bỏ License</span>
                </Button>
              )}

              {normStatus === 'CANCELLED' && (
                <div className="text-[12px] text-faint italic">
                  Giấy phép này đã bị hủy vĩnh viễn và không thể thao tác thêm.
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Two-Tier History Tabs */}
          <div>
            <div className="mb-3">
              <SegmentedControl<HistoryTab>
                segments={[
                  { key: 'status-events', label: 'Nhật ký trạng thái' },
                  { key: 'station-periods', label: 'Các kỳ License của trạm' },
                ]}
                active={activeTab}
                onChange={(val) => setActiveTab(val)}
              />
            </div>

            {activeTab === 'status-events' ? (
              /* Tab 1: Status Events Audit Timeline */
              <div className="flex flex-col gap-2.5">
                {isEventsLoading ? (
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-16 w-full rounded-[8px]" />
                    <Skeleton className="h-16 w-full rounded-[8px]" />
                  </div>
                ) : !statusEvents || statusEvents.length === 0 ? (
                  <div className="rounded-[9px] border border-line-2 bg-surface-2 py-8 text-center text-[12.5px] text-faint">
                    Chưa có sự kiện trạng thái nào được ghi nhận cho License này.
                  </div>
                ) : (
                  <div className="relative pl-4 border-l-2 border-line-2 flex flex-col gap-3.5 my-1">
                    {statusEvents.map((evt, idx) => {
                      const isFirst = idx === 0;
                      const eventBadgeTone =
                        evt.eventType === 'ACTIVATED' || evt.eventType === 'REACTIVATED'
                          ? 'good'
                          : evt.eventType === 'SUSPENDED'
                            ? 'warn'
                            : evt.eventType === 'CANCELLED' || evt.eventType === 'EXPIRED'
                              ? 'bad'
                              : 'brand';

                      return (
                        <div key={evt.id || idx} className="relative group">
                          {/* Dot indicator */}
                          <div
                            className={`absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-surface ${
                              eventBadgeTone === 'good'
                                ? 'bg-good'
                                : eventBadgeTone === 'warn'
                                  ? 'bg-warn'
                                  : eventBadgeTone === 'bad'
                                    ? 'bg-bad'
                                    : 'bg-brand'
                            }`}
                          />

                          <div className="rounded-[9px] border border-line-2 bg-surface-2 p-3 text-[12px] transition hover:border-line">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-ink text-[12.5px]">{evt.eventType}</span>
                                {evt.fromStatus && (
                                  <span className="text-[11px] text-muted">
                                    ({evt.fromStatus} → <b className="text-ink">{evt.toStatus}</b>)
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-faint">{formatDateVn(evt.performedAt)}</span>
                            </div>

                            {evt.reason && (
                              <div className="mt-1.5 rounded-[6px] bg-surface p-2 text-[11.5px] text-body">
                                <span className="font-semibold text-faint">Lý do: </span>
                                {evt.reason}
                              </div>
                            )}

                            <div className="mt-2 flex items-center justify-between text-[10.5px] text-faint border-t border-hairline pt-1.5">
                              <span>
                                Thực hiện bởi:{' '}
                                <b className="text-body">
                                  {evt.actorType === 'SYSTEM'
                                    ? 'Hệ thống tự động (SYSTEM)'
                                    : evt.performedByName || 'Quản trị viên'}
                                </b>
                              </span>
                              <span className="font-mono">{evt.actorType}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              /* Tab 2: Station Subscription Periods */
              <div className="flex flex-col gap-2.5">
                {isPeriodsLoading ? (
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-20 w-full rounded-[8px]" />
                    <Skeleton className="h-20 w-full rounded-[8px]" />
                  </div>
                ) : !stationPeriods || stationPeriods.length === 0 ? (
                  <div className="rounded-[9px] border border-line-2 bg-surface-2 py-8 text-center text-[12.5px] text-faint">
                    Trạm chưa có lịch sử các kỳ License khác.
                  </div>
                ) : (
                  stationPeriods.map((p) => {
                    const pStatus = String(p.status).toUpperCase() as LicenseStatus;
                    const pMeta = LICENSE_STATUS[pStatus] || { label: pStatus, tone: 'neutral' };
                    const pIsYear = String(p.plan).toUpperCase() === 'YEARLY';
                    const isCurrent = p.id === license.id;

                    return (
                      <Card
                        key={p.id}
                        className={`p-3 text-[12px] border ${
                          isCurrent ? 'border-brand bg-brand-soft/10 ring-1 ring-brand/30' : 'border-line-2 bg-surface-2'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[12px] font-bold text-brand">
                              {p.licenseCode || p.id}
                            </span>
                            {isCurrent && (
                              <span className="rounded bg-brand-soft px-1.5 py-0.2 text-[10px] font-bold text-brand">
                                Đang chọn
                              </span>
                            )}
                            <span className="rounded bg-surface px-1.5 py-0.2 text-[10.5px] font-medium text-body">
                              {pIsYear ? 'Gói Năm' : 'Gói Tháng'}
                            </span>
                          </div>
                          <StatusPill tone={pMeta.tone} label={pMeta.label} />
                        </div>

                        <div className="mt-2 grid grid-cols-2 gap-2 text-[11.5px] text-body border-t border-hairline pt-2">
                          <div>
                            <span className="text-faint">Hiệu lực: </span>
                            <span>{p.startAt ? formatDateVn(p.startAt) : '—'} → {p.expiresAt ? formatDateVn(p.expiresAt) : '—'}</span>
                          </div>
                          <div>
                            <span className="text-faint">Phí: </span>
                            <span className="font-mono font-semibold text-ink">
                              {formatVnd(p.feeAmount ?? p.priceVnd ?? 0)}
                            </span>
                          </div>
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </Drawer>
  );
}
