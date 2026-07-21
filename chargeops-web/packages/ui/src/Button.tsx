import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'danger-soft' | 'ghost';
export type ButtonAccent = 'brand' | 'owner';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /** Primary colour family: indigo (admin/portal) or emerald (owner). */
  accent?: ButtonAccent;
  size?: ButtonSize;
  fullWidth?: boolean;
  /** Leading icon node. */
  icon?: ReactNode;
}

const SIZE: Record<ButtonSize, string> = {
  sm: 'gap-1.5 rounded-[9px] px-3 py-[7px] text-[12px]',
  md: 'gap-[7px] rounded-[10px] px-[15px] py-[9px] text-[13px]',
  lg: 'gap-2 rounded-[11px] px-6 py-3 text-[13px]',
};

function variantClass(variant: ButtonVariant, accent: ButtonAccent): string {
  switch (variant) {
    case 'primary':
      return accent === 'owner'
        ? 'bg-owner text-white shadow-[0_1px_3px_rgba(18,161,80,.35)] hover:bg-owner-strong'
        : 'bg-brand text-white shadow-[0_1px_2px_rgba(91,84,232,.3)] hover:bg-brand-strong';
    case 'secondary':
      return 'border border-line bg-surface text-body hover:border-line-hover hover:bg-canvas';
    case 'danger':
      return 'bg-bad text-white hover:bg-bad-strong';
    case 'danger-soft':
      return 'border border-bad-border bg-bad-soft text-bad hover:bg-bad-soft-hover';
    case 'ghost':
      return 'text-body hover:bg-chip';
  }
}

/** Standard button: hover/active/disabled states, tactile press, focus ring. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', accent = 'brand', size = 'md', fullWidth, icon, className = '', children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={[
        'inline-flex select-none items-center justify-center font-semibold transition-all duration-150',
        'active:translate-y-px active:scale-[0.99]',
        'disabled:pointer-events-none disabled:opacity-55',
        SIZE[size],
        variantClass(variant, accent),
        fullWidth ? 'w-full' : '',
        className,
      ].join(' ')}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
});
