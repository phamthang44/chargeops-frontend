import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';
import { formatMinutes } from '@/utils/availability';
import { formatVnd } from '@/utils/format';

interface TimePickerStickyBarProps {
  hasSel: boolean;
  meetsMinDuration: boolean;
  minDurationMin: number;
  durationStepMin: number;
  startMin: number | null;
  endMin: number | null;
  durationMin: number;
  slotCount: number;
  isCrossDay: boolean;
  totalPrice: number;
  canContinue: boolean;
  onContinue: () => void;
  onReset?: () => void;
  themeColors: any;
  t: (key: string, options?: any) => string;
  durationLabel: (min: number) => string;
}

export const TimePickerStickyBar = React.memo(function TimePickerStickyBar({
  hasSel,
  meetsMinDuration,
  minDurationMin,
  durationStepMin,
  startMin,
  endMin,
  durationMin,
  slotCount,
  isCrossDay,
  totalPrice,
  canContinue,
  onContinue,
  onReset,
  themeColors,
  t,
  durationLabel,
}: TimePickerStickyBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: themeColors.surface,
          borderTopColor: themeColors.border,
          paddingBottom: Math.max(insets.bottom, 14),
        },
      ]}
    >
      {!hasSel ? (
        <View style={styles.hintContainer}>
          <View style={[styles.hintIcon, { backgroundColor: themeColors.surfaceAlt }]}>
            <Ionicons name="time-outline" size={20} color={themeColors.textMuted} />
          </View>
          <Text style={[styles.hintText, { color: themeColors.textMuted }]}>
            {t('timeRangePicker.selectHint')}
          </Text>
        </View>
      ) : !meetsMinDuration ? (
        <View style={[styles.minDurationHint, { backgroundColor: `${themeColors.warning}15`, borderColor: `${themeColors.warning}40` }]}>
          <Ionicons name="alert-circle-outline" size={18} color={themeColors.warning} />
          <Text style={[styles.minDurationText, { color: themeColors.warning }]}>
            {t('timeRangePicker.minDurationHint', {
              minutes: minDurationMin,
              count: Math.round(minDurationMin / durationStepMin),
            })}
          </Text>
        </View>
      ) : (
        <View style={styles.contentRow}>
          {/* Left info */}
          <View style={styles.infoCol}>
            <View style={styles.labelRow}>
              <Text style={[styles.timeRangeLabel, { color: themeColors.textMuted }]}>
                {t('timeRangePicker.selectedWindow')}
              </Text>
              {onReset && (
                <Pressable onPress={onReset} hitSlop={8}>
                  <Text style={[styles.resetText, { color: themeColors.primary }]}>
                    {t('timeRangePicker.resetSelection')}
                  </Text>
                </Pressable>
              )}
            </View>

            <View style={styles.timeValueRow}>
              <Text style={[styles.timeValue, { color: themeColors.textStrong }]}>
                {startMin !== null ? formatMinutes(startMin) : '--:--'} – {endMin !== null ? formatMinutes(endMin) : '--:--'}
              </Text>

              {isCrossDay && (
                <View style={[styles.crossDayBadge, { backgroundColor: `${themeColors.primary}20` }]}>
                  <Text style={[styles.crossDayText, { color: themeColors.primaryDark }]}>
                    {t('timeRangePicker.nextDayTag')}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.subInfoRow}>
              <Text style={[styles.durationSub, { color: themeColors.textMuted }]}>
                {durationLabel(durationMin)}
              </Text>
              <Text style={[styles.dotSep, { color: themeColors.textMuted }]}>·</Text>
              <Text style={[styles.totalAmount, { color: themeColors.primaryDark }]}>
                {formatVnd(totalPrice)}
              </Text>
            </View>
          </View>

          {/* Right CTA Button */}
          <Pressable
            disabled={!canContinue}
            onPress={onContinue}
            style={({ pressed }) => [
              styles.ctaButton,
              {
                backgroundColor: canContinue ? themeColors.primary : themeColors.border,
                opacity: pressed ? 0.85 : canContinue ? 1 : 0.6,
              },
              canContinue && styles.ctaButtonShadow,
            ]}
          >
            <Text style={styles.ctaButtonText}>{t('timeRangePicker.cta')}</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </Pressable>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md + 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 10,
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
    paddingVertical: 10,
  },
  hintIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintText: {
    fontSize: 14.5,
    fontWeight: fontWeights.semibold,
  },
  minDurationHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  minDurationText: {
    fontSize: 13,
    fontWeight: fontWeights.semibold,
    flex: 1,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  infoCol: {
    flex: 1,
    gap: 3,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 8,
  },
  timeRangeLabel: {
    fontSize: 12,
    fontWeight: fontWeights.medium,
  },
  resetText: {
    fontSize: 12,
    fontWeight: fontWeights.bold,
  },
  timeValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flexWrap: 'wrap',
  },
  timeValue: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  crossDayBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: radius.full,
  },
  crossDayText: {
    fontSize: 11,
    fontWeight: fontWeights.bold,
  },
  subInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  durationSub: {
    fontSize: 13,
    fontWeight: fontWeights.semibold,
  },
  dotSep: {
    fontSize: 13,
  },
  totalAmount: {
    fontSize: 15,
    fontWeight: '800',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 52,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.full,
  },
  ctaButtonShadow: {
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.32,
    shadowRadius: 7,
    elevation: 5,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: fontWeights.bold,
  },
});
