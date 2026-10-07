import { useTranslation } from 'react-i18next';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  DOMAIN_POLICIES,
  formatDateVn,
  formatVnd,
  LICENSE_STATUS,
  useApi,
  type License,
  type Station,
} from '@chargeops/api';
import {
  Card,
  IconAlertTriangle,
  IconBolt,
  IconClock,
  IconInfo,
  IconShield,
  IconShieldCheck,
  MetricCard,
  PageHeader,
  Select,
  Skeleton,
  StatusPill,
  type SelectOption,
} from '@chargeops/ui';

import { useOwnerStation } from '../context/OwnerStationContext';
import { ApiErrorState } from '../../shared/components/ApiErrorState';
import { ResourceStateCard } from '../../shared/components/ResourceStateCard';

/**
 * FR12 — owner license, status display only. Purchase/renewal happens
 * off-platform; the admin records status manually.
 */
export function License() {
  const { t } = useTranslation('owner');
  const api = useApi();
  const { stations: stationList, selectedStationId, setSelectedStationId, currentStation, isLoading: stationsLoading } = useOwnerStation();
  const currentStationId = currentStation?.id ?? selectedStationId ?? null;

  const { data: license, isLoading: licenseLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['license', 'mine', currentStationId],
    queryFn: () => api.licenses.mine(currentStationId ?? undefined),
    enabled: Boolean(currentStationId) || stationList.length === 0,
  });

  const { data: history } = useQuery({
    queryKey: ['licenses', 'history', currentStationId],
    queryFn: () => (currentStationId ? api.licenses.history(currentStationId) : Promise.resolve([])),
    enabled: Boolean(currentStationId),
  });

  const isLoading = stationsLoading || licenseLoading;

  const stationOptions = useMemo<SelectOption[]>(
    () =>
      stationList.map((s) => ({
        value: s.id,
        label: `${s.name} (${s.stationCode || s.id})`,
      })),
    [stationList],
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <PageHeader
        title={t('license.title', { defaultValue: 'Giấy phép Vận hành (License)' })}
        subtitle={t('license.subtitle', {
          defaultValue: 'Theo dõi hiệu lực các gói subscription License cho các trạm sạc của bạn.',
        })}
      />

      {/* High-End Station Selector Bar */}
      {stationList.length > 1 ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-card border border-line-2 bg-surface p-3.5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-owner-soft text-owner-deep">
              <IconBolt size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[14px] font-bold text-ink truncate">
                  {currentStation?.name || t('license.defaultStationName', { defaultValue: 'Trạm sạc' })}
                </span>
                {currentStation?.stationCode && (
                  <span className="font-mono text-[11px] font-semibold text-faint">
                    ({currentStation.stationCode})
                  </span>
                )}
                {currentStation?.city && (
                  <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[10.5px] font-medium text-muted">
                    {currentStation.city}
                  </span>
                )}
              </div>
              <div className="text-[12px] text-muted">
                {t('license.selectedStationSubtitle', {
                  defaultValue: 'Đang hiển thị gói giấy phép và lịch sử subscription của trạm đã chọn.',
                })}
              </div>
            </div>
          </div>

          <div className="w-full sm:w-[280px] shrink-0">
            <Select
              value={currentStationId ?? ''}
              onChange={(v) => setSelectedStationId(v)}
              options={stationOptions}
              searchable={stationList.length > 3}
              searchPlaceholder={t('license.searchStationPlaceholder', { defaultValue: 'Tìm trạm sạc...' })}
              accent="owner"
            />
          </div>
        </div>
      ) : currentStation ? (
        <div className="flex items-center gap-3 rounded-card border border-line-2 bg-surface p-3 px-4 shadow-sm">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] bg-owner-soft text-owner-deep">
            <IconBolt size={18} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[13.5px] font-bold text-ink">{currentStation.name}</span>
            {currentStation.stationCode && (
              <span className="font-mono text-[11px] font-semibold text-faint">({currentStation.stationCode})</span>
            )}
            {currentStation.city && (
              <span className="rounded bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-muted">
                {currentStation.city}
              </span>
            )}
          </div>
        </div>
      ) : null}

      {error ? (
        <ApiErrorState
          error={error}
          eyebrow={t('license.error.eyebrow', { defaultValue: 'Giấy phép' })}
          title={t('license.error.title', { defaultValue: 'Không thể tải thông tin giấy phép' })}
          missingEyebrow={t('license.error.missingEyebrow', { defaultValue: 'Giấy phép vận hành' })}
          missingTitle={t('license.error.missingTitle', { defaultValue: 'Chưa có thông tin giấy phép' })}
          missingDescription={t('license.error.missingDescription', {
            defaultValue:
              'Trạm chưa có gói License hoạt động. Việc mua và gia hạn giấy phép được thực hiện ngoài nền tảng và được Quản trị viên ghi nhận trên hệ thống.',
          })}
          missingHint={t('license.error.missingHint', {
            defaultValue:
              'Đã từng có giấy phép và cho rằng đây là lỗi? Nhấn chọn lại trạm hoặc liên hệ Quản trị viên để kiểm tra bản ghi License của trạm.',
          })}
          onRetry={() => refetch()}
          isRetrying={isFetching}
        />
      ) : isLoading ? (
        <div className="grid gap-[13px]">
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[96px] rounded-card" />
            ))}
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Skeleton className="h-[220px] rounded-card" />
            <Skeleton className="h-[220px] rounded-card" />
          </div>
        </div>
      ) : !license ? (
        // Also covers the 404 "no license recorded yet" case — a business
        // state, so it renders as a calm empty card instead of a failure.
        <ResourceStateCard
          tone="owner"
          eyebrow={t('license.error.missingEyebrow', { defaultValue: 'Giấy phép vận hành' })}
          title={t('license.empty.title', { defaultValue: 'Chưa có thông tin giấy phép' })}
          description={t('license.error.missingDescription', {
            defaultValue:
              'Trạm chưa có gói License hoạt động. Việc mua và gia hạn giấy phép được thực hiện ngoài nền tảng và được Quản trị viên ghi nhận trên hệ thống.',
          })}
          hint={t('license.error.missingHint', {
            defaultValue:
              'Đã từng có giấy phép và cho rằng đây là lỗi? Nhấn chọn lại trạm hoặc liên hệ Quản trị viên để kiểm tra bản ghi License của trạm.',
          })}
        />
      ) : (
        <Body license={license} station={currentStation} history={history ?? []} />
      )}
    </div>
  );
}

