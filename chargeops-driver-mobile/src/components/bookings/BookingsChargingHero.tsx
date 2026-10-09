import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { LiveDot } from '@/components/LiveDot';
import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';
import type { Booking } from '@/types';
import { formatTime, formatVnd } from '@/utils/format';

interface BookingsChargingHeroProps {
  booking: Booking;
  now: number;
  onPress: () => void;
}

/**
 * BookingsChargingHero — Clean, realistic charging card on the Bookings tab.
 * Displays accurate station/charger/connector metadata, booking slot time,
 * and finalized total price (no fake counters or misleading "tạm tính" estimates).
 * Fully localized with i18n support.
 */
export function BookingsChargingHero({
  booking,
  onPress,
}: BookingsChargingHeroProps) {
  const { t } = useTranslation();
  const { themeColors, isDark } = usePreferences();

  const chargerCode =
    booking.chargePointCode || booking.chargePointName || t('bookings.chargingHero.chargerFallback');
  const connectorCode =
    booking.connectorCode || booking.connectorName || t('bookings.chargingHero.connectorFallback');
  const finalPrice = booking.totalPrice ?? (booking as any).totalAmount ?? 0;

  return (
    <Pressable
      style={[
        styles.chargingHeroCard,
        {
          backgroundColor: isDark ? '#0D261E' : '#0B1F17',
          borderColor: '#10B981',
        },
      ]}
      onPress={onPress}
    >
      {/* Top Tag & Power Badge */}
      <View style={styles.heroTopRow}>
        <View style={styles.liveTagHero}>
          <LiveDot color="#10B981" />
          <Text style={styles.liveTagText}>{t('bookings.chargingHero.liveTag')}</Text>
        </View>
        <View style={styles.powerBadge}>
          <Ionicons name="flash" size={12} color="#10B981" />
          <Text style={styles.powerBadgeText}>
            {booking.powerKw}kW · {booking.connectorType || 'DC'}
          </Text>
        </View>
      </View>

      {/* Station Name */}
      <Text style={styles.chargingStationName} numberOfLines={1}>
        {booking.stationName}
      </Text>

      {/* Charger & Connector Info */}
      <View style={styles.portPill}>
        <Ionicons name="hardware-chip-outline" size={13} color="#34D399" />
        <Text style={styles.portPillText}>
          {t('bookings.chargingHero.chargerLabel')}:{' '}
          <Text style={styles.portPillBold}>{chargerCode}</Text> ·{' '}
          {t('bookings.chargingHero.connectorLabel')}:{' '}
          <Text style={styles.portPillBold}>{connectorCode}</Text>
        </Text>
      </View>

      {/* Booking Slot & Final Price Row */}
      <View style={styles.metricsRow}>
        <View style={styles.metricCell}>
          <Text style={styles.metricCellLabel}>{t('bookings.chargingHero.timeSlot')}</Text>
          <Text style={styles.metricCellVal}>
            {formatTime(booking.startAt)} – {formatTime(booking.endAt)}
          </Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricCell}>
          <Text style={styles.metricCellLabel}>{t('bookings.chargingHero.duration')}</Text>
          <Text style={styles.metricCellVal}>
            {t('bookings.chargingHero.durationMinutes', { minutes: booking.durationMin })}
          </Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricCell}>
          <Text style={styles.metricCellLabel}>{t('bookings.chargingHero.totalPayment')}</Text>
          <Text style={[styles.metricCellVal, styles.finalPriceVal]}>
            {formatVnd(finalPrice)}
          </Text>
        </View>
      </View>

      {/* Open Session CTA */}
      <Pressable
        style={[styles.heroBtn, { backgroundColor: themeColors.primary, marginTop: spacing.xs }]}
        onPress={onPress}
      >
        <Ionicons name="flash" size={18} color="#FFFFFF" />
        <Text style={[styles.heroBtnText, { color: '#FFFFFF' }]}>
          {t('bookings.chargingHero.actionDetails')}
        </Text>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chargingHeroCard: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1.5,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  liveTagHero: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  liveTagText: { fontSize: fontSizes.caption, fontWeight: fontWeights.bold, color: '#10B981', letterSpacing: 1 },
  powerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  powerBadgeText: { fontSize: fontSizes.caption, fontWeight: fontWeights.bold, color: '#34D399' },
  chargingStationName: { fontSize: fontSizes.title, fontWeight: fontWeights.bold, color: '#FFFFFF', marginTop: 2 },
  portPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignSelf: 'flex-start',
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  portPillText: { fontSize: fontSizes.caption, color: 'rgba(255, 255, 255, 0.85)' },
  portPillBold: { fontWeight: fontWeights.bold, color: '#FFFFFF' },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  metricCell: { flex: 1, alignItems: 'center' },
  metricCellLabel: { fontSize: fontSizes.caption, color: 'rgba(255, 255, 255, 0.65)' },
  metricCellVal: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
    color: '#FFFFFF',
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  finalPriceVal: {
    color: '#34D399',
  },
  metricDivider: { width: 1, height: 24, backgroundColor: 'rgba(255, 255, 255, 0.15)' },
  heroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: radius.full,
    paddingVertical: spacing.md,
  },
  heroBtnText: { fontSize: fontSizes.body, fontWeight: fontWeights.bold },
});
