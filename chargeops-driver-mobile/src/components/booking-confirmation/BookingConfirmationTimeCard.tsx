import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, lineHeights, radius, spacing } from '@/theme';
import { formatDate, formatTimeRange } from '@/utils/format';

export interface BookingConfirmationTimeCardProps {
  startAt: string;
  endAt: string;
  durationLabel: string;
  onChangeTime: () => void;
}

export function BookingConfirmationTimeCard({
  startAt,
  endAt,
  durationLabel,
  onChangeTime,
}: BookingConfirmationTimeCardProps) {
  const { t } = useTranslation();
  const { themeColors, isDark } = usePreferences();

  return (
    <View style={[styles.card, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
      <View style={styles.cardTitleRow}>
        <Ionicons name="calendar-outline" size={18} color={themeColors.primary} />
        <Text style={[styles.cardTitle, { color: themeColors.textStrong }]}>
          {t('bookingConfirmation.timeTitle')}
        </Text>
        <Pressable
          onPress={onChangeTime}
          hitSlop={6}
          style={[
            styles.changeBtn,
            { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6' },
          ]}
        >
          <Text style={{ color: themeColors.primary, fontSize: 12, fontWeight: '600' }}>
            {t('bookingConfirmation.changeTime', 'Đổi giờ')}
          </Text>
        </Pressable>
      </View>

      <View style={styles.timeBlock}>
        <View style={styles.timeCell}>
          <Text style={[styles.timeLabel, { color: themeColors.textMuted }]}>
            {t('bookingConfirmation.date')}
          </Text>
          <Text style={[styles.timeValue, { color: themeColors.textStrong }]}>
            {formatDate(startAt)}
          </Text>
        </View>
        <View style={[styles.timeDivider, { backgroundColor: themeColors.border }]} />
        <View style={styles.timeCell}>
          <Text style={[styles.timeLabel, { color: themeColors.textMuted }]}>
            {t('bookingConfirmation.timeRange')}
          </Text>
          <Text style={[styles.timeValue, { color: themeColors.textStrong }]}>
            {formatTimeRange(startAt, endAt)}
          </Text>
          <Text style={[styles.timeSub, { color: themeColors.textMuted }]}>
            {durationLabel}
          </Text>
        </View>
      </View>

      <View style={[styles.holdHint, { backgroundColor: isDark ? '#152A4A' : '#EFF6FF' }]}>
        <Ionicons name="information-circle-outline" size={16} color={themeColors.info} />
        <Text style={[styles.holdHintText, { color: themeColors.textBody }]}>
          {t('bookingConfirmation.holdNotice')}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.xs },
  cardTitle: { flex: 1, fontSize: fontSizes.heading, fontWeight: fontWeights.bold },
  changeBtn: {
    marginLeft: 'auto',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  timeBlock: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  timeCell: { flex: 1, gap: 2 },
  timeLabel: { fontSize: fontSizes.caption },
  timeValue: { fontSize: fontSizes.body, fontWeight: fontWeights.bold },
  timeSub: { fontSize: fontSizes.caption },
  timeDivider: { width: 1, height: 36 },
  holdHint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  holdHintText: { flex: 1, fontSize: fontSizes.caption, lineHeight: lineHeights.caption },
});