function Body({ license, station, history }: { license: License; station: Station | null; history: License[] }) {
  const { t } = useTranslation('owner');
  const normStatus = String(license.status).toUpperCase();
  const meta = LICENSE_STATUS[license.status] || { label: license.status, tone: 'neutral' };
  const statusLabel = t(`license.status.${license.status}`, { defaultValue: meta.label });
  const statusTooltip = t(`license.statusTooltips.${license.status}`, { defaultValue: statusLabel });
  const isYear = String(license.plan).toUpperCase() === 'YEARLY';
  const planShort = isYear
    ? t('license.planYearlyShort', { defaultValue: 'Gói Năm' })
    : t('license.planMonthlyShort', { defaultValue: 'Gói Tháng' });
  const fee = license.feeAmount ?? license.priceVnd ?? 0;
  const startDate = license.startAt || license.startDate;
  const expiryDate = license.expiresAt || license.expiryDate;
  const daysLeft = license.daysLeft ?? 0;

  const isActive = normStatus === 'ACTIVE';
  const isExpired = normStatus === 'EXPIRED';
  const isSuspended = normStatus === 'SUSPENDED';
  const isPendingApproval = station?.status === 'pending' || station?.status === 'PENDING_APPROVAL';

  // Exclude current license from history list if present
  const pastLicenses = history.filter((h) => h.id !== license.id);

  const remainingValue = isActive
    ? t('license.metrics.daysLeft', { count: daysLeft, defaultValue: `${daysLeft} ngày` })
    : isExpired
      ? t('license.metrics.expired', { defaultValue: 'Đã hết hạn' })
      : '—';

  return (
    <div className="flex flex-col gap-4">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 gap-[13px] xl:grid-cols-4">
        <div title={statusTooltip} className="cursor-default">
          <MetricCard
            label={t('license.metrics.validityStatus', { defaultValue: 'Trạng thái hiệu lực' })}
            value={statusLabel}
            accent={isActive ? (daysLeft <= 30 ? '#9a6b16' : '#0d8a5a') : isExpired ? '#c0392b' : '#5b54e8'}
          />
        </div>
        <MetricCard
          label={t('license.metrics.subscriptionPlan', { defaultValue: 'Gói Subscription' })}
          value={planShort}
          accent="#5b54e8"
        />
        <MetricCard
          label={t('license.metrics.remainingTime', { defaultValue: 'Thời hạn còn lại' })}
          value={remainingValue}
          accent={daysLeft <= 15 ? '#c0392b' : daysLeft <= 30 ? '#9a6b16' : '#0d8a5a'}
        />
        <MetricCard
          label={t('license.metrics.subscriptionFee', { defaultValue: 'Phí subscription' })}
          value={fee > 0 ? formatVnd(fee) : '—'}
          accent="#10111a"
        />
      </div>

      {/* Advisory Banners */}
      {isPendingApproval && isActive && (
        <div className="flex items-start gap-3 rounded-[11px] border border-brand-border bg-brand-soft/30 p-4 text-[13px] leading-relaxed text-ink shadow-sm">
          <IconShieldCheck size={20} className="mt-0.5 shrink-0 text-brand" />
          <div>
            <div className="font-bold text-brand-strong">
              {t('license.banners.pendingApprovalTitle', {
                defaultValue: 'Giấy phép đã được ghi nhận và kích hoạt thành công',
              })}
            </div>
            <div className="mt-0.5 text-muted">
              {t('license.banners.pendingApprovalDesc', {
                defaultValue:
                  'Gói License của trạm đã có hiệu lực trên hệ thống. Hồ sơ trạm đang trong hàng đợi phê duyệt hành chính lần cuối của Quản trị viên trước khi hiển thị cho tài xế tìm kiếm.',
              })}
            </div>
          </div>
        </div>
      )}

      {isActive && daysLeft <= 30 && (
        <div className="flex items-start gap-3 rounded-[11px] border border-warn-border bg-warn-soft p-4 text-[13px] leading-relaxed text-warn-deep shadow-sm">
          <IconClock size={20} className="mt-0.5 shrink-0 text-warn" />
          <div>
            <div className="font-bold">
              {daysLeft < 0
                ? t('license.banners.overdueTitle', {
                    count: -daysLeft,
                    defaultValue: `Giấy phép đã quá hạn ${-daysLeft} ngày`,
                  })
                : t('license.banners.expiringTitle', {
                    count: daysLeft,
                    defaultValue: `Gói License sắp hết hạn sau ${daysLeft} ngày`,
                  })}
            </div>
            <div className="mt-0.5 text-warn-deep/90">
              {t('license.banners.expiringDesc', {
                defaultValue:
                  'Vui lòng hoàn tất thanh toán gia hạn ngoài nền tảng với Quản trị viên để duy trì trạng thái hoạt động liên tục cho trạm sạc của bạn.',
              })}
            </div>
          </div>
        </div>
      )}

      {isSuspended && (
        <div className="flex items-start gap-3 rounded-[11px] border border-warn-border bg-warn-soft p-4 text-[13px] leading-relaxed text-warn-deep shadow-sm">
          <IconAlertTriangle size={20} className="mt-0.5 shrink-0 text-warn" />
          <div>
            <div className="font-bold text-ink">
              {t('license.banners.suspendedTitle', {
                defaultValue: 'Gói Giấy phép đang bị tạm ngưng (Suspended)',
              })}
            </div>
            <div className="mt-0.5 text-muted">
              {t('license.banners.suspendedDesc', {
                defaultValue:
                  'Trạm đang tạm thời bị ẩn khỏi ứng dụng tìm kiếm của tài xế và tạm dừng nhận đặt chỗ mới.',
              })}{' '}
              <span className="font-semibold text-ink">
                {t('license.banners.suspendedNotice', {
                  defaultValue:
                    'Các phiên sạc đang diễn ra và lịch đặt chỗ đã thanh toán trước đó vẫn tiếp tục hoàn thành bình thường mà không bị ảnh hưởng.',
                })}
              </span>
            </div>
          </div>
        </div>
      )}

      {isExpired && (
        <div className="flex items-start gap-3 rounded-[11px] border border-bad-border bg-bad-soft p-4 text-[13px] leading-relaxed text-bad-deep shadow-sm">
          <IconAlertTriangle size={20} className="mt-0.5 shrink-0 text-bad" />
          <div>
            <div className="font-bold">
              {t('license.banners.expiredTitle', {
                defaultValue: 'Giấy phép vận hành đã hết hạn',
              })}
            </div>
            <div className="mt-0.5 text-bad-deep/90">
              {t('license.banners.expiredDesc', {
                policy: DOMAIN_POLICIES.LICENSE_SEARCH_VISIBILITY,
                defaultValue: `Trạm sạc đang tạm thời bị ẩn khỏi ứng dụng tìm kiếm của tài xế (quy tắc ${DOMAIN_POLICIES.LICENSE_SEARCH_VISIBILITY}). Các phiên sạc đang chạy vẫn được bảo đảm hoàn thành. Vui lòng liên hệ Quản trị viên để ghi nhận kỳ hạn mới.`,
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Split: Current License Details & Guidelines */}
      <div className="grid gap-[13px] md:grid-cols-2">
        {/* Current Active License Details */}
        <Card className="p-5 flex flex-col justify-between">
          <div>
            <div className="mb-4 flex items-center justify-between border-b border-hairline pb-3.5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-brand-soft text-brand">
                  <IconShield size={22} />
                </div>
                <div>
                  <div className="text-[16px] font-bold text-ink">
                    {isYear
                      ? t('license.plans.yearly', { defaultValue: 'Gói Năm (1 năm lịch)' })
                      : t('license.plans.monthly', { defaultValue: 'Gói Tháng (1 tháng lịch)' })}
                  </div>
                  <div className="text-[12px] font-mono text-faint">
                    {t('license.licenseCodeLabel', { defaultValue: 'Mã License:' })}{' '}
                    <span className="font-bold text-brand">{license.licenseCode || license.id}</span>
                  </div>
                </div>
              </div>
              <div title={statusTooltip} className="cursor-default">
                <StatusPill tone={meta.tone} label={statusLabel} />
              </div>
            </div>

            <div className="flex flex-col gap-3 text-[13px]">
              <DetailRow
                label={t('license.details.appliedStation', { defaultValue: 'Trạm sạc áp dụng' })}
                value={station?.name || license.stationName || license.stationId}
              />
              <DetailRow
                label={t('license.details.stationCode', { defaultValue: 'Mã trạm' })}
                value={station?.stationCode || license.stationId}
                isMono
              />
              <DetailRow
                label={t('license.details.startDate', { defaultValue: 'Ngày bắt đầu hiệu lực' })}
                value={startDate ? formatDateVn(startDate) : '—'}
              />
              <DetailRow
                label={t('license.details.expiryDate', { defaultValue: 'Ngày kết thúc / Hết hạn' })}
                value={expiryDate ? formatDateVn(expiryDate) : '—'}
                isBold
              />
              <DetailRow
                label={t('license.details.recordedFee', { defaultValue: 'Phí subscription đã ghi nhận' })}
                value={fee > 0 ? formatVnd(fee) : '—'}
                isBrand
              />
            </div>
          </div>

          <div className="mt-5 rounded-[8px] border border-hairline bg-surface-2 p-2.5 text-[11.5px] text-muted">
            {t('license.details.currentTerm', { defaultValue: 'Kỳ hạn hiện tại:' })}{' '}
            <span className="font-semibold text-ink">{startDate ? formatDateVn(startDate) : '—'}</span> →{' '}
            <span className="font-semibold text-ink">{expiryDate ? formatDateVn(expiryDate) : '—'}</span>
          </div>
        </Card>

        {/* Operational Guidelines & Regulations */}
        <Card className="p-5 flex flex-col justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-[14px] font-bold text-ink border-b border-hairline pb-3">
              <IconInfo size={18} className="text-brand" />
              <span>
                {t('license.guidelines.title', { defaultValue: 'Bảng giá & Quy định gia hạn' })}
              </span>
            </div>

            {/* Pricing Packages Box */}
            <div className="mb-3.5 grid grid-cols-2 gap-2">
              <div className="rounded-[8px] border border-line-2 bg-surface-2 p-2.5">
                <div className="text-[11px] font-bold text-ink">
                  {t('license.guidelines.monthlyTitle', { defaultValue: 'Gói Tháng (1 tháng)' })}
                </div>
                <div className="mt-0.5 text-[13px] font-extrabold text-ink">
                  {t('license.guidelines.monthlyPrice', { defaultValue: '500.000 đ' })}
                </div>
                <div className="text-[10px] text-muted">
                  {t('license.guidelines.monthlyFlex', { defaultValue: 'Linh hoạt theo tháng' })}
                </div>
              </div>
              <div className="rounded-[8px] border border-brand bg-brand-soft/20 p-2.5 relative">
                <span className="absolute -top-2 right-1.5 rounded-full bg-brand px-1.5 py-0.2 text-[9.5px] font-bold text-white">
                  {t('license.guidelines.discountBadge', { defaultValue: '-16.7%' })}
                </span>
                <div className="text-[11px] font-bold text-brand">
                  {t('license.guidelines.yearlyTitle', { defaultValue: 'Gói Năm (1 năm)' })}
                </div>
                <div className="mt-0.5 text-[13px] font-extrabold text-brand">
                  {t('license.guidelines.yearlyPrice', { defaultValue: '5.000.000 đ' })}
                </div>
                <div className="text-[10px] text-brand-strong">
                  {t('license.guidelines.yearlySave', { defaultValue: 'Tiết kiệm 1.000.000 đ' })}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 text-[12px] leading-relaxed text-body">
              <div className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                <span>
                  <b>{t('license.guidelines.offPlatformPaymentTitle', { defaultValue: 'Thanh toán ngoài nền tảng:' })}</b>{' '}
                  {t('license.guidelines.offPlatformPaymentDesc', {
                    defaultValue:
                      'Việc mua mới và gia hạn giấy phép được thực hiện trực tiếp giữa chủ trạm và đơn vị điều hành.',
                  })}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                <span>
                  <b>{t('license.guidelines.systemRecordTitle', { defaultValue: 'Ghi nhận hệ thống:' })}</b>{' '}
                  {t('license.guidelines.systemRecordDesc', {
                    defaultValue:
                      'Sau khi xác nhận giao dịch, Quản trị viên sẽ tạo kỳ hạn mới trên hệ thống để trạm vận hành liên tục.',
                  })}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-warn" />
                <span>
                  <b>{t('license.guidelines.searchVisibilityTitle', { defaultValue: 'Quyền hiển thị tìm kiếm:' })}</b>{' '}
                  {t('license.guidelines.searchVisibilityDesc', {
                    policy: DOMAIN_POLICIES.LICENSE_SEARCH_VISIBILITY,
                    defaultValue: `Khi License hết hạn, trạm sẽ tạm thời ngưng nhận đặt chỗ mới cho tới khi gia hạn thành công (${DOMAIN_POLICIES.LICENSE_SEARCH_VISIBILITY}).`,
                  })}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3.5 rounded-[9px] border border-brand-border bg-brand-soft/20 p-2.5 text-[11.5px] text-brand-strong">
            {t('license.guidelines.contactAdmin', {
              defaultValue:
                'Cần gia hạn hoặc nâng cấp gói? Vui lòng liên hệ Quản trị viên hệ thống ChargeOps.',
            })}
          </div>
        </Card>
      </div>

      {/* License History Section */}
      {pastLicenses.length > 0 && (
        <Card className="overflow-hidden p-0">
          <div className="border-b border-hairline px-4 py-3 bg-surface-2 flex items-center justify-between">
            <div className="text-[13px] font-bold text-ink">
              {t('license.history.title', {
                count: pastLicenses.length,
                defaultValue: `Lịch sử các kỳ hạn License của trạm (${pastLicenses.length})`,
              })}
            </div>
            <span className="text-[11px] text-faint">
              {t('license.history.subtitle', {
                defaultValue: 'Bao gồm các kỳ hạn trước và kỳ hạn chờ',
              })}
            </span>
          </div>

          <div className="divide-y divide-hairline">
            {pastLicenses.map((h) => {
              const hMeta = LICENSE_STATUS[h.status] || { label: h.status, tone: 'neutral' };
              const hStatusLabel = t(`license.status.${h.status}`, { defaultValue: hMeta.label });
              const hStatusTooltip = t(`license.statusTooltips.${h.status}`, { defaultValue: hStatusLabel });
              const hYear = String(h.plan).toUpperCase() === 'YEARLY';
              const hPlanLabel = hYear
                ? t('license.planYearlyShort', { defaultValue: 'Gói Năm' })
                : t('license.planMonthlyShort', { defaultValue: 'Gói Tháng' });
              const hStart = h.startAt || h.startDate;
              const hExp = h.expiresAt || h.expiryDate;
              return (
                <div key={h.id} className="flex items-center justify-between px-4 py-3 text-[12.5px] transition-colors hover:bg-surface-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[11.5px] font-bold text-brand">{h.licenseCode || h.id}</span>
                    <span className="rounded bg-surface-2 px-2 py-0.5 text-[11px] font-semibold text-body">
                      {hPlanLabel}
                    </span>
                    <span className="text-muted">
                      {hStart ? formatDateVn(hStart) : '—'} → <span className="font-semibold text-ink">{hExp ? formatDateVn(hExp) : '—'}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-ink">
                      {h.feeAmount ? formatVnd(h.feeAmount) : '—'}
                    </span>
                    <div title={hStatusTooltip} className="cursor-default">
                      <StatusPill tone={hMeta.tone} label={hStatusLabel} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

function DetailRow({
  label,
  value,
  isMono,
  isBold,
  isBrand,
}: {
  label: string;
  value?: string | number | null;
  isMono?: boolean;
  isBold?: boolean;
  isBrand?: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-b border-hairline pb-2.5">
      <span className="text-muted">{label}</span>
      <span
        className={`text-right ${isMono ? 'font-mono' : ''} ${isBold ? 'font-bold text-ink' : ''} ${
          isBrand ? 'font-mono font-bold text-brand' : 'text-ink font-medium'
        }`}
      >
        {value ?? '—'}
      </span>
    </div>
  );
}
