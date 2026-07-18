export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** on-track colour; defaults to owner emerald. */
  accent?: string;
}

/** iOS-style switch used in pricing/availability rules and operating hours. */
export function Toggle({ checked, onChange, accent = '#12a150' }: ToggleProps) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative h-[23px] w-10 shrink-0 rounded-full transition-colors duration-150"
      style={{ background: checked ? accent : '#d6d9df' }}
    >
      <span
        className="absolute top-[3px] h-[17px] w-[17px] rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,.2)] transition-all duration-150"
        style={{ left: checked ? 20 : 3 }}
      />
    </button>
  );
}
