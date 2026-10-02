import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { usePreferences } from '@/context/PreferencesContext';
import { formatClockIso, type SlotCell } from '@/hooks/useTimeRangePicker';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';
import { TimePickerPeriodTabs, type TimeFilterPeriod } from './TimePickerPeriodTabs';
import { TimePickerSlotItem } from './TimePickerSlotItem';

interface TimePickerSlotGridProps {
  loading: boolean;
  generatedAt?: string;
  slots: SlotCell[];
  visibleSlots: SlotCell[];
  timeFilter: TimeFilterPeriod;
  onSelectFilter: (period: TimeFilterPeriod) => void;
  periodCounts: Record<TimeFilterPeriod, number>;
  durationTargetMin: number;
  hasSel: boolean;
  selStart: number | null;
  selEnd: number | null;
  canFitFrom: (index: number) => boolean;
  onTapSlot: (index: number) => void;
}

export function TimePickerSlotGrid({
  loading,
  generatedAt,
  slots,
  visibleSlots,
  timeFilter,
  onSelectFilter,
  periodCounts,
  durationTargetMin,
  hasSel,
  selStart,
  selEnd,
  canFitFrom,
  onTapSlot,
}: TimePickerSlotGridProps) {
  const { t } = useTranslation();
  const { themeColors } = usePreferences();

  return (
    <View style={styles.slotsSectionContainer}>
      {/* Header Row: Section Title + Live Status Sync & Legend */}
      <View style={styles.slotsHeaderRow}>
        <View style={styles.slotsTitleGroup}>
          <View style={[styles.sectionIconBadge, { backgroundColor: `${themeColors.primary}18` }]}>
            <Ionicons name="time" size={15} color={themeColors.primaryDark} />
          </View>
          <Text style={[styles.slotsSectionTitle, { color: themeColors.textStrong }]}>
            {t('timeRangePicker.sectionSlots')}
          </Text>
        </View>

        {/* Live dot */}
        <View style={[styles.liveIndicator, { backgroundColor: themeColors.primarySoft }]}>
          <View style={[styles.liveDot, { backgroundColor: themeColors.primary }]} />
          <Text style={[styles.liveText, { color: themeColors.primaryDark }]}>
            {generatedAt
              ? formatClockIso(generatedAt)
              : t('timeRangePicker.liveAvailability')}
          </Text>
        </View>
      </View>

      {/* Friendly Legend */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendDot,
              { backgroundColor: themeColors.surface, borderColor: `${themeColors.primary}80` },
            ]}
          />
          <Text style={[styles.legendText, { color: themeColors.textMuted }]}>
            {t('timeRangePicker.legendFree')}
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: themeColors.primary }]} />
          <Text style={[styles.legendText, { color: themeColors.textMuted }]}>
            {t('timeRangePicker.legendSelected')}
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendDot,
              { backgroundColor: themeColors.surfaceAlt, borderColor: themeColors.border },
            ]}
          />
          <Text style={[styles.legendText, { color: themeColors.textMuted }]}>
            {t('timeRangePicker.legendUnavailable')}
          </Text>
        </View>
      </View>

      {/* Period Filter Tabs */}
      <TimePickerPeriodTabs
        timeFilter={timeFilter}
        onSelectFilter={onSelectFilter}
        periodCounts={periodCounts}
        themeColors={themeColors}
        t={t}
      />

      {/* Slot Grid */}
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={themeColors.primary} />
          <Text style={[styles.loaderText, { color: themeColors.textMuted }]}>
            {t('timeRangePicker.awaitingAvailability')}
          </Text>
        </View>
      ) : slots.length === 0 ? (
        <View
          style={[
            styles.emptyCard,
            { backgroundColor: themeColors.surfaceAlt, borderColor: themeColors.border },
          ]}
        >
          <Ionicons name="calendar-outline" size={38} color={themeColors.textMuted} />
          <Text style={[styles.emptyTitle, { color: themeColors.textStrong }]}>
            {t('timeRangePicker.empty')}
          </Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {visibleSlots.map((sl) => {
            const originalIdx = slots.findIndex((s) => s.startMin === sl.startMin);
            const isSelected = hasSel && originalIdx >= selStart! && originalIdx <= selEnd!;
            const unavailableForDuration = !sl.booked && !canFitFrom(originalIdx);

            return (
              <TimePickerSlotItem
                key={sl.startMin}
                startMin={sl.startMin}
                durationMin={durationTargetMin}
                isBooked={sl.booked}
                isSelected={isSelected}
                isUnavailableForDuration={unavailableForDuration}
                onPress={() => onTapSlot(originalIdx)}
                themeColors={themeColors}
                t={t}
              />
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  slotsSectionContainer: {
    gap: spacing.md,
  },
  slotsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  slotsTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 4,
  },
  sectionIconBadge: {
    width: 26,
    height: 26,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotsSectionTitle: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveText: {
    fontSize: 11.5,
    fontWeight: fontWeights.bold,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 2,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.2,
  },
  legendText: {
    fontSize: 12,
    fontWeight: fontWeights.medium,
  },
  loaderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  loaderText: {
    fontSize: fontSizes.caption,
  },
  emptyCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.semibold,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs + 4,
  },
});
