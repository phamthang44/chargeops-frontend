import { IconSearch } from './icons';

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

/** Search field with icon and clear (×) affordance. */
export function SearchInput({ value, onChange, placeholder, className = '' }: SearchInputProps) {
  return (
    <div
      className={`flex h-9 items-center gap-2 rounded-ctl border border-line bg-white px-[11px] ${className}`}
    >
      <IconSearch size={15} strokeWidth={2} className="shrink-0 text-faint" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full flex-1 border-none bg-transparent text-[13px] text-ink placeholder:text-faint"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="text-[14px] font-semibold text-faint"
          aria-label="Xóa"
        >
          ×
        </button>
      )}
    </div>
  );
}
