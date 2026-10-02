import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';

interface StationListFooterProps {
  loading: boolean;
  error: boolean;
  hasMore: boolean;
  loadingMore: boolean;
  shownCount: number;
  totalCount: number;
  onLoadMore: () => void;
}

export function StationListFooter({
  loading,
  error,
  hasMore,
  loadingMore,
  shownCount,
  totalCount,
  onLoadMore,
}: StationListFooterProps) {
  const { t } = useTranslation();
  const { themeColors, isDark } = usePreferences();

  if (loading || error || shownCount === 0 || !hasMore) {
    return null;
  }

  return (
    <View style={styles.footerWrap}>
      <Pressable
        style={[
          styles.showMore,
          {
            backgroundColor: isDark ? '#161B1A' : themeColors.surface,
            borderColor: isDark ? '#2A312F' : themeColors.border,
          },
        ]}
        disabled={loadingMore}
        onPress={onLoadMore}
      >
        {loadingMore ? (
          <ActivityIndicator color={themeColors.primary} size="small" />
        ) : (
          <>
            <Text style={[styles.showMoreText, { color: themeColors.primary }]}>
              {t('stationList.showMore')}
            </Text>
            <Text style={[styles.showMoreCount, { color: themeColors.textMuted }]}>
              {t('stationList.showingCount', { shown: shownCount, total: totalCount })}
            </Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  footerWrap: { gap: spacing.md },
  showMore: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingVertical: spacing.sm,
  },
  showMoreText: { fontSize: fontSizes.body, fontWeight: fontWeights.semibold },
  showMoreCount: { fontSize: fontSizes.caption },
});
