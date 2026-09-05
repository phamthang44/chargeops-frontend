import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';
import { formatMinutes } from '@/utils/availability';

interface TimePickerSlotItemProps {
  startMin: number;
  durationMin: number;
  isBooked: boolean;
  isSelected: boolean;
  isUnavailableForDuration: boolean;
  onPress: () => void;
  themeColors: any;
  t: (key: string, options?: any) => string;
}

export const TimePickerSlotItem = React.memo(function TimePickerSlotItem({
  startMin,
  durationMin,
  isBooked,
  isSelected,
  isUnavailableForDuration,
  onPress,
  themeColors,
  t,
}: TimePickerSlotItemProps) {
  const isDisabled = isBooked || isUnavailableForDuration;
  const endMin = startMin + durationMin;

  return (
    <Pressable
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.slotCard,
        {
          backgroundColor: isSelected
            ? themeColors.primary
            : isDisabled
              ? themeColors.surfaceAlt
              : themeColors.surface,
          borderColor: isSelected
            ? themeColors.primary
            : isDisabled
              ? themeColors.border
              : `${themeColors.primary}45`,
          opacity: pressed ? 0.8 : isDisabled ? 0.65 : 1,
        },
        isSelected && styles.slotCardActiveShadow,
      ]}
    >
      {/* Top row: Start time & Status indicator */}
      <View style={styles.topRow}>
        <Text
          style={[
            styles.timeText,
            {
              color: isSelected
                ? '#FFFFFF'
                : isDisabled
                  ? themeColors.textMuted
                  : themeColors.textStrong,
            },
          ]}
        >
          {formatMinutes(startMin)}
        </Text>

        {isSelected ? (
          <View style={styles.checkBadge}>
            <Ionicons name="checkmark" size={12} color="#059669" />
          </View>
        ) : isBooked ? (
          <Ionicons name="time" size={13} color={themeColors.textMuted} />
        ) : isUnavailableForDuration ? (
          <Ionicons name="alert-circle-outline" size={13} color={themeColors.textMuted} />
        ) : (
          <View style={[styles.availDot, { backgroundColor: themeColors.primary }]} />
        )}
      </View>

      {/* Bottom row: End time preview or Status tag */}
      <View style={styles.bottomRow}>
        {isSelected ? (
          <Text style={[styles.endPreviewText, { color: 'rgba(255, 255, 255, 0.95)' }]}>
            → {formatMinutes(endMin)}
          </Text>
        ) : isBooked ? (
          <Text style={[styles.statusTag, { color: themeColors.textMuted }]}>
            {t('timeRangePicker.slotBooked')}
          </Text>
        ) : isUnavailableForDuration ? (
          <Text style={[styles.statusTag, { color: themeColors.textMuted }]}>
            {t('timeRangePicker.slotUnavailable')}
          </Text>
        ) : (
          <Text style={[styles.availTag, { color: themeColors.textMuted }]}>
            → {formatMinutes(endMin)}
          </Text>
        )}
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  slotCard: {
    width: '31.3%',
    minHeight: 68,
    borderRadius: radius.md + 2,
    borderWidth: 1.3,
    paddingVertical: spacing.xs + 5,
    paddingHorizontal: spacing.xs + 5,
    justifyContent: 'space-between',
  },
  slotCardActiveShadow: {
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  checkBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  availDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  endPreviewText: {
    fontSize: 12,
    fontWeight: fontWeights.bold,
  },
  availTag: {
    fontSize: 11.5,
    fontWeight: fontWeights.medium,
  },
  statusTag: {
    fontSize: 11,
    fontWeight: fontWeights.medium,
  },
});
