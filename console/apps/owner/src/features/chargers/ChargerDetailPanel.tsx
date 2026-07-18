import { useEffect, useState, type ReactNode } from 'react';
import type { Charger, ChargerStatus } from '@chargeops/api';
import { Card, IconBolt, IconClock, IconLock, IconX, QrGlyph } from '@chargeops/ui';
import { CHARGER_PILL, OWNER_CYCLE } from './chargerStatus';

export interface ChargerDetailPanelProps {
  charger: Charger;
  saving: boolean;
  onClose: () => void;
  onSave: (id: string, patch: { name: string; status: ChargerStatus }) => void;
  onDownloadQr: (c: Charger) => void;
}

/** Right-hand editor: owner edits name + status; specs are read-only (admin-provisioned). */
export function ChargerDetailPanel({
  charger,
  saving,
  onClose,
  onSave,
  onDownloadQr,
}: ChargerDetailPanelProps) {
  const [name, setName] = useState(charger.name);
  const [status, setStatus] = useState<ChargerStatus>(charger.status);

  // Re-sync drafts when a different charger is selected.
  useEffect(() => {
    setName(charger.name);
    setStatus(charger.status);
  }, [charger.id, charger.name, charger.status]);

  return (
    <Card className="p-[18px]">
      <div className="mb-1.5 flex items-start justify-between">
        <div>
          <div className="font-mono text-[10px] font-semibold tracking-[0.05em] text-owner">
            CHỈNH SỬA TRỤ SẠC
          </div>
          <div className="mt-1 text-[17px] font-bold">{charger.name}</div>
        </div>
        <button
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-faint hover:bg-chip"
          aria-label="Đóng"
        >
          <IconX size={16} strokeWidth={2} />
        </button>
      </div>

      {/* identity */}
      <SectionTitle icon={<IconBolt size={15} className="text-owner" />}>
        Thông tin định danh
      </SectionTitle>
      <FieldLabel>MÃ TRỤ (CHARGER ID)</FieldLabel>
      <div className="mb-[5px] flex items-center gap-2 rounded-[10px] border border-line-3 bg-[#f7f8fa] px-[13px] py-[11px]">
        <span className="flex-1 font-mono text-[13px] font-semibold text-body">{charger.id}</span>
        <IconLock size={14} className="text-disabled" />
      </div>
      <p className="mb-[15px] text-[11px] leading-[1.5] text-faint">
        Mã duy nhất dùng để tạo QR Check-in — không thể đổi.
      </p>
      <FieldLabel>TÊN HIỂN THỊ</FieldLabel>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="VD: Bộ sạc nhanh 60kW — Trụ 1"
        className="w-full rounded-[10px] border border-line px-[13px] py-[11px] text-[13.5px] font-medium focus:border-owner"
      />
      <p className="mt-[7px] text-[11px] leading-[1.5] text-faint">
        Tên này hiển thị cho tài xế và trên màn hình trụ sạc.
      </p>

      {/* locked specs */}
      <div className="mt-[18px] mb-3 flex items-center justify-between">
        <SectionTitleInline icon={<IconBolt size={15} className="text-owner" />}>
          Thông số kỹ thuật
        </SectionTitleInline>
        <span className="flex items-center gap-[5px] rounded-full bg-warn-soft px-[9px] py-1 font-mono text-[10px] text-warn">
          <IconLock size={11} strokeWidth={2.1} />
          Do QTV cấp
        </span>
      </div>
      <div className="mb-[5px] flex gap-[11px]">
        <LockedSpec label="LOẠI ĐẦU CẮM" value={charger.connector} />
        <LockedSpec label="CÔNG SUẤT" value={`${charger.powerKw} kW`} />
      </div>
      <p className="text-[11px] leading-[1.5] text-faint">
        Kết nối &amp; công suất được Quản trị viên cấp khi lắp đặt.
      </p>

      {/* status */}
      <SectionTitle className="mt-[18px]" icon={<IconClock size={15} className="text-owner" />}>
        Trạng thái vận hành
      </SectionTitle>
      <div className="flex gap-[7px]">
        {OWNER_CYCLE.map((s) => {
          const pill = CHARGER_PILL[s];
          const on = s === status;
          return (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-[10px] border-[1.5px] px-1 py-2.5 text-[12px] font-semibold transition"
              style={{
                borderColor: on ? pill.fg : '#e6e8ec',
                background: on ? pill.bg : '#fff',
                color: on ? pill.fg : '#62656e',
              }}
            >
              <span className="h-[7px] w-[7px] rounded-full" style={{ background: pill.fg }} />
              {pill.label}
            </button>
          );
        })}
      </div>

      {/* today performance */}
      <SectionTitle className="mt-[18px]" icon={<IconBolt size={15} className="text-owner" />}>
        Hiệu suất hôm nay
      </SectionTitle>
      <div className="grid grid-cols-2 gap-2.5">
        <PerfStat label="SỬ DỤNG" value={`${charger.utilizationPct}%`} />
        <PerfStat label="UPTIME 30N" value={`${charger.uptime30dPct}%`} />
        <PerfStat label="PHIÊN HÔM NAY" value={String(charger.sessionsToday)} />
        <PerfStat label="kWh HÔM NAY" value={String(charger.kwhToday)} />
      </div>

      {/* QR */}
      <div className="mt-[18px] flex items-center gap-[13px] rounded-card border border-line-3 bg-surface-2 p-3.5">
        <span className="flex h-[74px] w-[74px] shrink-0 items-center justify-center rounded-[10px] border border-line-3 bg-white">
          <QrGlyph size={56} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[12.5px] font-semibold">QR Check-in</div>
          <div className="mt-0.5 text-[11px] leading-[1.45] text-faint">
            Dán tại trụ để tài xế quét khi đến.
          </div>
        </div>
        <button
          onClick={() => onDownloadQr(charger)}
          className="flex shrink-0 items-center gap-1.5 rounded-[9px] border-[1.5px] border-owner-border px-[13px] py-[9px] text-[12px] font-semibold text-owner-deep hover:bg-owner-soft"
        >
          Tải QR
        </button>
      </div>

      <button
        onClick={() => onSave(charger.id, { name: name.trim() || charger.name, status })}
        disabled={saving}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-[11px] bg-owner py-3 text-[13px] font-semibold text-white shadow-[0_1px_3px_rgba(18,161,80,.35)] hover:bg-owner-strong disabled:opacity-60"
      >
        {saving ? 'Đang lưu…' : 'Lưu thay đổi'}
      </button>
    </Card>
  );
}

function SectionTitle({
  icon,
  children,
  className = '',
}: {
  icon: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mb-3 flex items-center gap-2.5 ${className}`}>
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-owner-soft">
        {icon}
      </span>
      <span className="text-[13.5px] font-semibold">{children}</span>
    </div>
  );
}

function SectionTitleInline({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-owner-soft">
        {icon}
      </span>
      <span className="text-[13.5px] font-semibold">{children}</span>
    </div>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <div className="mb-[7px] font-mono text-[10px] font-semibold tracking-[0.05em] text-faint">
      {children}
    </div>
  );
}

function LockedSpec({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1">
      <div className="mb-1.5 font-mono text-[10px] font-semibold text-faint">{label}</div>
      <div className="rounded-[10px] border border-line-3 bg-[#f7f8fa] px-3 py-2.5 text-[12.5px] font-semibold text-body">
        {value}
      </div>
    </div>
  );
}

function PerfStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[10px] border border-line-3 p-[11px]">
      <div className="font-mono text-[9px] font-semibold text-faint">{label}</div>
      <div className="mt-[3px] text-[17px] font-bold">{value}</div>
    </div>
  );
}
