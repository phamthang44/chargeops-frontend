import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { Button, Card, IconAlertTriangle, IconCheck, IconShield } from '@chargeops/ui';
import { useApi, type ContentScope, type ProhibitedTermCheckResult } from '@chargeops/api';

const SCOPE_OPTIONS: { id: ContentScope; labelKey: string }[] = [
  { id: 'TICKET_MESSAGE', labelKey: 'scopes.TICKET_MESSAGE' },
  { id: 'TICKET_SUBJECT', labelKey: 'scopes.TICKET_SUBJECT' },
  { id: 'TICKET_DESCRIPTION', labelKey: 'scopes.TICKET_DESCRIPTION' },
  { id: 'DISPLAY_NAME', labelKey: 'scopes.DISPLAY_NAME' },
  { id: 'STATION_NAME', labelKey: 'scopes.STATION_NAME' },
];

export function PolicySandboxCard() {
  const { t } = useTranslation('admin');
  const api = useApi();

  const [scope, setScope] = useState<ContentScope>('TICKET_MESSAGE');
  const [text, setText] = useState('');
  const [result, setResult] = useState<ProhibitedTermCheckResult | null>(null);

  const checkMutation = useMutation({
    mutationFn: () => api.prohibitedTerms.check({ scope, text: text.trim() }),
    onSuccess: (data) => {
      setResult(data);
    },
    onError: () => {
      setResult(null);
    },
  });

  const handleRun = () => {
    if (!text.trim() || checkMutation.isPending) return;
    checkMutation.mutate();
  };

  // Keyboard shortcut: ⌘+Enter or Ctrl+Enter to trigger run
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleRun();
    }
  };

  return (
    <Card bordered className="h-full bg-surface p-5 shadow-xs rounded-2xl flex flex-col justify-between border-line">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line/80 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-soft text-brand">
              <IconShield size={17} />
            </div>
            <div>
              <div className="text-[10.5px] uppercase font-bold tracking-[0.15em] text-brand">
                {t('prohibitedTerms.sandbox.eyebrow', 'Interactive Sandbox')}
              </div>
              <h4 className="text-[14px] font-bold text-ink">
                {t('prohibitedTerms.sandbox.title', 'Thử nghiệm chính sách')}
              </h4>
            </div>
          </div>
          <span className="rounded-full bg-brand-soft border border-brand-line px-2.5 py-0.5 text-[11px] font-semibold text-brand">
            Live Gateway
          </span>
        </div>

        {/* Notice */}
        <p className="mt-3 text-[11.5px] leading-relaxed text-muted">
          {t('prohibitedTerms.sandbox.cacheWarning')}
        </p>

        {/* Scope Selector */}
        <div className="mt-4">
          <label className="mb-1.5 block text-[12px] font-semibold text-ink">
            {t('prohibitedTerms.sandbox.targetScope', 'Phạm vi kiểm tra')}
          </label>
          <div className="flex flex-wrap gap-1.5">
            {SCOPE_OPTIONS.map((sc) => (
              <button
                key={sc.id}
                type="button"
                onClick={() => {
                  setScope(sc.id);
                  setResult(null);
                }}
                className={`rounded-lg px-2.5 py-1 text-[11.5px] font-medium transition-all ${
                  scope === sc.id
                    ? 'bg-brand text-white shadow-2xs font-semibold'
                    : 'bg-surface-2 text-body hover:bg-surface-3 border border-line/70'
                }`}
              >
                {t(`prohibitedTerms.${sc.labelKey}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Text Input */}
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-[12px] font-semibold text-ink">
              {t('prohibitedTerms.sandbox.inputLabel', 'Nội dung kiểm thử')}
            </label>
            <span className="text-[11px] font-medium text-muted">
              {text.length} / 2.000
            </span>
          </div>
          <textarea
            rows={4}
            maxLength={2000}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setResult(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder={t('prohibitedTerms.sandbox.inputPlaceholder')}
            className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-[12.5px] text-ink placeholder:text-faint hover:border-line-hover focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15 transition-all resize-none shadow-2xs"
          />
        </div>

        {/* Action Button */}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[11px] text-muted flex items-center gap-1">
            <kbd className="rounded-md border border-line bg-surface-2 px-1.5 py-0.5 text-[10px] font-mono text-muted shadow-2xs">
              {t('prohibitedTerms.sandbox.hotkey', '⌘ + Enter')}
            </kbd>
          </span>
          <Button
            type="button"
            accent="brand"
            size="sm"
            disabled={!text.trim() || checkMutation.isPending}
            onClick={handleRun}
          >
            {checkMutation.isPending ? t('prohibitedTerms.sandbox.running') : `⚡ ${t('prohibitedTerms.sandbox.runBtn')}`}
          </Button>
        </div>

        {/* Diagnostic Results */}
        {result && (
          <div
            className={`mt-4 rounded-xl border p-3.5 transition-all ${
              result.allowed
                ? 'border-good/30 bg-good-soft'
                : 'border-bad-border bg-bad-soft'
            }`}
          >
            <div className="flex items-center gap-2">
              {result.allowed ? (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-good text-white shadow-2xs">
                  <IconCheck size={12} strokeWidth={3} />
                </div>
              ) : (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-bad text-white shadow-2xs">
                  <IconAlertTriangle size={12} strokeWidth={3} />
                </div>
              )}
              <span
                className={`text-[12.5px] font-bold ${
                  result.allowed ? 'text-good-deep' : 'text-bad-deep'
                }`}
              >
                {result.allowed
                  ? t('prohibitedTerms.sandbox.allowed')
                  : t('prohibitedTerms.sandbox.rejected')}
              </span>
            </div>

            {!result.allowed && result.matches.length > 0 && (
              <div className="mt-2.5 border-t border-bad-border/70 pt-2 text-[11.5px]">
                <div className="font-semibold text-bad-deep mb-1.5">
                  {t('prohibitedTerms.sandbox.matchesCount', { count: result.matches.length })}
                </div>
                <div className="space-y-1.5">
                  {result.matches.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between rounded-lg bg-surface px-2.5 py-1.5 border border-bad-border/80 shadow-2xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-ink">"{m.term}"</span>
                        <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-body border border-line/60">
                          {m.matchType}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-muted">
                        ID: {m.id.slice(0, 8)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-5 border-t border-line/70 pt-3 text-[11px] text-muted">
        🛡️ ChargeOps Engine v1 · Zero Client Storage Invariant
      </div>
    </Card>
  );
}
