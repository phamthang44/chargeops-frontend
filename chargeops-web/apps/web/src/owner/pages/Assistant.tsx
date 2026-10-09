import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ApiError, useApi, type AssistantCitation, type ConversationSummary } from '@chargeops/api';
import { useAuth } from '@chargeops/auth';
import {
  IconAlertTriangle,
  IconBook,
  IconChat,
  IconCheck,
  IconChevronDown,
  IconChevronUp,
  IconClock,
  IconHistory,
  IconInfoCircle,
  IconRefreshCw,
  IconSend,
  IconX,
  PageHeader,
} from '@chargeops/ui';

interface ChatMessage {
  id: string;
  role: 'bot' | 'user';
  text: string;
  timestamp: string;
  messageId?: string;
  citations?: AssistantCitation[];
}

interface AssistantErrorState {
  code?: string;
  status?: number;
  message: string;
  resetAt?: string;
  failedQuestion?: string;
}

const QUICK_QS_KEYS = [
  'assistant.quickQs.cancelRefund',
  'assistant.quickQs.checkinWindow',
  'assistant.quickQs.bookingConfirm',
  'assistant.quickQs.stationFailure',
] as const;

const MAX_QUESTION_LENGTH = 2000;

/** Markdown element styling for bot answers (matches chat bubble typography). */
const MD_COMPONENTS = {
  p: ({ children }: { children?: ReactNode }) => (
    <p className="my-1.5 first:mt-0 last:mb-0">{children}</p>
  ),
  strong: ({ children }: { children?: ReactNode }) => (
    <strong className="font-semibold text-ink">{children}</strong>
  ),
  em: ({ children }: { children?: ReactNode }) => (
    <em className="italic">{children}</em>
  ),
  ul: ({ children }: { children?: ReactNode }) => (
    <ul className="my-1.5 list-disc space-y-1 pl-5">{children}</ul>
  ),
  ol: ({ children }: { children?: ReactNode }) => (
    <ol className="my-1.5 list-decimal space-y-1 pl-5">{children}</ol>
  ),
  li: ({ children }: { children?: ReactNode }) => <li className="pl-0.5">{children}</li>,
  h1: ({ children }: { children?: ReactNode }) => (
    <h1 className="mt-3 mb-1.5 text-[15px] font-bold text-ink first:mt-0">{children}</h1>
  ),
  h2: ({ children }: { children?: ReactNode }) => (
    <h2 className="mt-2.5 mb-1.5 text-[14.5px] font-bold text-ink first:mt-0">{children}</h2>
  ),
  h3: ({ children }: { children?: ReactNode }) => (
    <h3 className="mt-2 mb-1 text-[13.5px] font-semibold text-ink first:mt-0">{children}</h3>
  ),
  blockquote: ({ children }: { children?: ReactNode }) => (
    <blockquote className="my-1.5 border-l-2 border-brand/40 pl-2.5 text-muted italic">
      {children}
    </blockquote>
  ),
  code: ({ children }: { children?: ReactNode }) => (
    <code className="rounded bg-surface-2 px-1 py-0.5 font-mono text-[12px] text-ink">{children}</code>
  ),
  pre: ({ children }: { children?: ReactNode }) => (
    <pre className="my-1.5 overflow-x-auto rounded-lg bg-surface-2 p-2.5 text-[12px]">{children}</pre>
  ),
  a: ({ children, href }: { children?: ReactNode; href?: string }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-brand underline underline-offset-2 hover:text-brand-strong"
    >
      {children}
    </a>
  ),
  table: ({ children }: { children?: ReactNode }) => (
    <div className="my-1.5 overflow-x-auto">
      <table className="w-full border-collapse text-[12.5px]">{children}</table>
    </div>
  ),
  th: ({ children }: { children?: ReactNode }) => (
    <th className="border border-line bg-surface-2 px-2 py-1 text-left font-semibold text-ink">
      {children}
    </th>
  ),
  td: ({ children }: { children?: ReactNode }) => (
    <td className="border border-line px-2 py-1 align-top">{children}</td>
  ),
  hr: () => <hr className="my-2.5 border-line-2" />,
};

