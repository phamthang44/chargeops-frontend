import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { LiveDot } from '@/components/LiveDot';
import { usePreferences } from '@/context/PreferencesContext';
import { getBookingTimeRemainingMs } from '@/services/bookingService';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';
import type { Booking } from '@/types';
import { formatCountdown } from '@/utils/format';

interface BookingsPendingBannerProps {
  booking: Booking;
  now: number;
}

export function BookingsPendingBanner({ booking, now }: BookingsPendingBannerProps) {
  const { t } = useTranslation();
  const { themeColors } = usePreferences();

  const msLeft = getBookingTimeRemainingMs(
    booking.paymentHoldExpiresAt ?? booking.expiresAt,
    now,
  );

  return (
    <View
      style={[
        styles.chargeBanner,
        {
          backgroundColor: `${themeColors.warning}18`,
          borderColor: `${themeColors.warning}40`,
        },
      ]}
    >
      <View style={styles.chargeRow}>
        <View style={styles.liveTag}>
          <LiveDot color={themeColors.warning} />
          <Text style={[styles.liveText, { color: themeColors.warning }]}>
            {t('bookings.pendingHoldLeft', { time: formatCountdown(msLeft) })}
          </Text>
        </View>
        <Text style={[styles.elapsed, { color: themeColors.warning }]}>
          {msLeft === 0 ? t('history.reasonExpired', 'Hết hạn') : formatCountdown(msLeft)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chargeBanner: { padding: spacing.sm, borderRadius: radius.md, borderWidth: 1, gap: spacing.xs },
  chargeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  liveTag: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  liveText: { fontSize: fontSizes.caption, fontWeight: fontWeights.bold, letterSpacing: 0.5 },
  elapsed: { fontSize: fontSizes.caption, fontWeight: fontWeights.bold, fontVariant: ['tabular-nums'] },
});
