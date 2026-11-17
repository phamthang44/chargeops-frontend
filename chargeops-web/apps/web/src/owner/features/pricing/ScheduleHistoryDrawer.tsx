import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  useApi,
  formatDateTimeVn,
  type StationScheduleHistoryItem,
} from '@chargeops/api';
import {
  Drawer,
  IconClock,
  IconCheck,
  Skeleton,
} from '@chargeops/ui';
import { ApiErrorState } from '../../../shared/components/ApiErrorState';
import { ResourceStateCard } from '../../../shared/components/ResourceStateCard';

export interface ScheduleHistoryDrawerProps {
  open: boolean;
  onClose: () => void;
  stationId: string;
}

const DAY_NAME_MAP: Record<string, string> = {
  T2: 'Thứ 2',
  T3: 'Thứ 3',
  T4: 'Thứ 4',
  T5: 'Thứ 5',
  T6: 'Thứ 6',
  T7: 'Thứ 7',
  CN: 'Chủ Nhật',
  MONDAY: 'Thứ 2',
  TUESDAY: 'Thứ 3',
  WEDNESDAY: 'Thứ 4',
  THURSDAY: 'Thứ 5',
  FRIDAY: 'Thứ 6',
  SATURDAY: 'Thứ 7',
  SUNDAY: 'Chủ Nhật',
};

function getActiveDuration(startIso: string, endIso: string, t: (key: string, opts?: any) => string): string {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  const diffMs = end - start;
  if (diffMs <= 0) return t('pricing.history.durationUnderOneHour', { defaultValue: 'Dưới 1 giờ' });
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  if (days > 0) {
    const remHours = hours % 24;
    return remHours > 0
      ? t('pricing.history.durationDaysHours', { days, hours: remHours, defaultValue: `${days} ngày ${remHours} giờ` })
      : t('pricing.history.durationDays', { days, defaultValue: `${days} ngày` });
  }
  if (hours > 0) return t('pricing.history.durationHours', { hours, defaultValue: `${hours} giờ` });
  const minutes = Math.floor(diffMs / (1000 * 60));
  return t('pricing.history.durationMinutes', {
    minutes: Math.max(1, minutes),
    defaultValue: `${Math.max(1, minutes)} phút`,
  });
}

