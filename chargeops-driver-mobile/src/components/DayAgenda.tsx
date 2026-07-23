import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import {
  type GestureResponderEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors, fontSizes, fontWeights, radius, spacing } from '@/theme';
import { formatMinutes, MIN_DURATION_MIN, type BusyRange } from '@/utils/availability';

interface FreeGap {
  fromMin: number;
  toMin: number;
}

/**
 * The stretches of the day a booking can actually start in: operating hours,
 * minus the past and minus everything already booked, keeping only gaps long
 * enough to fit the shortest booking. These become the visible "tap here" bands.
 */
function computeFreeGaps(startMin: number, endMin: number, busy: BusyRange[]): FreeGap[] {
  const blocks = busy.map((b) => [b.fromMin, b.toMin] as const).sort((a, b) => a[0] - b[0]);
  const gaps: FreeGap[] = [];
  let cursor = startMin;
  for (const [bf, bt] of blocks) {
    if (bt <= cursor) continue;
    if (bf > cursor) gaps.push({ fromMin: cursor, toMin: Math.min(bf, endMin) });
    cursor = Math.max(cursor, bt);
    if (cursor >= endMin) break;
  }
  if (cursor < endMin) gaps.push({ fromMin: cursor, toMin: endMin });
  return gaps.filter((g) => g.toMin - g.fromMin >= MIN_DURATION_MIN);
}

/**
 * Vertical day view for booking (FR05/FR11).
 *
 * The old horizontal bar hid the day inside a 6px strip; this shows the whole
 * day top-to-bottom like a calendar, so a driver can actually SEE which hours
 * are free before choosing. Bookings are shaded blocks in place; tapping a free
 * spot sets the start (the parent snaps it to the nearest valid time), and the
 * chosen range is drawn back on the grid so it's obvious it fits.
 */

/** Pixel height of one hour row — tall enough to read, scrolls for the full day. */
const HOUR_H = 56;
/** Left gutter width for the hour labels. */
const GUTTER = 52;

export interface DayAgendaProps {
  opensAtMin: number;
  closesAtMin: number;
  /** Minutes before which the day is already gone (past, on today). */
  earliestMin: number;
  busy: BusyRange[];
  /** Currently chosen window, if any. */
  selection: { startMin: number; durationMin: number } | null;
  /** Fired with a raw minutes-from-midnight value when a free spot is tapped. */
  onPickStart: (rawMin: number) => void;
}

