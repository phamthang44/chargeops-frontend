import { useTranslation } from 'react-i18next';
import type { BookingSearchField } from '@chargeops/api';
import { IconCard, SearchInput, SegmentedControl, Select } from '@chargeops/ui';
import type { BookingRange } from './bookingExport';

export type { BookingRange } from './bookingExport';

export interface BookingToolbarProps {
  range: BookingRange;
  onRange: (r: BookingRange) => void;
  onExport: () => void;
  exporting?: boolean;
  search?: string;
  onSearch?: (v: string) => void;
  searchIn?: BookingSearchField;
  onSearchIn?: (f: BookingSearchField) => void;
}

/** Date range segmented control + Excel export. */
export function BookingToolbar({
  range,
  onRange,
  onExport,
  exporting = false,
}: BookingToolbarProps) {
  const { t } = useTranslation('owner');

  const ranges = [
    { key: 'today' as const, label: t('bookings.toolbar.ranges.today') },
    { key: '7d' as const, label: t('bookings.toolbar.ranges.7d') },
    { key: '30d' as const, label: t('bookings.toolbar.ranges.30d') },
    { key: 'all' as const, label: t('bookings.toolbar.ranges.all') },
  ];

  return (
    <div className="mb-3 flex flex-wrap items-center gap-[9px]">
      <SegmentedControl segments={ranges} active={range} onChange={onRange} />
      <button
        type="button"
        onClick={onExport}
        disabled={exporting}
        aria-busy={exporting}
        className="ml-auto flex items-center gap-[7px] rounded-ctl border border-line bg-surface px-[13px] py-2 text-[12.5px] font-semibold text-body transition hover:border-line-hover hover:bg-canvas disabled:cursor-wait disabled:opacity-60"
      >
        <IconCard size={14} strokeWidth={1.9} />
        {t(exporting ? 'bookings.exporting' : 'bookings.exportExcel')}
      </button>
    </div>
  );
}
