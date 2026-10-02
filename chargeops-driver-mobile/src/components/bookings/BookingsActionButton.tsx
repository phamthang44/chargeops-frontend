import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text } from 'react-native';

import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';
import type { Booking, BookingStatus } from '@/types';
import { formatTime } from '@/utils/format';

type ActionTone = 'primary' | 'info' | 'warning';
const ACTION: Partial<
  Record<BookingStatus, { labelKey: string; icon: keyof typeof Ionicons.glyphMap; tone: ActionTone }>
> = {
  PENDING: { labelKey: 'bookings.actionPay', icon: 'card-outline', tone: 'warning' },
  CONFIRMED: { labelKey: 'bookings.actionCheckIn', icon: 'qr-code-outline', tone: 'primary' },
  CHECKED_IN: { labelKey: 'bookings.actionCharging', icon: 'flash', tone: 'info' },
};

interface BookingsActionButtonProps {
  booking: Booking;
  now: number;
  onAction: (booking: Booking) => void;
  onPayNow: (booking: Booking) => void;
}

export function BookingsActionButton({
  booking,
  now,
  onAction,
  onPayNow,
}: BookingsActionButtonProps) {
  const { t } = useTranslation();
  const { themeColors } = usePreferences();

  const toneBg: Record<ActionTone, string> = {
    primary: themeColors.primary,
    info: themeColors.info,
    warning: themeColors.warning,
  };

  if (booking.status === 'PENDING') {
    return (
      <Pressable
        style={[styles.actionBtn, { backgroundColor: themeColors.warning }]}
        onPress={() => onPayNow(booking)}
      >
        <Text style={styles.actionTextWhite}>{t('bookings.payNow', 'Thanh toán')}</Text>
        <Ionicons name="card-outline" size={15} color="#FFFFFF" />
      </Pressable>
    );
  }

  if (booking.status === 'CONFIRMED') {
    const canCheckIn = booking.actions?.canCheckIn ?? now >= new Date(booking.startAt).getTime();
    return (
      <Pressable
        style={[
          styles.actionBtn,
          {
            backgroundColor: canCheckIn ? themeColors.primary : themeColors.surfaceAlt,
            borderWidth: canCheckIn ? 0 : 1,
            borderColor: themeColors.border,
          },
        ]}
        onPress={() => onAction(booking)}
      >
        <Text style={[styles.actionText, { color: canCheckIn ? '#FFFFFF' : themeColors.textMuted }]}>
          {canCheckIn
            ? t('bookings.actionCheckIn')
            : t('bookings.checkInAt', { time: formatTime(booking.startAt) })}
        </Text>
        <Ionicons
          name={canCheckIn ? 'qr-code-outline' : 'time-outline'}
          size={15}
          color={canCheckIn ? '#FFFFFF' : themeColors.textMuted}
        />
      </Pressable>
    );
  }

  const cfg = ACTION[booking.status];
  if (!cfg) return null;

  return (
    <Pressable
      style={[styles.actionBtn, { backgroundColor: toneBg[cfg.tone] }]}
      onPress={() => onAction(booking)}
    >
      <Text style={styles.actionTextWhite}>{t(cfg.labelKey)}</Text>
      <Ionicons name={cfg.icon} size={15} color="#FFFFFF" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  actionText: { fontSize: fontSizes.caption, fontWeight: fontWeights.semibold },
  actionTextWhite: { fontSize: fontSizes.caption, fontWeight: fontWeights.semibold, color: '#FFFFFF' },
});
