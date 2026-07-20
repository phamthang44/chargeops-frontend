import type { SelectHTMLAttributes } from 'react';
import { IconChevronDown } from './icons';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange' | 'value' | 'size'> {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  /** Focus-ring colour family. */
  accent?: 'brand' | 'owner';
  className?: string;
}

/** Styled native select: custom chevron, hover border, accent focus ring. */
export function Select({
  value,
  onChange,
  options,
  accent = 'brand',
  className = '',
  ...rest
}: SelectProps) {
  const ring =
    accent === 'owner'
      ? 'focus:border-owner focus:ring-owner/15'
      : 'focus:border-brand focus:ring-brand/15';
  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full cursor-pointer appearance-none rounded-[10px] border border-line bg-white py-[9px] pl-3 pr-9 text-[13px] font-medium text-ink transition hover:border-[#c9ccd4] focus:ring-2 ${ring}`}
        {...rest}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <IconChevronDown
        size={14}
        strokeWidth={2.2}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-faint"
      />
    </div>
  );
}
