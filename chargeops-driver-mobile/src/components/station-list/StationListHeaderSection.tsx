import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { usePreferences } from '@/context/PreferencesContext';
import type { SortKey } from '@/hooks/useStationList';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';
import { StationListPromoBanner } from './StationListPromoBanner';

interface StationListHeaderSectionProps {
  error: boolean;
  loading: boolean;
  total: number;
  sort: SortKey;
  promoDismissed: boolean;
  onDismissPromo: () => void;
  onOpenSort: () => void;
}

export function StationListHeaderSection({
  error,
  loading,
  total,
  sort,
  promoDismissed,
  onDismissPromo,
  onOpenSort,
}: StationListHeaderSectionProps) {
  const { t } = useTranslation();
  const { themeColors, isDark } = usePreferences();

  if (error) return null;

  return (
    <View style={styles.listHeaderWrap}>
      <StationListPromoBanner
        visible={!promoDismissed}
        onDismiss={onDismissPromo}
      />

      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleBlock}>
          <Text style={[styles.sectionTitle, { color: themeColors.textStrong }]}>
            {t('stationList.nearby')}
          </Text>
          {!loading && (
            <Text style={[styles.resultCount, { color: themeColors.textMuted }]}>
              {t('stationList.resultCount', { count: total })}
            </Text>
          )}
        </View>

        <Pressable
          style={[
            styles.sortControl,
            {
              backgroundColor: isDark ? '#161B1A' : themeColors.surfaceAlt,
              borderColor: isDark ? '#2A312F' : themeColors.border,
            },
          ]}
          hitSlop={6}
          onPress={onOpenSort}
        >
          <Ionicons name="swap-vertical" size={15} color={themeColors.textBody} />
          <Text style={[styles.sortControlText, { color: themeColors.textBody }]}>
            {t(`stationList.sort.${sort}`)}
          </Text>
          <Ionicons name="chevron-down" size={14} color={themeColors.textMuted} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  listHeaderWrap: {
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  sectionTitleBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSizes.heading,
    fontWeight: fontWeights.bold,
    lineHeight: 24,
    includeFontPadding: false,
  },
  resultCount: {
    fontSize: fontSizes.caption,
    lineHeight: 16,
    includeFontPadding: false,
  },
  sortControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    height: 32,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  sortControlText: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semibold,
    lineHeight: 16,
    includeFontPadding: false,
  },
});
