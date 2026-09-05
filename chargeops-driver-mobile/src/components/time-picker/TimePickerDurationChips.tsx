import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';

interface TimePickerDurationChipsProps {
  durationChoices: number[];
  durationTargetMin: number;
  onSelectDuration: (min: number) => void;
  minDurationMin: number;
  maxDurationMin: number;
  themeColors: any;
  t: (key: string, options?: any) => string;
  durationLabel: (min: number) => string;
}

export const TimePickerDurationChips = React.memo(function TimePickerDurationChips({
  durationChoices,
  durationTargetMin,
  onSelectDuration,
  minDurationMin,
  maxDurationMin,
  themeColors,
  t,
  durationLabel,
}: TimePickerDurationChipsProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleGroup}>
          <View style={[styles.sectionBadge, { backgroundColor: `${themeColors.primary}18` }]}>
            <Ionicons name="timer" size={15} color={themeColors.primaryDark} />
          </View>
          <Text style={[styles.title, { color: themeColors.textStrong }]}>
            {t('timeRangePicker.durationChoice')}
          </Text>
        </View>
        <Text style={[styles.boundsText, { color: themeColors.textMuted }]}>
          {t('timeRangePicker.durationBounds', { min: minDurationMin, max: maxDurationMin })}
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollRow}
      >
        {durationChoices.map((min) => {
          const isSelected = min === durationTargetMin;
          return (
            <Pressable
              key={min}
              onPress={() => onSelectDuration(min)}
              style={({ pressed }) => [
                styles.chip,
                {
                  backgroundColor: isSelected ? themeColors.primary : themeColors.surfaceAlt,
                  borderColor: isSelected ? themeColors.primary : themeColors.border,
                  opacity: pressed ? 0.85 : 1,
                },
                isSelected && styles.chipActiveShadow,
              ]}
            >
              <Ionicons
                name={isSelected ? 'flash' : 'time-outline'}
                size={15}
                color={isSelected ? '#FFFFFF' : themeColors.primary}
              />
              <Text
                style={[
                  styles.chipText,
                  { color: isSelected ? '#FFFFFF' : themeColors.textStrong },
                  isSelected && styles.chipTextActive,
                ]}
              >
                {durationLabel(min)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 4,
  },
  sectionBadge: {
    width: 26,
    height: 26,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
  },
  boundsText: {
    fontSize: 12,
    fontWeight: fontWeights.medium,
  },
  scrollRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.full,
    borderWidth: 1.2,
  },
  chipActiveShadow: {
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 5,
    elevation: 3,
  },
  chipText: {
    fontSize: 13.5,
    fontWeight: fontWeights.semibold,
  },
  chipTextActive: {
    fontWeight: fontWeights.bold,
  },
});
