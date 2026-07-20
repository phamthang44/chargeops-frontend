import type { BookingSearchField } from '@chargeops/api';
import { IconCard, SearchInput, SegmentedControl, Select } from '@chargeops/ui';

export type BookingRange = 'today' | '7d' | '30d' | 'all';

const RANGES = [
  { key: 'today' as const, label: 'Hôm nay' },
  { key: '7d' as const, label: '7 ngày' },
  { key: '30d' as const, label: '30 ngày' },
  { key: 'all' as const, label: 'Tất cả' },
];

const SEARCH_FIELDS = [
  { value: 'all', label: 'Tất cả trường' },
  { value: 'id', label: 'Mã đặt chỗ' },
  { value: 'driver', label: 'Tài xế' },
  { value: 'charger', label: 'Trụ sạc' },
];

export interface BookingToolbarProps {
  search: string;
  onSearch: (v: string) => void;
  searchIn: BookingSearchField;
  onSearchIn: (f: BookingSearchField) => void;
  range: BookingRange;
  onRange: (r: BookingRange) => void;
  onExport: () => void;
}

/** Search (debounced) + field-scope select + date range + CSV export. */
export function BookingToolbar({
  search,
  onSearch,
  searchIn,
  onSearchIn,
  range,
  onRange,
  onExport,
}: BookingToolbarProps) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-[9px]">
      <SearchInput
        value={search}
        onChange={onSearch}
        accent="owner"
        placeholder="Lọc theo mã, tài xế, trụ…"
        className="max-w-[300px] min-w-[190px] flex-1"
      />
      <Select
        value={searchIn}
        onChange={(v) => onSearchIn(v as BookingSearchField)}
        options={SEARCH_FIELDS}
        accent="owner"
        className="w-[142px]"
        aria-label="Tìm trong trường"
      />
      <SegmentedControl segments={RANGES} active={range} onChange={onRange} />
      <button
        onClick={onExport}
        className="ml-auto flex items-center gap-[7px] rounded-ctl border border-line bg-white px-[13px] py-2 text-[12.5px] font-semibold text-body transition hover:border-[#c9ccd4] hover:bg-canvas"
      >
        <IconCard size={14} strokeWidth={1.9} />
        Xuất CSV
      </button>
    </div>
  );
}
