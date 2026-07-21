import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconSearch } from './icons';

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  /** Debounce before onChange fires while typing (Enter flushes immediately). */
  debounceMs?: number;
  /** Focus-ring colour family. */
  accent?: 'brand' | 'owner';
}

/**
 * Debounced search field: types locally, commits after `debounceMs`;
 * Enter commits immediately, Escape clears, × clears.
 */
export function SearchInput({
  value,
  onChange,
  placeholder,
  className = '',
  debounceMs = 300,
  accent = 'brand',
}: SearchInputProps) {
  const { t } = useTranslation('ui');
  const [draft, setDraft] = useState(value);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // External resets (e.g. parent clears the filter) sync back into the draft.
  useEffect(() => {
    setDraft(value);
  }, [value]);

  // Debounced commit.
  useEffect(() => {
    if (draft === value) return;
    const t = setTimeout(() => onChangeRef.current(draft), debounceMs);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, debounceMs]);

  const ring =
    accent === 'owner'
      ? 'focus-within:border-owner focus-within:ring-owner/15'
      : 'focus-within:border-brand focus-within:ring-brand/15';

  return (
    <div
      className={`flex h-9 items-center gap-2 rounded-ctl border border-line bg-white px-[11px] transition focus-within:ring-2 ${ring} ${className}`}
    >
      <IconSearch size={15} strokeWidth={2} className="shrink-0 text-faint" />
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onChangeRef.current(draft);
          if (e.key === 'Escape') {
            setDraft('');
            onChangeRef.current('');
          }
        }}
        placeholder={placeholder}
        className="w-full flex-1 border-none bg-transparent text-[13px] text-ink placeholder:text-faint"
      />
      {draft && (
        <button
          onClick={() => {
            setDraft('');
            onChangeRef.current('');
          }}
          className="text-[14px] font-semibold text-faint hover:text-body"
          aria-label={t('search.clear')}
        >
          ×
        </button>
      )}
    </div>
  );
}
