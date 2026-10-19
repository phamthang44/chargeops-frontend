import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  IconAlertTriangle,
  IconCheck,
  IconShieldAlert,
  Modal,
  Toggle,
  useToast,
} from '@chargeops/ui';
import {
  useApi,
  type ContentScope,
  type ProhibitedTerm,
  type ProhibitedTermInput,
  type TermMatchType,
} from '@chargeops/api';

const ALL_SCOPES: { id: ContentScope; labelKey: string }[] = [
  { id: 'DISPLAY_NAME', labelKey: 'scopes.DISPLAY_NAME' },
  { id: 'STATION_NAME', labelKey: 'scopes.STATION_NAME' },
  { id: 'TICKET_SUBJECT', labelKey: 'scopes.TICKET_SUBJECT' },
  { id: 'TICKET_DESCRIPTION', labelKey: 'scopes.TICKET_DESCRIPTION' },
  { id: 'TICKET_MESSAGE', labelKey: 'scopes.TICKET_MESSAGE' },
];

export interface TermUpsertModalProps {
  open: boolean;
  term: ProhibitedTerm | null; // null for Create mode, existing record for Edit mode
  onClose: () => void;
  onSuccess?: () => void;
}

export function TermUpsertModal({ open, term, onClose, onSuccess }: TermUpsertModalProps) {
  const { t } = useTranslation('admin');
  const api = useApi();
  const qc = useQueryClient();
  const toast = useToast();

  const isEdit = Boolean(term);

  // Form State
  const [termText, setTermText] = useState('');
  const [matchType, setMatchType] = useState<TermMatchType>('WORD_OR_PHRASE');
  const [scopes, setScopes] = useState<ContentScope[]>(['DISPLAY_NAME', 'TICKET_MESSAGE']);
  const [enabled, setEnabled] = useState(false);
  const [note, setNote] = useState('');
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  // Synchronize form when term prop changes
  useEffect(() => {
    if (term) {
      setTermText(term.term);
      setMatchType(term.matchType);
      setScopes([...term.scopes]);
      setEnabled(term.enabled);
      setNote(term.note ?? '');
    } else {
      setTermText('');
      setMatchType('WORD_OR_PHRASE');
      setScopes(['DISPLAY_NAME', 'TICKET_MESSAGE']);
      setEnabled(false);
      setNote('');
    }
    setErrorBanner(null);
  }, [term, open]);

  const toggleScope = (scopeId: ContentScope) => {
    setScopes((prev) =>
      prev.includes(scopeId) ? prev.filter((s) => s !== scopeId) : [...prev, scopeId],
    );
  };

  const createMutation = useMutation({
    mutationFn: (input: ProhibitedTermInput) => api.prohibitedTerms.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['prohibited-terms'] });
      toast(t('prohibitedTerms.toast.created', 'Đã tạo quy tắc từ cấm thành công.'), 'success');
      onSuccess?.();
      onClose();
    },
    onError: (err: any) => {
      if (err?.code === 'MODERATION_DUPLICATE') {
        setErrorBanner(t('prohibitedTerms.modal.duplicateWarning'));
      } else {
        setErrorBanner(err?.message || t('prohibitedTerms.toast.error'));
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: (input: ProhibitedTermInput) => {
      if (!term) throw new Error('No term to update');
      return api.prohibitedTerms.update(term.id, {
        ...input,
        version: term.version,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['prohibited-terms'] });
      toast(t('prohibitedTerms.toast.updated', 'Đã cập nhật quy tắc từ cấm thành công.'), 'success');
      onSuccess?.();
      onClose();
    },
    onError: (err: any) => {
      if (err?.code === 'MODERATION_VERSION_CONFLICT') {
        setErrorBanner(t('prohibitedTerms.modal.conflictWarning'));
      } else if (err?.code === 'MODERATION_DUPLICATE') {
        setErrorBanner(t('prohibitedTerms.modal.duplicateWarning'));
      } else {
        setErrorBanner(err?.message || t('prohibitedTerms.toast.error'));
      }
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    setErrorBanner(null);

    const trimmed = termText.trim();
    if (!trimmed) {
      setErrorBanner(t('prohibitedTerms.modal.termPlaceholder'));
      return;
    }
    if (scopes.length === 0) {
      setErrorBanner(t('prohibitedTerms.modal.scopesRequired'));
      return;
    }

    const payload: ProhibitedTermInput = {
      term: trimmed,
      matchType,
      scopes,
      enabled,
      note: note.trim() || null,
    };

    if (isEdit) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <Modal open={open} onClose={onClose} maxWidth={580}>
      <div className="flex items-center justify-between border-b border-hairline pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-soft text-brand">
            <IconShieldAlert size={19} />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-ink">
              {isEdit
                ? t('prohibitedTerms.modal.editTitle', 'Chỉnh sửa quy tắc từ cấm')
                : t('prohibitedTerms.modal.createTitle', 'Thêm quy tắc từ cấm mới')}
            </h3>
            <p className="text-[12px] text-muted">
              {isEdit
                ? `${t('prohibitedTerms.scopes.' + scopes[0], { defaultValue: '' })} · Version ${term?.version}`
                : t('prohibitedTerms.subtitle')}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink transition-colors"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        {errorBanner && (
          <div className="flex items-start gap-2.5 rounded-xl border border-error/20 bg-error/5 p-3 text-[12.5px] text-error">
            <IconAlertTriangle size={16} className="mt-0.5 shrink-0" />
            <div className="flex-1 leading-relaxed">{errorBanner}</div>
          </div>
        )}

        {/* Term Input */}
        <div>
          <label className="mb-1.5 block text-[12.5px] font-semibold text-ink">
            {t('prohibitedTerms.modal.termLabel', 'Từ hoặc cụm từ cấm')}{' '}
            <span className="text-error">*</span>
          </label>
          <input
            type="text"
            required
            maxLength={100}
            value={termText}
            onChange={(e) => setTermText(e.target.value)}
            placeholder={t('prohibitedTerms.modal.termPlaceholder')}
            className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-[13px] text-ink placeholder:text-faint focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30 transition-all font-medium"
            autoFocus={!isEdit}
          />
          <div className="mt-1 flex justify-between text-[11px] text-muted">
            <span>{t('prohibitedTerms.cacheSyncNote')}</span>
            <span>{termText.length} / 100</span>
          </div>
        </div>

        {/* Match Type Segmented Selector */}
        <div>
          <label className="mb-1.5 block text-[12.5px] font-semibold text-ink">
            {t('prohibitedTerms.modal.matchTypeLabel', 'Phương thức so khớp')}{' '}
            <span className="text-error">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setMatchType('WORD_OR_PHRASE')}
              className={`rounded-xl border p-3 text-left transition-all ${
                matchType === 'WORD_OR_PHRASE'
                  ? 'border-brand bg-brand-soft/40 shadow-sm'
                  : 'border-border bg-surface hover:bg-surface-2'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-bold text-ink">
                  {t('prohibitedTerms.matchTypes.WORD_OR_PHRASE')}
                </span>
                {matchType === 'WORD_OR_PHRASE' && (
                  <IconCheck size={14} className="text-brand" strokeWidth={2.5} />
                )}
              </div>
              <p className="mt-1 text-[11.5px] leading-relaxed text-muted">
                {t('prohibitedTerms.matchTypes.WORD_OR_PHRASE_DESC')}
              </p>
            </button>

            <button
              type="button"
              onClick={() => setMatchType('EXACT')}
              className={`rounded-xl border p-3 text-left transition-all ${
                matchType === 'EXACT'
                  ? 'border-brand bg-brand-soft/40 shadow-sm'
                  : 'border-border bg-surface hover:bg-surface-2'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-bold text-ink">
                  {t('prohibitedTerms.matchTypes.EXACT')}
                </span>
                {matchType === 'EXACT' && (
                  <IconCheck size={14} className="text-brand" strokeWidth={2.5} />
                )}
              </div>
              <p className="mt-1 text-[11.5px] leading-relaxed text-muted">
                {t('prohibitedTerms.matchTypes.EXACT_DESC')}
              </p>
            </button>
          </div>
        </div>

        {/* Scopes Multiselect */}
        <div>
          <label className="mb-1.5 block text-[12.5px] font-semibold text-ink">
            {t('prohibitedTerms.modal.scopesLabel', 'Phạm vi áp dụng')}{' '}
            <span className="text-error">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-xl border border-border bg-surface p-3">
            {ALL_SCOPES.map((sc) => {
              const checked = scopes.includes(sc.id);
              return (
                <label
                  key={sc.id}
                  className="flex items-center gap-2.5 p-1 rounded-lg cursor-pointer hover:bg-surface-2 select-none transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleScope(sc.id)}
                    className="h-4 w-4 rounded border-border text-brand focus:ring-brand accent-brand cursor-pointer"
                  />
                  <span className="text-[12.5px] font-medium text-body">
                    {t(`prohibitedTerms.${sc.labelKey}`)}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Enabled Toggle */}
        <div className="flex items-center justify-between rounded-xl border border-border bg-surface-2/40 px-3.5 py-3">
          <div>
            <div className="text-[13px] font-semibold text-ink">
              {t('prohibitedTerms.modal.enabledLabel', 'Kích hoạt quy tắc')}
            </div>
            <div className="text-[11.5px] text-muted">
              {t('prohibitedTerms.cacheSyncNote')}
            </div>
          </div>
          <Toggle checked={enabled} onChange={setEnabled} />
        </div>

        {/* Note Textarea */}
        <div>
          <label className="mb-1.5 block text-[12.5px] font-semibold text-ink">
            {t('prohibitedTerms.modal.noteLabel', 'Ghi chú nội bộ')}
          </label>
          <textarea
            rows={2}
            maxLength={500}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t('prohibitedTerms.modal.notePlaceholder')}
            className="w-full rounded-xl border border-border bg-surface px-3.5 py-2 text-[12.5px] text-ink placeholder:text-faint focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30 transition-all resize-none"
          />
          <div className="mt-1 text-right text-[11px] text-muted">
            {note.length} / 500
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 border-t border-hairline pt-3.5">
          <Button type="button" variant="secondary" size="md" onClick={onClose} disabled={isSubmitting}>
            {t('prohibitedTerms.modal.cancel', 'Hủy')}
          </Button>
          <Button
            type="submit"
            accent="brand"
            size="md"
            disabled={isSubmitting || !termText.trim() || scopes.length === 0}
          >
            {isSubmitting
              ? t('dashboard.refreshing', 'Đang lưu...')
              : isEdit
              ? t('prohibitedTerms.modal.submitEdit', 'Lưu thay đổi')
              : t('prohibitedTerms.modal.submitCreate', 'Tạo quy tắc')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
