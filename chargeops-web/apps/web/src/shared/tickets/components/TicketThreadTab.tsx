import type { RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  ChatComposer,
  IconAlertCircle,
  IconClock,
  IconLock,
  IconSend,
  Skeleton,
} from '@chargeops/ui';
import type { TicketMessage } from '@chargeops/api';
import { TicketMessageBubble } from './TicketMessageBubble';

export interface TicketThreadTabProps {
  messages: TicketMessage[];
  isLoading: boolean;
  draft: string;
  onDraftChange: (val: string) => void;
  onSend: (text: string) => void;
  isSending: boolean;
  isResolved: boolean;
  isClosed: boolean;
  accent: 'brand' | 'owner';
  messagesEndRef: RefObject<HTMLDivElement | null>;
}

export function TicketThreadTab({
  messages,
  isLoading,
  draft,
  onDraftChange,
  onSend,
  isSending,
  isResolved,
  isClosed,
  accent,
  messagesEndRef,
}: TicketThreadTabProps) {
  const { t } = useTranslation('tickets');

  return (
    <>
      <div className="flex min-h-[340px] max-h-[550px] overflow-y-auto flex-col gap-4 p-4">
        {isLoading ? (
          <>
            <Skeleton className="h-14 w-3/4" />
            <Skeleton className="ml-auto h-14 w-3/4" />
          </>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted">
            <IconAlertCircle size={28} className="mb-2 text-faint" />
            <p className="text-[13px] font-medium text-ink">
              {t('detail.noMessages', 'Chưa có phản hồi nào trong luồng này.')}
            </p>
            <p className="text-[11.5px] text-faint">
              {t('detail.sendFirst', 'Gửi tin nhắn để bắt đầu trao đổi với khách hàng.')}
            </p>
          </div>
        ) : (
          <>
            {messages.map((m) => (
              <TicketMessageBubble key={m.id} message={m} accent={accent} />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Adaptive Composer or Terminal Sealed Vault */}
      <div className="border-t border-hairline p-3.5 bg-surface-2/40">
        {isClosed ? (
          <div className="flex items-center justify-center gap-2.5 rounded-xl border border-line bg-surface p-3.5 text-[12.5px] text-muted shadow-sm">
            <IconLock size={16} className="text-faint" />
            <span>
              {t(
                'detail.composerClosedNotice',
                'Phiếu hỗ trợ này đã được đóng hoàn tất. Không thể gửi thêm tin nhắn phản hồi.'
              )}
            </span>
          </div>
        ) : isResolved ? (
          <div className="space-y-2 rounded-xl border border-line bg-surface p-3">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-amber-700 dark:text-amber-300 px-1">
              <IconClock size={12} strokeWidth={2.2} />
              <span>
                {t(
                  'detail.composerResolvedWarning',
                  'Đang chờ tài xế xác nhận hoặc báo vấn đề vẫn còn. Bên xử lý không thể gửi tin nhắn trong giai đoạn này.'
                )}
              </span>
            </div>
          </div>
        ) : (
          <ChatComposer
            value={draft}
            onChange={onDraftChange}
            onSubmit={() => onSend(draft.trim())}
            placeholder={t('detail.composerPlaceholder', 'Nhập phản hồi hoặc hướng dẫn xử lý...')}
            disabled={isSending}
            accent={accent}
            actions={
              <Button
                accent={accent}
                size="md"
                icon={<IconSend size={14} strokeWidth={2.2} />}
                disabled={!draft.trim() || isSending}
                onClick={() => onSend(draft.trim())}
              >
                {isSending ? t('detail.sending', 'Đang gửi...') : t('detail.send', 'Gửi')}
              </Button>
            }
          />
        )}
      </div>
    </>
  );
}
