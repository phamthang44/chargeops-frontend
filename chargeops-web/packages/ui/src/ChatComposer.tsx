import type { ReactNode } from 'react';

export interface ChatComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  disabled?: boolean;
  accent?: 'brand' | 'owner';
  /** Send button (or any trailing controls) — rendered in the send-actions slot. */
  actions: ReactNode;
  className?: string;
}

/**
 * Layout shell for a message composer (Astryx ChatComposer pattern): one
 * rounded surface that gets the focus ring, not the bare textarea — textarea
 * and send-actions are slots inside it. Enter sends, Shift+Enter inserts a
 * newline.
 */
export function ChatComposer({
  value,
  onChange,
  onSubmit,
  placeholder,
  disabled,
  accent = 'owner',
  actions,
  className = '',
}: ChatComposerProps) {
  const ring = accent === 'owner' ? 'focus-within:border-owner focus-within:ring-owner/15' : 'focus-within:border-brand focus-within:ring-brand/15';
  return (
    <div
      className={`flex items-end gap-2 rounded-[12px] border border-line bg-surface p-2 transition focus-within:ring-2 ${ring} ${className}`}
    >
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (value.trim()) onSubmit();
          }
        }}
        placeholder={placeholder}
        rows={1}
        disabled={disabled}
        className="max-h-32 min-h-9 flex-1 resize-none bg-transparent px-2 py-1.5 text-[13px] leading-[1.4] text-ink placeholder:text-faint focus:outline-none disabled:opacity-55"
      />
      <div className="flex shrink-0 items-center gap-1.5 pb-0.5">{actions}</div>
    </div>
  );
}
