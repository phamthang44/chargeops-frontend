import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect, type ReactNode } from 'react';
import {
  BOOKING_STATUS,
  formatTimeVn,
  useApi,
  type Booking,
  type ChargePoint,
  type Connector,
  type ConnectorRuntimeStatus,
  type OperationalChargePointStatus,
} from '@chargeops/api';
import { Button, IconAlertTriangle, IconBolt, IconClock, IconLock, Modal, Skeleton, StatusPill } from '@chargeops/ui';
import { effectiveConnectorStatus } from './chargerStatus';

/** What the owner is about to do. `target` carries the affected connectors either way. */
export type StatusIntent =
  | { kind: 'chargePoint'; chargePoint: ChargePoint; connectors: Connector[]; next: OperationalChargePointStatus; reason?: string }
  | { kind: 'connector'; chargePoint: ChargePoint; connector: Connector; next: ConnectorRuntimeStatus; reason?: string };

export interface StatusChangeDialogProps {
  intent: StatusIntent | null;
  saving: boolean;
  onClose: () => void;
  onConfirm: (intent: StatusIntent) => void;
}

function affectedConnectors(intent: StatusIntent): Connector[] {
  return intent.kind === 'chargePoint' ? intent.connectors : [intent.connector];
}

function isGoingDown(intent: StatusIntent): boolean {
  return intent.next === 'OFFLINE' || intent.next === 'MAINTENANCE';
}

const REASON_PRESETS: Record<string, string[]> = {
  MAINTENANCE: [
    'Bảo trì định kỳ phần cứng',
    'Kiểm tra an toàn đường dây & trạm biến áp',
    'Bảo dưỡng và vệ sinh đầu súng sạc',
    'Nâng cấp firmware / phần mềm điều khiển',
  ],
  OFFLINE: [
    'Tạm ngắt nguồn điện',
    'Sự cố thiết bị phần cứng',
    'Tạm đóng cửa khu vực trạm sạc',
    'Khu vực thi công / sửa chữa hạ tầng',
  ],
};

/**
 * Confirmation gate for every operational status change on this screen.
 * Requires mandatory reason when switching to OFFLINE or MAINTENANCE.
 */
