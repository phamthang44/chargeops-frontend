import type { IncidentAuditAction, IncidentReasonRef } from '@chargeops/api';
import i18n from '../../i18n';

const ACTIONS: readonly IncidentAuditAction[] = [
  'INCIDENT_REPORT',
  'INCIDENT_RECOVER',
  'INCIDENT_SESSION_STOP',
];

interface ParsedReason {
  action: IncidentAuditAction;
  id?: string;
  detail?: string;
}

/** Parses `INCIDENT_REPORT:<id>`, `INCIDENT_RECOVER:<id>`, `INCIDENT_SESSION_STOP:<id>:<bookingId>` [- <detail>]. */
function parseRaw(reason: string): ParsedReason | null {
  for (const action of ACTIONS) {
    const prefix = `${action}:`;
    if (!reason.startsWith(prefix)) continue;
    const rest = reason.slice(prefix.length);
    let head = rest;
    let detail: string | undefined;
    const dash = rest.indexOf(' - ');
    if (dash !== -1) {
      head = rest.slice(0, dash);
      const text = rest.slice(dash + 3).trim();
      detail = text || undefined;
    }
    const id = head.split(':')[0]?.trim();
    return { action, id: id || undefined, detail };
  }
  return null;
}

/**
 * Format raw technical reason strings (e.g., INCIDENT_REPORT:<id>, INCIDENT_RECOVER:<id>)
 * into friendly human-readable text for status history drawers and audit logs.
 *
 * Pass the server-provided incident context (`incidentAction`/`incidentId`/`incidentDetail`)
 * when available: it carries the full incident text resolved from `connector_incidents`,
 * instead of the 500-char copy embedded in the status-event reason.
 */
export function formatStatusReason(
  reason?: string | null,
  t?: (key: string, options?: Record<string, unknown>) => string,
  context?: Partial<IncidentReasonRef>,
): string {
  const raw = reason ?? '';
  if (!raw && !context?.incidentAction) return '';

  const translate =
    t || ((k: string, opts?: Record<string, unknown>) => i18n.t(k, { ns: 'common', ...opts }));

  const parsed = raw ? parseRaw(raw) : null;
  const action = context?.incidentAction ?? parsed?.action;
  if (!action) return raw;

  const id = (context?.incidentId || parsed?.id || '').slice(0, 8);
  const detail = context?.incidentDetail ?? parsed?.detail;

  switch (action) {
    case 'INCIDENT_REPORT':
      return detail
        ? translate('equipmentHistory.reasonIncidentReport', {
            id,
            detail,
            defaultValue: `Báo cáo sự cố khẩn cấp (#${id}): ${detail}`,
          })
        : translate('equipmentHistory.reasonIncidentReportShort', {
            id,
            defaultValue: `Báo cáo sự cố khẩn cấp (#${id})`,
          });
    case 'INCIDENT_RECOVER':
      return detail
        ? translate('equipmentHistory.reasonIncidentRecover', {
            id,
            detail,
            defaultValue: `Khắc phục sự cố (#${id}): ${detail}`,
          })
        : translate('equipmentHistory.reasonIncidentRecoverShort', {
            id,
            defaultValue: `Khắc phục sự cố (#${id})`,
          });
    case 'INCIDENT_SESSION_STOP':
      return detail
        ? translate('equipmentHistory.reasonSessionStop', {
            id,
            detail,
            defaultValue: `Xác nhận dừng phiên sạc an toàn (sự cố #${id}): ${detail}`,
          })
        : translate('equipmentHistory.reasonSessionStopShort', {
            id,
            defaultValue: `Xác nhận dừng phiên sạc an toàn (sự cố #${id})`,
          });
    default:
      return raw;
  }
}
