import { useTranslation } from 'react-i18next';
import {
  type GestureResponderEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors, fontSizes, fontWeights, radius, spacing } from '@/theme';
import { formatMinutes, type BusyRange } from '@/utils/availability';

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

  function handleTap(e: GestureResponderEvent) {
    const localY = e.nativeEvent.locationY;
    const min = opensAtMin + (localY / HOUR_H) * 60;
    onPickStart(min);
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

          {/* Tap surface — taps set the start, drags still scroll the page */}
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={handleTap}
            accessibilityRole="adjustable"
            accessibilityLabel={t('timeRangePicker.tapToStart')}
          />
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
  swFree: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  swBooked: { backgroundColor: colors.border },
  swMine: { backgroundColor: `${colors.info}26` },
  swSelected: { backgroundColor: colors.primary },
  legendText: { fontSize: fontSizes.caption, color: colors.textMuted, fontWeight: fontWeights.medium },
});
