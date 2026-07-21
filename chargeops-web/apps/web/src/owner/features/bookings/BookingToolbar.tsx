import { useTranslation } from 'react-i18next';
import type { BookingSearchField } from '@chargeops/api';
import { IconCard, SearchInput, SegmentedControl, Select } from '@chargeops/ui';

export type BookingRange = 'today' | '7d' | '30d' | 'all';

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
  const { t } = useTranslation('owner');

  const ranges = [
    { key: 'today' as const, label: t('bookings.toolbar.ranges.today') },
    { key: '7d' as const, label: t('bookings.toolbar.ranges.7d') },
    { key: '30d' as const, label: t('bookings.toolbar.ranges.30d') },
    { key: 'all' as const, label: t('bookings.toolbar.ranges.all') },
  ];

  const searchFields = [
    { value: 'all', label: t('bookings.toolbar.fields.all') },
    { value: 'id', label: t('bookings.toolbar.fields.id') },
    { value: 'driver', label: t('bookings.toolbar.fields.driver') },
    { value: 'charger', label: t('bookings.toolbar.fields.charger') },
  ];

  return (
    <div className="mb-3 flex flex-wrap items-center gap-[9px]">
      <SearchInput
        value={search}
        onChange={onSearch}
        accent="owner"
        placeholder={t('bookings.toolbar.placeholder')}
        className="max-w-[300px] min-w-[190px] flex-1"
      />
      <Select
        value={searchIn}
        onChange={(v) => onSearchIn(v as BookingSearchField)}
        options={searchFields}
        accent="owner"
        className="w-[142px]"
        aria-label={t('bookings.toolbar.searchIn')}
      />
      <SegmentedControl segments={ranges} active={range} onChange={onRange} />
      <button
        onClick={onExport}
        className="ml-auto flex items-center gap-[7px] rounded-ctl border border-line bg-white px-[13px] py-2 text-[12.5px] font-semibold text-body transition hover:border-[#c9ccd4] hover:bg-canvas"
      >
        <IconCard size={14} strokeWidth={1.9} />
        {t('bookings.exportCsv')}
      </button>
    </div>
  );
}