export function DayAgenda({
  opensAtMin,
  closesAtMin,
  earliestMin,
  busy,
  selection,
  onPickStart,
}: DayAgendaProps) {
  const { t } = useTranslation();

  const span = Math.max(1, closesAtMin - opensAtMin);
  const totalH = (span / 60) * HOUR_H;
  const y = (min: number) => ((min - opensAtMin) / 60) * HOUR_H;
  const clampTop = (min: number) => Math.max(0, Math.min(totalH, y(min)));

  // Whole-hour lines across the visible window.
  const hours: number[] = [];
  for (let m = Math.ceil(opensAtMin / 60) * 60; m <= closesAtMin; m += 60) hours.push(m);

  const pastBottom = clampTop(Math.min(earliestMin, closesAtMin));

  const firstFree = Math.max(opensAtMin, Math.min(earliestMin, closesAtMin));
  const freeGaps = computeFreeGaps(firstFree, closesAtMin, busy);

  /** A tap inside a free band sets the start at the tapped minute of that gap. */
  function tapGap(gap: FreeGap, e: GestureResponderEvent) {
    const localY = e.nativeEvent.locationY;
    onPickStart(gap.fromMin + (localY / HOUR_H) * 60);
  }

  return (
    <View>
      <View style={{ height: totalH }}>
        {/* Hour gridlines + labels */}
        {hours.map((m) => (
          <View key={m} pointerEvents="none" style={[styles.hourLine, { top: y(m) }]}>
            <Text style={styles.hourLabel}>{formatMinutes(m)}</Text>
            <View style={styles.gridRule} />
          </View>
        ))}

        {/* Track (right of the gutter) holds the blocks + the tap surface */}
        <View style={styles.track}>
          {/* Elapsed part of today */}
          {pastBottom > 0 && (
            <View pointerEvents="none" style={[styles.past, { height: pastBottom }]}>
              {pastBottom > 22 && <Text style={styles.pastText}>{t('timeRangePicker.past')}</Text>}
            </View>
          )}

          {/* Free, tappable time — the obvious "tap here" bands */}
          {freeGaps.map((g, i) => {
            const top = clampTop(g.fromMin);
            const height = Math.max(18, clampTop(g.toMin) - top);
            return (
              <Pressable key={`free-${i}`} style={[styles.free, { top, height }]} onPress={(e) => tapGap(g, e)}>
                {height > 40 ? (
                  <View style={styles.freeInner}>
                    <Ionicons name="add-circle" size={15} color={colors.primary} />
                    <Text style={styles.freeText}>{t('timeRangePicker.freeSlot')}</Text>
                  </View>
                ) : height > 22 ? (
                  <Ionicons name="add" size={14} color={colors.primary} />
                ) : null}
              </Pressable>
            );
          })}

          {/* Ranges already booked */}
          {busy.map((r, i) => {
            const top = clampTop(r.fromMin);
            const height = Math.max(3, clampTop(r.toMin) - top);
            const mine = r.kind === 'MINE';
            return (
              <View
                key={`${r.fromMin}-${i}`}
                pointerEvents="none"
                style={[styles.busy, mine && styles.busyMine, { top, height }]}
              >
                {height > 24 && (
                  <Text style={[styles.busyText, mine && styles.busyTextMine]} numberOfLines={1}>
                    {formatMinutes(r.fromMin)}–{formatMinutes(r.toMin)} ·{' '}
                    {t(mine ? 'timeRangePicker.legendMine' : 'timeRangePicker.legendBooked')}
                  </Text>
                )}
              </View>
            );
          })}

          {/* The chosen window */}
          {selection && (
            <View
              pointerEvents="none"
              style={[
                styles.selection,
                {
                  top: clampTop(selection.startMin),
                  height: Math.max(
                    18,
                    clampTop(selection.startMin + selection.durationMin) - clampTop(selection.startMin),
                  ),
                },
              ]}
            >
              <Text style={styles.selectionText} numberOfLines={1}>
                {formatMinutes(selection.startMin)}–{formatMinutes(selection.startMin + selection.durationMin)}
              </Text>
            </View>
          )}

        </View>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <LegendItem swatch={styles.swFree} label={t('timeRangePicker.legendFree')} />
        <LegendItem swatch={styles.swBooked} label={t('timeRangePicker.legendBooked')} />
        <LegendItem swatch={styles.swMine} label={t('timeRangePicker.legendMine')} />
        <LegendItem swatch={styles.swSelected} label={t('timeRangePicker.legendSelected')} />
      </View>
    </View>
  );
}

function LegendItem({ swatch, label }: { swatch: object; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.swatch, swatch]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hourLine: { position: 'absolute', left: 0, right: 0, height: 1, flexDirection: 'row', alignItems: 'center' },
  hourLabel: {
    width: GUTTER - spacing.sm,
    textAlign: 'right',
    marginTop: -HOUR_H / 2,
    fontSize: fontSizes.caption,
    color: colors.textMuted,
  },
  gridRule: { flex: 1, marginLeft: spacing.sm, height: 1, backgroundColor: colors.border },

  track: { position: 'absolute', left: GUTTER, right: 0, top: 0, bottom: 0 },
  past: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    backgroundColor: colors.surfaceAlt,
    opacity: 0.9,
    justifyContent: 'center',
    paddingLeft: spacing.sm,
  },
  pastText: { fontSize: fontSizes.caption, color: colors.textMuted },

  // Free, bookable time — a faint emerald wash + a "tap to choose" affordance so
  // it reads as an inviting, tappable surface (vs. the solid grey booked blocks).
  free: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderRadius: radius.sm,
    backgroundColor: `${colors.primary}26`,
    borderWidth: 1,
    borderColor: `${colors.primary}66`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  freeInner: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  freeText: { fontSize: fontSizes.caption, fontWeight: fontWeights.semibold, color: colors.primaryDark },

  busy: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderRadius: radius.sm,
    backgroundColor: colors.border,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  busyMine: { backgroundColor: `${colors.info}26` },
  busyText: { fontSize: fontSizes.caption, color: colors.textMuted, fontWeight: fontWeights.medium },
  busyTextMine: { color: colors.info },

  selection: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  selectionText: { fontSize: fontSizes.caption, color: colors.textInverse, fontWeight: fontWeights.bold },

  // Legend
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  swatch: { width: 12, height: 12, borderRadius: 3 },
  swFree: { backgroundColor: `${colors.primary}26`, borderWidth: 1, borderColor: `${colors.primary}66` },
  swBooked: { backgroundColor: colors.border },
  swMine: { backgroundColor: `${colors.info}26` },
  swSelected: { backgroundColor: colors.primary },
  legendText: { fontSize: fontSizes.caption, color: colors.textMuted, fontWeight: fontWeights.medium },
});