/** Format ISO instant string using user's browser locale and local timezone */
function formatLocalTime(isoString?: string): string {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return isoString;
    return new Intl.DateTimeFormat(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d);
  } catch {
    return isoString;
  }
}

function formatRelativeTime(isoString?: string, locale: 'vi' | 'en' = 'vi'): string {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return '';
    const now = new Date();
    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();

    if (isToday) {
      return new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(d);
    }
    return new Intl.DateTimeFormat(undefined, { day: '2-digit', month: '2-digit' }).format(d);
  } catch {
    return '';
  }
}

/** FR15 — Owner Policy Assistant (BKG-067 ask-only grounded RAG + BKG-067 chat history recovery). */
export function Assistant() {
  const { t, i18n } = useTranslation('owner');
  const api = useApi();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // History and conversation state
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [conversationsHasMore, setConversationsHasMore] = useState(false);
  const [conversationsCursor, setConversationsCursor] = useState<string | null>(null);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Chat message & interaction state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [pending, setPending] = useState(false);
  const [errorState, setErrorState] = useState<AssistantErrorState | null>(null);
  const [expandedCitationMessageIds, setExpandedCitationMessageIds] = useState<Record<string, boolean>>({});
  const [quotaLockedUntil, setQuotaLockedUntil] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentLocale = (i18n.language?.startsWith('en') ? 'en' : 'vi') as 'vi' | 'en';
  const userStorageKey = user?.id ? `chargeops_assistant_convo_${user.id}` : null;

  // 1. Fetch conversations list on mount
  useEffect(() => {
    let active = true;
    setConversationsLoading(true);
    api.policies
      .conversations(undefined, 30)
      .then((res) => {
        if (!active) return;
        setConversations(res.items);
        setConversationsHasMore(res.hasMore);
        setConversationsCursor(res.nextCursor ?? null);

        // Check conversation ID from URL param ?c= or localStorage
        const urlConvoId = searchParams.get('c');
        const storedConvoId = userStorageKey ? localStorage.getItem(userStorageKey) : null;
        const targetId = urlConvoId || storedConvoId;

        if (targetId && res.items.some((item) => item.id === targetId)) {
          setCurrentConversationId(targetId);
        } else if (targetId) {
          // If not in first page, still attempt loading targetId directly
          setCurrentConversationId(targetId);
        }
      })
      .catch((err) => {
        console.warn('Could not load conversations list:', err);
      })
      .finally(() => {
        if (active) setConversationsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [api, userStorageKey]);

  // 2. Load messages whenever currentConversationId changes
  useEffect(() => {
    if (!currentConversationId) {
      // New conversation: seed local greeting if empty
      setMessages([
        {
          id: 'greeting',
          role: 'bot',
          text: t('assistant.greeting'),
          timestamp: new Date().toISOString(),
        },
      ]);
      return;
    }

    let active = true;
    setHistoryLoading(true);
    setErrorState(null);

    // Sync storage and URL search param
    if (userStorageKey) {
      localStorage.setItem(userStorageKey, currentConversationId);
    }
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (next.get('c') !== currentConversationId) {
          next.set('c', currentConversationId);
        }
        return next;
      },
      { replace: true },
    );

    api.policies
      .messages(currentConversationId, undefined, 50)
      .then((res) => {
        if (!active) return;
        // Upstream messages are sorted, ensure oldest-to-newest linear order in transcript
        const sortedTurns = [...res.items].reverse();
        const chatMsgs: ChatMessage[] = [];

        for (const turn of sortedTurns) {
          chatMsgs.push({
            id: `usr-${turn.id}`,
            role: 'user',
            text: turn.query,
            timestamp: turn.createdAt,
          });
          chatMsgs.push({
            id: `bot-${turn.id}`,
            role: 'bot',
            text: turn.answer,
            timestamp: turn.createdAt,
            messageId: turn.id,
            citations: turn.citations ?? [],
          });
        }

        if (chatMsgs.length === 0) {
          chatMsgs.push({
            id: 'greeting',
            role: 'bot',
            text: t('assistant.greeting'),
            timestamp: new Date().toISOString(),
          });
        }
        setMessages(chatMsgs);
      })
      .catch((err) => {
        if (!active) return;
        if (err instanceof ApiError && (err.status === 404 || err.code === 'ASSISTANT_CONVERSATION_NOT_FOUND')) {
          setErrorState({
            code: 'ASSISTANT_CONVERSATION_NOT_FOUND',
            status: 404,
            message: t('assistant.conversationNotFound'),
          });
          if (userStorageKey) localStorage.removeItem(userStorageKey);
        } else {
          setErrorState({
            code: err instanceof ApiError ? err.code : 'UNKNOWN',
            status: err instanceof ApiError ? err.status : 500,
            message: err instanceof Error ? err.message : t('assistant.errors.serviceUnavailable'),
          });
        }
      })
      .finally(() => {
        if (active) setHistoryLoading(false);
      });

    return () => {
      active = false;
    };
  }, [currentConversationId, api, t, userStorageKey, setSearchParams]);

  // Auto-scroll transcript on new messages or loading change
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, pending, errorState, historyLoading]);

  // Check quota unlock
  useEffect(() => {
    if (!quotaLockedUntil) return;
    const checkQuota = () => {
      const resetTime = new Date(quotaLockedUntil).getTime();
      if (Date.now() >= resetTime) {
        setQuotaLockedUntil(null);
        setErrorState(null);
      }
    };
    checkQuota();
    const interval = setInterval(checkQuota, 10_000);
    return () => clearInterval(interval);
  }, [quotaLockedUntil]);

  const isQuotaLocked = Boolean(
    quotaLockedUntil && new Date(quotaLockedUntil).getTime() > Date.now(),
  );

  const toggleCitations = (messageId: string) => {
    setExpandedCitationMessageIds((prev) => ({
      ...prev,
      [messageId]: !prev[messageId],
    }));
  };

  const handleNewChat = () => {
    setCurrentConversationId(null);
    setErrorState(null);
    if (userStorageKey) {
      localStorage.removeItem(userStorageKey);
    }
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('c');
        return next;
      },
      { replace: true },
    );
    setMessages([
      {
        id: 'greeting',
        role: 'bot',
        text: t('assistant.greeting'),
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  const handleSelectConversation = (id: string) => {
    if (id === currentConversationId) return;
    setCurrentConversationId(id);
  };

  const handleLoadMoreConversations = async () => {
    if (!conversationsCursor || conversationsLoading) return;
    setConversationsLoading(true);
    try {
      const res = await api.policies.conversations(conversationsCursor, 20);
      setConversations((prev) => [...prev, ...res.items]);
      setConversationsHasMore(res.hasMore);
      setConversationsCursor(res.nextCursor ?? null);
    } catch (err) {
      console.warn('Failed loading more conversations:', err);
    } finally {
      setConversationsLoading(false);
    }
  };

  const ask = async (questionToAsk: string) => {
    const q = questionToAsk.trim();
    if (!q || pending || isQuotaLocked) return;

    if (q.length > MAX_QUESTION_LENGTH) {
      setErrorState({
        code: 'VALIDATION_ERROR',
        message: t('assistant.errors.badRequest'),
        failedQuestion: q,
      });
      return;
    }

    // Clear error before new submission
    setErrorState(null);
    setInput('');

    const userMsgId = 'usr-' + Date.now();
    // If greeting was the only message, replace it or keep it
    setMessages((m) => [
      ...(m.length === 1 && m[0].id === 'greeting' ? [] : m),
      {
        id: userMsgId,
        role: 'user',
        text: q,
        timestamp: new Date().toISOString(),
      },
    ]);
    setPending(true);

    try {
      const answer = await api.policies.ask(q, currentLocale, currentConversationId ?? undefined);
      const botMsgId = 'bot-' + (answer.messageId || Date.now());

      setMessages((m) => [
        ...m,
        {
          id: botMsgId,
          role: 'bot',
          text: answer.answer || answer.text || '',
          citations: answer.citations ?? [],
          messageId: answer.messageId,
          timestamp: new Date().toISOString(),
        },
      ]);

      // If new conversation was created, adopt its conversationId
      if (answer.conversationId && answer.conversationId !== currentConversationId) {
        setCurrentConversationId(answer.conversationId);
        if (userStorageKey) {
          localStorage.setItem(userStorageKey, answer.conversationId);
        }
        setSearchParams(
          (prev) => {
            const next = new URLSearchParams(prev);
            next.set('c', answer.conversationId!);
            return next;
          },
          { replace: true },
        );

        // Prepend new item to conversation list
        const derivedTitle = q.length > 36 ? q.slice(0, 36) + '…' : q;
        setConversations((prev) => [
          {
            id: answer.conversationId!,
            title: derivedTitle,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          ...prev,
        ]);
      } else if (currentConversationId) {
        // Update timestamp in conversation list
        setConversations((prev) =>
          prev.map((c) =>
            c.id === currentConversationId ? { ...c, updatedAt: new Date().toISOString() } : c,
          ),
        );
      }
    } catch (err: unknown) {
      let errorMsg = t('assistant.errors.serviceUnavailable');
      let status = 0;
      let code = 'UNKNOWN';
      let resetAt: string | undefined;

      if (err instanceof ApiError) {
        status = err.status;
        code = err.code;

        const details = err.details as any;
        resetAt = details?.resetAt || details?.error?.details?.resetAt;

        if (status === 429 || code === 'ASSISTANT_QUOTA_EXCEEDED') {
          if (resetAt) {
            setQuotaLockedUntil(resetAt);
          }
          const formattedReset = formatLocalTime(resetAt);
          errorMsg = t('assistant.errors.quotaExceeded', {
            count: details?.maxDailyQueries ?? 10,
            time: formattedReset || 'hôm sau / tomorrow',
          });
        } else if (status === 400 || code === 'VALIDATION_ERROR') {
          errorMsg = t('assistant.errors.badRequest');
        } else if (status === 403 || code === 'AUTH_004' || code === 'FORBIDDEN') {
          errorMsg = t('assistant.errors.forbidden');
        } else if (status === 504 || code === 'TIMEOUT') {
          errorMsg = t('assistant.errors.timeout');
        } else if (status >= 500) {
          errorMsg = t('assistant.errors.serviceUnavailable');
        } else {
          errorMsg = err.message || t('assistant.errors.unknown', { message: code });
        }
      } else if (err instanceof Error) {
        errorMsg = err.message;
      }

      setErrorState({
        code,
        status,
        message: errorMsg,
        resetAt,
        failedQuestion: q,
      });

      setInput((curr) => (curr.trim() ? curr : q));
    } finally {
      setPending(false);
    }
  };

  const handleRetryFailed = () => {
    if (errorState?.failedQuestion) {
      ask(errorState.failedQuestion);
    }
  };

  return (
    <>
      <PageHeader
        title={t('assistant.title')}
        subtitle={t('assistant.subtitle')}
      />

      <div
        className="flex min-h-[500px] flex-col md:flex-row overflow-hidden rounded-2xl border border-line-2 bg-surface shadow-xs"
        style={{ height: 'calc(100vh - 210px)' }}
      >
        {/* Sidebar: Conversation History */}
        <aside
          className={`border-b md:border-b-0 md:border-r border-line-3 bg-surface-2/40 flex flex-col shrink-0 transition-all duration-200 ${
            sidebarOpen ? 'w-full md:w-64 lg:w-72' : 'hidden md:flex md:w-0 md:border-r-0 md:overflow-hidden'
          }`}
        >
          {/* Sidebar Top: New Chat Button */}
          <div className="p-3 border-b border-line-3 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleNewChat}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-brand px-3 py-2 text-[12.5px] font-semibold text-white shadow-2xs hover:bg-brand-strong transition"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>{t('assistant.newChat')}</span>
            </button>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="md:hidden flex h-8 w-8 items-center justify-center rounded-lg border border-line text-muted hover:text-ink transition"
              aria-label="Close sidebar"
            >
              <IconX size={15} />
            </button>
          </div>

          {/* Sidebar History List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            <div className="px-2 py-1.5 text-[11px] font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
              <IconHistory size={12} />
              <span>{t('assistant.history')}</span>
            </div>

            {conversations.length === 0 && !conversationsLoading && (
              <div className="px-3 py-6 text-center text-[12px] text-faint">
                {t('assistant.noHistory')}
              </div>
            )}

            {conversations.map((c) => {
              const isSelected = c.id === currentConversationId;
              const formattedTime = formatRelativeTime(c.updatedAt || c.createdAt, currentLocale);

              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleSelectConversation(c.id)}
                  className={`w-full text-left rounded-xl px-3 py-2.5 transition flex flex-col gap-0.5 border ${
                    isSelected
                      ? 'border-brand/40 bg-brand-soft text-brand-strong font-medium shadow-2xs'
                      : 'border-transparent text-ink hover:bg-surface hover:border-line-3'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5 w-full">
                    <span className="text-[12.5px] truncate font-medium flex-1">
                      {c.title || 'Hội thoại'}
                    </span>
                    {formattedTime && (
                      <span className="text-[10px] text-muted shrink-0 font-mono">
                        {formattedTime}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}

            {conversationsLoading && (
              <div className="flex items-center justify-center py-4 text-muted text-[12px] gap-2">
                <span className="h-3.5 w-3.5 animate-[spin360_.7s_linear_infinite] rounded-full border-2 border-line-3 border-t-brand" />
                <span>{t('assistant.loadingHistory')}</span>
              </div>
            )}

            {conversationsHasMore && !conversationsLoading && (
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={handleLoadMoreConversations}
                  className="rounded-lg px-2.5 py-1 text-[11px] font-medium text-brand hover:underline"
                >
                  {t('assistant.loadMore')}
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content Area */}
        <section className="flex flex-1 flex-col overflow-hidden bg-surface">
          {/* Header toolbar */}
          <div className="flex items-center justify-between border-b border-line-3 px-4 py-3 bg-surface-2/40">
            <div className="flex items-center gap-2.5">
              {!sidebarOpen && (
                <button
                  type="button"
                  onClick={() => setSidebarOpen(true)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-muted hover:border-brand hover:text-ink transition"
                  aria-label="Open chat history sidebar"
                >
                  <IconHistory size={15} />
                </button>
              )}
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-soft shadow-2xs">
                <IconChat size={16} className="text-brand" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[13.5px] font-bold text-ink">
                    {currentConversationId
                      ? conversations.find((c) => c.id === currentConversationId)?.title || t('assistant.title')
                      : t('assistant.title')}
                  </span>
                  <span className="rounded-full bg-brand-soft px-2 py-0.5 font-mono text-[10px] font-semibold text-brand">
                    v4.9 RAG
                  </span>
                  <span className="rounded-full border border-line px-2 py-0.5 font-mono text-[10px] font-medium text-muted uppercase">
                    {currentLocale}
                  </span>
                </div>
                <div className="text-[11px] text-muted">{t('assistant.sub')}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {currentConversationId && (
                <button
                  type="button"
                  onClick={handleNewChat}
                  className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1 text-[11.5px] font-medium text-muted hover:border-brand hover:text-ink transition"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  <span>{t('assistant.newChat')}</span>
                </button>
              )}
              {isQuotaLocked && (
                <div className="flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-[11.5px] font-medium text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                  <IconClock size={13} />
                  <span>{t('assistant.errors.quotaCountdown', { time: formatLocalTime(quotaLockedUntil ?? undefined) })}</span>
                </div>
              )}
            </div>
          </div>

          {/* Transcript Area */}
          <div ref={scrollRef} className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 md:p-5">
            {historyLoading && (
              <div className="flex items-center justify-center py-8 text-muted gap-2 text-[12.5px]">
                <span className="h-4 w-4 animate-[spin360_.7s_linear_infinite] rounded-full border-2 border-line-3 border-t-brand" />
                <span>{t('assistant.loadingHistory')}</span>
              </div>
            )}

            {!historyLoading &&
              messages.map((m) => {
                const isUser = m.role === 'user';
                const hasCitations = Boolean(m.citations && m.citations.length > 0);
                const isExpanded = Boolean(expandedCitationMessageIds[m.id]);

                return (
                  <div key={m.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex flex-col gap-2 ${isUser ? 'max-w-[80%]' : 'max-w-[88%]'}`}>
                      {/* Bubble */}
                      <div
                        className={`rounded-2xl px-4 py-3 text-[13.5px] leading-relaxed shadow-2xs ${
                          isUser
                            ? 'rounded-tr-xs bg-brand text-white'
                            : 'rounded-tl-xs border border-line-2 bg-canvas text-ink'
                        }`}
                      >
                        {isUser ? (
                          <div className="whitespace-pre-wrap">{m.text}</div>
                        ) : (
                          <div className="whitespace-pre-wrap [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                            <Markdown remarkPlugins={[remarkGfm]} components={MD_COMPONENTS}>
                              {m.text}
                            </Markdown>
                          </div>
                        )}
                      </div>

                      {/* Bot Citations Section (Grounded sources) */}
                      {!isUser && m.id !== 'greeting' && (
                        <div className="pl-1 text-[12px]">
                          {hasCitations ? (
                            <div className="flex flex-col gap-2">
                              <button
                                type="button"
                                onClick={() => toggleCitations(m.id)}
                                className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1 text-[11.5px] font-medium text-muted hover:border-brand hover:text-ink transition"
                              >
                                <IconBook size={13} className="text-brand" />
                                <span>{t('assistant.citations', { count: m.citations!.length })}</span>
                                {isExpanded ? <IconChevronUp size={13} /> : <IconChevronDown size={13} />}
                              </button>

                              {/* Expanded Citation Cards */}
                              {isExpanded && (
                                <div className="mt-1 flex flex-col gap-2 rounded-xl border border-line-2 bg-surface p-3">
                                  {m.citations!.map((cit, idx) => {
                                    const scorePercent = cit.score != null ? Math.round(cit.score * 100) : null;
                                    return (
                                      <div
                                        key={cit.segmentId || cit.documentId || idx}
                                        className="rounded-lg border border-line/80 bg-surface-2/60 p-2.5 transition hover:border-brand/40"
                                      >
                                        <div className="flex flex-wrap items-center justify-between gap-1.5">
                                          <div className="flex items-center gap-1.5 font-semibold text-[12px] text-ink">
                                            <IconBook size={12} className="text-brand shrink-0" />
                                            <span>{cit.documentName || cit.documentId || `Văn bản #${idx + 1}`}</span>
                                          </div>
                                          {scorePercent != null && (
                                            <span className="rounded bg-brand-soft px-1.5 py-0.5 font-mono text-[10.5px] font-semibold text-brand">
                                              {t('assistant.relevance', { score: scorePercent })}
                                            </span>
                                          )}
                                        </div>
                                        {cit.content && (
                                          <div className="mt-2 rounded-lg border-l-2 border-brand bg-canvas/60 px-3 py-2 text-[12px] leading-relaxed text-body">
                                            <p className="line-clamp-4 hover:line-clamp-none whitespace-pre-wrap">
                                              {cit.content.trim()}
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-md bg-canvas px-2 py-0.5 text-[11px] font-medium text-faint">
                              <IconInfoCircle size={11} />
                              {t('assistant.noCitations')}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

            {/* Pending search indicator */}
            {pending && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2.5 rounded-2xl rounded-tl-xs border border-line-3 bg-canvas px-4 py-3 shadow-2xs">
                  <span className="h-4 w-4 animate-[spin360_.7s_linear_infinite] rounded-full border-2 border-line-3 border-t-brand" />
                  <span className="text-[12.5px] font-medium text-muted">{t('assistant.searching')}</span>
                </div>
              </div>
            )}

            {/* Isolated Error Banner */}
            {errorState && (
              <div className="my-1 rounded-xl border border-rose-300 bg-rose-50 p-3.5 text-rose-900 shadow-2xs dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
                <div className="flex items-start gap-2.5">
                  <IconAlertTriangle size={18} className="text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-[13px] font-semibold">{errorState.message}</div>
                    {errorState.code && (
                      <div className="mt-0.5 font-mono text-[11px] text-rose-700/80 dark:text-rose-300/80">
                        Mã lỗi: {errorState.code} {errorState.status ? `(${errorState.status})` : ''}
                      </div>
                    )}
                    {errorState.failedQuestion && !isQuotaLocked && (
                      <div className="mt-2.5 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleRetryFailed}
                          disabled={pending}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-[11.5px] font-semibold text-white hover:bg-rose-700 disabled:opacity-50 transition"
                        >
                          <IconRefreshCw size={12} />
                          <span>{t('assistant.errors.retry')}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setErrorState(null)}
                          className="rounded-lg px-2.5 py-1.5 text-[11.5px] font-medium text-rose-800 hover:bg-rose-100 dark:text-rose-200 dark:hover:bg-rose-900/40 transition"
                        >
                          {t('assistant.errors.dismiss')}
                        </button>
                      </div>
                    )}
                    {errorState.code === 'ASSISTANT_CONVERSATION_NOT_FOUND' && (
                      <div className="mt-2.5">
                        <button
                          type="button"
                          onClick={handleNewChat}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-[11.5px] font-semibold text-white hover:bg-brand-strong transition"
                        >
                          <span>{t('assistant.newChat')}</span>
                        </button>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setErrorState(null)}
                    className="text-rose-500 hover:text-rose-700 transition"
                    aria-label={t('assistant.errors.dismiss')}
                  >
                    <IconX size={15} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Composer & Quick Questions */}
          <div className="border-t border-line-3 bg-surface px-4 py-3 md:px-5">
            {/* Quick prompts chips */}
            <div className="mb-2.5 flex flex-wrap gap-1.5">
              {QUICK_QS_KEYS.map((key) => {
                const q = t(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => ask(q)}
                    disabled={pending || isQuotaLocked}
                    className="rounded-full border border-line bg-canvas px-3 py-1 text-[11.5px] font-medium text-body hover:border-brand hover:bg-surface disabled:opacity-40 transition"
                  >
                    {q}
                  </button>
                );
              })}
            </div>

            {/* Input field + Send button */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      ask(input);
                    }
                  }}
                  disabled={pending || isQuotaLocked}
                  placeholder={
                    isQuotaLocked
                      ? t('assistant.errors.quotaCountdown', { time: formatLocalTime(quotaLockedUntil ?? undefined) })
                      : t('assistant.placeholder')
                  }
                  maxLength={MAX_QUESTION_LENGTH}
                  className="w-full rounded-xl border border-line bg-canvas px-3.5 py-2.5 pr-16 text-[13px] text-ink placeholder:text-faint focus:border-brand focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand/15 disabled:opacity-50 transition"
                />
                {input.length > 500 && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10.5px] text-faint">
                    {input.length}/{MAX_QUESTION_LENGTH}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => ask(input)}
                disabled={pending || !input.trim() || isQuotaLocked}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand text-white shadow-2xs hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-40 transition"
                aria-label={t('assistant.send')}
              >
                <IconSend size={16} />
              </button>
            </div>

            {/* Scope and legal disclaimer footer */}
            <div className="mt-2 text-center text-[11px] text-faint">
              {t('assistant.disclaimerFooter')}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
