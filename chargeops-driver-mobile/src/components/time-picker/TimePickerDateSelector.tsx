import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';

interface TimePickerDateSelectorProps {
  dates: Date[];
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
  weekdays: string[];
  themeColors: any;
  t: (key: string, options?: any) => string;
}

export const TimePickerDateSelector = React.memo(function TimePickerDateSelector({
  dates,
  selectedDate,
  onSelectDate,
  weekdays,
  themeColors,
  t,
}: TimePickerDateSelectorProps) {
  function dateOptionLabel(index: number): string {
    return t(index === 0 ? 'timeRangePicker.today' : 'timeRangePicker.tomorrow');
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <View style={[styles.sectionBadge, { backgroundColor: `${themeColors.primary}18` }]}>
            <Ionicons name="calendar" size={15} color={themeColors.primaryDark} />
          </View>
          <Text style={[styles.sectionTitle, { color: themeColors.textStrong }]}>
            {t('timeRangePicker.selectDate')}
          </Text>
        </View>
        <Text style={[styles.subtitle, { color: themeColors.textMuted }]}>
          {t('timeRangePicker.bookingWindow')}
        </Text>
      </View>

      {/* Symmetrical & Evenly Balanced Date Cards */}
      <View style={styles.cardsRow}>
        {dates.map((d, index) => {
          const isSelected = d.toDateString() === selectedDate.toDateString();
          return (
            <Pressable
              key={d.toISOString()}
              onPress={() => onSelectDate(d)}
              style={({ pressed }) => [
                styles.dateCard,
                {
                  backgroundColor: isSelected ? themeColors.primary : themeColors.surfaceAlt,
                  borderColor: isSelected ? themeColors.primary : themeColors.border,
                  opacity: pressed ? 0.88 : 1,
                },
                isSelected && styles.dateCardActiveShadow,
              ]}
            >
              {/* Top status bar: Uniform width & centered alignment */}
              <View
                style={[
                  styles.dayTag,
                  {
                    backgroundColor: isSelected
                      ? 'rgba(255, 255, 255, 0.24)'
                      : themeColors.surface,
                    borderColor: isSelected
                      ? 'rgba(255, 255, 255, 0.35)'
                      : themeColors.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.dayDot,
                    { backgroundColor: isSelected ? '#FFFFFF' : themeColors.primary },
                  ]}
                />
                <Text
                  style={[
                    styles.dayTagText,
                    { color: isSelected ? '#FFFFFF' : themeColors.textStrong },
                  ]}
                >
                  {dateOptionLabel(index)}
                </Text>
              </View>

              {/* Symmetrical Middle Body: Large Date Number */}
              <View style={styles.dateBody}>
                <Text
                  style={[
                    styles.dateDayNumber,
                    { color: isSelected ? '#FFFFFF' : themeColors.textStrong },
                  ]}
                >
                  {String(d.getDate()).padStart(2, '0')}
                </Text>

                <View style={styles.dateMetaCol}>
                  <Text
                    style={[
                      styles.dateWeekday,
                      { color: isSelected ? '#FFFFFF' : themeColors.textStrong },
                    ]}
                  >
                    {weekdays[d.getDay()]}
                  </Text>
                  <Text
                    style={[
                      styles.dateMonth,
                      { color: isSelected ? 'rgba(255, 255, 255, 0.85)' : themeColors.textMuted },
                    ]}
                  >
                    {t('timeRangePicker.monthFormat', { month: d.getMonth() + 1 })}
                  </Text>
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm + 2,
  },
  headerRow: {
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
  sectionTitle: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
  },
  subtitle: {
    fontSize: 12.5,
    fontWeight: fontWeights.medium,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  dateCard: {
    flex: 1,
    minHeight: 100,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  dateCardActiveShadow: {
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  dayTag: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 26,
    borderRadius: radius.full,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
  },
  dayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dayTagText: {
    fontSize: 12,
    fontWeight: fontWeights.bold,
  },
  dateBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingTop: 4,
  },
  dateDayNumber: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  dateMetaCol: {
    gap: 2,
    alignItems: 'flex-start',
  },
  dateWeekday: {
    fontSize: 13.5,
    fontWeight: fontWeights.bold,
  },
  dateMonth: {
    fontSize: 12,
    fontWeight: fontWeights.medium,
  },
});
