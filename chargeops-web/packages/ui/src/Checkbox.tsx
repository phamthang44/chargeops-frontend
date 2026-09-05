import React, { type ReactNode } from 'react';
import { IconCheck } from './icons';

export interface CheckboxProps {
  id?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  accent?: 'owner' | 'brand';
  children?: ReactNode;
  className?: string;
  description?: ReactNode;
}

/**
 * Design system Checkbox component for ChargeOps Console.
 * - Theme-adaptive via design tokens (bg-surface, border-line, text-ink)
 * - Accessible with native keyboard / screen-reader support via sr-only input
 * - Custom SVG checkmark icon from design system icons
 */
export const Checkbox: React.FC<CheckboxProps> = ({
  id,
  checked,
  onChange,
  disabled = false,
  accent = 'owner',
  children,
  className = '',
  description,
}) => {
  const accentCheckedClass =
    accent === 'brand'
      ? 'bg-brand border-brand text-white'
      : 'bg-owner border-owner text-white';

  const accentRingClass =
    accent === 'brand'
      ? 'peer-focus-visible:ring-brand'
      : 'peer-focus-visible:ring-owner';

  return (
    <label
      htmlFor={id}
      className={`inline-flex items-start gap-2.5 select-none transition-opacity ${
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
      } ${className}`}
    >
      <div className="relative flex items-center justify-center mt-0.5 shrink-0">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div
          className={`h-4 w-4 rounded-[5px] border transition-all duration-150 flex items-center justify-center ${
            checked
              ? accentCheckedClass
              : 'border-line bg-surface hover:border-line-hover'
          } ${accentRingClass} peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-surface`}
        >
          {checked && <IconCheck size={11} strokeWidth={2.5} />}
        </div>
      </div>
      {(children || description) && (
        <div className="flex flex-col">
          {children && (
            <span className="text-xs font-medium text-ink leading-snug">
              {children}
            </span>
          )}
          {description && (
            <span className="text-[11px] text-muted leading-normal mt-0.5">
              {description}
            </span>
          )}
        </div>
      )}
    </label>
  );
};
