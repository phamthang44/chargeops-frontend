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

function getActiveDuration(startIso: string, endIso: string): string {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  const diffMs = end - start;
  if (diffMs <= 0) return 'Dưới 1 giờ';
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  if (days > 0) {
    const remHours = hours % 24;
    return remHours > 0 ? `${days} ngày ${remHours} giờ` : `${days} ngày`;
  }
  if (hours > 0) return `${hours} giờ`;
  const minutes = Math.floor(diffMs / (1000 * 60));
  return `${Math.max(1, minutes)} phút`;
}

export function ScheduleHistoryDrawer({
  open,
  onClose,
  stationId,
}: ScheduleHistoryDrawerProps) {
  const { t } = useTranslation('owner');
  const api = useApi();

  const { data: history = [], isLoading, error } = useQuery({
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
              {t('pricing.history.title', { defaultValue: 'Lịch sử giờ hoạt động' })}
            </div>
            <div className="text-[11.5px] text-muted">
              {t('pricing.history.subtitle', { defaultValue: 'Nhật ký các phiên bản giờ mở/đóng đã áp dụng cho trạm' })}
            </div>
          </div>
        </div>
      }
    >
      {/* Informational Callout */}
      <div className="rounded-[10px] border border-line-2 bg-surface-2 p-3 text-[12px] leading-relaxed text-muted">
        💡 <b>{t('pricing.history.calloutTitle', { defaultValue: 'Quy cách chu kỳ giờ hoạt động:' })}</b>{' '}
        {t('pricing.history.calloutDesc', {
          defaultValue:
            'Giờ mở/đóng là lịch lặp lại hàng tuần. Khi bạn xác nhận Lưu & áp dụng ngay, phiên bản cũ sẽ chốt mốc dừng, và phiên bản mới này sẽ duy trì hiệu lực xuyên suốt các tuần cho đến lần chỉnh sửa tiếp theo.',
        })}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-28 rounded-panel" />
          <Skeleton className="h-28 rounded-panel" />
          <Skeleton className="h-28 rounded-panel" />
        </div>
      ) : error ? (
        <div className="rounded-panel border border-bad-border bg-bad-soft p-4 text-[12.5px] text-bad-deep">
          {t('pricing.history.loadError', { defaultValue: 'Không thể tải lịch sử giờ hoạt động: ' }) + (error as Error).message}
        </div>
      ) : history.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-panel border border-dashed border-line-2 p-8 text-center text-[13px] text-muted">
          <IconClock size={28} className="mb-2 text-faint" />
          <span>{t('pricing.history.empty', { defaultValue: 'Chưa có lịch sử thay đổi nào cho trạm này.' })}</span>
        </div>
      ) : (
        <div className="flex flex-col gap-3.5">
          {history.map((item, index) => {
            const isActive = item.status === 'ACTIVE';
            return (
              <div
                key={item.scheduleId || index}
                className={`flex flex-col gap-3 rounded-[12px] border p-4 transition-all ${
                  isActive
                    ? 'border-owner-border/70 bg-owner-soft/20 shadow-xs ring-1 ring-owner/20'
                    : 'border-line-2 bg-surface'
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
                        {t('pricing.history.expired', { defaultValue: 'Đã hết hiệu lực' })}
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-[11px] text-faint">
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
                        <span className="text-faint">{t('pricing.history.validityPeriod', { defaultValue: 'Thời hạn hiệu lực:' })}</span>
                        <div className="font-bold text-emerald-600">
                          {t('pricing.history.activeBadge', { defaultValue: 'Đang áp dụng (Lặp lại hàng tuần)' })}
                        </div>
                      </div>
                    </div>
                    <div className="rounded-[7px] bg-emerald-500/10 px-2.5 py-1 text-[11px] text-emerald-700 leading-snug">
                      🔄 {t('pricing.history.activeHint', {
                        defaultValue: 'Phiên bản này đang chạy và sẽ tự động lặp lại mỗi tuần cho đến khi bạn cập nhật lịch mới.',
                      })}
                    </div>
                    <div className="pt-1 border-t border-hairline flex items-center justify-between text-[11.5px]">
                      <span className="text-muted">{t('pricing.history.updatedBy', { defaultValue: 'Người cập nhật:' })}</span>
                      <span className="font-medium text-ink">
                        {item.changedByName || t('common:system', { defaultValue: 'Hệ thống' })}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 text-[12px]">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-faint">{t('pricing.history.appliedAt', { defaultValue: 'Bắt đầu áp dụng:' })}</span>
                        <div className="font-semibold text-ink">
                          {formatDateTimeVn(item.effectiveFrom)}
                        </div>
                      </div>
                      <div>
                        <span className="text-faint">{t('pricing.history.endedAt', { defaultValue: 'Được thay thế lúc:' })}</span>
                        <div className="font-semibold text-ink">
                          {item.effectiveTo ? formatDateTimeVn(item.effectiveTo) : '—'}
                        </div>
                      </div>
                    </div>
                    {item.effectiveTo && (
                      <div className="text-[11px] text-muted">
                        ⏱️ {t('pricing.history.duration', { defaultValue: 'Thời gian đã vận hành: ' })}
                        <span className="font-semibold text-ink">{getActiveDuration(item.effectiveFrom, item.effectiveTo)}</span>
                      </div>
                    )}
                    <div className="pt-1 border-t border-hairline flex items-center justify-between text-[11.5px]">
                      <span className="text-muted">{t('pricing.history.updatedBy', { defaultValue: 'Người cập nhật:' })}</span>
                      <span className="font-medium text-ink">
                        {item.changedByName || t('common:system', { defaultValue: 'Hệ thống' })}
                      </span>
                    </div>
                  </div>
                )}

                {/* Operating hours breakdown */}
                <div className="rounded-[9px] border border-line-2 bg-surface-2/70 p-2.5 text-[11.5px]">
                  {item.open24Hours ? (
                    <div className="flex items-center gap-2 font-medium text-owner-deep">
                      <IconCheck size={14} className="text-owner" />
                      <span>{t('pricing.history.open247AllDays', { defaultValue: 'Cả tuần: Mở liên tục 24/7 (00:00 – 24:00)' })}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      <div className="font-semibold text-muted text-[10.5px] uppercase tracking-wider">
                        {t('pricing.history.sevenDaysHours', { defaultValue: 'Khung giờ từng ngày:' })}
                      </div>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                        {item.hours.map((h) => (
                          <div
                            key={h.day}
                            className="flex items-center justify-between border-b border-hairline/60 py-0.5"
                          >
                            <span className="text-muted font-medium">
                              {DAY_NAME_MAP[h.day] ?? h.day}:
                            </span>
                            <span
                              className={`font-mono ${
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
