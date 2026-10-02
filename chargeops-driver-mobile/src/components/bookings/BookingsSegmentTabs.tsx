import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { usePreferences } from '@/context/PreferencesContext';
import type { BookingsTab } from '@/hooks/useBookingsScreen';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';

interface BookingsSegmentTabsProps {
  tab: BookingsTab;
  upcomingCount: number;
  chargingCount: number;
  onSelectTab: (tab: BookingsTab) => void;
}

export function BookingsSegmentTabs({
  tab,
  upcomingCount,
  chargingCount,
  onSelectTab,
}: BookingsSegmentTabsProps) {
  const { t } = useTranslation();
  const { themeColors } = usePreferences();

  return (
    <View style={[styles.segment, { backgroundColor: themeColors.surfaceAlt, borderColor: themeColors.border }]}>
      <Pressable
        style={[
          styles.segmentBtn,
          tab === 'upcoming' && [styles.segmentBtnActive, { backgroundColor: themeColors.surface }],
        ]}
        onPress={() => onSelectTab('upcoming')}
      >
        <Text
          style={[
            styles.segmentText,
            { color: tab === 'upcoming' ? themeColors.primary : themeColors.textMuted },
            tab === 'upcoming' && styles.segmentTextActive,
          ]}
        >
          {t('bookings.tabUpcomingCount', { count: upcomingCount })}
        </Text>
      </Pressable>
      <Pressable
        style={[
          styles.segmentBtn,
          tab === 'charging' && [styles.segmentBtnActive, { backgroundColor: themeColors.surface }],
        ]}
        onPress={() => onSelectTab('charging')}
      >
        <Text
          style={[
            styles.segmentText,
            { color: tab === 'charging' ? themeColors.primary : themeColors.textMuted },
            tab === 'charging' && styles.segmentTextActive,
          ]}
        >
          {t('bookings.tabChargingCount', { count: chargingCount })}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  segment: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: radius.md,
    padding: spacing.xs,
    gap: spacing.xs,
    borderWidth: 1,
  },
  segmentBtn: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm, borderRadius: radius.sm },
  segmentBtnActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  segmentText: { fontSize: fontSizes.body, fontWeight: fontWeights.medium },
  segmentTextActive: { fontWeight: fontWeights.bold },
});
