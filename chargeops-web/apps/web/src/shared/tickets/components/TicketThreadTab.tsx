import { useEffect, useRef, type RefObject } from 'react';
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
  readOnlyNotice?: string;
  accent: 'brand' | 'owner';
  /** Profile id của người xem — để nhận diện "tin của mình" theo authorId. */
  currentUserId?: string;
  messagesEndRef?: RefObject<HTMLDivElement | null>;
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
  readOnlyNotice,
  accent,
  currentUserId,
  messagesEndRef,
}: TicketThreadTabProps) {
  const { t } = useTranslation('tickets');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef<number>(0);
  const isInitialLoadRef = useRef<boolean>(true);

  // Self-contained scroll to bottom inside this container only
  useEffect(() => {
    if (!scrollContainerRef.current || isLoading) return;

    const el = scrollContainerRef.current;
    const currentCount = messages.length;

    if (currentCount > prevCountRef.current) {
      const behavior: ScrollBehavior = isInitialLoadRef.current ? 'instant' : 'smooth';
      requestAnimationFrame(() => {
        if (el) {
          el.scrollTo({
            top: el.scrollHeight,
            behavior,
          });
        }
      });
      isInitialLoadRef.current = false;
    }
    prevCountRef.current = currentCount;
  }, [messages.length, isLoading]);

  return (
    <>
      <div
        ref={scrollContainerRef}
        className="flex h-[360px] sm:h-[440px] lg:h-[500px] overflow-y-auto flex-col gap-3 sm:gap-4 p-3 sm:p-4 overscroll-contain"
      >
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
              <TicketMessageBubble
                key={m.id}
                message={m}
                accent={accent}
                currentUserId={currentUserId}
              />
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
        ) : readOnlyNotice ? (
          <div className="flex items-center gap-2 rounded-xl border border-line bg-surface p-3 text-sm text-muted">
            <IconLock size={16} />
            <span>{readOnlyNotice}</span>
          </div>
        ) : isResolved ? (
          <div className="space-y-2 rounded-xl border border-line bg-surface p-3">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-warn-deep px-1">
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
                type="button"
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
