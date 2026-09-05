import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';

export type TimeFilterPeriod = 'ALL' | 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT';

interface PeriodTabConfig {
  key: TimeFilterPeriod;
  i18nKey: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
}

const PERIODS: PeriodTabConfig[] = [
  { key: 'ALL', i18nKey: 'timeRangePicker.periodShortAll', icon: 'grid', iconColor: '#059669' },
  { key: 'MORNING', i18nKey: 'timeRangePicker.periodShortMorning', icon: 'partly-sunny', iconColor: '#F59E0B' },
  { key: 'AFTERNOON', i18nKey: 'timeRangePicker.periodShortAfternoon', icon: 'sunny', iconColor: '#EA580C' },
  { key: 'EVENING', i18nKey: 'timeRangePicker.periodShortEvening', icon: 'cloudy-night', iconColor: '#6366F1' },
  { key: 'NIGHT', i18nKey: 'timeRangePicker.periodShortNight', icon: 'moon', iconColor: '#8B5CF6' },
];

interface TimePickerPeriodTabsProps {
  timeFilter: TimeFilterPeriod;
  onSelectFilter: (f: TimeFilterPeriod) => void;
  periodCounts: Record<TimeFilterPeriod, number>;
  themeColors: any;
  t: (key: string, options?: any) => string;
}

export const TimePickerPeriodTabs = React.memo(function TimePickerPeriodTabs({
  timeFilter,
  onSelectFilter,
  periodCounts,
  themeColors,
  t,
}: TimePickerPeriodTabsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {PERIODS.map((period) => {
        const isSelected = timeFilter === period.key;
        const count = periodCounts[period.key] ?? 0;
        return (
          <Pressable
            key={period.key}
            onPress={() => onSelectFilter(period.key)}
            style={({ pressed }) => [
              styles.tab,
              {
                backgroundColor: isSelected ? themeColors.primary : themeColors.surfaceAlt,
                borderColor: isSelected ? themeColors.primary : themeColors.border,
                opacity: pressed ? 0.85 : 1,
              },
              isSelected && styles.tabActiveShadow,
            ]}
          >
            <Ionicons
              name={period.icon}
              size={15}
              color={isSelected ? '#FFFFFF' : period.iconColor}
            />
            <Text
              style={[
                styles.tabLabel,
                { color: isSelected ? '#FFFFFF' : themeColors.textStrong },
                isSelected && styles.tabLabelActive,
              ]}
            >
              {t(period.i18nKey)}
            </Text>

            {count > 0 && (
              <View
                style={[
                  styles.countBadge,
                  {
                    backgroundColor: isSelected
                      ? 'rgba(255, 255, 255, 0.28)'
                      : `${themeColors.primary}18`,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.countText,
                    { color: isSelected ? '#FFFFFF' : themeColors.primaryDark },
                  ]}
                >
                  {count}
                </Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 4,
    paddingVertical: 4,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1.2,
  },
  tabActiveShadow: {
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: fontWeights.semibold,
  },
  tabLabelActive: {
    fontWeight: fontWeights.bold,
  },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  countText: {
    fontSize: 11.5,
    fontWeight: fontWeights.bold,
  },
});
