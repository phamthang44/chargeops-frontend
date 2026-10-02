import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';
import type { Booking } from '@/types';
import { formatCountdown, formatTime } from '@/utils/format';

interface BookingsUpcomingHeroProps {
  booking: Booking;
  now: number;
  onPress: () => void;
  onCheckInPress: () => void;
}

const HERO_MUTED = 'rgba(255, 255, 255, 0.75)';
const HERO_CHIP_BG = 'rgba(255, 255, 255, 0.15)';

export function BookingsUpcomingHero({
  booking,
  now,
  onPress,
  onCheckInPress,
}: BookingsUpcomingHeroProps) {
  const { t } = useTranslation();
  const { themeColors, isDark } = usePreferences();

  const msLeft = new Date(booking.startAt).getTime() - now;
  const canCheckIn = booking.actions?.canCheckIn ?? msLeft <= 0;
  const heroBg = isDark ? '#113E30' : '#111827';
  const heroBorder = isDark ? '#10B981' : 'transparent';

  return (
    <Pressable
      style={[
        styles.hero,
        {
          backgroundColor: heroBg,
          borderColor: heroBorder,
          borderWidth: isDark ? 1.5 : 0,
        },
      ]}
      onPress={onPress}
    >
      <View style={styles.heroTopRow}>
        <Text style={[styles.heroEyebrow, { color: isDark ? '#6EE6A0' : themeColors.primaryLight }]}>
          {t('bookings.nextSession')}
        </Text>
        <View style={[styles.heroChip, { backgroundColor: HERO_CHIP_BG }]}>
          <Ionicons name="flash" size={11} color={isDark ? '#6EE6A0' : themeColors.primaryLight} />
          <Text style={[styles.heroChipText, { color: '#FFFFFF' }]}>
            {booking.connectorType} · {booking.powerKw}kW
          </Text>
        </View>
      </View>

      <Text style={[styles.heroStation, { color: '#FFFFFF' }]} numberOfLines={1}>
        {booking.stationName}
      </Text>
      <View style={styles.heroMetaRow}>
        <Ionicons name="location-outline" size={13} color={HERO_MUTED} />
        <Text style={[styles.heroMeta, { color: HERO_MUTED }]} numberOfLines={1}>
          {booking.chargePointName} · {booking.connectorName} · {formatTime(booking.startAt)}
        </Text>
      </View>

      <Text style={[styles.heroCountdown, { color: '#FFFFFF' }]}>
        {canCheckIn ? t('bookings.readyNow') : formatCountdown(Math.max(0, msLeft))}
      </Text>
      <Text style={[styles.heroCaption, { color: HERO_MUTED }]}>
        {canCheckIn ? t('bookings.readyToCheckIn') : t('bookings.untilCheckIn')}
      </Text>

      <Pressable
        style={[
          styles.heroBtn,
          {
            backgroundColor: canCheckIn ? themeColors.primary : 'rgba(255, 255, 255, 0.18)',
            borderWidth: canCheckIn ? 0 : 1,
            borderColor: 'rgba(255, 255, 255, 0.25)',
          },
        ]}
        onPress={(e) => {
          e.stopPropagation?.();
          onCheckInPress();
        }}
      >
        <Ionicons name={canCheckIn ? 'qr-code-outline' : 'time-outline'} size={16} color="#FFFFFF" />
        <Text style={[styles.heroBtnText, { color: '#FFFFFF' }]}>
          {canCheckIn
            ? t('bookings.checkInNow')
            : t('bookings.checkInAt', { time: formatTime(booking.startAt) })}
        </Text>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 4,
  },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroEyebrow: { fontSize: fontSizes.caption, fontWeight: fontWeights.bold, letterSpacing: 1 },
  heroChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  heroChipText: { fontSize: fontSizes.caption, fontWeight: fontWeights.semibold },
  heroStation: { fontSize: fontSizes.heading, fontWeight: fontWeights.bold, marginTop: 2 },
  heroMetaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  heroMeta: { flex: 1, fontSize: fontSizes.caption },
  heroCountdown: {
    fontSize: fontSizes.display,
    fontWeight: fontWeights.bold,
    marginTop: spacing.sm,
    fontVariant: ['tabular-nums'],
  },
  heroCaption: { fontSize: fontSizes.caption, marginBottom: spacing.sm },
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
