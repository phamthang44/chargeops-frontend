import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card, IconWrench, StatusPill } from '@chargeops/ui';
import { formatDateVn, formatTimeVn, type TicketFinding } from '@chargeops/api';

const CONCLUSION_LABELS: Record<string, { label: string; tone: 'bad' | 'warn' | 'neutral' | 'brand' }> = {
  STATION_FAILURE: { label: 'Lỗi phía trạm', tone: 'bad' },
  NOT_STATION_FAILURE: { label: 'Không phải lỗi phía trạm', tone: 'neutral' },
  HARDWARE_FAULT: { label: 'Lỗi phần cứng trụ sạc', tone: 'bad' },
  STATION_OFFLINE: { label: 'Trạm mất kết nối mạng', tone: 'bad' },
  SOFTWARE_BUG: { label: 'Sự cố phần mềm / firmware', tone: 'warn' },
  USER_ERROR: { label: 'Thao tác phía người dùng', tone: 'neutral' },
  OTHER: { label: 'Nguyên nhân khác', tone: 'neutral' },
};

export interface TicketFindingsCardProps {
  findings: TicketFinding[];
  canRecord?: boolean;
  isPending?: boolean;
  onRecord?: (conclusion: 'STATION_FAILURE' | 'NOT_STATION_FAILURE', affectedAt: string, reason: string) => Promise<void>;
}

export function TicketFindingsCard({ findings, canRecord = false, isPending = false, onRecord }: TicketFindingsCardProps) {
  const { t } = useTranslation('tickets');
  const [conclusion, setConclusion] = useState<'STATION_FAILURE' | 'NOT_STATION_FAILURE'>('STATION_FAILURE');
  const [affectedAt, setAffectedAt] = useState(() =>
    new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16));
  const [reason, setReason] = useState('');

  return (
    <Card className="rounded-2xl p-4 shadow-sm">
      <div className="mb-2.5 flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-[13px] font-bold text-ink">
          <IconWrench size={14} className="text-muted" />
          <span>{t('detail.findings.title', 'Kết luận kỹ thuật')}</span>
        </h2>
        {findings.length > 0 && (
          <span className="rounded bg-chip px-1.5 py-0.5 text-[10.5px] font-medium text-muted">
            {findings.length}
          </span>
        )}
      </div>

      {findings.length === 0 ? (
        <p className="text-[12px] text-muted leading-relaxed">
          {t('detail.findings.empty', 'Chưa có kết luận kỹ thuật nào được ghi nhận cho phiếu này.')}
        </p>
      ) : (
        <div className="space-y-2.5">
          {findings.map((f, idx) => {
            const metaConclusion = CONCLUSION_LABELS[f.conclusion] || {
              label: f.conclusion,
              tone: 'neutral' as const,
            };
            return (
              <div
                key={f.id || f.findingId || idx}
                className="rounded-xl border border-line bg-surface p-2.5 text-[12px]"
              >
                <div className="flex items-center justify-between gap-1.5">
                  <span className="font-semibold text-ink">
                    {t(`detail.findings.${f.conclusion}`, metaConclusion.label)}
                  </span>
                  <StatusPill
                    tone={metaConclusion.tone}
                    label={t(`detail.findings.${f.conclusion}`, metaConclusion.label)}
                  />
                </div>
                {f.reason && <p className="mt-1 text-muted">{f.reason}</p>}
                <div className="mt-1.5 text-[10.5px] text-faint">
                  {t('detail.findings.recordedAt', 'Ghi nhận: {{time}}', {
                    time: `${formatDateVn(f.recordedAt)} ${formatTimeVn(f.recordedAt)}`,
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {canRecord && onRecord && (
        <form className="mt-4 space-y-2 border-t border-hairline pt-3" onSubmit={async (event) => {
          event.preventDefault();
          if (!reason.trim() || !affectedAt || isPending) return;
          await onRecord(conclusion, new Date(affectedAt).toISOString(), reason.trim());
          setReason('');
        }}>
          <p className="text-[11px] text-muted">
            {t('detail.findings.auditNote', 'Kết luận được lưu vào audit, không tự quyết định hoặc thực hiện hoàn tiền.')}
          </p>
          <select value={conclusion} onChange={(event) => setConclusion(event.target.value as typeof conclusion)}
            className="w-full rounded-lg border border-line bg-surface p-2 text-[12px] text-ink">
            <option value="STATION_FAILURE">{t('detail.findings.STATION_FAILURE', 'Lỗi phía trạm')}</option>
            <option value="NOT_STATION_FAILURE">{t('detail.findings.NOT_STATION_FAILURE', 'Không phải lỗi phía trạm')}</option>
          </select>
          <input type="datetime-local" required value={affectedAt} onChange={(event) => setAffectedAt(event.target.value)}
            className="w-full rounded-lg border border-line bg-surface p-2 text-[12px] text-ink" />
          <textarea required maxLength={2000} rows={3} value={reason} onChange={(event) => setReason(event.target.value)}
            placeholder={t('detail.findings.reasonPlaceholder', 'Lý do và bằng chứng kết luận')}
            className="w-full rounded-lg border border-line bg-surface p-2 text-[12px] text-ink" />
          <Button type="submit" size="sm" disabled={isPending || !reason.trim() || !affectedAt}>
            {t('detail.findings.save', 'Ghi kết luận')}
          </Button>
        </form>
      )}
    </Card>
  );
}
