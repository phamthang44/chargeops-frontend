import { useTranslation } from 'react-i18next';
import { formatDateVn, formatTimeVn, type TicketMessage } from '@chargeops/api';
import { Avatar } from '@chargeops/ui';

export function getActorMeta(m: TicketMessage) {
  const kind = m.authorKind;
  if (kind === 'ADMIN') {
    return {
      label: 'Quản trị viên ChargeOps',
      badgeClass: 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900',
      tone: 'brand' as const,
      isInternal: true,
    };
  }
  if (kind === 'OWNER') {
    return {
      label: 'Chủ trạm',
      badgeClass: 'bg-owner-soft text-owner-deep border border-owner-border',
      tone: 'owner' as const,
      isInternal: true,
    };
  }
  if (kind === 'STAFF') {
    return {
      label: 'Nhân viên trạm',
      badgeClass: 'bg-brand-soft text-brand-deep border border-brand-line',
      tone: 'brand' as const,
      isInternal: true,
    };
  }
  // Reporter or driver
  return {
    label: 'Tài xế (Người báo cáo)',
    badgeClass: 'bg-chip text-muted border border-hairline',
    tone: 'neutral' as const,
    isInternal: false,
  };
}

export interface TicketMessageBubbleProps {
  message: TicketMessage;
  accent: 'brand' | 'owner';
}

export function TicketMessageBubble({ message, accent }: TicketMessageBubbleProps) {
  const { t } = useTranslation('tickets');
  const actor = getActorMeta(message);
  const isMine = actor.isInternal;
  const actorKey = message.authorKind || message.authorRole || 'REPORTER';
  const actorLabel = t(`actor.${actorKey}`, actor.label);

  const bubbleClass = isMine
    ? accent === 'owner'
      ? 'bg-owner-soft border-owner-border'
      : 'bg-brand-soft border-brand-line'
    : 'bg-surface border-line';

  return (
    <div className={`flex items-start gap-2.5 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
      <Avatar
        name={message.authorDisplayName || message.authorName || 'User'}
        size="sm"
        tone={isMine ? accent : 'neutral'}
      />
      <div className={`flex max-w-[80%] flex-col ${isMine ? 'items-end' : 'items-start'}`}>
        <div className="mb-1 flex items-center gap-1.5 text-[11px] text-faint">
          <span className="font-semibold text-ink">
            {message.authorDisplayName || message.authorName || t('detail.senderFallback', 'Người gửi')}
          </span>
          <span className={`rounded px-1.5 py-0.2 text-[9.5px] font-medium ${actor.badgeClass}`}>
            {actorLabel}
          </span>
          <span>·</span>
          <span>
            {formatDateVn(message.createdAt)} {formatTimeVn(message.createdAt)}
          </span>
        </div>
        <div className={`rounded-2xl border px-3.5 py-2.5 text-[13px] leading-relaxed text-ink shadow-sm ${bubbleClass}`}>
          {message.body}
        </div>
      </div>
    </div>
  );
}