export function StatusChangeDialog({ intent, saving, onClose, onConfirm }: StatusChangeDialogProps) {
  const { t } = useTranslation('owner');
  const api = useApi();
  const [reason, setReason] = useState(intent?.reason ?? '');

  useEffect(() => {
    setReason(intent?.reason ?? '');
  }, [intent]);

  const connectors = intent ? affectedConnectors(intent) : [];
  const goingDown = intent ? isGoingDown(intent) : false;
  const isMaint = intent?.next === 'MAINTENANCE';

  // Only an offline transition can be blocked, so only look bookings up then.
  const blockersQ = useQuery({
    queryKey: ['bookings', 'active', connectors.map((c) => c.id).sort()],
    queryFn: () => api.bookings.activeFor(connectors.map((c) => c.id)),
    enabled: !!intent && goingDown,
  });

  if (!intent) return null;

  const name =
    intent.kind === 'chargePoint'
      ? intent.chargePoint.name
      : `${intent.connector.connectorCode || intent.connector.id} (${intent.connector.connectorType})`;

  const blockers = blockersQ.data ?? [];
  const checking = goingDown && blockersQ.isLoading;
  const blocked = goingDown && blockers.length > 0;
  const requiresReason = goingDown;
  const isReasonValid = !requiresReason || reason.trim().length >= 3;

  const presets = isMaint ? REASON_PRESETS.MAINTENANCE : REASON_PRESETS.OFFLINE;

  return (
    <Modal open onClose={onClose} maxWidth={blocked ? 520 : 480}>
      {/* ---- header ---- */}
      <div className="mb-3 flex items-start gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] ${
            blocked
              ? 'bg-bad-soft'
              : isMaint
                ? 'bg-warn-soft'
                : goingDown
                  ? 'bg-bad-soft'
                  : 'bg-owner-soft'
          }`}
        >
          {blocked ? (
            <IconLock size={18} className="text-bad" />
          ) : isMaint ? (
            <IconClock size={18} className="text-warn" />
          ) : goingDown ? (
            <IconAlertTriangle size={18} className="text-bad" />
          ) : (
            <IconBolt size={18} className="text-owner" />
          )}
        </span>
        <div className="min-w-0 flex-1 pt-0.5">
          <div className="text-[15.5px] font-bold leading-snug">
            {blocked
              ? t('statusDialog.blockedTitle', { name })
              : isMaint
                ? `Chuyển Bảo trì · ${name}`
                : goingDown
                  ? t('statusDialog.offlineTitle', { name })
                  : t('statusDialog.onlineTitle', { name })}
          </div>
        </div>
      </div>

      {checking ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ) : blocked ? (
        <BlockedBody intent={intent} blockers={blockers} />
      ) : goingDown ? (
        <OfflineBody intent={intent} connectors={connectors} isMaintenance={isMaint} />
      ) : (
        <OnlineBody intent={intent} connectors={connectors} />
      )}

      {/* ---- mandatory reason input when going offline / maintenance ---- */}
      {!blocked && !checking && requiresReason && (
        <div className="mt-3.5 flex flex-col gap-1.5 rounded-[10px] border border-line-2 bg-surface-2 p-3">
          <label className="text-[11.5px] font-bold text-ink">
            Lý do thay đổi trạng thái <span className="text-bad">*</span>
          </label>
          <div className="flex flex-wrap gap-1.5 mb-1">
            {presets.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setReason(p)}
                className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition ${
                  reason === p
                    ? 'border-owner bg-owner text-white font-semibold'
                    : 'border-line-2 bg-surface text-body hover:border-line-3'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <textarea
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Nhập chi tiết lý do (bắt buộc, tối thiểu 3 ký tự)..."
            className="w-full rounded-[8px] border border-line bg-surface px-3 py-2 text-[12px] font-medium text-ink focus:border-owner focus:outline-none"
          />
        </div>
      )}

      {/* ---- actions ---- */}
      <div className="mt-[18px] flex justify-end gap-2.5">
        <Button variant="secondary" onClick={onClose}>
          {blocked ? t('statusDialog.close') : t('statusDialog.cancel')}
        </Button>
        {!blocked && !checking && (
          <Button
            accent="owner"
            variant={isMaint ? 'primary' : goingDown ? 'danger' : 'primary'}
            onClick={() => onConfirm({ ...intent, reason: reason.trim() })}
            disabled={saving || !isReasonValid}
          >
            {saving
              ? t('statusDialog.applying')
              : isMaint
                ? 'Xác nhận Bảo trì'
                : goingDown
                  ? t('statusDialog.confirmOffline')
                  : t('statusDialog.confirmOnline')}
          </Button>
        )}
      </div>
    </Modal>
  );
}

/** BR-CHG-05 refusal — name the bookings standing in the way. */
function BlockedBody({ intent, blockers }: { intent: StatusIntent; blockers: Booking[] }) {
  const { t } = useTranslation('owner');
  return (
    <>
      <p className="text-[12.5px] leading-[1.55] text-body">
        {intent.kind === 'chargePoint'
          ? t('statusDialog.blockedBodyDevice', { count: blockers.length })
          : t('statusDialog.blockedBodyConnector', { count: blockers.length })}
      </p>

      <div className="mt-3 max-h-[190px] overflow-y-auto rounded-card border border-line-3">
        {blockers.map((b) => {
          const meta = BOOKING_STATUS[b.status];
          return (
            <div
              key={b.id}
              className="flex items-center justify-between gap-2 border-b border-hairline px-3 py-2.5 text-[12px] last:border-b-0"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span className="font-mono text-[11.5px] font-semibold text-brand">{b.id}</span>
                <span className="truncate font-medium text-muted">{b.driverName}</span>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="font-mono text-[11px] text-muted">
                  {formatTimeVn(b.startAt)}–{formatTimeVn(b.endAt)}
                </span>
                <StatusPill tone={meta.tone} label={meta.label} />
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-3 rounded-[9px] bg-chip px-3 py-2.5 text-[11.5px] leading-[1.5] text-muted">
        {t('statusDialog.blockedHint')}
      </p>
    </>
  );
}

/** Spell out the blast radius before going offline / maintenance. */
function OfflineBody({ intent, connectors, isMaintenance }: { intent: StatusIntent; connectors: Connector[]; isMaintenance?: boolean }) {
  const { t } = useTranslation('owner');
  return (
    <>
      <p className="text-[12.5px] leading-[1.55] text-body">
        {isMaintenance
          ? intent.kind === 'chargePoint'
            ? `Chuyển trụ sạc sang chế độ Bảo trì sẽ tạm dừng phục vụ trên tất cả ${connectors.length} cổng sạc con.`
            : 'Chuyển cổng sạc sang chế độ Bảo trì kỹ thuật.'
          : intent.kind === 'chargePoint'
            ? t('statusDialog.offlineBodyDevice', { count: connectors.length })
            : t('statusDialog.offlineBodyConnector')}
      </p>

      <ul className="mt-3 flex flex-col gap-2 rounded-card border border-line-3 p-3.5">
        <Impact tone="bad">{t('statusDialog.impactNoBookings')}</Impact>
        <Impact tone="bad">{t('statusDialog.impactHiddenFromDrivers')}</Impact>
        <Impact tone="muted">{t('statusDialog.impactRestores')}</Impact>
      </ul>

      {intent.kind === 'chargePoint' && connectors.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {connectors.map((c) => (
            <span
              key={c.id}
              className="rounded-full bg-chip px-2.5 py-1 font-mono text-[10.5px] font-semibold text-body"
            >
              {c.id}
            </span>
          ))}
        </div>
      )}
    </>
  );
}

/** Coming back online — show which ports actually return, and which stay down. */
function OnlineBody({ intent, connectors }: { intent: StatusIntent; connectors: Connector[] }) {
  const { t } = useTranslation('owner');

  if (intent.kind === 'connector') {
    return (
      <p className="text-[12.5px] leading-[1.55] text-body">
        {t('statusDialog.onlineBodyConnector')}
      </p>
    );
  }

  const returning = connectors.filter((c) => c.runtimeStatus !== 'OFFLINE');
  const staying = connectors.filter((c) => c.runtimeStatus === 'OFFLINE');

  return (
    <>
      <p className="text-[12.5px] leading-[1.55] text-body">
        {t('statusDialog.onlineBodyDevice', { returning: returning.length, total: connectors.length })}
      </p>

      <div className="mt-3 flex flex-col gap-1.5 rounded-card border border-line-3 p-3.5">
        {connectors.map((c) => {
          const back = c.runtimeStatus !== 'OFFLINE';
          return (
            <div key={c.id} className="flex items-center justify-between gap-2 text-[12px]">
              <span className="flex min-w-0 items-center gap-2">
                <span className={`h-[6px] w-[6px] shrink-0 rounded-full ${back ? 'bg-good' : 'bg-disabled'}`} />
                <span className="font-mono text-[11.5px] font-semibold text-body">{c.id}</span>
                <span className="truncate text-muted">{c.name}</span>
              </span>
              <span className={`shrink-0 font-medium ${back ? 'text-good' : 'text-faint'}`}>
                {back
                  ? t(`connectors.status.${effectiveConnectorStatus('ACTIVE', 'AVAILABLE', c.runtimeStatus)}`)
                  : t('statusDialog.staysOffline')}
              </span>
            </div>
          );
        })}
      </div>

      {staying.length > 0 && (
        <p className="mt-3 rounded-[9px] bg-chip px-3 py-2.5 text-[11.5px] leading-[1.5] text-muted">
          {t('statusDialog.staysOfflineHint', { count: staying.length })}
        </p>
      )}
    </>
  );
}

function Impact({ tone, children }: { tone: 'bad' | 'muted'; children: ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-[12px] leading-[1.5]">
      <span
        className={`mt-[6px] h-[5px] w-[5px] shrink-0 rounded-full ${tone === 'bad' ? 'bg-bad' : 'bg-disabled'}`}
      />
      <span className={tone === 'bad' ? 'text-body' : 'text-muted'}>{children}</span>
    </li>
  );
}
