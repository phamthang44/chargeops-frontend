export interface Segment<K extends string> {
  key: K;
  label: string;
}

export interface SegmentedControlProps<K extends string> {
  segments: Segment<K>[];
  active: K;
  onChange: (key: K) => void;
}

/** Joined button group with one active segment (date range, etc.). */
export function SegmentedControl<K extends string>({
  segments,
  active,
  onChange,
}: SegmentedControlProps<K>) {
  return (
    <div className="flex overflow-hidden rounded-ctl border border-line">
      {segments.map((s, i) => {
        const on = s.key === active;
        return (
          <button
            key={s.key}
            onClick={() => onChange(s.key)}
            className={`px-[13px] py-2 text-[12px] font-semibold ${i > 0 ? 'border-l border-line-3' : ''} ${
              on ? 'bg-owner-soft text-owner-deep' : 'bg-white text-body hover:bg-canvas'
            }`}
          >
            {s.label}
          </button>
        );
      })}
    </div>
  );
}
