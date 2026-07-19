import { useState, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CHARGER_STATUS, useApi, type ConnectorType } from '@chargeops/api';
import { Card, IconCard, PageHeader, Skeleton, StatusPill, useToast } from '@chargeops/ui';

const CONNECTORS: { value: ConnectorType; label: string }[] = [
  { value: 'CCS2', label: 'CCS2' },
  { value: 'CHAdeMO', label: 'CHAdeMO' },
  { value: 'Type2AC', label: 'Type 2 AC' },
  { value: 'GBT', label: 'GB/T' },
];
const POWERS = [22, 50, 60, 120, 150];
const PROV_STATION = 'ST-1042';

/** FR14 — admin creates charger records (UNCLAIMED until installed + linked). */
export function Provisioning() {
  const api = useApi();
  const qc = useQueryClient();
  const toast = useToast();
  const [connector, setConnector] = useState<ConnectorType>('CCS2');
  const [powerKw, setPowerKw] = useState(60);
  const [name, setName] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['chargers', 'provisioned', PROV_STATION],
    queryFn: () => api.chargers.list(PROV_STATION),
  });

  const provision = useMutation({
    mutationFn: () => api.chargers.provision({ connector, powerKw, name: name.trim() || undefined }),
    onSuccess: (c) => {
      qc.invalidateQueries({ queryKey: ['chargers'] });
      toast(`Đã tạo bản ghi ${c.id} (${CHARGER_STATUS[c.status].label})`, 'success');
      setName('');
    },
    onError: (e) => toast((e as Error).message, 'error'),
  });

  const rows = data ?? [];

  return (
    <>
      <PageHeader title="Cấp trụ sạc" subtitle="Tạo bản ghi trụ sạc và mã QR check-in cho trạm." />

      <div className="grid items-start gap-[13px] lg:grid-cols-[1fr_1.4fr]">
        {/* create form */}
        <Card className="p-[17px]">
          <div className="mb-[15px] text-[15px] font-semibold">Tạo bản ghi trụ sạc</div>
          <div className="flex flex-col gap-[13px]">
            <Field label="KẾT NỐI">
              <select
                value={connector}
                onChange={(e) => setConnector(e.target.value as ConnectorType)}
                className="w-full cursor-pointer rounded-[9px] border border-line bg-white px-[11px] py-[9px] text-[13px] font-medium"
              >
                {CONNECTORS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="CÔNG SUẤT (kW)">
              <select
                value={powerKw}
                onChange={(e) => setPowerKw(Number(e.target.value))}
                className="w-full cursor-pointer rounded-[9px] border border-line bg-white px-[11px] py-[9px] text-[13px] font-medium"
              >
                {POWERS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="TÊN HIỂN THỊ (tùy chọn)">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Cổng A1 — chủ trạm đổi sau"
                className="w-full rounded-[9px] border border-line px-[11px] py-[9px] text-[13px]"
              />
            </Field>
            <button
              onClick={() => provision.mutate()}
              disabled={provision.isPending}
              className="rounded-[9px] bg-brand py-[11px] text-[13px] font-semibold text-white hover:bg-brand-strong disabled:opacity-60"
            >
              {provision.isPending ? 'Đang tạo…' : 'Tạo mã trụ + QR'}
            </button>
            <div className="flex gap-2 rounded-[9px] border border-warn-border bg-warn-soft px-[13px] py-[11px] text-[11.5px] leading-[1.5] text-warn-deep">
              <span>
                Bản ghi mới ở trạng thái <b className="font-semibold">CHƯA GÁN</b> → chuyển HOẠT ĐỘNG
                sau khi lắp đặt &amp; liên kết.
              </span>
            </div>
          </div>
        </Card>

        {/* provisioned table */}
        <div>
          <div className="mb-[11px] flex items-center justify-between">
            <div className="text-[15px] font-semibold">Trụ đã cấp · Trạm Long Biên</div>
            <span className="text-[12px] font-medium text-muted">{rows.length} bản ghi</span>
          </div>
          <Card className="overflow-hidden">
            {isLoading ? (
              <div className="p-4">
                {Array.from({ length: 4 }, (_, i) => (
                  <Skeleton key={i} className="mb-2 h-10 w-full" />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="min-w-[520px]">
                  <div
                    className="grid bg-surface-2 px-3.5 py-[11px] font-mono text-[9.5px] font-semibold text-faint"
                    style={{ gridTemplateColumns: '1fr 1fr 1fr 0.8fr 1.1fr 0.7fr' }}
                  >
                    <span>MÃ</span>
                    <span>TÊN</span>
                    <span>KẾT NỐI</span>
                    <span>kW</span>
                    <span>TRẠNG THÁI</span>
                    <span className="text-right">QR</span>
                  </div>
                  {rows.map((c) => {
                    const meta = CHARGER_STATUS[c.status];
                    return (
                      <div
                        key={c.id}
                        className="grid items-center border-b border-hairline px-3.5 py-3 text-[12px] font-medium"
                        style={{ gridTemplateColumns: '1fr 1fr 1fr 0.8fr 1.1fr 0.7fr' }}
                      >
                        <span className="font-mono text-[10.5px] font-semibold text-brand">{c.id}</span>
                        <span className="text-body">{c.name}</span>
                        <span className="text-muted">{c.connector}</span>
                        <span className="text-muted">{c.powerKw}</span>
                        <span>
                          <StatusPill tone={meta.tone} label={meta.label} />
                        </span>
                        <span className="text-right">
                          <button
                            onClick={() => toast(`Đang tải QR cho ${c.id}… (demo)`, 'info')}
                            className="inline-flex text-brand"
                            aria-label="Tải QR"
                          >
                            <IconCard size={15} strokeWidth={1.9} />
                          </button>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 font-mono text-[10px] font-semibold text-faint">{label}</div>
      {children}
    </div>
  );
}
