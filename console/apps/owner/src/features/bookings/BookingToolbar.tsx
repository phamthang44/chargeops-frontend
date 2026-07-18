import { IconCard, SearchInput, SegmentedControl } from '@chargeops/ui';

export type BookingRange = 'today' | '7d' | '30d' | 'all';

const RANGES = [
  { key: 'today' as const, label: 'Hôm nay' },
  { key: '7d' as const, label: '7 ngày' },
  { key: '30d' as const, label: '30 ngày' },
  { key: 'all' as const, label: 'Tất cả' },
];

export interface BookingToolbarProps {
  search: string;
  onSearch: (v: string) => void;
  range: BookingRange;
  onRange: (r: BookingRange) => void;
  onExport: () => void;
}

/** Search + date-range segmented control + CSV export. */
export function BookingToolbar({ search, onSearch, range, onRange, onExport }: BookingToolbarProps) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-[9px]">
      <SearchInput
        value={search}
        onChange={onSearch}
        placeholder="Lọc theo mã, tài xế, trụ…"
        className="max-w-[320px] min-w-[200px] flex-1"
      />
      <SegmentedControl segments={RANGES} active={range} onChange={onRange} />
      <button
        onClick={onExport}
        className="ml-auto flex items-center gap-[7px] rounded-ctl border border-line bg-white px-[13px] py-2 text-[12.5px] font-semibold text-body hover:bg-canvas"
      >
        <IconCard size={14} strokeWidth={1.9} />
        Xuất CSV
      </button>
    </div>
  );
}
