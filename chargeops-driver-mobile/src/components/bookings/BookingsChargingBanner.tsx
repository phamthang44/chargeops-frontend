import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { LiveDot } from '@/components/LiveDot';
import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';
import type { Booking } from '@/types';
import { formatCountdown } from '@/utils/format';

interface BookingsChargingBannerProps {
  booking: Booking;
  now: number;
}

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

export function BookingsChargingBanner({ booking, now }: BookingsChargingBannerProps) {
  const { t } = useTranslation();
  const { themeColors } = usePreferences();

  const start = new Date(booking.startAt).getTime();
  const end = new Date(booking.endAt).getTime();
  const elapsed = Math.max(0, now - new Date(booking.checkedInAt ?? booking.startAt).getTime());
  const progress = clamp01((now - start) / (end - start || 1));
  const percent = Math.round(20 + progress * 60);

  return (
    <View style={[styles.chargeBanner, { backgroundColor: themeColors.surfaceAlt, borderColor: themeColors.border }]}>
      <View style={styles.chargeRow}>
        <View style={styles.liveTag}>
          <LiveDot color={themeColors.info} />
          <Text style={[styles.liveText, { color: themeColors.info }]}>
            {t('bookings.liveCharging')} · {percent}%
          </Text>
        </View>
        <Text style={[styles.elapsed, { color: themeColors.textStrong }]}>{formatCountdown(elapsed)}</Text>
      </View>
      <View style={[styles.track, { backgroundColor: themeColors.surface }]}>
        <View style={[styles.fill, { width: `${percent}%`, backgroundColor: themeColors.info }]} />
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
  track: { height: 4, borderRadius: radius.full, overflow: 'hidden' },
  fill: { height: 4, borderRadius: radius.full },
});
