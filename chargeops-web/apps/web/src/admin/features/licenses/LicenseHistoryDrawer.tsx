import { useQuery } from '@tanstack/react-query';
import { Button, Card, IconShield, Modal, Skeleton, StatusPill } from '@chargeops/ui';
import { formatDateVn, formatVnd, LICENSE_STATUS, useApi, type License } from '@chargeops/api';

export interface LicenseHistoryDrawerProps {
  open: boolean;
  stationId: string | null;
  stationName?: string;
  onClose: () => void;
}

export function LicenseHistoryDrawer({
  open,
  stationId,
  stationName,
  onClose,
}: LicenseHistoryDrawerProps) {
  const api = useApi();

  const { data: history, isLoading } = useQuery({
    queryKey: ['licenses', 'history', stationId],
    queryFn: () => (stationId ? api.licenses.history(stationId) : Promise.resolve([])),
    enabled: Boolean(stationId) && open,
  });

  if (!stationId) return null;

  const items = history ?? [];

  return (
    <Modal open={open} onClose={onClose} maxWidth={640}>
      <div className="flex items-center justify-between border-b border-hairline pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-[9px] bg-brand-soft text-brand">
            <IconShield size={20} />
          </div>
          <div>
            <div className="text-[16px] font-bold text-ink">Lịch sử License theo trạm</div>
            <div className="text-[12px] text-muted">
              {stationName || stationId} · Mã trạm: <span className="font-mono font-semibold">{stationId}</span>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          ✕
        </Button>
      </div>

      <div className="mt-4 flex max-h-[480px] flex-col gap-3 overflow-y-auto pr-1">
        {isLoading ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-20 w-full rounded-[9px]" />
            <Skeleton className="h-20 w-full rounded-[9px]" />
          </div>
        ) : items.length === 0 ? (
          <div className="py-8 text-center text-[13px] text-faint">Chưa có lịch sử license cho trạm này.</div>
        ) : (
          items.map((l) => {
            const meta = LICENSE_STATUS[l.status] || { label: l.status, tone: 'neutral' };
            const isYear = String(l.plan).toUpperCase() === 'YEARLY';
            const start = l.startAt || l.startDate;
            const expiry = l.expiresAt || l.expiryDate;
            const fee = l.feeAmount ?? l.priceVnd ?? 0;

            return (
              <Card key={l.id} className="border border-line-2 bg-surface-2 p-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[12px] font-bold text-brand">{l.licenseCode || l.id}</span>
                    <span className="rounded bg-surface px-2 py-0.5 text-[11px] font-semibold text-body">
                      {isYear ? 'Gói Năm (1 năm)' : 'Gói Tháng (1 tháng)'}
                    </span>
                  </div>
                  <StatusPill tone={meta.tone} label={meta.label} />
                </div>

                <div className="mt-2.5 grid grid-cols-2 gap-2 text-[12px] font-medium text-body border-t border-hairline pt-2">
                  <div>
                    <span className="text-faint">Bắt đầu: </span>
                    <span>{start ? formatDateVn(start) : '—'}</span>
                  </div>
                  <div>
                    <span className="text-faint">Hết hạn: </span>
                    <span className="font-semibold text-ink">{expiry ? formatDateVn(expiry) : '—'}</span>
                  </div>
                  <div>
                    <span className="text-faint">Phí ghi nhận: </span>
                    <span className="font-semibold text-brand">{fee > 0 ? formatVnd(fee) : '—'}</span>
                  </div>
                  <div>
                    <span className="text-faint">Chủ trạm: </span>
                    <span className="text-muted">{l.ownerName || '—'}</span>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </Modal>
  );
}
