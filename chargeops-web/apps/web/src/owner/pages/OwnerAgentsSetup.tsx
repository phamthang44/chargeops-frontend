import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, IconCheck, IconCopy, IconInfoCircle, IconSparkles, PageHeader } from '@chargeops/ui';

const MCP_URL = import.meta.env.VITE_OWNER_MCP_URL?.trim() ?? '';
const OAUTH_CLIENT_ID = import.meta.env.VITE_OWNER_MCP_OAUTH_CLIENT_ID?.trim() ?? '';
const MCP_ENABLED = import.meta.env.VITE_OWNER_MCP_ENABLED?.trim().toLowerCase() === 'true';

function isMcpEndpoint(value: string) {
  try {
    const url = new URL(value);
    return (
      url.protocol === 'https:' &&
      url.pathname.replace(/\/+$/, '') === '/mcp' &&
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash
    );
  } catch {
    return false;
  }
}

export function OwnerAgentsSetup() {
  const { t } = useTranslation('owner');
  const [copiedProvider, setCopiedProvider] = useState<string | null>(null);
  const [copyFailed, setCopyFailed] = useState(false);
  const ready =
    MCP_ENABLED &&
    isMcpEndpoint(MCP_URL) &&
    /^[A-Za-z0-9._-]+$/.test(OAUTH_CLIENT_ID);

  const codexCommands = [
    'codex mcp add chargeops --url ' + MCP_URL + ' --oauth-client-id ' + OAUTH_CLIENT_ID,
    'codex mcp login chargeops',
    'codex mcp list',
  ].join('\n');
  const claudeCommands = [
    'claude mcp add --transport http --client-id ' + OAUTH_CLIENT_ID + ' --callback-port 8766 chargeops ' + MCP_URL,
    'claude mcp login chargeops',
    'claude mcp get chargeops',
  ].join('\n');
  const placeholderCommands = t('agents.placeholderCommands');

  const copyCommands = async (provider: string, commands: string) => {
    setCopyFailed(false);
    try {
      await navigator.clipboard.writeText(commands);
      setCopiedProvider(provider);
      window.setTimeout(() => setCopiedProvider(null), 1800);
    } catch {
      setCopyFailed(true);
    }
  };

  const providers = [
    {
      id: 'codex',
      title: t('agents.codex.title'),
      description: t('agents.codex.description'),
      commands: codexCommands,
      docsUrl: 'https://developers.openai.com/codex/mcp/',
      docsLabel: t('agents.codex.docs'),
    },
    {
      id: 'claude',
      title: t('agents.claude.title'),
      description: t('agents.claude.description'),
      commands: claudeCommands,
      docsUrl: 'https://code.claude.com/docs/en/mcp',
      docsLabel: t('agents.claude.docs'),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title={t('agents.title')} subtitle={t('agents.subtitle')} />

      <Card className={'flex items-start gap-3 p-4 ' + (ready ? 'border-owner/30 bg-owner-soft/30' : 'border-warn/30 bg-warn/5')}>
        <IconInfoCircle
          size={19}
          className={'mt-0.5 shrink-0 ' + (ready ? 'text-owner-deep' : 'text-warn')}
        />
        <div>
          <div className="text-[13.5px] font-semibold text-ink">
            {ready ? t('agents.readyTitle') : t('agents.notReadyTitle')}
          </div>
          <p className="mt-1 text-[12.5px] leading-relaxed text-body">
            {ready ? t('agents.readyDescription') : t('agents.notReadyDescription')}
          </p>
        </div>
      </Card>

      <Card className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-owner-soft text-owner-deep">
            <IconSparkles size={18} />
          </span>
          <div>
            <h2 className="text-[15px] font-semibold text-ink">{t('agents.howItWorksTitle')}</h2>
            <p className="mt-1 max-w-3xl text-[12.5px] leading-relaxed text-muted">
              {t('agents.howItWorksDescription')}
            </p>
          </div>
        </div>
        <ol className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {(['step1', 'step2', 'step3', 'step4'] as const).map((step, index) => (
            <li key={step} className="flex gap-3 rounded-xl border border-line bg-canvas p-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-owner-soft text-[11px] font-bold text-owner-deep">
                {index + 1}
              </span>
              <span className="text-[12px] leading-relaxed text-body">{t('agents.steps.' + step)}</span>
            </li>
          ))}
        </ol>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        {providers.map((provider) => {
          const copied = copiedProvider === provider.id;
          return (
            <Card key={provider.id} className="flex min-w-0 flex-col p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-[15px] font-semibold text-ink">{provider.title}</h2>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{provider.description}</p>
                </div>
                <a
                  href={provider.docsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 text-[11.5px] font-semibold text-owner-deep underline underline-offset-2"
                >
                  {provider.docsLabel}
                </a>
              </div>

              <div className="mt-4 rounded-xl bg-ink p-3 text-[11.5px] text-white">
                <pre className="overflow-x-auto whitespace-pre-wrap break-all font-mono leading-relaxed">
                  {ready ? provider.commands : placeholderCommands}
                </pre>
              </div>

              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="text-[11.5px] text-muted">{t('agents.runCommandsInOrder')}</span>
                <button
                  type="button"
                  onClick={() => void copyCommands(provider.id, provider.commands)}
                  disabled={!ready}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-2 text-[11.5px] font-semibold text-ink transition hover:bg-canvas disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                  {copied ? t('agents.copied') : t('agents.copyCommands')}
                </button>
              </div>
            </Card>
          );
        })}
      </div>

      {copyFailed && (
        <p role="status" className="text-[12px] text-danger">
          {t('agents.copyFailed')}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4 sm:p-5">
          <h2 className="text-[14px] font-semibold text-ink">{t('agents.tryTitle')}</h2>
          <p className="mt-1 text-[12px] text-muted">{t('agents.tryDescription')}</p>
          <ul className="mt-3 space-y-2">
            {(['prompt1', 'prompt2', 'prompt3'] as const).map((prompt) => (
              <li key={prompt} className="rounded-lg bg-canvas px-3 py-2 font-mono text-[11.5px] leading-relaxed text-body">
                “{t('agents.prompts.' + prompt)}”
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-4 sm:p-5">
          <h2 className="text-[14px] font-semibold text-ink">{t('agents.scopeTitle')}</h2>
          <ul className="mt-3 space-y-2 text-[12px] leading-relaxed text-body">
            {(['scope1', 'scope2', 'scope3', 'scope4'] as const).map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-owner-deep" />
                <span>{t('agents.scope.' + item)}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <p className="text-[11.5px] leading-relaxed text-faint">{t('agents.connectionNote')}</p>
    </div>
  );
}
