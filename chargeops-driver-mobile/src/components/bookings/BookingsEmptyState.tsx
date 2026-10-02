import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '@/components/illustrations/EmptyState';
import { usePreferences } from '@/context/PreferencesContext';
import type { BookingsTab } from '@/hooks/useBookingsScreen';
import { fontSizes, spacing } from '@/theme';

interface BookingsEmptyStateProps {
  tab: BookingsTab;
  tabInset: number;
}

export function BookingsEmptyState({ tab, tabInset }: BookingsEmptyStateProps) {
  const { t } = useTranslation();
  const { themeColors } = usePreferences();

  return (
    <View style={[styles.empty, { paddingBottom: tabInset }]}>
      <EmptyState variant="bookings" />
      <Text style={[styles.emptyText, { color: themeColors.textMuted }]}>
        {tab === 'charging' ? t('bookings.emptyCharging') : t('bookings.emptyUpcoming')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl },
  emptyText: { fontSize: fontSizes.body, textAlign: 'center' },
});
