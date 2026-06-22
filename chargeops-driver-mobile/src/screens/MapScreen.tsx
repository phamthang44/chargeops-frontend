import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View, type DimensionValue } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StationPin, type PinStatus } from '@/components';
import { colors, fontSizes, fontWeights, lineHeights, radius, spacing } from '@/theme';

/**
 * "Bản đồ" tab. The real interactive map (Google Maps) is out of scope, so this
 * shows a faux map preview that demonstrates the station pins + legend. Swapping
 * in a real <MapView> later only replaces the faux-map View.
 */
const PREVIEW_PINS: { status: PinStatus; selected?: boolean; top: DimensionValue; left: DimensionValue }[] = [
  { status: 'available', top: '18%', left: '22%' },
  { status: 'available', selected: true, top: '40%', left: '52%' },
  { status: 'busy', top: '30%', left: '74%' },
  { status: 'full', top: '64%', left: '30%' },
  { status: 'closed', top: '72%', left: '66%' },
];

const LEGEND: PinStatus[] = ['available', 'busy', 'full', 'closed'];

export function MapScreen() {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        <Text style={styles.title}>{t('map.title')}</Text>
        <Text style={styles.subtitle}>{t('map.placeholder')}</Text>

        {/* Faux map canvas with scattered station pins */}
        <View style={styles.map}>
          <View style={styles.grid} pointerEvents="none">
            {[0, 1, 2, 3].map((i) => (
              <View key={`h${i}`} style={[styles.gridLineH, { top: `${(i + 1) * 20}%` }]} />
            ))}
            {[0, 1, 2, 3].map((i) => (
              <View key={`v${i}`} style={[styles.gridLineV, { left: `${(i + 1) * 20}%` }]} />
            ))}
          </View>
          {PREVIEW_PINS.map((p, i) => (
            <View key={i} style={[styles.pin, { top: p.top, left: p.left }]}>
              <StationPin status={p.status} selected={p.selected} size={p.selected ? 56 : 42} />
            </View>
          ))}
          <Text style={styles.mapNote}>{t('map.body')}</Text>
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          {LEGEND.map((s) => (
            <View key={s} style={styles.legendItem}>
              <StationPin status={s} size={22} />
              <Text style={styles.legendText}>{t(`map.legend.${s}`)}</Text>
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, padding: spacing.lg, gap: spacing.md },
  title: { fontSize: fontSizes.title, fontWeight: fontWeights.bold, color: colors.textStrong },
  subtitle: { fontSize: fontSizes.body, color: colors.textMuted },

  map: {
    flex: 1,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    overflow: 'hidden',
  },
  grid: { ...StyleSheet.absoluteFillObject },
  gridLineH: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: colors.border, opacity: 0.6 },
  gridLineV: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: colors.border, opacity: 0.6 },
  pin: { position: 'absolute', transform: [{ translateX: -21 }, { translateY: -42 }] },
  mapNote: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
    fontSize: fontSizes.caption,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: lineHeights.caption,
  },

  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  legendText: { fontSize: fontSizes.caption, color: colors.textBody },
});
