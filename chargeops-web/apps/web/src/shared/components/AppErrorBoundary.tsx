import { Component, type ErrorInfo, type ReactNode } from 'react';
import i18n from '../../i18n';

interface AppErrorBoundaryState {
  hasError: boolean;
}

export class AppErrorBoundary extends Component<{ children: ReactNode }, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ChargeOps] UI render failed', {
      name: error.name,
      componentStack: info.componentStack,
    });
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <main role="alert" className="flex min-h-screen flex-col items-center justify-center gap-3 bg-canvas p-8 text-center">
        <h1 className="text-lg font-bold text-ink">{i18n.t('fatalError.title', { ns: 'common' })}</h1>
        <p className="max-w-md text-sm text-muted">{i18n.t('fatalError.body', { ns: 'common' })}</p>
        <button type="button" onClick={() => window.location.reload()} className="rounded-full border border-line bg-surface px-4 py-2 text-sm font-semibold text-ink hover:bg-surface-2">
          {i18n.t('fatalError.retry', { ns: 'common' })}
        </button>
      </main>
    );
  }
}
