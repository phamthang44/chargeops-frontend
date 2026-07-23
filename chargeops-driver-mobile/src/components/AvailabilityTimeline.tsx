import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fontSizes, fontWeights, radius, spacing } from '@/theme';
import { formatMinutes, type BusyRange } from '@/utils/availability';

/**
 * The station's operating window for one day, drawn as a single bar with the
 * ranges already booked cut out of it.
 *
 * This exists because the driver now picks an arbitrary start + duration rather
 * than a slot from a grid: without seeing how the day is already carved up, a
 * chosen window is just a guess that the server may reject. Tapping the bar sets
 * the start time (snapped by the caller); the chosen window is drawn back on top
 * so the driver can see it fits.
 */
export interface AvailabilityTimelineProps {
  opensAtMin: number;
  closesAtMin: number;
  busy: BusyRange[];
  /** Minutes before which the day is already gone (past, on today). */
  earliestMin: number;
  /** Currently chosen window, if any. */
  selection: { startMin: number; durationMin: number } | null;
  /** Fired with a minutes-from-midnight value when the driver taps the bar. */
  onPickStart: (startMin: number) => void;
}

const BAR_HEIGHT = 46;

export function AvailabilityTimeline({
  opensAtMin,
  closesAtMin,
  busy,
  earliestMin,
  selection,
  onPickStart,
}: AvailabilityTimelineProps) {
  const { t } = useTranslation();
  const [width, setWidth] = useState(0);

  const span = Math.max(1, closesAtMin - opensAtMin);
  const pct = (min: number) => ((min - opensAtMin) / span) * 100;
  const clampPct = (v: number) => Math.max(0, Math.min(100, v));

  function handleLayout(e: LayoutChangeEvent) {
    setWidth(e.nativeEvent.layout.width);
  }

  function handlePress(locationX: number) {
    if (width <= 0) return;
    const ratio = Math.max(0, Math.min(1, locationX / width));
    onPickStart(opensAtMin + ratio * span);
  }

  // Hour ticks every 3 hours keep the bar readable on a phone.
  const ticks: number[] = [];
  for (let m = Math.ceil(opensAtMin / 180) * 180; m < closesAtMin; m += 180) ticks.push(m);

  const pastWidth = clampPct(pct(Math.min(earliestMin, closesAtMin)));

  return (
    <View style={styles.wrap}>
      <Pressable
        onLayout={handleLayout}
        onPress={(e) => handlePress(e.nativeEvent.locationX)}
        style={styles.bar}
        accessibilityRole="adjustable"
        accessibilityLabel={t('timeRangePicker.timelineLabel')}
      >
        {/* Elapsed part of today */}
        {pastWidth > 0 && <View style={[styles.past, { width: `${pastWidth}%` }]} />}

        {/* Ranges already booked */}
        {busy.map((r, i) => {
          const left = clampPct(pct(r.fromMin));
          const right = clampPct(pct(r.toMin));
          return (
            <View
              key={`${r.fromMin}-${i}`}
              style={[
                styles.busy,
                r.kind === 'MINE' && styles.busyMine,
                { left: `${left}%`, width: `${Math.max(0.5, right - left)}%` },
              ]}
            />
          );
        })}

        {/* Hour ticks */}
        {ticks.map((m) => (
          <View key={m} style={[styles.tick, { left: `${clampPct(pct(m))}%` }]} />
        ))}

        {/* The window the driver has chosen */}
        {selection && (
          <View
            style={[
              styles.selection,
              {
                left: `${clampPct(pct(selection.startMin))}%`,
                width: `${Math.max(
                  1,
                  clampPct(pct(selection.startMin + selection.durationMin)) -
                    clampPct(pct(selection.startMin)),
                )}%`,
              },
            ]}
          />
        )}
      </Pressable>

      {/* Open / close bounds */}
      <View style={styles.boundsRow}>
        <Text style={styles.bound}>{formatMinutes(opensAtMin)}</Text>
        {ticks.map((m) => (
          <Text key={m} style={[styles.tickLabel, { left: `${clampPct(pct(m))}%` }]}>
            {formatMinutes(m)}
          </Text>
        ))}
        <Text style={styles.bound}>{formatMinutes(Math.min(closesAtMin, 1439))}</Text>
      </View>

      <View style={styles.legend}>
        <LegendItem color={colors.primary} label={t('timeRangePicker.legendSelected')} />
        <LegendItem color={colors.border} label={t('timeRangePicker.legendBooked')} />
        <LegendItem color={colors.info} label={t('timeRangePicker.legendMine')} />
      </View>
    </View>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  bar: {
    height: BAR_HEIGHT,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.primarySoft,
    overflow: 'hidden',
  },
  past: { position: 'absolute', top: 0, bottom: 0, left: 0, backgroundColor: colors.surfaceAlt },
  busy: { position: 'absolute', top: 0, bottom: 0, backgroundColor: colors.border },
  busyMine: { backgroundColor: `${colors.info}59` },
  tick: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: colors.surface, opacity: 0.7 },
  selection: {
    position: 'absolute',
    top: 3,
    bottom: 3,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
  },

  boundsRow: { flexDirection: 'row', justifyContent: 'space-between', height: 14 },
  bound: { fontSize: fontSizes.caption, color: colors.textMuted },
  tickLabel: {
    position: 'absolute',
    marginLeft: -14,
    fontSize: fontSizes.caption,
    color: colors.textMuted,
    opacity: 0.7,
  },

  legend: { flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  legendDot: { width: 8, height: 8, borderRadius: radius.full },
  legendText: { fontSize: fontSizes.caption, color: colors.textMuted, fontWeight: fontWeights.medium },
});
