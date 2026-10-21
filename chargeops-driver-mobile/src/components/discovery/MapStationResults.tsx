import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';
import type { Station } from '@/types';

interface Props {
  stations: Station[];
  selectedId?: string;
  loading: boolean;
  error: boolean;
  onSelect: (station: Station) => void;
  onRetry: () => void;
}

/** Uses the map's existing result set and selection; performs no additional fetch. */
export function MapStationResults({ stations, selectedId, loading, error, onSelect, onRetry }: Props) {
  const { t } = useTranslation();
  const { themeColors } = usePreferences();
  return (
    <View style={styles.results}>
      <Text style={[styles.heading, { color: themeColors.textStrong }]}>{t('map.resultsTitle')}</Text>
      <Text style={{ color: themeColors.textMuted }}>{t('map.resultsCount', { count: stations.length })}</Text>
      {loading && <ActivityIndicator color={themeColors.primary} accessibilityLabel={t('common.loading')} />}
      {error && (
        <View accessibilityRole="alert" style={styles.results}>
          <Text style={{ color: themeColors.textBody }}>{t('map.stationsUnavailable')}</Text>
          <Pressable accessibilityRole="button" onPress={onRetry} style={styles.retry}>
            <Text style={{ color: themeColors.primary }}>{t('map.retryStations')}</Text>
          </Pressable>
        </View>
      )}
      {!loading && !error && stations.length === 0 && <Text style={{ color: themeColors.textBody }}>{t('map.noResults')}</Text>}
      {stations.map((station) => (
        <Pressable
          key={station.id}
          testID={`map-result-${station.id}`}
          accessibilityRole="button"
          accessibilityLabel={station.name}
          accessibilityState={{ selected: station.id === selectedId }}
          onPress={() => onSelect(station)}
          style={({ pressed }) => [styles.row, {
            backgroundColor: station.id === selectedId || pressed ? themeColors.surfaceAlt : themeColors.surface,
            borderColor: station.id === selectedId ? themeColors.primary : themeColors.border,
          }]}
        >
          <Text style={[styles.name, { color: themeColors.textStrong }]}>{station.name}</Text>
          <Text numberOfLines={2} style={[styles.address, { color: themeColors.textBody }]}>{station.address}</Text>
          <Text style={{ color: themeColors.textMuted }}>{t('map.portsFree', { count: station.availableConnectors ?? 0 })}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  results: { gap: spacing.sm },
  heading: { fontSize: fontSizes.body, fontWeight: fontWeights.bold },
  row: { minHeight: 80, padding: spacing.md, borderWidth: 1, borderRadius: radius.md, gap: spacing.xs },
  name: { fontSize: fontSizes.body, fontWeight: fontWeights.semibold },
  address: { fontSize: fontSizes.caption, lineHeight: 18 },
  retry: { minHeight: 48, justifyContent: 'center' },
});
