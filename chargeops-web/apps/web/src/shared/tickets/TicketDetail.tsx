import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  formatDateVn,
  formatTimeVn,
  TICKET_STATUS,
  useApi,
  type TicketMessage,
  type TicketStatus,
} from '@chargeops/api';
import {
  Avatar,
  Button,
  Card,
  ChatComposer,
  HoverCard,
  IconArrowLeft,
  IconCalendar,
  IconPhone,
  IconPin,
  IconSend,
  IconUsers,
  Select,
  Skeleton,
  StatusPill,
  useToast,
} from '@chargeops/ui';

export function TicketDetail({ admin = false }: { admin?: boolean }) {
  const { id = '' } = useParams();
  const { t } = useTranslation('tickets');
  const navigate = useNavigate();
  const api = useApi();
  const qc = useQueryClient();
  const toast = useToast();
  const accent = admin ? 'brand' : 'owner';

  const [draft, setDraft] = useState('');
  const [reassignDraft, setReassignDraft] = useState('');

  const ticketQuery = useQuery({ queryKey: ['tickets', 'get', id], queryFn: () => api.tickets.get(id) });
  const messagesQuery = useQuery({ queryKey: ['tickets', 'messages', id], queryFn: () => api.tickets.messages(id) });

  const invalidateAll = () => qc.invalidateQueries({ queryKey: ['tickets'] });

  const reply = useMutation({
    mutationFn: (body: string) => api.tickets.reply(id, body),
    onSuccess: () => {
      setDraft('');
      invalidateAll();
    },
    onError: (e) => toast((e as Error).message, 'error'),
  });

  const setStatus = useMutation({
    mutationFn: (status: TicketStatus) => api.tickets.setStatus(id, status),
    onSuccess: () => {
      toast(t('detail.statusSuccess'), 'success');
      invalidateAll();
    },
    onError: (e) => toast((e as Error).message, 'error'),
  });

  const reassign = useMutation({
    mutationFn: (stationName: string) => api.tickets.reassign(id, stationName),
    onSuccess: (tk) => {
      setReassignDraft('');
      toast(t('detail.reassignSuccess', { id: tk.id, station: tk.stationName }), 'success');
      invalidateAll();
    },
    onError: (e) => toast((e as Error).message, 'error'),
  });

  const escalate = useMutation({
    mutationFn: () => api.tickets.escalate(id),
    onSuccess: (tk) => {
      toast(t('detail.escalateSuccess', { id: tk.id }), 'success');
      invalidateAll();
    },
    onError: (e) => toast((e as Error).message, 'error'),
  });

  if (ticketQuery.error) {
    return (
      <Card className="border-bad-border bg-bad-soft p-5 text-[13px] font-medium text-bad-deep">
        {t('detail.loadError', { message: (ticketQuery.error as Error).message })}
      </Card>
    );
  }
  if (ticketQuery.isLoading || !ticketQuery.data) {
    return (
      <>
        <Skeleton className="mb-3 h-5 w-24" />
        <Skeleton className="mb-3 h-[92px] w-full rounded-card" />
        <Skeleton className="h-[280px] w-full rounded-card" />
      </>
    );
  }

  const tk = ticketQuery.data;
  const meta = TICKET_STATUS[tk.status];
  const messages = messagesQuery.data ?? [];

  return (
    <>
      <div
        onClick={() => navigate('..')}
        className="mb-3 inline-flex cursor-pointer items-center gap-1.5 text-[12.5px] font-medium text-muted hover:text-ink"
      >
        <IconArrowLeft size={14} strokeWidth={2.2} />
        {t('detail.back')}
      </div>

      <Card className="mb-3 p-[15px]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2">
              <span className="font-mono text-[11.5px] font-semibold text-muted">{tk.id}</span>
              <StatusPill tone={meta.tone} label={meta.label} />
            </div>
            <div className="text-[15px] font-semibold text-ink">{tk.subject}</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {tk.stationName && (
                <span className="inline-flex items-center gap-1 rounded-full bg-chip px-2.5 py-1 text-[11px] font-medium text-muted">
                  <IconPin size={12} strokeWidth={2.2} /> {tk.stationName}
                </span>
              )}
              {tk.bookingId && (
                <span className="inline-flex items-center gap-1 rounded-full bg-chip px-2.5 py-1 text-[11px] font-medium text-muted">
                  <IconCalendar size={12} strokeWidth={2.2} /> {tk.bookingId}
                </span>
              )}
              <HoverCard
                trigger={
                  <span className="inline-flex cursor-default items-center gap-1 rounded-full bg-chip px-2.5 py-1 text-[11px] font-medium text-muted">
                    <IconUsers size={12} strokeWidth={2.2} /> {tk.reporterName}
                  </span>
                }
              >
                <div className="flex items-center gap-2.5">
                  <Avatar name={tk.reporterName} size="sm" tone="neutral" />
                  <div className="min-w-0">
                    <div className="truncate text-[12.5px] font-semibold text-ink">{tk.reporterName}</div>
                    <div className="text-[11px] text-faint">{t('detail.context.reporter')}</div>
                  </div>
                </div>
                {tk.reporterPhone && (
                  <div className="mt-2.5 flex items-center gap-1.5 border-t border-hairline pt-2.5 text-[12px] text-body">
                    <IconPhone size={13} className="text-faint" /> {tk.reporterPhone}
                  </div>
                )}
                {tk.stationName && (
                  <div className={`mt-1.5 flex items-center gap-1.5 text-[12px] text-body ${tk.reporterPhone ? '' : 'border-t border-hairline pt-2.5'}`}>
                    <IconPin size={13} className="text-faint" /> {tk.stationName}
                  </div>
                )}
              </HoverCard>
            </div>
          </div>
          <Select
            value={tk.status}
            onChange={(v) => setStatus.mutate(v as TicketStatus)}
            accent={accent}
            className="w-[168px] shrink-0"
            options={(Object.keys(TICKET_STATUS) as TicketStatus[]).map((s) => ({
              value: s,
              label: TICKET_STATUS[s].label,
            }))}
          />
        </div>

        {admin && (
          <div className="mt-3.5 flex flex-wrap items-center gap-2 border-t border-hairline pt-3.5">
            <input
              value={reassignDraft}
              onChange={(e) => setReassignDraft(e.target.value)}
              placeholder={t('detail.reassignPlaceholder')}
              className="h-8 w-[200px] rounded-[8px] border border-line px-2.5 text-[12px] focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
            />
            <Button
              variant="secondary"
              size="sm"
              disabled={!reassignDraft.trim() || reassign.isPending}
              onClick={() => reassign.mutate(reassignDraft.trim())}
            >
              {t('detail.reassignBtn')}
            </Button>
            <Button variant="secondary" size="sm" disabled={escalate.isPending} onClick={() => escalate.mutate()}>
              {t('detail.escalateBtn')}
            </Button>
          </div>
        )}
      </Card>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-hairline px-4 py-2.5">
          <span className="text-[12.5px] font-semibold text-ink">{t('detail.thread')}</span>
          <span className="text-[11px] text-faint">{t('detail.threadHint')}</span>
        </div>

        <div className="flex flex-col gap-3 p-4">
          {messagesQuery.isLoading ? (
            <>
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="ml-auto h-12 w-3/4" />
            </>
          ) : (
            messages.map((m) => <MessageBubble key={m.id} message={m} accent={accent} />)
          )}
        </div>

        <div className="border-t border-hairline p-3">
          <ChatComposer
            value={draft}
            onChange={setDraft}
            onSubmit={() => reply.mutate(draft.trim())}
            placeholder={t('detail.composerPlaceholder')}
            disabled={reply.isPending}
            accent={accent}
            actions={
              <Button
                accent={accent}
                size="md"
                icon={<IconSend size={14} strokeWidth={2.2} />}
                disabled={!draft.trim() || reply.isPending}
                onClick={() => reply.mutate(draft.trim())}
              >
                {reply.isPending ? t('detail.sending') : t('detail.send')}
              </Button>
            }
          />
        </div>
      </Card>
    </>
  );
}

function MessageBubble({ message, accent }: { message: TicketMessage; accent: 'brand' | 'owner' }) {
  const mine = message.authorRole !== 'driver';
  const bubbleClass = mine
    ? accent === 'owner'
      ? 'bg-owner-soft border-owner-border'
      : 'bg-brand-soft border-brand-line'
    : 'bg-surface border-line';
  return (
    <div className={`flex items-end gap-2 ${mine ? 'flex-row-reverse' : 'flex-row'}`}>
      <Avatar name={message.authorName} size="sm" tone={mine ? accent : 'neutral'} />
      <div className={`flex max-w-[74%] flex-col ${mine ? 'items-end' : 'items-start'}`}>
        <div className="mb-1 text-[10.5px] text-faint">
          {message.authorName} · {formatDateVn(message.createdAt)} {formatTimeVn(message.createdAt)}
        </div>
        <div className={`rounded-[10px] border px-[11px] py-2 text-[12.5px] leading-[1.45] text-ink ${bubbleClass}`}>
          {message.body}
        </div>
      </div>
    </div>
  );
}
