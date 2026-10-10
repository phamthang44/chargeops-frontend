import { useTranslation } from 'react-i18next';
import { formatDateVn, formatTimeVn, type TicketMessage } from '@chargeops/api';
import { Avatar } from '@chargeops/ui';

function getActorMeta(m: TicketMessage) {
  const kind = m.authorKind;
  if (kind === 'ADMIN') {
    return {
      label: 'Quản trị viên ChargeOps',
      badgeClass: 'bg-solid text-solid-fg',
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
  // Reporter or user
  return {
    label: 'Người báo cáo',
    badgeClass: 'bg-chip text-muted border border-hairline',
    tone: 'neutral' as const,
    isInternal: false,
  };
}

export interface TicketMessageBubbleProps {
  message: TicketMessage;
  accent: 'brand' | 'owner';
  /** Profile id của người xem — "tin của mình" chỉ khi authorId khớp. */
  currentUserId?: string;
}

export function TicketMessageBubble({ message, accent, currentUserId }: TicketMessageBubbleProps) {
  const { t } = useTranslation('tickets');
  const actor = getActorMeta(message);
  // Không suy "của mình" từ authorKind/tên hiển thị: thiếu authorId → hiển thị trung tính.
  const isMine = Boolean(
    currentUserId && message.authorId && message.authorId === currentUserId
  );
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
      <div className={`flex max-w-[88%] sm:max-w-[80%] flex-col ${isMine ? 'items-end' : 'items-start'}`}>
        <div className={`mb-1 flex flex-wrap items-center gap-1 sm:gap-1.5 text-[10.5px] sm:text-[11px] text-faint ${isMine ? 'justify-end' : 'justify-start'}`}>
          <span className="font-semibold text-ink truncate max-w-[120px] sm:max-w-none">
            {message.authorDisplayName || message.authorName || t('detail.senderFallback', 'Người gửi')}
          </span>
          <span className={`rounded px-1.5 py-0.2 text-[9px] sm:text-[9.5px] font-medium ${actor.badgeClass}`}>
            {actorLabel}
          </span>
          <span className="hidden xs:inline">·</span>
          <span className="shrink-0">
            {formatDateVn(message.createdAt)} {formatTimeVn(message.createdAt)}
          </span>
        </div>
        <div className={`rounded-2xl border px-3.5 py-2.5 text-[13px] leading-relaxed text-ink shadow-sm break-words [overflow-wrap:anywhere] whitespace-pre-wrap ${bubbleClass}`}>
          {message.body}
        </div>
      </div>
    </div>
  );
}
