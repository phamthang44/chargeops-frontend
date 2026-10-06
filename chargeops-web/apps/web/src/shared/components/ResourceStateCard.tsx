import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { IconInfoCircle, IconRefreshCw, IconShieldAlert, type IconProps } from '@chargeops/ui';

export type ResourceStateTone = 'owner' | 'brand' | 'neutral' | 'warning';

export interface ResourceStateCardProps {
  eyebrow?: string;
  title: string;
  description?: string;
  /** Info box under the description — next-step guidance for the user. */
  hint?: string;
  /** Leading glyph. Defaults to a per-tone icon. */
  icon?: ReactNode;
  tone?: ResourceStateTone;
  /** CTA row (retry button, link, …) rendered under the hint. */
  action?: ReactNode;
  /** Fade-up delay in ms for the staggered entry. */
  delay?: number;
  compact?: boolean;
  className?: string;
}

const TONE: Record<
  ResourceStateTone,
  { shell: string; frame: string; icon: (props: IconProps) => ReactNode; iconBox: string; eyebrow: string }
> = {
  owner: {
    shell: 'bg-surface-2 ring-line/70 hover:ring-line-hover/70',
    frame: 'border-line/70 bg-surface',
    icon: IconShieldAlert,
    iconBox: 'border-owner-border bg-owner-soft text-owner-deep',
    eyebrow: 'text-muted',
  },
  brand: {
    shell: 'bg-brand/5 ring-brand/25 hover:ring-brand/40',
    frame: 'border-brand/25 bg-surface',
    icon: IconShieldAlert,
    iconBox: 'border-brand/25 bg-brand-soft text-brand',
    eyebrow: 'text-brand-strong',
  },
  neutral: {
    shell: 'bg-surface-2 ring-line/70 hover:ring-line-hover/70',
    frame: 'border-line/70 bg-surface',
    icon: IconShieldAlert,
    iconBox: 'border-line bg-chip text-muted',
    eyebrow: 'text-muted',
  },
  warning: {
    shell: 'bg-warn/5 ring-warn/25 hover:ring-warn/40',
    frame: 'border-warn/25 bg-surface',
    icon: IconShieldAlert,
    iconBox: 'border-warn/25 bg-warn-soft text-warn-deep',
    eyebrow: 'text-warn-deep',
  },
};

/** Inline "Thử lại" pill — button-in-button trailing icon, spring easing. */
export function ResourceRetryButton({
  onClick,
  isRetrying = false,
  label,
}: {
  onClick?: () => void;
  isRetrying?: boolean;
  label?: string;
}) {
  const { t } = useTranslation();
  if (!onClick) return null;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isRetrying}
      className="group/retry inline-flex items-center gap-2 rounded-full border border-line bg-surface py-1.5 pl-4 pr-1.5 text-[11.5px] font-bold text-body transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-line-hover hover:bg-canvas hover:shadow-xs active:scale-[0.97] disabled:pointer-events-none disabled:opacity-60"
    >
      <span>{isRetrying ? t('errorCard.retrying', { defaultValue: 'Đang thử lại…' }) : label || t('retry')}</span>
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-chip transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover/retry:rotate-180 group-hover/retry:scale-110">
        <IconRefreshCw size={12} className={isRetrying ? 'animate-spin' : ''} />
      </span>
    </button>
  );
}

/**
 * Premium "resource not here" card — double-bezel shell, eyebrow pill,
 * staggered rise-in. Use it for legitimate absence of data (no license yet,
 * endpoint not built, empty list at page level), never for real failures;
 * those go through ApiErrorState/ApiErrorCard.
 */
export function ResourceStateCard({
  eyebrow,
  title,
  description,
  hint,
  icon,
  tone = 'owner',
  action,
  delay = 0,
  compact = false,
  className = '',
}: ResourceStateCardProps) {
  const meta = TONE[tone];
  const Glyph = meta.icon;

  const stagger = (extra: number) => ({
    animation: 'riseIn 560ms cubic-bezier(0.32,0.72,0,1) both',
    animationDelay: `${delay + extra}ms`,
  });

  return (
    <div
      className={`group relative rounded-2xl p-1 ring-1 transition-[box-shadow] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${meta.shell} ${className}`}
      style={{ animation: 'riseIn 560ms cubic-bezier(0.32,0.72,0,1) both', animationDelay: `${delay}ms` }}
    >
      <div
        className={`rounded-[calc(1rem-0.25rem)] border text-center shadow-sm ${
          compact ? 'px-5 py-7' : 'px-6 py-10 sm:px-10'
        } ${meta.frame}`}
      >
        <span
          className={`mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border ${meta.iconBox}`}
          style={stagger(60)}
        >
          {icon ?? <Glyph size={22} />}
        </span>

        {eyebrow && (
          <div
            className={`mt-4 text-[9.5px] font-bold uppercase tracking-[0.18em] ${meta.eyebrow}`}
            style={stagger(80)}
          >
            {eyebrow}
          </div>
        )}

        <div className={`mt-1.5 font-bold text-ink ${compact ? 'text-[14.5px]' : 'text-[16px]'}`} style={stagger(140)}>
          {title}
        </div>

        {description && (
          <p
            className={`mx-auto mt-1.5 max-w-xl leading-relaxed text-muted ${compact ? 'text-[12px]' : 'text-[12.5px]'}`}
            style={stagger(220)}
          >
            {description}
          </p>
        )}

        {hint && (
          <div
            className={`mx-auto mt-5 flex max-w-xl items-start gap-2 rounded-xl border border-line/70 bg-canvas p-3 text-left text-[11.5px] leading-relaxed text-muted ${
              compact ? 'mt-3' : ''
            }`}
            style={stagger(300)}
          >
            <IconInfoCircle size={14} className="mt-0.5 shrink-0 text-faint" />
            <span>{hint}</span>
          </div>
        )}

        {action && (
          <div className="mt-5 flex items-center justify-center gap-2" style={stagger(360)}>
            {action}
          </div>
        )}
      </div>
    </div>
  );
}
