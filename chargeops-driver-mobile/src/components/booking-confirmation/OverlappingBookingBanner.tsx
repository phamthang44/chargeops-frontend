import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, lineHeights, radius, spacing } from '@/theme';
import type { Booking } from '@/types';
import { formatTime } from '@/utils/format';

export interface OverlappingBookingBannerProps {
  overlappingBooking: Booking;
  onPress: () => void;
}

export function OverlappingBookingBanner({
  overlappingBooking,
  onPress,
}: OverlappingBookingBannerProps) {
  const { t } = useTranslation();
  const { themeColors } = usePreferences();

  return (
    <Pressable
      style={[
        styles.overlapCard,
        { backgroundColor: `${themeColors.warning}1A`, borderColor: themeColors.warning },
      ]}
      onPress={onPress}
    >
      <Ionicons name="warning-outline" size={20} color={themeColors.warning} />
      <View style={styles.copy}>
        <Text style={[styles.overlapTitle, { color: themeColors.warning }]}>
          {t('bookingConfirm.overlapTitle')}
        </Text>
        <Text style={[styles.overlapSub, { color: themeColors.textBody }]}>
          {t('bookingConfirm.overlapBody', {
            start: formatTime(overlappingBooking.startAt),
            end: formatTime(overlappingBooking.endAt),
            station: overlappingBooking.stationName,
          })}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={themeColors.warning} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlapCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  copy: { flex: 1 },
  overlapTitle: { fontSize: fontSizes.body, fontWeight: fontWeights.bold },
  overlapSub: { fontSize: fontSizes.caption, lineHeight: lineHeights.caption },
});
