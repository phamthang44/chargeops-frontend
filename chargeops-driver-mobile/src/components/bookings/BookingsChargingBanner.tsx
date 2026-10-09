import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { LiveDot } from '@/components/LiveDot';
import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';
import type { Booking } from '@/types';

interface BookingsChargingBannerProps {
  booking: Booking;
  now?: number;
}

export function BookingsChargingBanner({ booking }: BookingsChargingBannerProps) {
  const { t } = useTranslation();
  const { themeColors } = usePreferences();

  const chargerCode =
    booking.chargePointCode || booking.chargePointName || t('bookings.chargingHero.chargerFallback');
  const connectorCode =
    booking.connectorCode || booking.connectorName || t('bookings.chargingHero.connectorFallback');

  return (
    <View style={[styles.chargeBanner, { backgroundColor: themeColors.surfaceAlt, borderColor: themeColors.border }]}>
      <View style={styles.chargeRow}>
        <View style={styles.liveTag}>
          <LiveDot color={themeColors.info} />
          <Text style={[styles.liveText, { color: themeColors.info }]}>
            {t('bookings.liveCharging')}
          </Text>
        </View>
        <Text style={[styles.portInfo, { color: themeColors.textMuted }]}>
          {t('bookings.chargerPort', { charger: chargerCode, connector: connectorCode })}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chargeBanner: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  chargeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  liveTag: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  liveText: { fontSize: fontSizes.caption, fontWeight: fontWeights.bold, letterSpacing: 0.5 },
  portInfo: { fontSize: fontSizes.caption, fontWeight: fontWeights.medium },
});
