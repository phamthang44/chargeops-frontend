import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { IconAlertCircle, IconAlertTriangle, IconCheckCircle, IconInfoCircle, IconX, type IconProps } from './icons';

export type BannerStatus = 'info' | 'success' | 'warning' | 'error';

export interface BannerProps {
  status: BannerStatus;
  title: string;
  description?: string;
  /** Rendered as a button/link on the right, e.g. "Gia hạn ngay". */
  action?: ReactNode;
  onDismiss?: () => void;
  className?: string;
}

const META: Record<
  BannerStatus,
  { Icon: (props: IconProps) => ReactNode; border: string; bg: string; iconClass: string; titleClass: string }
> = {
  info: { Icon: IconInfoCircle, border: 'border-brand-line', bg: 'bg-brand-faint', iconClass: 'text-brand', titleClass: 'text-ink' },
  success: { Icon: IconCheckCircle, border: 'border-good/20', bg: 'bg-good-soft', iconClass: 'text-good', titleClass: 'text-good-deep' },
  warning: { Icon: IconAlertTriangle, border: 'border-warn-border', bg: 'bg-warn-soft', iconClass: 'text-warn', titleClass: 'text-warn-deep' },
  error: { Icon: IconAlertCircle, border: 'border-bad-border', bg: 'bg-bad-soft', iconClass: 'text-bad', titleClass: 'text-bad-deep' },
};

/** Persistent top-of-page/section status message. Use Toast instead for anything short-lived. */
export function Banner({ status, title, description, action, onDismiss, className = '' }: BannerProps) {
  const { t } = useTranslation('ui');
  const { Icon, border, bg, iconClass, titleClass } = META[status];
  return (
    <div
      className={`mb-[18px] flex flex-wrap items-start justify-between gap-3.5 rounded-[11px] border px-4 py-[13px] ${border} ${bg} ${className}`}
    >
      <div className="flex items-start gap-[11px]">
        <Icon size={18} strokeWidth={2} className={`mt-0.5 shrink-0 ${iconClass}`} />
        <div>
          <div className={`text-[13px] font-semibold ${titleClass}`}>{title}</div>
          {description && <div className="mt-0.5 text-[12px] leading-[1.5] text-muted">{description}</div>}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {action}
        {onDismiss && (
          <button
            onClick={onDismiss}
            aria-label={t('drawer.close')}
            className="flex h-6 w-6 items-center justify-center rounded-md text-faint hover:bg-black/5"
          >
            <IconX size={14} strokeWidth={2} />
          </button>
        )}
      </div>
    </div>
  );
}
