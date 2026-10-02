import { useTranslation } from 'react-i18next';
import {
  Drawer,
  Button,
  IconCheck,
  IconCopy,
  IconClock,
  IconCard,
} from '@chargeops/ui';
import {
  formatDateVn,
  formatDateTimeVn,
  formatVnd,
  type OwnerFinanceBooking,
} from '@chargeops/api';
import { useState } from 'react';

export interface ReceiptsDrawerProps {
  open: boolean;
  onClose: () => void;
  booking: OwnerFinanceBooking | null;
}

export function ReceiptsDrawer({ open, onClose, booking }: ReceiptsDrawerProps) {
  const { t } = useTranslation('owner');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!booking) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const receipts = booking.receipts || [];

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={
        <div>
          <div className="text-[14px] font-bold text-ink">
            {t('finance.receiptsDrawer.title', 'Chứng từ thanh toán')}
          </div>
          <div className="text-[11px] font-medium text-muted">
            {booking.bookingCode || booking.bookingId} · {booking.stationName}
          </div>
        </div>
      }
      width="480px"
    >
      <div className="space-y-4 p-5">
        {/* Transparent Evidence Banner */}
        <div className="rounded-xl border border-hairline bg-surface-2/60 p-3 text-[12px] text-muted">
          <div className="font-semibold text-ink flex items-center gap-1.5 mb-1">
            <IconCard size={14} className="text-brand" />
            <span>{t('finance.receiptsDrawer.simulatorNotice', 'Chứng từ thanh toán điện tử (Payment Evidence)')}</span>
          </div>
          <p className="leading-relaxed text-[11.5px]">
            {t(
              'finance.receiptsDrawer.simulatorNoticeDesc',
              'Chứng từ được sinh tự động khi tài xế hoàn tất thanh toán cho phiên sạc. Gắn liền vĩnh viễn với đơn đặt chỗ để đối soát.'
            )}
          </p>
        </div>

        {/* Summary Card */}
        <div className="rounded-2xl border border-line-2 bg-surface p-4 shadow-2xs space-y-2">
          <div className="flex justify-between text-[12px]">
            <span className="text-muted">{t('finance.receiptsDrawer.collected', 'Thu ghi nhận')}:</span>
            <span className="font-mono font-bold text-good">+{formatVnd(booking.collectedAmount)}</span>
          </div>
          <div className="flex justify-between text-[12px]">
            <span className="text-muted">{t('finance.receiptsDrawer.refunded', 'Đã hoàn trả')}:</span>
            <span className="font-mono font-bold text-bad">−{formatVnd(booking.refundedAmount)}</span>
          </div>
          <div className="border-t border-hairline pt-2 flex justify-between text-[13px] font-bold">
            <span className="text-ink">{t('finance.receiptsDrawer.net', 'Thu ròng ghi nhận')}:</span>
            <span className="font-mono text-ink">+{formatVnd(booking.netRecordedAmount)}</span>
          </div>
        </div>

        {/* Receipts List */}
        <div>
          <h4 className="text-[12px] font-bold uppercase tracking-wider text-faint mb-2.5">
            {t('finance.receiptsDrawer.listTitle', 'Danh sách biên lai')} ({receipts.length})
          </h4>

          {receipts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-hairline py-8 text-center text-[12px] text-muted">
              {t('finance.receiptsDrawer.empty', 'Chưa có chứng từ giao dịch được ghi nhận.')}
            </div>
          ) : (
            <div className="space-y-2.5">
              {receipts.map((r, idx) => (
                <div
                  key={r.receiptId || idx}
                  className="rounded-xl border border-hairline bg-surface p-3 text-[12px] transition hover:border-line-2 shadow-2xs"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono font-bold text-brand text-[11.5px]">
                      {r.transactionRef || r.receiptId}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(r.transactionRef || r.receiptId)}
                      className="p-1 text-faint hover:text-ink rounded transition"
                      title="Sao chép mã giao dịch"
                    >
                      {copiedId === (r.transactionRef || r.receiptId) ? (
                        <IconCheck size={12} className="text-good" />
                      ) : (
                        <IconCopy size={12} />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-muted">
                    <span className="flex items-center gap-1 font-mono">
                      <IconClock size={11} className="text-faint" />
                      {r.receivedAt ? formatDateTimeVn(r.receivedAt) : '—'}
                    </span>
                    <span className="font-mono font-bold text-ink text-[12.5px]">
                      {formatVnd(r.amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Close button */}
        <div className="pt-2">
          <Button variant="secondary" onClick={onClose} className="w-full">
            {t('common.close', 'Đóng')}
          </Button>
        </div>
      </div>
    </Drawer>
  );
}
