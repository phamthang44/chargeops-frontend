import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '@/components/illustrations/EmptyState';
import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';
import { StationListSkeleton } from './StationListSkeleton';

interface StationListEmptyStateProps {
  error: boolean;
  loading: boolean;
  onRetry: () => void;
}

export function StationListEmptyState({
  error,
  loading,
  onRetry,
}: StationListEmptyStateProps) {
  const { t } = useTranslation();
  const { themeColors } = usePreferences();

  if (error) {
    return (
      <View style={styles.stateBox}>
        <Ionicons name="cloud-offline-outline" size={40} color={themeColors.textMuted} />
        <Text style={[styles.stateText, { color: themeColors.textMuted }]}>
          {t('stationList.error')}
        </Text>
        <Pressable
          style={[styles.retryBtn, { backgroundColor: themeColors.primary }]}
          onPress={onRetry}
        >
          <Ionicons name="refresh" size={16} color="#FFFFFF" />
          <Text style={[styles.retryText, { color: '#FFFFFF' }]}>
            {t('stationList.retry')}
          </Text>
        </Pressable>
      </View>
    );
  }

  if (loading) {
    return <StationListSkeleton count={3} />;
  }

  return (
    <View style={styles.stateBox}>
      <EmptyState variant="search" />
      <Text style={[styles.stateText, { color: themeColors.textMuted }]}>
        {t('stationList.empty')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stateBox: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xxl },
  stateText: { fontSize: fontSizes.body, textAlign: 'center' },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  retryText: { fontSize: fontSizes.body, fontWeight: fontWeights.semibold },
});
