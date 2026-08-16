import type { ReactNode } from 'react';

export interface FormFieldProps {
  /** Mono uppercase label above the control. */
  label: string;
  /** Helper text under the control. */
  hint?: string;
  error?: boolean;
  required?: boolean;
  children: ReactNode;
}

export function FormField({ label, hint, error, required, children }: FormFieldProps) {
  return (
    <div>
      <div className="mb-[7px] text-[10px] font-semibold uppercase tracking-[0.07em] text-faint">
        {label} {required && <span className="text-bad">*</span>}
      </div>
      {children}
      {hint && (
        <div className={`mt-[6px] text-[11px] leading-[1.5] ${error ? 'text-bad' : 'text-faint'}`}>
          {hint}
        </div>
      )}
    </div>
  );
}

/** Standard text input matching the design (10px radius, focus ring by accent). */
export function TextInput({
  value,
  onChange,
  placeholder,
  invalid,
  mono,
  accent = 'owner',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  invalid?: boolean;
  mono?: boolean;
  accent?: 'owner' | 'brand';
}) {
  const ring =
    accent === 'owner'
      ? 'focus:border-owner focus:ring-owner/15'
      : 'focus:border-brand focus:ring-brand/15';
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full rounded-[10px] border px-[13px] py-[11px] text-[13.5px] transition focus:ring-2 ${
        mono ? 'font-mono' : ''
      } ${invalid ? 'border-bad' : 'border-line'} ${ring}`}
    />
  );
}