export function ScheduleHistoryDrawer({
  open,
  onClose,
  stationId,
}: ScheduleHistoryDrawerProps) {
  const { t } = useTranslation('owner');
  const api = useApi();

  const { data: history = [], isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['pricing-history', stationId],
    queryFn: () => api.pricing.history(stationId),
    enabled: open && Boolean(stationId),
  });

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width="540px"
      title={
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-owner-soft text-owner-deep">
            <IconClock size={16} strokeWidth={2.2} />
          </span>
          <div>
            <div className="text-[15px] font-bold text-ink">
              {t('pricing.history.title', { defaultValue: 'Lịch sử phiên bản Giá & Giờ' })}
            </div>
            <div className="text-[11.5px] text-muted">
              {t('pricing.history.subtitle', { defaultValue: 'Các phiên bản cấu hình Giá & Giờ, thời điểm lưu và các mốc bắt đầu, kết thúc hiệu lực.' })}
            </div>
          </div>
        </div>
      }
    >
      {/* Informational Callout */}
      <div className="rounded-[10px] border border-line bg-surface-2 p-3 text-[12px] leading-relaxed text-muted">
        <b>{t('pricing.history.calloutTitle', { defaultValue: 'Hiệu lực & cách đọc lịch sử:' })}</b>
        <ul className="mt-1.5 list-disc space-y-1 pl-4">
          <li>
            {t('pricing.history.calloutFirstSave', {
              defaultValue: 'Lần lưu cấu hình đầy đủ đầu tiên có hiệu lực ngay.',
            })}
          </li>
          <li>
            {t('pricing.history.calloutLaterEdits', {
              defaultValue:
                'Các lần sửa sau bắt đầu lúc 00:00 thứ Hai kế tiếp (giờ Việt Nam); bản hiện tại giữ đến mốc đó.',
            })}
          </li>
          <li>
            {t('pricing.history.calloutWeeklyVersion', {
              defaultValue:
                'Lịch lặp hằng tuần. Mỗi phiên bản gộp giá, thời lượng tối thiểu, TOU và giờ mở/đóng.',
            })}
          </li>
          <li>
            {t('pricing.history.calloutEffectiveDuration', {
              defaultValue:
                'Sửa giá, thời lượng hoặc TOU cũng tạo phiên bản dù giờ không đổi. Thời lượng trên thẻ là thời gian có hiệu lực thực tế.',
            })}
          </li>
          <li>
            {t('pricing.history.calloutLimitAndEmergency', {
              defaultValue:
                'Lịch sử chưa cho biết trường nào đã đổi. Đóng trạm khẩn cấp có hiệu lực ngay.',
            })}
          </li>
        </ul>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-28 rounded-panel" />
          <Skeleton className="h-28 rounded-panel" />
          <Skeleton className="h-28 rounded-panel" />
        </div>
      ) : error ? (
        <ApiErrorState
          error={error}
          compact
          eyebrow={t('pricing.history.error.eyebrow', { defaultValue: 'Lịch sử phiên bản Giá & Giờ' })}
          title={t('pricing.history.error.title', { defaultValue: 'Không thể tải lịch sử phiên bản Giá & Giờ' })}
          onRetry={() => refetch()}
          isRetrying={isFetching}
        />
      ) : history.length === 0 ? (
        <ResourceStateCard
          compact
          tone="brand"
          icon={<IconClock size={22} />}
          eyebrow={t('pricing.history.error.eyebrow', { defaultValue: 'Lịch sử phiên bản Giá & Giờ' })}
          title={t('pricing.history.empty', { defaultValue: 'Chưa có lịch sử thay đổi nào cho trạm này.' })}
        />
      ) : (
        <div className="flex flex-col gap-3.5">
          {history.map((item, index) => {
            const isActive = item.status === 'ACTIVE';
            const isPending = item.status === 'PENDING';
            const isExpired = item.status === 'EXPIRED';
            const isCancelled = item.status === 'CANCELLED';
            const systemName = t('common:system', { defaultValue: 'Hệ thống' });
            const actorName = isCancelled
              ? item.cancelledByName || systemName
              : item.changedByName || systemName;
            const statusLabel = isActive
              ? t('pricing.steps.step2.activeSchedule', { defaultValue: 'Đang áp dụng' })
              : isPending
                ? t('pricing.history.pending', { defaultValue: 'Sắp áp dụng' })
                : isExpired
                  ? t('pricing.history.expired', { defaultValue: 'Đã hết hiệu lực' })
                  : isCancelled
                    ? t('pricing.history.cancelled', { defaultValue: 'Đã hủy trước khi có hiệu lực' })
                    : t('pricing.history.unknownStatus', { defaultValue: 'Trạng thái chưa được hỗ trợ' });
            return (
              <div
                key={item.scheduleId || index}
                className={`flex flex-col gap-3 rounded-[12px] border p-4 transition-all ${
                  isActive
                    ? 'border-owner-border/70 bg-owner-soft/20 shadow-xs'
                    : 'border-line bg-surface'
                }`}
              >
                {/* Header of history card */}
                <div className="flex items-center justify-between border-b border-hairline pb-2.5">
                  <div className="flex items-center gap-2">
                    {isActive ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 border border-emerald-500/25">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        {t('pricing.steps.step2.activeSchedule', { defaultValue: 'Đang áp dụng' })}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-0.5 text-[11px] font-medium text-muted border border-hairline">
                        {statusLabel}
                      </span>
                    )}
                  </div>
                  <span className="tabular-nums text-[11px] text-faint">
                    {t('pricing.history.version', { count: history.length - index, defaultValue: `Phiên bản #${history.length - index}` })}
                  </span>
                </div>

                {/* Validity Details & Changed By */}
                {isActive ? (
                  <div className="flex flex-col gap-2 text-[12px]">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-faint">{t('pricing.history.appliedAt', { defaultValue: 'Thời điểm kích hoạt:' })}</span>
                        <div className="font-semibold text-ink">
                          {formatDateTimeVn(item.effectiveFrom)}
                        </div>
                      </div>
                      <div>
                        <span className="text-faint">{t('pricing.history.validityPeriod', { defaultValue: 'Có hiệu lực đến (không bao gồm):' })}</span>
                        <div className="font-bold text-emerald-600">
                          {item.effectiveTo
                            ? formatDateTimeVn(item.effectiveTo)
                            : t('pricing.history.noScheduledEnd', { defaultValue: 'Chưa có mốc kết thúc' })}
                        </div>
                      </div>
                    </div>
                    <div className="rounded-[7px] bg-emerald-500/10 px-2.5 py-1 text-[11px] text-emerald-700 leading-snug">
                      {item.effectiveTo
                        ? t('pricing.history.activeHintUntil', {
                            effectiveTo: formatDateTimeVn(item.effectiveTo),
                            defaultValue: `Lịch lặp lại hàng tuần đến ${formatDateTimeVn(item.effectiveTo)}; phiên bản kế tiếp bắt đầu đúng mốc đó.`,
                          })
                        : t('pricing.history.activeHint', {
                            defaultValue: 'Lịch này lặp lại hàng tuần đến khi có phiên bản thay thế.',
                          })}
                    </div>
                    <div className="pt-1 border-t border-hairline flex items-center justify-between text-[11.5px]">
                      <span className="text-muted">{t('pricing.history.savedByAt', { defaultValue: 'Người lưu / lưu lúc:' })}</span>
                      <span className="font-medium text-ink">
                        {actorName} · {formatDateTimeVn(item.changedAt)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 text-[12px]">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-faint">
                          {isPending || isCancelled
                            ? t('pricing.history.scheduledFrom', { defaultValue: 'Dự kiến có hiệu lực từ:' })
                            : isExpired
                              ? t('pricing.history.appliedAt', { defaultValue: 'Bắt đầu có hiệu lực:' })
                              : t('pricing.history.recordedFrom', { defaultValue: 'Mốc bắt đầu ghi nhận:' })}
                        </span>
                        <div className="font-semibold text-ink">
                          {formatDateTimeVn(item.effectiveFrom)}
                        </div>
                      </div>
                      <div>
                        <span className="text-faint">
                          {isPending
                            ? t('pricing.history.currentUntil', { defaultValue: 'Lịch hiện hành có hiệu lực đến (không bao gồm):' })
                            : isCancelled
                              ? t('pricing.history.cancelledAt', { defaultValue: 'Đã hủy lúc:' })
                              : isExpired
                                ? t('pricing.history.endedAt', { defaultValue: 'Kết thúc hiệu lực (mốc này không bao gồm):' })
                                : t('pricing.history.recordedUntil', { defaultValue: 'Mốc kết thúc ghi nhận:' })}
                        </span>
                        <div className="font-semibold text-ink">
                          {isPending
                            ? formatDateTimeVn(item.effectiveFrom)
                            : isCancelled
                              ? item.cancelledAt
                                ? formatDateTimeVn(item.cancelledAt)
                                : t('pricing.history.missingCancelledAt', { defaultValue: 'Không có dữ liệu hủy' })
                              : item.effectiveTo
                                ? formatDateTimeVn(item.effectiveTo)
                                : t('pricing.history.missingEnd', { defaultValue: 'Không có dữ liệu kết thúc' })}
                        </div>
                      </div>
                    </div>
                    {isExpired && item.effectiveTo && (
                      <div className="text-[11px] text-muted">
                        {t('pricing.history.duration', { defaultValue: 'Khoảng thời gian phiên bản có hiệu lực: ' })}
                        <span className="font-semibold text-ink">{getActiveDuration(item.effectiveFrom, item.effectiveTo, t)}</span>
                      </div>
                    )}
                    {isPending && (
                      <div className="text-[11px] text-muted">
                        {t('pricing.history.pendingHint', { defaultValue: 'Phiên bản này chưa được áp dụng; lịch hiện hành giữ hiệu lực đến đúng mốc trên.' })}
                      </div>
                    )}
                    {isCancelled && (
                      <div className="text-[11px] text-muted">
                        {t('pricing.history.cancelledHint', { defaultValue: 'Phiên bản này bị hủy trước ngày dự kiến có hiệu lực nên chưa từng được áp dụng.' })}
                      </div>
                    )}
                    <div className="pt-1 border-t border-hairline flex items-center justify-between text-[11.5px]">
                      <span className="text-muted">
                        {t(isCancelled ? 'pricing.history.cancelledBy' : 'pricing.history.savedBy', {
                          defaultValue: isCancelled ? 'Người hủy:' : 'Người lưu:',
                        })}
                      </span>
                      <span className="font-medium text-ink">
                        {actorName}
                      </span>
                    </div>
                  </div>
                )}

                {/* Operating hours breakdown */}
                <div className="rounded-[9px] bg-surface-2/70 p-2.5 text-[11.5px]">
                  {item.open24Hours ? (
                    <div className="flex items-center gap-2 font-medium text-owner-deep">
                      <IconCheck size={14} className="text-owner" />
                      <span>{t('pricing.history.open247AllDays', { defaultValue: 'Cả tuần: Mở liên tục 24/7 (00:00 – 24:00)' })}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      <div className="font-medium text-muted text-[12px]">
                        {t('pricing.history.sevenDaysHours', { defaultValue: 'Khung giờ từng ngày:' })}
                      </div>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                        {item.hours.map((h) => (
                          <div
                            key={h.day}
                            className="flex items-center justify-between border-b border-hairline/60 py-0.5"
                          >
                            <span className="text-muted font-medium">
                              {t(`pricing.dayNames.${h.day}`, { defaultValue: DAY_NAME_MAP[h.day] ?? h.day })}:
                            </span>
                            <span
                              className={`tabular-nums ${
                                h.open24
                                  ? 'text-ink font-semibold'
                                  : 'text-faint italic'
                              }`}
                            >
                              {h.open24
                                ? `${h.open || '06:00'} – ${h.close || '23:00'}`
                                : t('pricing.history.closed', { defaultValue: 'Đóng cửa' })}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Drawer>
  );
}
