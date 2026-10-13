import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, IconInfo } from '@chargeops/ui';

export function ChargerStatusGuide() {
  const { t } = useTranslation('owner');
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-4">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-muted hover:text-ink transition-colors cursor-pointer"
      >
        <IconInfo size={14} className="text-owner shrink-0" />
        <span>{t('chargers.statusGuide.title', 'Ý nghĩa các trạng thái Trụ & Cổng sạc')}</span>
        <span className="text-[10px] text-faint">({open ? '▲' : '▼'})</span>
      </button>

      {open && (
        <Card className="mt-2 p-3.5 bg-surface-2/60 border border-line">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11.5px]">
            {/* Left Column: ChargePoint Operational Statuses */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-faint">
                {t('chargers.statusGuide.cpSection', 'Trạng thái Trụ sạc (Charge Point)')}
              </div>
              <div className="flex items-start gap-2 rounded-lg bg-surface p-2.5 border border-hairline">
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {t('chargers.statusGuide.onlineTitle', 'Hoạt động (Online)')}
                </span>
                <span className="text-muted leading-relaxed">
                  {t('chargers.statusGuide.onlineDesc', 'Trụ kết nối mạng ổn định, các cổng sạc sẵn sàng tiếp nhận xe.')}
                </span>
              </div>
              <div className="flex items-start gap-2 rounded-lg bg-surface p-2.5 border border-hairline">
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  {t('chargers.statusGuide.maintTitle', 'Bảo trì (Maintenance)')}
                </span>
                <span className="text-muted leading-relaxed">
                  {t('chargers.statusGuide.maintDesc', 'Trụ đang bảo dưỡng kỹ thuật, tạm dừng nhận đặt chỗ trên mọi cổng con.')}
                </span>
              </div>
              <div className="flex items-start gap-2 rounded-lg bg-surface p-2.5 border border-hairline">
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                  {t('chargers.statusGuide.offlineTitle', 'Ngoại tuyến (Offline)')}
                </span>
                <span className="text-muted leading-relaxed">
                  {t('chargers.statusGuide.offlineDesc', 'Mất kết nối mạng hoặc ngắt điện, tự động bảo vệ không nhận đơn mới.')}
                </span>
              </div>
              <div className="flex items-start gap-2 rounded-lg bg-surface p-2.5 border border-hairline">
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold bg-blue-500/10 text-blue-600 border border-blue-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  {t('chargers.statusGuide.pendingTitle', 'Chờ kích hoạt (Pending)')}
                </span>
                <span className="text-muted leading-relaxed">
                  {t('chargers.statusGuide.pendingDesc', 'Trụ mới cấp hạ tầng từ Admin, cần kiểm tra nghiệm thu trước khi mở bán.')}
                </span>
              </div>
            </div>

            {/* Right Column: Connector Runtime Statuses */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-faint">
                {t('chargers.statusGuide.connSection', 'Trạng thái Cổng sạc (Connector / Port)')}
              </div>
              <div className="flex items-start gap-2 rounded-lg bg-surface p-2.5 border border-hairline">
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {t('chargers.statusGuide.availTitle', 'Sẵn sàng (Available)')}
                </span>
                <span className="text-muted leading-relaxed">
                  {t('chargers.statusGuide.availDesc', 'Cổng sạc rảnh rỗi, tài xế có thể đặt chỗ trước hoặc quét mã cắm sạc ngay.')}
                </span>
              </div>
              <div className="flex items-start gap-2 rounded-lg bg-surface p-2.5 border border-hairline">
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold bg-blue-500/10 text-blue-600 border border-blue-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                  {t('chargers.statusGuide.chargingTitle', 'Đang sạc (In Use)')}
                </span>
                <span className="text-muted leading-relaxed">
                  {t('chargers.statusGuide.chargingDesc', 'Xe đang cắm súng và nạp điện. Trụ ghi nhận công suất & sản lượng kWh thực tế.')}
                </span>
              </div>
              <div className="flex items-start gap-2 rounded-lg bg-surface p-2.5 border border-hairline">
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold bg-red-500/10 text-red-600 border border-red-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
                  {t('chargers.statusGuide.incidentTitle', 'Sự cố (Incident)')}
                </span>
                <span className="text-muted leading-relaxed">
                  {t('chargers.statusGuide.incidentDesc', 'Cổng báo lỗi khẩn cấp BKG-054, tạm dừng mọi lượt đặt để bảo đảm an toàn.')}
                </span>
              </div>
              <div className="flex items-start gap-2 rounded-lg bg-surface p-2.5 border border-hairline">
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                  {t('chargers.statusGuide.connOfflineTitle', 'Tắt súng (Offline)')}
                </span>
                <span className="text-muted leading-relaxed">
                  {t('chargers.statusGuide.connOfflineDesc', 'Cổng bị ngắt riêng lẻ hoặc kế thừa trạng thái ngắt điện từ trụ sạc cha.')}
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
