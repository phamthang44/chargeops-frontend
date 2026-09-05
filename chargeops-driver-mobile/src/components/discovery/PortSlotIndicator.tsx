import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { LiveDot } from '@/components/LiveDot';
import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';

interface PortSlotIndicatorProps {
  available: number;
  total: number;
  showBars?: boolean;
  showLabel?: boolean;
}

/**
 * Visual indicator showing real-time port availability with segment bars
 * and a live pulsing status dot.
 */
export function PortSlotIndicator({
  available,
  total,
  showBars = true,
  showLabel = true,
}: PortSlotIndicatorProps) {
  const { t } = useTranslation();
  const { themeColors, isDark } = usePreferences();

  const isFull = available <= 0;
  const isNearlyFull = available === 1 && total > 1;

  const statusColor = isFull
    ? themeColors.error
    : isNearlyFull
      ? themeColors.warning
      : themeColors.primary;

  const maxBars = Math.min(8, Math.max(1, total));
  const availableBars = Math.min(maxBars, Math.round((available / Math.max(1, total)) * maxBars));

  return (
    <View style={styles.container}>
      {showLabel && (
        <View style={styles.headerRow}>
          <LiveDot color={statusColor} size={7} />
          <Text
            style={[
              styles.label,
              {
                color: isFull
                  ? themeColors.error
                  : isNearlyFull
                    ? themeColors.warning
                    : isDark
                      ? themeColors.primaryLight
                      : themeColors.primaryDark,
              },
            ]}
          >
            {isFull
              ? t('stationList.card.portsFull', 'Hết chỗ trống')
              : t('stationList.card.portsAvailable', {
                  available,
                  total,
                  defaultValue: `Còn ${available}/${total} cổng khả dụng`,
                })}
          </Text>
        </View>
      )}

      {showBars && total > 0 && (
        <View style={styles.barRow}>
          {Array.from({ length: maxBars }).map((_, index) => {
            const isAvail = index < availableBars;
            return (
              <View
                key={index}
                style={[
                  styles.barSegment,
                  {
                    backgroundColor: isAvail
                      ? statusColor
                      : isDark
                        ? '#2A312F'
                        : '#E5E7EB',
                  },
                ]}
              />
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semibold,
    lineHeight: 16,
    includeFontPadding: false,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 4,
    width: '100%' as const,
    maxWidth: 160,
  },
  barSegment: {
    flex: 1,
    height: 4,
    borderRadius: radius.full,
  },
});
